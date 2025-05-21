import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export function useProjectStaff(projectId: string, isActive: boolean = true) {
  const [staffDetails, setStaffDetails] = useState<any[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    // Only fetch when tab is active and we have a project ID
    if (!isActive || !projectId) return;
    
    const fetchStaffDetails = async () => {
      setLoadingStaff(true);
      try {
        // Single optimized query with direct field selection
        const { data, error } = await supabase
          .from('project_staff')
          .select(`
            *,
            candidate:candidates(
              id,
              full_name,
              profile_photo,
              email,
              status,
              phone_number,
              ic_number
            )
          `)
          .eq('project_id', projectId);
          
        if (error) throw error;
        
        // Simple, focused transformation
        const staffWithDetails = data?.map(staff => ({
          id: staff.candidate?.id || staff.id,
          name: staff.candidate?.full_name || staff.name || 'Unknown',
          photo: staff.candidate?.profile_photo,
          designation: staff.position || staff.designation || 'Crew',
          status: 'confirmed',
          appliedDate: staff.applied_date ? new Date(staff.applied_date) : new Date(),
          applyType: staff.apply_type || 'full',
          email: staff.candidate?.email,
          phone_number: staff.candidate?.phone_number,
          // Pre-process dates once
          workingDates: (staff.working_dates || []).map(d => 
            d instanceof Date ? d : new Date(d)
          ),
          workingDatesWithSalary: (staff.working_dates_with_salary || []).map(item => ({
            ...item,
            date: item.date instanceof Date ? item.date : new Date(item.date)
          }))
        })) || [];
        
        setStaffDetails(staffWithDetails);
      } catch (error) {
        console.error('Error fetching staff details:', error);
        toast({
          title: "Error",
          description: "Failed to load staff details",
          variant: "destructive"
        });
      } finally {
        setLoadingStaff(false);
      }
    };
    
    fetchStaffDetails();
  }, [projectId, isActive, toast]);
  
  return { staffDetails, loadingStaff, setStaffDetails };
}