import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Briefcase, Mail, Phone, PlusCircle, Trash2, User } from 'lucide-react';

export interface ContactPerson {
  id?: string;
  company_id?: string;
  name: string;
  designation: string;
  email: string;
  phone: string;
  is_primary?: boolean;
}

interface ContactPersonFormProps {
  contacts: ContactPerson[];
  onChange: (contacts: ContactPerson[]) => void;
}

export default function ContactPersonForm({ contacts, onChange }: ContactPersonFormProps) {
  // If there are no contacts, initialize with one empty contact
  const [contactList, setContactList] = useState<ContactPerson[]>(
    contacts.length > 0 
      ? contacts 
      : [{ name: '', designation: '', email: '', phone: '', is_primary: true }]
  );

  const handleAddContact = () => {
    setContactList(prev => {
      const updated = [...prev, { name: '', designation: '', email: '', phone: '', is_primary: false }];
      onChange(updated);
      return updated;
    });
  };

  const handleRemoveContact = (index: number) => {
    if (contactList.length <= 1) {
      return; // Always keep at least one contact field
    }

    setContactList(prev => {
      const updated = prev.filter((_, i) => i !== index);
      
      // Ensure there's still a primary contact if we removed the primary one
      if (prev[index].is_primary && updated.length > 0) {
        updated[0].is_primary = true;
      }
      
      onChange(updated);
      return updated;
    });
  };

  const handleContactChange = (index: number, field: keyof ContactPerson, value: string | boolean) => {
    setContactList(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      
      // If making this contact primary, remove primary from others
      if (field === 'is_primary' && value === true) {
        updated.forEach((contact, i) => {
          if (i !== index) {
            updated[i] = { ...updated[i], is_primary: false };
          }
        });
      }
      
      onChange(updated);
      return updated;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span>Contact Persons</span>
        </h4>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddContact}
          className="h-8"
        >
          <PlusCircle className="h-4 w-4 mr-1" />
          Add Contact
        </Button>
      </div>

      {contactList.map((contact, index) => (
        <div 
          key={index} 
          className={`p-3 rounded-md border ${contact.is_primary ? 'border-primary/30 bg-primary/5' : 'border-muted'}`}
        >
          <div className="flex justify-between items-center mb-2">
            <h5 className="text-sm font-medium">
              {contact.is_primary ? 'Primary Contact' : `Contact ${index + 1}`}
            </h5>
            {contactList.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveContact(index)}
                className="h-7 px-2 text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor={`contact_name_${index}`}>Name</Label>
              <Input
                id={`contact_name_${index}`}
                value={contact.name}
                onChange={(e) => handleContactChange(index, 'name', e.target.value)}
                placeholder="Contact person's full name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`contact_designation_${index}`} className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <span>Job Title</span>
              </Label>
              <Input
                id={`contact_designation_${index}`}
                value={contact.designation}
                onChange={(e) => handleContactChange(index, 'designation', e.target.value)}
                placeholder="e.g. CEO, Manager, Director"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <div className="grid gap-2">
              <Label htmlFor={`contact_email_${index}`} className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>Email</span>
              </Label>
              <Input
                id={`contact_email_${index}`}
                type="email"
                value={contact.email}
                onChange={(e) => handleContactChange(index, 'email', e.target.value)}
                placeholder="contact@example.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`contact_phone_${index}`} className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>Phone</span>
              </Label>
              <Input
                id={`contact_phone_${index}`}
                value={contact.phone}
                onChange={(e) => handleContactChange(index, 'phone', e.target.value)}
                placeholder="+1 (555) 987-6543"
              />
            </div>
          </div>
          
          {!contact.is_primary && (
            <div className="mt-3">
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-7 p-0"
                onClick={() => handleContactChange(index, 'is_primary', true)}
              >
                Set as primary contact
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}