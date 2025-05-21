import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Loader2, Mail, Phone, Building, User, Briefcase, 
  ShieldAlert, Image, Upload, GitBranchPlus, UsersRound, 
  Plus as PlusIcon, Edit2 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { applyCompanyPermissionsFix, ensureLogosBucketExists } from '@/lib/utils';
import { formatDate } from '@/lib/utils';
import type { Company } from '@/lib/types';
import ContactPersonForm, { ContactPerson } from './ContactPersonForm';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface NewCompanyDialogProps {
  company?: Company;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompanyAdded: () => void;
}

export default function NewCompanyDialog({
  company,
  open,
  onOpenChange,
  onCompanyAdded,
}: NewCompanyDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isApplyingFix, setIsApplyingFix] = useState(false);
  const [permissionError, setPermissionError] = useState(false);
  const { toast } = useToast();
  
  // File upload state
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parent company state
  const [parentCompanies, setParentCompanies] = useState<Company[]>([]);
  const [isLoadingParents, setIsLoadingParents] = useState(false);

  // Contact persons state
  const [contacts, setContacts] = useState<ContactPerson[]>([
    { name: '', designation: '', email: '', phone: '', is_primary: true }
  ]);

  // Form state with DB fields
  const [formData, setFormData] = useState({
    company_name: company?.name || '',
    company_email: company?.contact_email || '',
    company_phone_no: company?.contact_phone || '',
    address: company?.address || '',
    logo_url: company?.logo_url || '',
    parent_id: company?.parent_id || null as string | null,
  });
  
  // Load parent companies
  const loadParentCompanies = async () => {
    setIsLoadingParents(true);
    try {
      // If editing and this company has an ID, exclude it from possible parents
      // to prevent circular references
      let query = supabase
        .from('companies')
        .select('id, company_name')
        .order('company_name');
      
      if (company?.id) {
        query = query.neq('id', company.id);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      setParentCompanies(data || []);
    } catch (error) {
      console.error('Error loading parent companies:', error);
      toast({
        title: 'Error',
        description: 'Failed to load parent companies',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingParents(false);
    }
  };

  // Load company contacts
  const loadCompanyContacts = async (companyId: string) => {
    try {
      const { data, error } = await supabase
        .from('company_contacts')
        .select('*')
        .eq('company_id', companyId);
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setContacts(data);
      } else {
        // If no contacts found, initialize with single empty contact
        setContacts([
          { name: '', designation: '', email: '', phone: '', is_primary: true }
        ]);
      }
    } catch (error) {
      console.error('Error loading company contacts:', error);
      // Default to a single empty contact
      setContacts([
        { name: '', designation: '', email: '', phone: '', is_primary: true }
      ]);
    }
  };
  
  // Reset form when dialog opens or company prop changes
  useEffect(() => {
    if (open) {
      // Load parent companies whenever dialog opens
      loadParentCompanies();
      
      setFormData({
        company_name: company?.company_name || '',
        company_email: company?.company_email || '',
        company_phone_no: company?.company_phone_no || '',
        address: company?.address || '',
        logo_url: company?.logo_url || '',
        parent_id: company?.parent_id || null, // Will be loaded from database if exists
      });
      
      // Reset file upload state
      setLogoFile(null);
      setLogoPreview(company?.logo_url || '');
      
      // If editing a company, load its parent company and contacts
      if (company?.id) {
        // For now, just initialize with a single contact using the PIC fields
        if (company.pic_name) {
          setContacts([{
            name: company.pic_name || '',
            designation: company.pic_designation || '',
            email: company.pic_email || '',
            phone: company.pic_phone || '',
            is_primary: true
          }]);
        } else {
          setContacts([
            { name: '', designation: '', email: '', phone: '', is_primary: true }
          ]);
        }
        
        // Load parent company if it exists
        // This would be implemented when the parent_id field is added to the database
        
        // Load contacts if they exist in the company_contacts table
        // loadCompanyContacts(company.id);
      } else {
        // New company - initialize with a single empty contact
        setContacts([
          { name: '', designation: '', email: '', phone: '', is_primary: true }
        ]);
      }
      
      console.log('Dialog opened, form reset with company data:', company);
    }
  }, [open, company]);
  
  // Handle file selection for logo upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file (PNG, JPG, etc.)',
        variant: 'destructive',
      });
      return;
    }
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Logo image must be less than 2MB',
        variant: 'destructive',
      });
      return;
    }
    
    setLogoFile(file);
    
    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setLogoPreview(previewUrl);
  };
  
  // Upload logo to storage and get URL
  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile) {
      return formData.logo_url || null; // Return existing URL if no new file
    }
    
    setIsUploading(true);
    
    try {
      // First, try to ensure the bucket exists
      const bucketResult = await ensureLogosBucketExists();
      if (!bucketResult.success) {
        console.warn('Error ensuring logos bucket:', bucketResult.message);
        // Continue anyway, in case it's just a permission issue but the bucket actually exists
      }
      
      // Create a unique file path
      const fileExt = logoFile.name.split('.').pop()?.toLowerCase() || 'png';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `company-logos/${fileName}`;
      
      // Create company-logos folder if needed
      try {
        const { data: folderData, error: folderError } = await supabase.storage
          .from('logos')
          .upload('company-logos/.folder', new Blob(['']));
          
        if (folderError && !folderError.message.includes('already exists')) {
          console.warn('Error creating folder:', folderError);
        }
      } catch (folderError) {
        console.warn('Error creating folder:', folderError);
      }
      
      // Upload the file
      const { data, error } = await supabase.storage
        .from('logos')
        .upload(filePath, logoFile, {
          cacheControl: '3600',
          upsert: true // Set to true to overwrite if needed
        });
      
      if (error) {
        if (error.message.includes('Bucket not found')) {
          // Special handling for bucket not found
          toast({
            title: 'Storage bucket missing',
            description: 'Please use the fix-company-logo.html tool to fix this issue',
            variant: 'destructive',
          });
        }
        throw error;
      }
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath);
        
      // Return the public URL
      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload company logo. Check console for details.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // Function to apply the database permissions fix
  const handleApplyFix = async () => {
    setIsApplyingFix(true);
    
    try {
      const result = await applyCompanyPermissionsFix();
      
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Company permissions have been fixed. You can now create companies.',
        });
        setPermissionError(false);
      } else {
        toast({
          title: 'Error',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error applying fix:', error);
      toast({
        title: 'Error',
        description: 'Failed to apply permissions fix',
        variant: 'destructive',
      });
    } finally {
      setIsApplyingFix(false);
    }
  };
  
  // Save company contacts
  const saveCompanyContacts = async (companyId: string, contacts: ContactPerson[]) => {
    try {
      // First, ensure PIC fields are updated with primary contact
      const primaryContact = contacts.find(c => c.is_primary);
      if (primaryContact) {
        // Update PIC fields to maintain backward compatibility
        await supabase
          .from('companies')
          .update({
            pic_name: primaryContact.name,
            pic_designation: primaryContact.designation,
            pic_email: primaryContact.email,
            pic_phone: primaryContact.phone
          })
          .eq('id', companyId);
      }
      
      // Now we would save all contacts to company_contacts table
      // This would be implemented once the company_contacts table is created
      
      // For demonstration purposes, let's log what we would save
      console.log('Company contacts to save:', contacts.map(c => ({ ...c, company_id: companyId })));
      
      // This is a placeholder for the actual implementation
      // If the company_contacts table exists, we would:
      // 1. Delete all existing contacts for this company
      // 2. Insert all new contacts
      
      return true;
    } catch (error) {
      console.error('Error saving company contacts:', error);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setPermissionError(false);

    try {
      // Log current dialog state
      console.log('Form submission - Company data:', formData);
      console.log('Contacts to save:', contacts);
      
      // Validate required fields
      if (!formData.company_name || !formData.company_phone_no) {
        throw new Error('Company name and phone number are required');
      }
      
      // Make sure at least one contact has a name if contacts are defined
      if (contacts.length > 0 && !contacts.some(c => c.name.trim())) {
        throw new Error('At least one contact person with a name is required');
      }
      
      // Try to run permissions check/fix preemptively if fields are valid
      if (formData.company_name && formData.company_phone_no) {
        try {
          const checkResult = await supabase.from('companies').select('count(*)');
          if (checkResult.error && checkResult.error.message.includes('permission denied')) {
            console.log('Preemptively applying permissions fix for companies table');
            await applyCompanyPermissionsFix();
          }
        } catch (e) {
          console.log('Preemptive permission check failed', e);
        }
      }
      
      // Upload logo if one was selected
      let logoUrl = formData.logo_url;
      if (logoFile) {
        logoUrl = await uploadLogo() || logoUrl;
      }
      
      // Get primary contact data for backward compatibility
      const primaryContact = contacts.find(c => c.is_primary);
      
      if (company) {
        // Updating existing company
        const { error } = await supabase
          .from('companies')
          .update({
            company_name: formData.company_name,
            company_email: formData.company_email || null,
            company_phone_no: formData.company_phone_no,
            address: formData.address || null,
            // parent_id: formData.parent_id, // Uncomment when parent_id is added to schema
            pic_name: primaryContact?.name || null,
            pic_designation: primaryContact?.designation || null,
            pic_email: primaryContact?.email || null,
            pic_phone: primaryContact?.phone || null,
            logo_url: logoUrl || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', company.id);

        if (error) {
          console.error('Update error:', error);
          throw new Error(`Failed to update company: ${error.message || 'Unknown error'}`);
        }
        
        // Save company contacts
        await saveCompanyContacts(company.id, contacts);
      } else {
        // Creating new company
        console.log('Creating new company:', formData);
        
        const companyData = {
          company_name: formData.company_name,
          company_email: formData.company_email || null,
          company_phone_no: formData.company_phone_no,
          address: formData.address || null,
          // parent_id: formData.parent_id, // Uncomment when parent_id is added to schema
          pic_name: primaryContact?.name || null,
          pic_designation: primaryContact?.designation || null,
          pic_email: primaryContact?.email || null,
          pic_phone: primaryContact?.phone || null,
          logo_url: logoUrl || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        console.log('Formatted company data:', companyData);
        
        const { data, error } = await supabase
          .from('companies')
          .insert([companyData])
          .select();

        if (error) {
          console.error('Insert error:', error);
          throw new Error(`Failed to create company: ${error.message || 'Unknown error'}`);
        }

        console.log('Company created:', data);
        
        // If company was created successfully and we have its ID, save contacts
        if (data && data.length > 0) {
          await saveCompanyContacts(data[0].id, contacts);
        }
      }

      // Reset form and close dialog
      onCompanyAdded();
      onOpenChange(false);
      setFormData({
        company_name: '',
        company_email: '',
        company_phone_no: '',
        address: '',
        logo_url: '',
        parent_id: null,
      });
      
      // Reset contacts
      setContacts([
        { name: '', designation: '', email: '', phone: '', is_primary: true }
      ]);
      
      // Clear the logo file state
      setLogoFile(null);
      setLogoPreview('');

      // Show success message
      toast({
        title: company ? 'Company updated' : 'Company created',
        description: `Company has been ${company ? 'updated' : 'created'} successfully.`,
      });
    } catch (error) {
      console.error('Error saving company:', error);
      
      // More informative error handling
      let errorMessage = 'Failed to save company. Please try again.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Handle specific Supabase errors
        if (errorMessage.includes('permission denied')) {
          // Show a more helpful error with actionable information
          setPermissionError(true);
          errorMessage = 'Permission denied: Unable to create company. You can fix this by applying the database migration.';
        } else if (errorMessage.includes('duplicate key')) {
          errorMessage = 'A company with this name or email already exists.';
        } else if (errorMessage.includes('violates foreign key constraint')) {
          errorMessage = 'Invalid reference to another record.';
        } else if (errorMessage.includes('null value in column')) {
          // Handle missing required fields
          errorMessage = 'Missing required field. Please check all required fields are filled.';
          console.error('SQL Error details:', errorMessage);
        } else if (errorMessage.includes('violated not-null constraint')) {
          // Handle missing required fields
          errorMessage = 'Required field cannot be empty. Please check all required fields.';
          console.error('SQL Error details:', errorMessage);
        }
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-3 sm:p-5 border-primary/10 bg-background shadow-md shadow-primary/5"
        overlayClassName="bg-black/25 backdrop-blur-[1px]"
      >
        <DialogHeader>
          <DialogTitle>
            {company ? `Edit Company: ${company.company_name}` : "Add New Company"}
          </DialogTitle>
          <div className="flex items-center gap-2 text-primary mt-1">
            {company ? (
              <Edit2 className="h-4 w-4" />
            ) : (
              <PlusIcon className="h-4 w-4" />
            )}
            <DialogDescription>
              {company 
                ? "Update the company details below. Required fields are marked with *" 
                : "Complete the form below to add a new business partner. Required fields are marked with *"}
            </DialogDescription>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="grid gap-5 py-4">
            {/* Company Basic Information Section */}
            <div className="rounded-md border border-muted p-3 bg-muted/5">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Building className="h-4 w-4 text-primary" />
                <span>Basic Information</span>
              </h3>
              
              <div className="flex flex-col md:flex-row gap-4">
                <div className="grid gap-2 md:w-3/4">
                  <Label htmlFor="company_name" className="flex items-center gap-2">
                    <span>Company Name *</span>
                  </Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, company_name: e.target.value }));
                    }}
                    placeholder="Enter company name"
                    required
                  />
                  
                  {/* Parent Company Selection */}
                  <div className="grid gap-1 mt-3">
                    <Label htmlFor="parent_company" className="flex items-center gap-2 text-sm">
                      <GitBranchPlus className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Parent Company</span>
                      <span className="text-xs text-muted-foreground ml-1">(Optional)</span>
                    </Label>
                    <Select 
                      value={formData.parent_id || "none"}
                      onValueChange={(value) => 
                        setFormData(prev => ({ ...prev, parent_id: value !== "none" ? value : null }))
                      }
                    >
                      <SelectTrigger id="parent_company" className="w-full">
                        <SelectValue placeholder="None (Top-level company)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None (Top-level company)</SelectItem>
                        {parentCompanies.map((parent) => (
                          <SelectItem key={parent.id} value={parent.id}>
                            {parent.company_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid gap-2 md:w-1/4">
                  <Label htmlFor="company_logo" className="flex items-center gap-2">
                    <span>Logo</span>
                    <span className="text-xs text-muted-foreground">(Optional)</span>
                  </Label>
                  <div className="flex flex-col items-center gap-2">
                    <div 
                      className="w-24 h-24 border rounded-md flex items-center justify-center bg-gray-50 dark:bg-gray-900 overflow-hidden relative cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {logoPreview || formData.logo_url ? (
                        <img 
                          src={logoPreview || formData.logo_url} 
                          alt="Company logo preview" 
                          className="w-full h-full object-contain" 
                        />
                      ) : (
                        <Building className="h-12 w-12 text-gray-300 dark:text-gray-600" />
                      )}
                      <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                        <Upload className="h-6 w-6 text-white drop-shadow-md" />
                      </div>
                    </div>
                    <input
                      type="file"
                      id="company_logo"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      className="w-24 text-xs h-8"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {logoPreview ? 'Change' : 'Upload'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Company Contact Information Section */}
            <div className="rounded-md border border-muted p-3 bg-muted/5">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                <span>Company Contact Information</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="company_phone_no">
                    <span>Phone Number *</span>
                  </Label>
                  <Input
                    id="company_phone_no"
                    value={formData.company_phone_no}
                    onChange={(e) => setFormData(prev => ({ ...prev, company_phone_no: e.target.value }))}
                    placeholder="+1 (555) 123-4567"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="company_email">
                    <span>Email Address</span>
                    <span className="text-xs text-muted-foreground ml-1">(Optional)</span>
                  </Label>
                  <Input
                    id="company_email"
                    type="email"
                    value={formData.company_email}
                    onChange={(e) => setFormData(prev => ({ ...prev, company_email: e.target.value }))}
                    placeholder="company@example.com"
                  />
                </div>
              </div>
              
              <div className="grid gap-2 mt-3">
                <Label htmlFor="address">
                  <span>Address</span>
                  <span className="text-xs text-muted-foreground ml-1">(Optional)</span>
                </Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="123 Business Ave, Suite 100, City, State, ZIP"
                />
              </div>
            </div>
            
            {/* Contact Persons Section */}
            <div className="rounded-md border border-muted p-3 bg-muted/5">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <UsersRound className="h-4 w-4 text-primary" />
                <span>Contact Persons</span>
              </h3>
              
              {/* Contact Person Form Component */}
              <ContactPersonForm
                contacts={contacts}
                onChange={setContacts}
              />
            </div>
          </div>
          
          {/* Show permission error message and fix button */}
          {permissionError && (
            <div className="mt-3 mb-4 p-3 border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900 rounded-md">
              <div className="flex gap-2 items-start">
                <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-amber-800 dark:text-amber-300">Permission Error</h4>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                    You don't have permission to create companies. This can be fixed by applying the database migration.
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    className="mt-2 bg-amber-600 hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-600"
                    onClick={handleApplyFix}
                    disabled={isApplyingFix}
                  >
                    {isApplyingFix ? (
                      <>
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        Applying Fix...
                      </>
                    ) : (
                      'Apply Database Fix'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="mt-4 pt-3 border-t">
            <div className="mr-auto text-xs text-muted-foreground">
              * Required fields
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="min-w-[100px]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                    {company ? 'Updating...' : 'Creating...'}
                  </>
                ) : company ? (
                  'Save Changes'
                ) : (
                  'Create Company'
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}