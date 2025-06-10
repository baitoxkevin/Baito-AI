import { supabase } from "./supabase";
import { WorkingDateWithSalary } from "@/components/ui/working-date-picker";

import { logger } from './logger';
/**
 * Save staff payment details to the database
 * Attempts to use the save_staff_payroll RPC function if available,
 * falls back to direct table update if the RPC isn't available
 */
export async function saveStaffPaymentDetails(
  staffId: string,
  workingDatesWithSalary: WorkingDateWithSalary[],
  projectId?: string  // Added projectId parameter for creating new records
): Promise<{ success: boolean; error?: unknown }> {
  logger.debug(`saveStaffPaymentDetails called with staffId: ${staffId}, projectId:`, projectId);
  try {
    // Validate staff ID
    if (!staffId || staffId === "undefined") {
      logger.error('Invalid staff ID:', staffId);
      return {
        success: false,
        error: { message: 'Invalid staff ID. Cannot save payment details.' }
      };
    }

    // Early validation for project ID if we might need it later
    if (!projectId || projectId === "undefined") {
      logger.warn('Warning: No valid project ID provided. Creating new project_staff records will fail.');
    }

    // Validate working dates
    if (!workingDatesWithSalary || !Array.isArray(workingDatesWithSalary)) {
      logger.error('Invalid working dates:', workingDatesWithSalary);
      return {
        success: false,
        error: { message: 'No valid working dates provided.' }
      };
    }

    // Format the working dates with salary to match the expected JSONB format
    const formattedDates = workingDatesWithSalary.map(date => ({
      date: date.date instanceof Date ? date.date.toISOString().split('T')[0] : date.date,
      basicSalary: typeof date.basicSalary === 'string' ? parseFloat(date.basicSalary) || 0 : date.basicSalary || 0,
      claims: typeof date.claims === 'string' ? parseFloat(date.claims) || 0 : date.claims || 0,
      commission: typeof date.commission === 'string' ? parseFloat(date.commission) || 0 : date.commission || 0
    }));

    // First, try to use the RPC function
    try {
      const { data, error } = await supabase
        .rpc('save_staff_payroll', {
          p_staff_id: staffId,
          p_working_dates_with_salary: formattedDates
        });

      if (!error) {
        return { success: true };
      }

      // Check for different types of errors
      if (error.message.includes('Staff member not found') || error.message.includes('Candidate not found')) {
        logger.warn('RPC reports candidate not found, will try direct update:', error);
        // Continue to fallback - the direct update might work if the candidate ID is valid but RPC has issues
      } else if (!error.message.includes('Could not find the function')) {
        logger.error('Error saving staff payment details via RPC:', error);
        return { success: false, error };
      }

      logger.warn('RPC function not available, falling back to direct update');
    } catch (rpcError) {
      logger.warn('RPC call failed, falling back to direct update:', rpcError);
    }

    // First check if the staff member exists
    const { data: staffData, error: staffCheckError } = await supabase
      .from('project_staff')
      .select('id')
      .eq('id', staffId)
      .maybeSingle();

    if (staffCheckError) {
      logger.error('Error checking if staff exists:', staffCheckError);
      return { success: false, error: staffCheckError };
    }

    if (!staffData) {
      logger.warn(`Candidate with ID ${staffId} does not exist in project_staff table - checking candidates table`);

      // Check if this ID exists in the candidates table
      const { data: candidateData, error: candidateCheckError } = await supabase
        .from('candidates')
        .select('id, full_name')
        .eq('id', staffId)
        .maybeSingle();

      if (candidateCheckError) {
        logger.error('Error checking if candidate exists:', candidateCheckError);
        return { success: false, error: candidateCheckError };
      }

      if (!candidateData) {
        logger.error(`Candidate with ID ${staffId} does not exist in either table`);
        return {
          success: false,
          error: { message: 'Candidate not found in database' }
        };
      }

      // Verify the candidate record has a valid name
      if (!candidateData.full_name || candidateData.full_name.trim() === '') {
        logger.error(`Candidate with ID ${staffId} exists but has an invalid name value`);
        return {
          success: false,
          error: {
            message: 'Candidate record is invalid',
            details: `Candidate with ID ${staffId} has an invalid or empty name`
          }
        };
      }

      // The candidate exists in candidates table but not in project_staff
      logger.warn(`Found candidate ${candidateData.full_name} (${staffId}) in candidates table, creating project_staff record`);

      // Check if project ID is valid by querying the projects table
      if (projectId && projectId !== "undefined") {
        const { data: projectExists, error: projectCheckError } = await supabase
          .from('projects')
          .select('id')
          .eq('id', projectId)
          .maybeSingle();

        if (projectCheckError) {
          logger.error('Error checking if project exists:', projectCheckError);
        } else if (!projectExists) {
          logger.warn(`Project with ID ${projectId} does not exist in the projects table`);
          projectId = undefined;  // Invalidate the project ID to avoid foreign key errors
        } else {
          logger.debug(`Confirmed project ID ${projectId} exists`);
        }
      }

      // Validate that we have a valid project ID
      if (!projectId || projectId === "undefined") {
        logger.error('Cannot create project_staff record without a valid project_id, received:', projectId);

        // WORKAROUND: Instead of failing, try to directly update the working_dates_with_salary array
        // which doesn't require a project_id. This might work if the ID exists elsewhere in the database.
        logger.debug(`Cannot create project_staff record with invalid project ID. Attempting alternative approach...`);

        // First check if the candidate already has any project_staff records
        const { data: existingRecords, error: lookupError } = await supabase
          .from('project_staff')
          .select('id, project_id')
          .eq('id', staffId);

        if (lookupError) {
          logger.error('Error looking up existing project_staff records:', lookupError);
        } else if (existingRecords && existingRecords.length > 0) {
          logger.debug(`Found ${existingRecords.length} existing project_staff records for this candidate`);

          // Try to update an existing record instead
          const anyRecord = existingRecords[0];
          logger.debug(`Using existing project_staff record with project_id: ${anyRecord.project_id}`);

          const { error: updateError } = await supabase
            .from('project_staff')
            .update({
              working_dates_with_salary: formattedDates
            })
            .eq('id', staffId)
            .eq('project_id', anyRecord.project_id);

          if (updateError) {
            logger.error('Error updating existing project_staff record:', updateError);
          } else {
            logger.debug(`Successfully updated existing record for candidate ${candidateData.full_name}`);
            return { success: true };
          }
        }

        // FALLBACK: Try to directly update the candidate record itself
        logger.debug(`Attempting to update candidate record directly...`);
        const { error: directUpdateError } = await supabase
          .from('candidates')
          .update({
            working_dates: formattedDates.map(date =>
              typeof date.date === 'string' ? date.date : date.date.toISOString()
            ),
            salary_data: {
              working_dates_with_salary: formattedDates,
              last_updated: new Date().toISOString()
            }
          })
          .eq('id', staffId);

        if (directUpdateError) {
          logger.error('Direct update to candidates table failed:', directUpdateError);
          return {
            success: false,
            error: {
              message: 'Cannot update candidate payment data',
              details: 'All attempted approaches failed. Please try again with a valid project ID.'
            }
          };
        }

        logger.debug(`Successfully updated candidate ${candidateData.full_name} directly via the candidates table`);
        return { success: true };
      }

      // Create the project_staff record
      const { error: createError } = await supabase
        .from('project_staff')
        .insert({
          id: staffId,
          project_id: projectId,  // Must be a valid project ID
          name: candidateData.full_name,
          working_dates_with_salary: formattedDates
        });

      if (createError) {
        logger.error('Error creating project_staff record:', createError);

        // Check if this is a foreign key constraint error (project not found)
        if (createError.code === '23503' && createError.details?.includes('project_staff_project_id_fkey')) {
          logger.warn(`Foreign key constraint error - project ID ${projectId} does not exist in the projects table`);

          // First check if the candidate already has any project_staff records
          const { data: existingRecords, error: lookupError } = await supabase
            .from('project_staff')
            .select('id, project_id')
            .eq('id', staffId);

          if (!lookupError && existingRecords && existingRecords.length > 0) {
            logger.debug(`Found ${existingRecords.length} existing project_staff records for this candidate`);

            // Try to update an existing record instead
            const anyRecord = existingRecords[0];
            logger.debug(`Using existing project_staff record with project_id: ${anyRecord.project_id}`);

            const { error: updateError } = await supabase
              .from('project_staff')
              .update({
                working_dates_with_salary: formattedDates
              })
              .eq('id', staffId)
              .eq('project_id', anyRecord.project_id);

            if (!updateError) {
              logger.debug(`Successfully updated existing record for candidate ${candidateData.full_name}`);
              return { success: true };
            }
          }

          // FALLBACK: Update the candidate record directly
          logger.debug(`Attempting to update candidate record directly as fallback...`);
          const { error: directUpdateError } = await supabase
            .from('candidates')
            .update({
              working_dates: formattedDates.map(date =>
                typeof date.date === 'string' ? date.date : date.date.toISOString()
              ),
              salary_data: {
                working_dates_with_salary: formattedDates,
                last_updated: new Date().toISOString()
              }
            })
            .eq('id', staffId);

          if (directUpdateError) {
            logger.error('Direct update to candidates table failed:', directUpdateError);
            return {
              success: false,
              error: {
                message: 'Invalid project ID and all fallback approaches failed',
                details: `Project ID ${projectId} does not exist in the database`
              }
            };
          }

          logger.debug(`Successfully updated candidate ${candidateData.full_name} directly via the candidates table`);
          return { success: true };
        }

        // For other types of errors, try a simple update
        logger.debug(`Insert failed, { data: attempting update instead...` });
        const { error: updateError } = await supabase
          .from('project_staff')
          .update({
            working_dates_with_salary: formattedDates
          })
          .eq('id', staffId);

        if (updateError) {
          logger.error('Fallback update also failed:', updateError);
          return { success: false, error: createError };
        }

        logger.debug(`Fallback update succeeded for candidate ${candidateData.full_name}`);
        return { success: true };
      }

      logger.debug(`Created project_staff record for candidate ${candidateData.full_name}`);
      // Continue to update the new record
    }

    // Proceed with direct table update
    const { error } = await supabase
      .from('project_staff')
      .update({
        working_dates_with_salary: formattedDates
      })
      .eq('id', staffId);

    if (error) {
      logger.error('Error saving staff payment details via direct update:', error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    logger.error('Exception saving staff payment details:', error);
    return { success: false, error };
  }
}

/**
 * Save all staff payment details for a project to the database
 * Attempts to use the save_project_payroll RPC function if available,
 * falls back to direct table updates if the RPC isn't available
 */
export async function saveProjectPayroll(
  projectId: string,
  staffMembers: Array<{
    id: string;
    workingDatesWithSalary?: WorkingDateWithSalary[];
  }>
): Promise<{ success: boolean; error?: unknown }> {
  try {
    // Validate project ID
    if (!projectId || projectId === "undefined") {
      logger.error('Invalid project ID:', projectId);
      return {
        success: false,
        error: { message: 'Invalid project ID. Cannot save payroll data.' }
      };
    }

    // Validate staff members
    if (!staffMembers || !Array.isArray(staffMembers) || staffMembers.length === 0) {
      logger.error('Invalid staff members:', staffMembers);
      return {
        success: false,
        error: { message: 'No valid staff members provided.' }
      };
    }

    // Filter and format staff data with proper data types
    const filteredStaff = staffMembers
      .filter(staff => staff && staff.id && staff.workingDatesWithSalary && staff.workingDatesWithSalary.length > 0)
      .map(staff => ({
        id: staff.id,
        workingDatesWithSalary: staff.workingDatesWithSalary?.map(date => ({
          date: date.date instanceof Date ? date.date.toISOString().split('T')[0] : date.date,
          basicSalary: typeof date.basicSalary === 'string' ? parseFloat(date.basicSalary) || 0 : date.basicSalary || 0,
          claims: typeof date.claims === 'string' ? parseFloat(date.claims) || 0 : date.claims || 0,
          commission: typeof date.commission === 'string' ? parseFloat(date.commission) || 0 : date.commission || 0
        }))
      }));

    if (filteredStaff.length === 0) {
      return { success: true }; // Nothing to save
    }

    // First, try to use the RPC function
    try {
      const rpcPayload = {
        p_project_id: projectId,
        p_staff_payroll: filteredStaff.map(staff => ({
          id: staff.id,
          working_dates_with_salary: staff.workingDatesWithSalary
        }))
      };

      const { data, error } = await supabase.rpc('save_project_payroll', rpcPayload);

      if (!error) {
        return { success: true };
      }

      // Check for different types of errors
      if (error.message.includes('Project not found') || error.message.includes('Staff member not found') || error.message.includes('Candidate not found')) {
        logger.warn('RPC reports entity not found, will try direct update:', error);
        // Continue to fallback - the direct update might work if the IDs are valid but RPC has issues
      } else if (!error.message.includes('Could not find the function')) {
        logger.error('Error saving project payroll via RPC:', error);
        return { success: false, error };
      }

      logger.warn('RPC function not available, falling back to direct updates');
    } catch (rpcError) {
      logger.warn('RPC call failed, falling back to direct updates:', rpcError);
    }

    // First check if the project exists
    const { data: projectData, error: projectCheckError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .maybeSingle();

    if (projectCheckError) {
      logger.error('Error checking if project exists:', projectCheckError);
      return { success: false, error: projectCheckError };
    }

    if (!projectData) {
      logger.error(`Project with ID ${projectId} does not exist`);
      return {
        success: false,
        error: { message: 'Project not found in database' }
      };
    }

    // Check which staff members exist in the database
    const staffIds = filteredStaff.map(staff => staff.id);
    const { data: existingStaff, error: staffCheckError } = await supabase
      .from('project_staff')
      .select('id')
      .eq('project_id', projectId)
      .in('id', staffIds);

    if (staffCheckError) {
      logger.error('Error checking staff existence:', staffCheckError);
      return { success: false, error: staffCheckError };
    }

    // Create a Set of existing staff IDs for quick lookup
    const existingStaffIds = new Set(existingStaff?.map(s => s.id) || []);

    // Check for candidates that might exist in the candidates table but not in project_staff
    const missingStaffIds = staffIds.filter(id => !existingStaffIds.has(id));

    if (missingStaffIds.length > 0) {
      logger.warn(`${missingStaffIds.length} candidates not found in project_staff table - checking candidates table`);

      // Check which of these exist in the candidates table
      const { data: existingCandidates, error: candidateCheckError } = await supabase
        .from('candidates')
        .select('id, full_name')
        .in('id', missingStaffIds);

      if (candidateCheckError) {
        logger.error('Error checking candidates existence:', candidateCheckError);
        // Continue with the ones we know exist in project_staff
      } else if (existingCandidates && existingCandidates.length > 0) {
        logger.debug(`Found ${existingCandidates.length} candidates that need to be added to project_staff`);

        // Validate that we have a valid project ID
        if (!projectId || projectId === "undefined") {
          logger.error('Cannot create project_staff records without a valid project_id');
          // Continue with the ones we know exist
        } else {
          // Filter out any candidates with invalid names
          const validCandidates = existingCandidates.filter(candidate =>
            candidate.full_name && candidate.full_name.trim() !== ''
          );

          if (validCandidates.length < existingCandidates.length) {
            logger.warn(`Skipping ${existingCandidates.length - validCandidates.length} candidates with invalid names`);
          }

          // Create project_staff records for these candidates
          const staffToCreate = validCandidates.map(candidate => {
            const staffData = filteredStaff.find(staff => staff.id === candidate.id);
            return {
              id: candidate.id,
              project_id: projectId,
              name: candidate.full_name,
              working_dates_with_salary: staffData?.workingDatesWithSalary || []
            };
          });

          // Insert the new records
          const { error: createError } = await supabase
            .from('project_staff')
            .insert(staffToCreate);

          if (createError) {
            logger.error('Error creating project_staff records:', createError);
            // Continue with the ones we know exist
          } else {
            logger.debug(`Created ${staffToCreate.length} new project_staff records`);
            // Add these IDs to our valid set
            staffToCreate.forEach(staff => existingStaffIds.add(staff.id));
          }
        }
      }
    }

    // Get list of IDs that are still missing after our checks
    const stillMissingIds = staffIds.filter(id => !existingStaffIds.has(id));

    // Log which candidates weren't found
    if (stillMissingIds.length > 0) {
      logger.warn(`${stillMissingIds.length} candidates not found in either project_staff or candidates tables:`, stillMissingIds);
    }

    // Only update candidates that exist
    const validStaff = filteredStaff.filter(staff => existingStaffIds.has(staff.id));

    if (validStaff.length === 0) {
      logger.error('No valid candidates found to update');
      return {
        success: false,
        error: {
          message: 'No valid candidates found to update',
          details: `The following candidate IDs were not found in the database: ${stillMissingIds.join(', ')}`
        }
      };
    }

    // Fallback: Use direct table updates for each valid staff member individually
    const results = await Promise.all(
      validStaff.map(async staff => {
        const { error } = await supabase
          .from('project_staff')
          .update({
            working_dates_with_salary: staff.workingDatesWithSalary
          })
          .eq('id', staff.id)
          .eq('project_id', projectId);

        if (error) {
          logger.error(`Error updating staff ${staff.id}:`, error);
          return { success: false, error };
        }
        return { success: true };
      })
    );

    // Check if any updates failed
    const failures = results.filter(result => !result.success);
    if (failures.length > 0) {
      logger.error(`Failed to save payment details for ${failures.length} staff members`);
      return {
        success: false,
        error: `Failed to save payment details for ${failures.length} staff members`
      };
    }

    return { success: true };
  } catch (error) {
    logger.error('Exception saving project payroll:', error);
    return { success: false, error };
  }
}

/**
 * Get a summary of the project payroll from the database
 */
export async function getProjectPayrollSummary(projectId: string) {
  try {
    const { data, error } = await supabase
      .rpc('get_project_payroll_summary', { project_id: projectId });

    if (error) {
      logger.error('Error fetching project payroll summary:', error);
      return null;
    }

    return data;
  } catch (error) {
    logger.error('Exception fetching project payroll summary:', error);
    return null;
  }
}

/**
 * Get detailed payroll information for a staff member
 */
export async function getStaffPayrollDetails(staffId: string) {
  try {
    const { data, error } = await supabase
      .rpc('get_staff_payroll_details', { staff_id: staffId });

    if (error) {
      logger.error('Error fetching staff payroll details:', error);
      return null;
    }

    return data;
  } catch (error) {
    logger.error('Exception fetching staff payroll details:', error);
    return null;
  }
}