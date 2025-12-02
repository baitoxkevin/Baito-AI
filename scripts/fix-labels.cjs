const fs = require('fs');
const path = require('path');

// Read the file
const filePath = path.join(__dirname, '../src/pages/ProfessionalProfileTestPage.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Label-Input associations to fix
const labelFixes = [
  // Personal Info
  { label: 'Nationality', id: 'nationality', field: 'nationality' },
  { label: 'IC Number', id: 'ic_number', field: 'ic_number' },
  { label: 'Gender', id: 'gender', field: 'gender' },
  { label: 'Date of Birth', id: 'date_of_birth', field: 'date_of_birth' },
  { label: 'Phone Number', id: 'phone', field: 'phone' },
  { label: 'Email', id: 'email', field: 'email' },
  { label: 'Emergency Contact Name', id: 'emergency_contact_name', field: 'emergency_contact_name' },
  { label: 'Emergency Contact Number', id: 'emergency_contact_number', field: 'emergency_contact_number' },

  // Address
  { label: 'Street Address', id: 'address', field: 'address' },
  { label: 'City', id: 'city', field: 'city' },
  { label: 'State', id: 'state', field: 'state' },
  { label: 'Postcode', id: 'postcode', field: 'postcode' },
  { label: 'Transport Mode', id: 'transport_mode', field: 'transport_mode' },

  // Skills
  { label: 'Education Level', id: 'education_level', field: 'education_level' },
  { label: 'Field of Study', id: 'field_of_study', field: 'field_of_study' },
  { label: 'Years of Experience', id: 'years_of_experience', field: 'years_of_experience' },
  { label: 'Previous Roles', id: 'previous_roles', field: 'previous_roles' },
  { label: 'Skills', id: 'skills', field: 'skills' },
  { label: 'Languages', id: 'languages', field: 'languages' },

  // Bank
  { label: 'Bank Name', id: 'bank_name', field: 'bank_name' },
  { label: 'Account Number', id: 'bank_account_number', field: 'bank_account_number' },
  { label: 'Account Holder Name', id: 'bank_account_holder_name', field: 'bank_account_holder_name' }
];

// Fix each label-input pair
labelFixes.forEach(({ label, id, field }) => {
  // Fix label to have htmlFor
  const labelRegex = new RegExp(`<label className="block text-sm font-medium text-gray-700 mb-2">${label}</label>`, 'g');
  content = content.replace(labelRegex, `<label htmlFor="${id}" className="block text-sm font-medium text-gray-700 mb-2">${label}</label>`);

  // Add id to corresponding input/select/textarea
  // For inputs after the label
  const inputAfterLabelRegex = new RegExp(
    `(<label htmlFor="${id}"[^>]*>[^<]*</label>[\\s\\S]*?<(?:input|select|textarea))([^>]*?)(value=\\{formData\\.${field})`,
    'g'
  );

  content = content.replace(inputAfterLabelRegex, (match, beforeInput, attributes, valueAttr) => {
    // Check if id already exists
    if (!attributes.includes(' id=')) {
      return `${beforeInput} id="${id}"${attributes}${valueAttr}`;
    }
    return match;
  });
});

// Write the fixed content back
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Fixed all label associations in ProfessionalProfileTestPage.tsx');