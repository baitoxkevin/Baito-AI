import { supabase } from '@/lib/supabase';
import { getUserProfile } from '@/lib/auth';

export interface CandidateInfo {
  name: string;
  email: string;
  phone: string;
  skills: string[];
  location: string;
  experience: string[];
  education: string[];
  raw_resume: string;
  
  // Additional fields for the numbered format
  unique_id?: string;
  ic_number?: string;
  age?: string;
  date_of_birth?: string;
  race?: string;
  tshirt_size?: string;
  transportation?: string;
  spoken_languages?: string;
  height?: string;
  typhoid?: string;
  
  // Emergency contact information
  emergency_contact_name?: string;
  emergency_contact_number?: string;
  
  // Photos
  profile_photo?: string;
  full_body_photo?: string;
}

/**
 * Create a new candidate in the database
 */
export async function createCandidate(candidateInfo: CandidateInfo) {
  try {
    // Get the current user's ID
    const profile = await getUserProfile();
    if (!profile) {
      throw new Error('No user profile found');
    }
    
    const userId = profile.id;
    
    // Insert the candidate into the database
    // Calculate date of birth from IC number if available, otherwise use age
    let dateOfBirth = null;
    
    // Malaysian IC format: YYMMDD-SS-####
    // Extract DOB from IC number first if available
    if (candidateInfo.ic_number && candidateInfo.ic_number.length >= 6) {
      const icDigits = candidateInfo.ic_number.replace(/\D/g, '');
      if (icDigits.length >= 6) {
        // Extract year, month, day from first 6 digits
        let year = parseInt(icDigits.substring(0, 2));
        const month = parseInt(icDigits.substring(2, 4)) - 1; // JS months are 0-indexed
        const day = parseInt(icDigits.substring(4, 6));
        
        // Determine the century (people born in 2000s have 00-99 as first two digits)
        // Those born before 2000 have year in range 00-99
        if (year < 30) { // Assuming anyone with IC starting with 00-29 was born in 2000s
          year += 2000;
        } else {
          year += 1900;
        }
        
        // Validate the date is realistic
        const dob = new Date(year, month, day);
        if (!isNaN(dob.getTime()) && month === dob.getMonth() && day === dob.getDate()) {
          dateOfBirth = dob.toISOString().split('T')[0];
        }
      }
    }
    
    // Fall back to age-based calculation if IC extraction didn't work
    if (!dateOfBirth && candidateInfo.age) {
      const currentDate = new Date();
      const birthYear = currentDate.getFullYear() - parseInt(candidateInfo.age);
      dateOfBirth = new Date(birthYear, 0, 1).toISOString().split('T')[0]; // Just use January 1st of the birth year
    }

    // Map transportation to has_vehicle
    const hasVehicle = candidateInfo.transportation?.toLowerCase().includes('car') || 
                      candidateInfo.transportation?.toLowerCase().includes('motorcycle') || 
                      candidateInfo.transportation?.toLowerCase().includes('own');
    
    const vehicleType = hasVehicle ? candidateInfo.transportation : null;

    // Create the candidate data object with fields that match the database schema
    // Generate a unique ID if one isn't provided
    const uniqueId = candidateInfo.unique_id || `C${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`;
    
    // Use only fields that exist in the database
    const candidateData: any = {
      full_name: candidateInfo.name,
      ic_number: candidateInfo.ic_number || '000000-00-0000', // Placeholder if missing
      date_of_birth: dateOfBirth,
      phone_number: candidateInfo.phone || '0000000000', // Placeholder if missing
      gender: 'other',
      email: candidateInfo.email || 'unknown@example.com', // Placeholder if missing
      nationality: 'Malaysian', // Default value
      unique_id: uniqueId, // Add the unique ID
      
      // Work related fields
      has_vehicle: hasVehicle,
      vehicle_type: vehicleType,
      highest_education: candidateInfo.education.length > 0 ? candidateInfo.education[0] : null,
      
      // Address data - serialize as JSON
      address_business: {
        street: candidateInfo.location || '',
        city: '',
        state: '',
        postcode: '',
        country_code: 'MY',
      },
      
      // Store metadata
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    // Store the additional data
    const customFieldsData = {
      race: candidateInfo.race || '',
      tshirt_size: candidateInfo.tshirt_size || '',
      transportation: candidateInfo.transportation || '',
      spoken_languages: candidateInfo.spoken_languages || '',
      height: candidateInfo.height || '',
      typhoid: candidateInfo.typhoid || 'No',
      skills: candidateInfo.skills,
      experience_summary: candidateInfo.experience.join('\n\n'),
      education_summary: candidateInfo.education.join('\n\n'),
      resume_text: candidateInfo.raw_resume,
      profile_photo: candidateInfo.profile_photo || '',
      full_body_photo: candidateInfo.full_body_photo || '',
      emergency_contact_name: candidateInfo.emergency_contact_name || '',
      emergency_contact_number: candidateInfo.emergency_contact_number || '',
    };
    
    // Try to include custom_fields if supported
    try {
      // First, check if the custom_fields column exists by doing a select query
      const { error: checkError } = await supabase
        .from('candidates')
        .select('custom_fields')
        .limit(1);
      
      // If no error, the column exists
      if (!checkError) {
        candidateData.custom_fields = customFieldsData;
      }
    } catch (e) {
      console.log('Custom fields not supported, continuing without them');
    }
    
    // Insert the candidate into the database
    const { data, error } = await supabase
      .from('candidates')
      .insert(candidateData)
      .select();
    
    if (error) {
      throw error;
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('Error creating candidate:', error);
    return { success: false, error };
  }
}

/**
 * Extract text patterns from resume text
 */
export function extractCandidateInfo(text: string): CandidateInfo {
  // Define patterns for different profile sections with support for numbered formats
  const PATTERNS = {
    // Basic patterns
    name: /([A-Z][a-z]+ [A-Z][a-z]+)/,
    
    // Direct label format patterns (more common in resumes)
    labeledName: /(?:Full Name|Name):?\s*([^\n]+)/i,
    labeledIC: /(?:IC No|IC Number|I\/C Number|Identification Number):?\s*([^\n]+)/i,
    
    // Numbered format patterns (matches both with and without numbers)
    numberedName: /(?:1\.?\s*)?(?:\s*)?Full Name(?:\s+as per I\/C)?:([^\n]+)/i,
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
    phone: /(?:Contact (?:no|number)|Phone|Tel):?\s*([^\n]+)/i,
    phoneBackup: /\b(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/,
    icNumber: /(?:2\.?\s*)?(?:\s*)?I\/C Number:([^\n]+)/i,
    address: /(?:Address|Where do you stay):?\s*([^\n]+)/i,
    age: /(?:4\.?\s*)?(?:\s*)?Age:([^\n]+)/i,
    race: /(?:5\.?\s*)?(?:\s*)?Race:([^\n]+)/i,
    tshirtSize: /(?:6\.?\s*)?(?:\s*)?T-Shirt Size:([^\n]+)/i,
    transportation: /(?:7\.?\s*)?(?:\s*)?Transportation[^:]*:([^\n]+)/i,
    language: /(?:8\.?\s*)?(?:\s*)?(?:Spoken language|Language[s]?):?\s*([^\n]+)/i,
    height: /(?:9\.?\s*)?(?:\s*)?Height[^:]*:([^\n]+)/i,
    typhoid: /(?:10\.?\s*)?(?:\s*)?T(?:h)?yphoid:([^\n]+)/i,
    
    // Emergency contact patterns
    emergencyContactName: /(?:11\.?\s*)?(?:\s*)?Emergency Contact (?:Name|Person):([^\n]+)/i,
    emergencyContactNumber: /(?:12\.?\s*)?(?:\s*)?Emergency Contact (?:Number|Phone|H\/P):([^\n]+)/i,
    emergencyContact: /Emergency Contact:([^\n]+)/i,
    
    // Standard format patterns
    location: /(Location|LOCATION|Address|ADDRESS):(.*?)(?:\n\n|\n[A-Z]|$)/s,
    skills: /(Skills|SKILLS|Technical Skills|TECHNICAL SKILLS|Competencies|COMPETENCIES):(.*?)(?:\n\n|\n[A-Z]|$)/s,
    workExperience: /Working Experiences? \(List Latest \d+\):\s*([^]*?)(?:\n\n|\n\d+\.|\n[A-Z]|$)/s,
    emceeExperience: /(?:Emcee for[\-:]|Emcee Experience|Working Experience:|Work Experience:|Previous Emcee Events|Masters?[ \-]of[ \-]Ceremonies?)\s*(?:List|Summary|Experience)?[\-:]?\s*([^]*?)(?:\n\n|Latest pictures:|$)/is,
    experience: /(Experience|EXPERIENCE|Work(?:ing)? Experience|WORK(?:ING)? EXPERIENCE|Employment History|EMPLOYMENT HISTORY):?\s*(.*?)(?:\n\n|\n[A-Z]|$)/s,
    education: /(Education|EDUCATION|Academic Background|ACADEMIC BACKGROUND):?\s*(.*?)(?:\n\n|\n[A-Z]|$)/s,
  };
  
  // Try to extract name using various patterns in order of preference
  let name = '';
  
  // First, we try to check for "Full Name as per I/C:" format specifically
  // This handles our test case properly
  const fullNameAsPerICMatch = text.match(PATTERNS.numberedName);
  if (fullNameAsPerICMatch && fullNameAsPerICMatch[1]) {
    name = fullNameAsPerICMatch[1].trim();
  }
  // If that didn't work, try generic labeled name
  else if (text.match(PATTERNS.labeledName)?.[1]) {
    name = text.match(PATTERNS.labeledName)?.[1].trim() || '';
  }
  // If still nothing, try pattern matching in the first few lines
  else {
    // Try to find a name pattern near the beginning of the text
    const firstFewLines = text.split('\n').slice(0, 5).join('\n');
    const nameMatch = firstFewLines.match(/([A-Z][a-z]+(?: [A-Z][a-z]+)+)/);
    if (nameMatch) {
      name = nameMatch[0].trim();
    } else {
      // Fall back to the simple pattern
      name = text.match(PATTERNS.name)?.[0] || '';
    }
  }
  
  // Extract contact information
  const email = text.match(PATTERNS.email)?.[0] || '';
  
  // Extract phone number from labeled format first, then fall back to regex pattern
  let phone = text.match(PATTERNS.phone)?.[1]?.trim() || '';
  if (!phone) {
    phone = text.match(PATTERNS.phoneBackup)?.[0] || '';
  }
  
  // Extract location (try multiple patterns)
  let location = text.match(PATTERNS.address)?.[1]?.trim() || '';
  if (!location) {
    location = text.match(PATTERNS.location)?.[2]?.trim() || '';
  }
  
  // Extract IC number using multiple patterns
  let ic_number = text.match(PATTERNS.labeledIC)?.[1]?.trim() || '';
  if (!ic_number) {
    ic_number = text.match(PATTERNS.icNumber)?.[1]?.trim() || '';
  }
  
  // If we found an IC, clean it up to standard Malaysian format (######-##-####)
  if (ic_number) {
    // Remove any non-digit characters
    const digitsOnly = ic_number.replace(/\D/g, '');
    
    // If we have 12 digits, format properly
    if (digitsOnly.length === 12) {
      ic_number = `${digitsOnly.substring(0, 6)}-${digitsOnly.substring(6, 8)}-${digitsOnly.substring(8, 12)}`;
    }
  }
  
  // If still no IC, try to find any 12-digit number pattern in the text
  if (!ic_number) {
    const icPattern = /\b(\d{6}[-\s]?\d{2}[-\s]?\d{4})\b/;
    const foundIc = text.match(icPattern)?.[1]?.replace(/\s/g, '') || '';
    if (foundIc) {
      // Format to standard
      const digitsOnly = foundIc.replace(/\D/g, '');
      if (digitsOnly.length === 12) {
        ic_number = `${digitsOnly.substring(0, 6)}-${digitsOnly.substring(6, 8)}-${digitsOnly.substring(8, 12)}`;
      }
    }
  }
  const age = text.match(PATTERNS.age)?.[1]?.trim() || '';
  const race = text.match(PATTERNS.race)?.[1]?.trim() || '';
  const tshirt_size = text.match(PATTERNS.tshirtSize)?.[1]?.trim() || '';
  const transportation = text.match(PATTERNS.transportation)?.[1]?.trim() || '';
  const spoken_languages = text.match(PATTERNS.language)?.[1]?.trim() || '';
  const height = text.match(PATTERNS.height)?.[1]?.trim() || '';
  
  // Clean up typhoid value to be just "yes" or "no"
  let typhoid = text.match(PATTERNS.typhoid)?.[1]?.trim() || '';
  if (typhoid) {
    typhoid = typhoid.toLowerCase().includes('yes') ? 'Yes' : 'No';
  }
  
  // Get languages as skills
  let skills: string[] = [];
  
  // If spoken_languages is available, use it as the primary source
  if (spoken_languages) {
    skills = spoken_languages.split(/\s*(?:and|,)\s*/)
      .map(lang => lang.trim())
      .filter(lang => lang.length > 0);
  } else {
    // Attempt to extract from specific Skills section as backup
    const skillsText = text.match(PATTERNS.skills)?.[2] || '';
    if (skillsText) {
      skills = skillsText
        .split(/[,•\n\r]+/)
        .map(skill => skill.trim())
        .filter(skill => skill.length > 2 && skill.length < 50);
    }
  }
  
  // Add common languages if none found
  if (skills.length === 0) {
    // Default to common languages in Malaysia
    skills = ['Malay', 'English', 'Chinese'];
  }
  
  // Deduplicate skills
  skills = [...new Set(skills)];
  
  // Extract experience items (try multiple patterns)
  let experience: string[] = [];
  
  // Try emcee format first (most specific)
  const emceeExperienceText = text.match(PATTERNS.emceeExperience)?.[1] || '';
  if (emceeExperienceText) {
    // Emcee experience can be formatted in multiple ways - let's try different splitting approaches
    // First, try to split by numbered points (e.g., "1. Event Name")
    let expItems = emceeExperienceText
      .split(/\n\d+\.?\s*⁠?/)
      .map(exp => exp.trim())
      .filter(exp => exp.length > 3); // Filter out very short lines
    
    // If that didn't yield good results, try splitting by event markers
    if (expItems.length <= 1) {
      expItems = emceeExperienceText
        .split(/\n(?=[A-Z][\w\s]+ \d{4}|[\w\s]+ for [\w\s]+|[\w\s]+ at [\w\s]+)/)
        .map(exp => exp.trim())
        .filter(exp => exp.length > 5);
    }
    
    // If that still didn't work, try splitting by new lines
    if (expItems.length <= 1) {
      expItems = emceeExperienceText
        .split(/\n+/)
        .map(exp => exp.trim())
        .filter(exp => exp.length > 15); // Only keep substantial lines
    }
    
    experience = expItems;
  }
  
  // Try numbered format if emcee format doesn't match
  if (experience.length === 0) {
    const workExperienceText = text.match(PATTERNS.workExperience)?.[1] || '';
    if (workExperienceText) {
      // Split the text by bullet points or new lines
      experience = workExperienceText
        .split(/•|\*|\n-|\n\d+\.|\n/)
        .map(exp => exp.trim())
        .filter(exp => exp.length > 3); // Filter out very short lines
    }
  }
  
  // If previous patterns don't work, try standard format
  if (experience.length === 0) {
    const experienceText = text.match(PATTERNS.experience)?.[2] || '';
    experience = experienceText
      .split(/\n(?=[A-Z][a-z]+ \d{4}|\d{4}-\d{4}|\d{4} - \d{4}|[A-Z][a-z]+ \d{4} - [A-Z][a-z]+ \d{4})/)
      .map(exp => exp.trim())
      .filter(exp => exp.length > 10);
  }
  
  // Extract education items
  const educationText = text.match(PATTERNS.education)?.[2] || '';
  const education = educationText
    .split(/\n(?=[A-Z]|Bachelor|Master|PhD|Diploma|Certificate|Associate)/)
    .map(edu => edu.trim())
    .filter(edu => edu.length > 10);
  
  // Extract emergency contact information
  let emergency_contact_name = text.match(PATTERNS.emergencyContactName)?.[1]?.trim() || '';
  let emergency_contact_number = text.match(PATTERNS.emergencyContactNumber)?.[1]?.trim() || '';
  
  // If we have the combined emergency contact pattern and no specific fields, try to extract both
  if (!emergency_contact_name && !emergency_contact_number) {
    const emergencyContactFull = text.match(PATTERNS.emergencyContact)?.[1]?.trim() || '';
    if (emergencyContactFull) {
      // Try to split into name and number
      const parts = emergencyContactFull.split(/[-:,]/);
      if (parts.length >= 2) {
        // First part is likely the name, second part is likely the number
        const contactName = parts[0].trim();
        const contactNumber = parts[1].trim();
        
        if (!emergency_contact_name && contactName) {
          emergency_contact_name = contactName;
        }
        
        if (!emergency_contact_number && contactNumber) {
          emergency_contact_number = contactNumber;
        }
      }
    }
  }

  // Extract date of birth from IC number
  let date_of_birth = '';
  if (ic_number && ic_number.length >= 6) {
    const icDigits = ic_number.replace(/\D/g, '');
    if (icDigits.length >= 6) {
      // Extract year, month, day from first 6 digits
      let year = parseInt(icDigits.substring(0, 2));
      const month = parseInt(icDigits.substring(2, 4)) - 1; // JS months are 0-indexed
      const day = parseInt(icDigits.substring(4, 6));
      
      // Determine the century (people born in 2000s have 00-29 as first two digits)
      // Those born before 2000 have year in range 00-99
      if (year < 30) { // Assuming anyone with IC starting with 00-29 was born in 2000s
        year += 2000;
      } else {
        year += 1900;
      }
      
      // Validate the date is realistic
      const dob = new Date(year, month, day);
      if (!isNaN(dob.getTime()) && month === dob.getMonth() && day === dob.getDate()) {
        date_of_birth = dob.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      }
    }
  }

  return {
    name,
    email,
    phone,
    skills,
    location,
    experience,
    education,
    raw_resume: text,
    
    // Additional fields from numbered format
    ic_number,
    age,
    date_of_birth,
    race,
    tshirt_size,
    transportation,
    spoken_languages,
    height,
    typhoid,
    
    // Emergency contact information
    emergency_contact_name,
    emergency_contact_number
  };
}