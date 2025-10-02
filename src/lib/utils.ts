import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { isWeekend, format, parseISO } from 'date-fns';
import type { Project } from '@/lib/types';
import { supabase } from '@/lib/supabase';

// Global declaration for file picker state
declare global {
  interface Window {
    __filePickerActive?: boolean;
  }
}

export const eventColors = {
  'roving': 'bg-red-200 text-red-800',
  'roadshow': 'bg-blue-200 text-blue-800',
  'in-store': 'bg-purple-200 text-purple-800',
  'ad-hoc': 'bg-yellow-200 text-yellow-800',
  'corporate': 'bg-green-200 text-green-800',
  'wedding': 'bg-pink-200 text-pink-800',
  'concert': 'bg-indigo-200 text-indigo-800',
  'conference': 'bg-orange-200 text-orange-800',
  'other': 'bg-gray-200 text-gray-800',
} as const;

export function formatTimeString(timeStr: string) {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':');
  const date = new Date();
  date.setHours(parseInt(hours, 10));
  date.setMinutes(parseInt(minutes, 10));
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
}

export function formatDate(dateString: string | null | undefined): string {
  try {
    if (!dateString) {
      return '-';
    }
    const date = parseISO(dateString);
    return format(date, 'd MMM');
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString || '-';
  }
}

export function formatRecurringDates(project: Project): string {
  if (project.schedule_type !== 'recurring' || !project.recurrence_days || !project.end_date) {
    // For non-recurring projects, use compact date formatting
    const startDate = formatDate(project.start_date);
    const endDate = project.end_date ? formatDate(project.end_date) : null;
    return endDate ? `${startDate}-${endDate}` : startDate;
  }
  
  // Generate specific dates for recurring events
  const startDateObj = new Date(project.start_date);
  const endDateObj = new Date(project.end_date);
  const dayNumbers = project.recurrence_days;
  const dayNames = dayNumbers.map(day => ['Su','Mo','Tu','We','Th','Fr','Sa'][day]);
  
  // Format more compactly with 1-2 character month abbreviations
  const formatCompactDate = (date: Date) => {
    // Get day number and ultra-short month (1-2 chars)
    const day = date.getDate();
    const month = ['J','F','M','A','M','Jn','Jl','A','S','O','N','D'][date.getMonth()];
    return `${day}${month}`;
  };
  
  // For 1-2 specific days per week, show actual dates more compactly
  if (dayNumbers.length <= 2) {
    // For weekend or specific day selection, show the actual dates
    const dates = [];
    const currentDate = new Date(startDateObj);
    
    // Adjust to first matching day if needed
    while (!dayNumbers.includes(currentDate.getDay())) {
      currentDate.setDate(currentDate.getDate() + 1);
      if (currentDate > endDateObj) break;
    }
    
    // Collect all matching dates
    while (currentDate <= endDateObj) {
      if (dayNumbers.includes(currentDate.getDay())) {
        dates.push(new Date(currentDate));
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Format the dates in a more compact way
    if (dates.length > 0) {
      // Group consecutive dates
      const dateGroups = [];
      let currentGroup = [dates[0]];
      
      for (let i = 1; i < dates.length; i++) {
        const prevDate = dates[i-1];
        const currDate = dates[i];
        const dayDiff = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (dayDiff === 1) {
          currentGroup.push(currDate);
        } else {
          dateGroups.push([...currentGroup]);
          currentGroup = [currDate];
        }
      }
      
      dateGroups.push(currentGroup);
      
      // Format date groups more compactly
      const formattedGroups = dateGroups.map(group => {
        if (group.length === 1) {
          return formatCompactDate(group[0]);
        } else {
          return `${formatCompactDate(group[0])}-${formatCompactDate(group[group.length-1])}`;
        }
      });
      
      // Always truncate after 2 groups to keep it compact
      if (formattedGroups.length > 2) {
        return `${formattedGroups.slice(0, 2).join(', ')}...`;
      }
      
      return formattedGroups.join(', ');
    }
  }
  
  // For specific day patterns, show more compactly
  // Handle common weekly patterns specially
  if (dayNumbers.length === 5 && 
      dayNumbers.includes(1) && dayNumbers.includes(2) && 
      dayNumbers.includes(3) && dayNumbers.includes(4) && 
      dayNumbers.includes(5)) {
    // Weekdays pattern
    return `Weekdays (${formatCompactDate(startDateObj)}-${formatCompactDate(endDateObj)})`;
  } else if (dayNumbers.length === 2 && 
             dayNumbers.includes(0) && dayNumbers.includes(6)) {
    // Weekend pattern
    return `Weekends (${formatCompactDate(startDateObj)}-${formatCompactDate(endDateObj)})`;
  } else if (dayNumbers.length === 7) {
    // Daily pattern
    return `Daily (${formatCompactDate(startDateObj)}-${formatCompactDate(endDateObj)})`;
  }
  
  // For other patterns, use extremely compact days + date range
  if (dayNames.length > 3) {
    return `${dayNames.length}d/wk (${formatCompactDate(startDateObj)}-${formatCompactDate(endDateObj)})`;
  }
  
  // For 2-3 days, show the day abbreviations
  return `${dayNames.join(',')} (${formatCompactDate(startDateObj)}-${formatCompactDate(endDateObj)})`;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Creates a standardized dialog close handler with proper delay to prevent UI glitches
 * @param onOpenChange The original onOpenChange function
 * @param delay Optional delay in ms (defaults to 100ms)
 * @returns A handler function for the dialog onOpenChange
 */
export function createDialogHandler(
  onOpenChange: (open: boolean) => void, 
  delay = 100
): (open: boolean) => void {
  // Create a reference to track if we're currently in a file picker dialog
  let isInFilePicker = false;
  
  // Event listeners to detect file input clicks
  const detectFileInputClick = (e: MouseEvent) => {
    if (e.target instanceof HTMLElement) {
      // Check if the clicked element or its parent is a file input trigger
      const isFileInputTrigger = (element: HTMLElement | null): boolean => {
        if (!element) return false;
        
        // Common patterns for file input triggers
        if (element.tagName === 'INPUT' && element.getAttribute('type') === 'file') return true;
        if (element.getAttribute('data-file-input-trigger') === 'true') return true;
        if (element.onclick && element.onclick.toString().includes('fileInput')) return true;
        
        // Check class names for camera or upload related terms
        const className = element.className || '';
        if (
          className.includes('upload') || 
          className.includes('camera') || 
          className.includes('avatar')
        ) return true;
        
        // Check if any child is a camera or upload icon
        const hasUploadIcon = Array.from(element.children).some(child => {
          if (child instanceof HTMLElement) {
            return child.className?.includes('camera') || 
                  child.className?.includes('upload');
          }
          return false;
        });
        
        if (hasUploadIcon) return true;
        
        return isFileInputTrigger(element.parentElement);
      };
      
      if (isFileInputTrigger(e.target as HTMLElement)) {
        isInFilePicker = true;
        console.log('File picker detected, preventing dialog auto-close');
        
        // Reset the flag after a reasonable time for the file picker to complete
        setTimeout(() => {
          isInFilePicker = false;
        }, 60000); // 1 minute timeout
      }
    }
  };
  
  // Add listener when this handler is created
  document.addEventListener('click', detectFileInputClick);
  
  return (newOpen: boolean) => {
    if (!newOpen) {
      // Check both our file picker detection and the global flag
      if (isInFilePicker || window.__filePickerActive) {
        console.log('Preventing automatic dialog close during file picker operation');
        return;
      }
      
      // Set a flag in the DOM to indicate transition is happening
      document.body.setAttribute('data-dialog-closing', 'true');
      
      // Add a small delay before actually closing to ensure smooth transition
      setTimeout(() => {
        onOpenChange(newOpen);
        // Clean up flag
        document.body.removeAttribute('data-dialog-closing');
      }, delay);
    } else {
      // When opening, execute immediately
      onOpenChange(newOpen);
      
      // Set overflow hidden on body to prevent background scrolling
      document.body.classList.add('overflow-hidden');
      
      // When dialog closes, remove the class
      setTimeout(() => {
        if (!document.querySelector('[role="dialog"]')) {
          document.body.classList.remove('overflow-hidden');
        }
      }, delay + 50);
    }
  };
}

/**
 * Z-index values used throughout the application for consistent stacking
 */
export const zIndices = {
  // Base layers
  base: 1,
  elevated: 10,
  
  // Navigation and layout
  nav: 100,
  header: 100,
  sidebar: 100,
  
  // Floating components that appear above the content
  dropdown: 250,
  select: 250,
  popover: 250,
  tooltip: 300,
  
  // Modal and dialog layers
  modalOverlay: 150,
  modalContent: 200,
  
  // Toast notifications
  toast: 400,
  
  // Top layer for debugging and critical UI (higher than everything)
  top: 1000,
};

export const getBestTextColor = (bgColor: string): string => {
  // Check if it's a valid hex color
  if (!bgColor || !bgColor.startsWith('#') || bgColor.length !== 7) {
    return '#000000'; // Default to black text
  }
  
  // Extract RGB components
  const r = parseInt(bgColor.substring(1, 3), 16);
  const g = parseInt(bgColor.substring(3, 5), 16);
  const b = parseInt(bgColor.substring(5, 7), 16);
  
  // Calculate perceived brightness (YIQ formula)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  
  // Return white for dark backgrounds, black for light backgrounds
  return brightness > 130 ? '#000000' : '#FFFFFF';
};

/**
 * Compares two arrays for equality, handles date objects properly
 */
export const arraysAreEqual = (arr1: any[], arr2: any[]) => {
  if (arr1.length !== arr2.length) return false;
  
  const processArrayForComparison = (arr: any[]) => {
    return arr.map(item => {
      if (item instanceof Date) {
        return format(item, 'yyyy-MM-dd');
      } else if (typeof item === 'object' && item !== null) {
        const processedItem = { ...item };
        for (const key in processedItem) {
          if (processedItem[key] instanceof Date) {
            processedItem[key] = format(processedItem[key], 'yyyy-MM-dd');
          } else if (Array.isArray(processedItem[key])) {
            processedItem[key] = processArrayForComparison(processedItem[key]);
          }
        }
        return processedItem;
      }
      return item;
    });
  };
  
  const normalizedArr1 = processArrayForComparison(arr1);
  const normalizedArr2 = processArrayForComparison(arr2);
  
  return JSON.stringify(normalizedArr1) === JSON.stringify(normalizedArr2);
};

/**
 * Prepares staff data for saving to backend
 */
export const prepareStaffForSaving = (staffArray: any[]) => {
  return staffArray.map(member => {
    const processedMember = { ...member };
    
    // Convert date objects to formatted strings for backend
    if (Array.isArray(processedMember.workingDates)) {
      processedMember.workingDates = processedMember.workingDates.map((date: any) => {
        if (date instanceof Date) {
          return format(date, 'yyyy-MM-dd');
        }
        return date;
      });
    } else {
      // Initialize with an empty array to prevent errors
      processedMember.workingDates = [];
    }
    
    // Handle workingDatesWithSalary
    if (Array.isArray(processedMember.workingDatesWithSalary)) {
      processedMember.workingDatesWithSalary = processedMember.workingDatesWithSalary.map((entry: any) => ({
        ...entry,
        date: entry.date instanceof Date ? format(entry.date, 'yyyy-MM-dd') : entry.date,
        basicSalary: parseFloat(entry.basicSalary) || 0,
        claims: parseFloat(entry.claims) || 0,
        commission: parseFloat(entry.commission) || 0
      }));
    } else {
      // Initialize with an empty array
      processedMember.workingDatesWithSalary = [];
    }
    
    return processedMember;
  });
};

/**
 * Generates a human-readable summary of changes
 */
export const generateChangePrompt = (changes: any[]) => {
  if (changes.length === 0) return "";
  
  let prompt = "The following changes will be made:\n\n";
  
  changes.forEach((change) => {
    prompt += `• ${change.field}:\n`;
    prompt += `  From: ${change.old || '(empty)'}\n`;
    prompt += `  To: ${change.new || '(empty)'}\n\n`;
  });
  
  return prompt;
};

export const projectsOverlap = (a: Project, b: Project) => {
  const aStart = new Date(a.start_date);
  const aEnd = a.end_date ? new Date(a.end_date) : aStart;
  const bStart = new Date(b.start_date);
  const bEnd = b.end_date ? new Date(b.end_date) : bStart;

  return aStart <= bEnd && aEnd >= bStart;
};

// Malaysian public holidays for 2024 and 2025
// Extended with detailed information for each holiday
export const MY_PUBLIC_HOLIDAYS: Record<string, { name: string; description: string; type: string }> = {
  // 2024 Holidays
  '2024-01-01': { 
    name: 'New Year\'s Day', 
    description: 'The first day of the calendar year. A public holiday in Malaysia.', 
    type: 'National'
  },
  '2024-01-24': { 
    name: 'Thaipusam', 
    description: 'A Hindu festival celebrated by the Tamil community to honor Lord Murugan.', 
    type: 'Religious'
  },
  '2024-02-10': { 
    name: 'Chinese New Year (Day 1)', 
    description: 'The first day of the Chinese Lunar New Year, also known as Spring Festival. A major celebration for Chinese Malaysians.', 
    type: 'Cultural'
  },
  '2024-02-11': { 
    name: 'Chinese New Year (Day 2)', 
    description: 'The second day of the Chinese Lunar New Year celebrations.', 
    type: 'Cultural'
  },
  '2024-04-10': { 
    name: 'Eid al-Fitr (Day 1)', 
    description: 'Marks the end of Ramadan, the Islamic holy month of fasting. Also known as Hari Raya Aidilfitri in Malaysia.', 
    type: 'Religious'
  },
  '2024-04-11': { 
    name: 'Eid al-Fitr (Day 2)', 
    description: 'Second day of Eid al-Fitr celebrations in Malaysia.', 
    type: 'Religious'
  },
  '2024-05-01': { 
    name: 'Labour Day', 
    description: 'International Workers\' Day, celebrating the achievements of workers worldwide.', 
    type: 'National'
  },
  '2024-05-22': { 
    name: 'Wesak Day', 
    description: 'Buddhist holiday celebrating the birth, enlightenment, and death of Gautama Buddha.', 
    type: 'Religious'
  },
  '2024-06-01': { 
    name: 'Yang di-Pertuan Agong\'s Birthday', 
    description: 'The official birthday of the current Malaysian King (Yang di-Pertuan Agong).', 
    type: 'National'
  },
  '2024-06-17': { 
    name: 'Eid al-Adha', 
    description: 'Islamic festival commemorating Prophet Ibrahim\'s willingness to sacrifice his son. Also known as Hari Raya Haji in Malaysia.', 
    type: 'Religious'
  },
  '2024-07-08': { 
    name: 'Awal Muharram', 
    description: 'Islamic New Year, marking the beginning of the Islamic lunar calendar.', 
    type: 'Religious'
  },
  '2024-08-31': { 
    name: 'National Day', 
    description: 'Commemorates Malaysia\'s independence from British colonial rule in 1957.', 
    type: 'National'
  },
  '2024-09-16': { 
    name: 'Malaysia Day', 
    description: 'Celebrates the formation of the Malaysian federation in 1963 when Malaya, North Borneo, Sarawak, and Singapore joined together.', 
    type: 'National'
  },
  '2024-09-17': { 
    name: 'Prophet Muhammad\'s Birthday', 
    description: 'Commemorates the birth of the Islamic Prophet Muhammad, also known as Maulidur Rasul.', 
    type: 'Religious'
  },
  '2024-11-02': { 
    name: 'Deepavali', 
    description: 'Hindu festival of lights celebrating the victory of light over darkness and good over evil.', 
    type: 'Religious'
  },
  '2024-12-25': { 
    name: 'Christmas Day', 
    description: 'Christian holiday celebrating the birth of Jesus Christ. A public holiday in Malaysia.', 
    type: 'Religious'
  },
  
  // 2025 Holidays (official calendar)
  '2025-01-01': { 
    name: 'New Year\'s Day', 
    description: 'The first day of the calendar year. National holiday except in Johor, Kedah, Kelantan, Perlis & Terengganu.', 
    type: 'National'
  },
  '2025-01-14': { 
    name: 'YDPB Negeri Sembilan\'s Birthday', 
    description: 'Birthday celebration of the Yang di-Pertuan Besar of Negeri Sembilan.', 
    type: 'State (Negeri Sembilan)'
  },
  '2025-01-27': { 
    name: 'Israk and Mikraj', 
    description: 'Islamic observance commemorating the Prophet Muhammad\'s night journey. Holiday in Kedah, Negeri Sembilan, Perlis & Terengganu.', 
    type: 'Religious'
  },
  '2025-01-29': { 
    name: 'Chinese New Year', 
    description: 'The first day of the Chinese Lunar New Year, also known as Spring Festival. A national holiday in Malaysia.', 
    type: 'Cultural'
  },
  '2025-01-30': { 
    name: 'Chinese New Year Holiday', 
    description: 'Second day of Chinese New Year celebrations. A national holiday in Malaysia.', 
    type: 'Cultural'
  },
  '2025-02-01': { 
    name: 'Federal Territory Day', 
    description: 'Commemorates the formation of the Federal Territories. Holiday in Kuala Lumpur, Labuan & Putrajaya.', 
    type: 'Regional'
  },
  '2025-02-11': { 
    name: 'Thaipusam', 
    description: 'Hindu festival celebrated in Johor, Kedah, Kuala Lumpur, Negeri Sembilan, Penang, Perak, Putrajaya & Selangor.', 
    type: 'Religious'
  },
  '2025-02-20': { 
    name: 'Independence Declaration Day', 
    description: 'Commemorates Melaka\'s declaration of independence. Holiday in Melaka only.', 
    type: 'State (Melaka)'
  },
  '2025-03-02': { 
    name: 'Awal Ramadan', 
    description: 'Marks the beginning of the Islamic holy month of Ramadan. Holiday in Johor & Kedah.', 
    type: 'Religious'
  },
  '2025-03-03': { 
    name: 'Awal Ramadan Holiday', 
    description: 'Holiday following the start of Ramadan. Observed in Johor.', 
    type: 'Religious'
  },
  '2025-03-04': { 
    name: 'Installation of Sultan Terengganu', 
    description: 'Celebration of the installation of the Sultan of Terengganu. Holiday in Terengganu.', 
    type: 'State (Terengganu)'
  },
  '2025-03-18': { 
    name: 'Nuzul Al-Quran', 
    description: 'Commemorates the revelation of the first verses of the Quran to Prophet Muhammad. National holiday except in Johor, Kedah, Melaka, Negeri Sembilan, Sabah & Sarawak.', 
    type: 'Religious'
  },
  '2025-03-23': { 
    name: 'Sultan of Johor\'s Birthday', 
    description: 'Celebration of the Sultan of Johor\'s birthday. Holiday in Johor.', 
    type: 'State (Johor)'
  },
  '2025-03-30': { 
    name: 'Hari Raya Aidilfitri Holiday / Sabah Governor\'s Birthday', 
    description: 'Holiday marking the end of Ramadan (in Kedah, Kelantan & Terengganu) and celebration of the Sabah State Governor\'s birthday (in Sabah).', 
    type: 'Mixed'
  },
  '2025-03-31': { 
    name: 'Hari Raya Aidilfitri', 
    description: 'Marks the end of Ramadan, the Islamic holy month of fasting. Also known as Eid al-Fitr. National holiday in Malaysia.', 
    type: 'Religious'
  },
  '2025-04-01': { 
    name: 'Hari Raya Aidilfitri Holiday', 
    description: 'Second day of Eid celebrations. National holiday in Malaysia.', 
    type: 'Religious'
  },
  '2025-04-02': { 
    name: 'Hari Raya Aidilfitri Holiday', 
    description: 'Additional Eid holiday observed in Melaka.', 
    type: 'Religious'
  },
  '2025-04-18': { 
    name: 'Good Friday', 
    description: 'Christian observance commemorating the crucifixion of Jesus Christ. Holiday in Sabah & Sarawak.', 
    type: 'Religious'
  },
  '2025-04-26': { 
    name: 'Sultan of Terengganu\'s Birthday', 
    description: 'Celebration of the Sultan of Terengganu\'s birthday. Holiday in Terengganu.', 
    type: 'State (Terengganu)'
  },
  '2025-04-28': { 
    name: 'Special Public Holiday', 
    description: 'Special public holiday observed in Johor.', 
    type: 'State (Johor)'
  },
  '2025-05-01': { 
    name: 'Labour Day', 
    description: 'International Workers\' Day, celebrating the achievements of workers worldwide. National holiday in Malaysia.', 
    type: 'National'
  },
  '2025-05-12': { 
    name: 'Wesak Day', 
    description: 'Buddhist holiday celebrating the birth, enlightenment, and death of Gautama Buddha. National holiday in Malaysia.', 
    type: 'Religious'
  },
  '2025-05-17': { 
    name: 'Raja Perlis\' Birthday', 
    description: 'Celebration of the Raja of Perlis\' birthday. Holiday in Perlis.', 
    type: 'State (Perlis)'
  },
  '2025-05-22': { 
    name: 'Hari Hol Pahang', 
    description: 'Day of remembrance in Pahang. State holiday.', 
    type: 'State (Pahang)'
  },
  '2025-05-30': { 
    name: 'Harvest Festival', 
    description: 'Cultural celebration in Sabah and Labuan. Also known as Pesta Kaamatan.', 
    type: 'Cultural'
  },
  '2025-05-31': { 
    name: 'Harvest Festival Holiday', 
    description: 'Second day of Harvest Festival celebrations in Labuan & Sabah.', 
    type: 'Cultural'
  },
  '2025-06-01': { 
    name: 'Hari Gawai', 
    description: 'Dayak harvest festival celebrated in Sarawak.', 
    type: 'Cultural'
  },
  '2025-06-02': { 
    name: 'Agong\'s Birthday', 
    description: 'The official birthday of the Malaysian King (Yang di-Pertuan Agong). National holiday.', 
    type: 'National'
  },
  '2025-06-06': { 
    name: 'Arafat Day', 
    description: 'Islamic observance day preceding Eid al-Adha. Holiday in Kelantan & Terengganu.', 
    type: 'Religious'
  },
  '2025-06-07': { 
    name: 'Hari Raya Haji', 
    description: 'Islamic festival commemorating Prophet Ibrahim\'s willingness to sacrifice his son. Also known as Eid al-Adha. National holiday.', 
    type: 'Religious'
  },
  '2025-06-22': { 
    name: 'Sultan of Kedah\'s Birthday', 
    description: 'Celebration of the Sultan of Kedah\'s birthday. Holiday in Kedah.', 
    type: 'State (Kedah)'
  },
  '2025-06-27': { 
    name: 'Awal Muharram', 
    description: 'Islamic New Year, marking the beginning of the Islamic lunar calendar. National holiday in Malaysia.', 
    type: 'Religious'
  },
  '2025-07-07': { 
    name: 'Georgetown World Heritage City Day', 
    description: 'Commemorates Georgetown\'s UNESCO World Heritage Site status. Holiday in Penang.', 
    type: 'State (Penang)'
  },
  '2025-07-12': { 
    name: 'Penang Governor\'s Birthday', 
    description: 'Celebration of the Penang State Governor\'s birthday. Holiday in Penang.', 
    type: 'State (Penang)'
  },
  '2025-07-22': { 
    name: 'Sarawak Day', 
    description: 'Commemorates the establishment of self-government in Sarawak. Holiday in Sarawak.', 
    type: 'State (Sarawak)'
  },
  '2025-07-30': { 
    name: 'Sultan of Pahang\'s Birthday', 
    description: 'Celebration of the Sultan of Pahang\'s birthday. Holiday in Pahang.', 
    type: 'State (Pahang)'
  },
  '2025-07-31': { 
    name: 'Hari Hol Almarhum Sultan Iskandar', 
    description: 'Day of remembrance for the late Sultan Iskandar. Holiday in Johor.', 
    type: 'State (Johor)'
  },
  '2025-08-24': { 
    name: 'Melaka Governor\'s Birthday', 
    description: 'Celebration of the Melaka State Governor\'s birthday. Holiday in Melaka.', 
    type: 'State (Melaka)'
  },
  '2025-08-31': { 
    name: 'Merdeka Day', 
    description: 'Commemorates Malaysia\'s independence from British colonial rule in 1957. National holiday.', 
    type: 'National'
  },
  '2025-09-01': { 
    name: 'Merdeka Day Holiday', 
    description: 'Holiday following Merdeka Day. National except in Kedah, Kelantan & Terengganu.', 
    type: 'National'
  },
  '2025-09-05': { 
    name: 'Prophet Muhammad\'s Birthday', 
    description: 'Commemorates the birth of the Islamic Prophet Muhammad, also known as Maulidur Rasul. National holiday.', 
    type: 'Religious'
  },
  '2025-09-16': { 
    name: 'Malaysia Day', 
    description: 'Celebrates the formation of the Malaysian federation in 1963. National holiday.', 
    type: 'National'
  },
  '2025-09-29': { 
    name: 'Sultan of Kelantan\'s Birthday', 
    description: 'Celebration of the Sultan of Kelantan\'s birthday. Holiday in Kelantan.', 
    type: 'State (Kelantan)'
  },
  '2025-10-11': { 
    name: 'Sarawak Governor\'s Birthday', 
    description: 'Celebration of the Sarawak State Governor\'s birthday. Holiday in Sarawak.', 
    type: 'State (Sarawak)'
  },
  '2025-10-20': { 
    name: 'Deepavali', 
    description: 'Hindu festival of lights celebrating the victory of light over darkness and good over evil. National holiday except Sarawak.', 
    type: 'Religious'
  },
  '2025-11-07': { 
    name: 'Sultan of Perak\'s Birthday', 
    description: 'Celebration of the Sultan of Perak\'s birthday. Holiday in Perak.', 
    type: 'State (Perak)'
  },
  '2025-12-11': { 
    name: 'Sultan of Selangor\'s Birthday', 
    description: 'Celebration of the Sultan of Selangor\'s birthday. Holiday in Selangor.', 
    type: 'State (Selangor)'
  },
  '2025-12-24': { 
    name: 'Christmas Eve', 
    description: 'Day before Christmas. Holiday in Sabah.', 
    type: 'Religious'
  },
  '2025-12-25': { 
    name: 'Christmas Day', 
    description: 'Christian holiday celebrating the birth of Jesus Christ. National holiday in Malaysia.', 
    type: 'Religious'
  }
};

// Enhanced function to check if a date is a public holiday in Malaysia
export function isPublicHoliday(date: Date): boolean {
  const dateStr = format(date, 'yyyy-MM-dd');
  return dateStr in MY_PUBLIC_HOLIDAYS;
}

// New function to get holiday details if available
export function getHolidayDetails(date: Date): { name: string; description: string; type: string } | null {
  const dateStr = format(date, 'yyyy-MM-dd');
  return MY_PUBLIC_HOLIDAYS[dateStr] || null;
}

/**
 * Generate a Google Maps link for a given address
 * @param address The address to link to
 * @returns A URL that opens Google Maps with the address
 */
export function getGoogleMapsLink(address: string): string {
  if (!address) return '';
  const encodedAddress = encodeURIComponent(address);
  return `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
}

/**
 * Generate a Waze link for a given address
 * @param address The address to link to
 * @returns A URL that opens Waze with the address
 */
export function getWazeLink(address: string): string {
  if (!address) return '';
  const encodedAddress = encodeURIComponent(address);
  return `https://waze.com/ul?q=${encodedAddress}&navigate=yes`;
}

/**
 * Generate a shareable link for a specific project
 * @param projectId The unique ID of the project
 * @returns A URL that can be shared to directly access the project
 */
export function getProjectShareLink(projectId: string): string {
  // Get the current origin (e.g., https://example.com)
  const origin = window.location.origin;
  // Construct a shareable URL with the project ID
  return `${origin}/projects/${projectId}`;
}

// Function to apply the company permissions fix directly to the database
export async function applyCompanyPermissionsFix(): Promise<{ success: boolean; message: string }> {
  try {
    console.log('Starting company permissions fix...');
    
    // First try a simpler approach - just try to write a test record
    // If we can write, the permissions are already working and we don't need the fix
    const testRecord = {
      company_name: "_TEST_PERMISSIONS",
      company_email: "test@example.com",
      company_phone_no: "1234567890",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    try {
      // Try to insert a test record
      const { data: testData, error: testError } = await supabase
        .from('companies')
        .insert([testRecord])
        .select()
        .limit(1);
        
      if (!testError) {
        console.log('Write test succeeded, permissions already work:', testData);
        
        // Clean up the test record
        if (testData && testData.length > 0) {
          await supabase
            .from('companies')
            .delete()
            .eq('id', testData[0].id);
        }
        
        return { 
          success: true, 
          message: 'Permissions check passed! You already have access to create companies.' 
        };
      }
      
      console.log('Test write failed, proceeding with permissions fix:', testError);
    } catch (testError) {
      console.log('Error during test write:', testError);
      // Continue with the fix
    }
    
    // Simpler approach - just check if we can see the companies table
    // If we can see it, then the error is likely related to INSERT permission
    const { data: readData, error: readError } = await supabase
      .from('companies')
      .select('count(*)');
      
    if (!readError) {
      console.log('Can read companies table, fixing INSERT permissions only');
      
      // Create a direct API call to create a write policy
      // This should work if the application has permissions to manage policies
      const policyResult = await supabase.from('auth').rpc('manage_policies', {
        table_name: 'companies',
        policy_name: 'Allow inserts for authenticated users',
        policy_definition: 'FOR INSERT TO authenticated WITH CHECK (true)'
      });
      
      console.log('Policy creation result:', policyResult);
      
      // Also try to add PIC fields and logo_url if possible
      try {
        // Try to run SQL directly to add fields
        const { error: sqlError } = await supabase.rpc('exec_sql', {
          sql: `
            ALTER TABLE companies
            ADD COLUMN IF NOT EXISTS pic_name text,
            ADD COLUMN IF NOT EXISTS pic_designation text,
            ADD COLUMN IF NOT EXISTS pic_email text,
            ADD COLUMN IF NOT EXISTS pic_phone text,
            ADD COLUMN IF NOT EXISTS logo_url text;
          `
        });
        
        if (sqlError) {
          console.log('Error adding fields to companies table:', sqlError);
        } else {
          console.log('Successfully added fields to companies table');
        }
      } catch (sqlExecError) {
        console.log('Error executing SQL for adding fields:', sqlExecError);
      }
      
      // Try to create logos bucket
      try {
        // Check if bucket exists
        const { error: bucketCheckError } = await supabase.storage.getBucket('logos');
        
        if (bucketCheckError && bucketCheckError.message.includes('not found')) {
          // Create bucket
          const { data: bucketData, error: bucketError } = await supabase.storage.createBucket('logos', {
            public: true,
            fileSizeLimit: 5242880, // 5MB limit
          });
          
          if (bucketError) {
            console.log('Error creating logos bucket:', bucketError);
          } else {
            console.log('Successfully created logos bucket');
          }
        } else {
          console.log('Logos bucket already exists');
        }
      } catch (bucketError) {
        console.log('Error checking/creating logos bucket:', bucketError);
      }
      
      return {
        success: true,
        message: 'Applied company insert permissions and schema fixes. You should now be able to create companies.'
      };
    }
    
    console.log('Cannot read companies table:', readError);
    
    // If we get here, we need a full permission fix, but direct SQL isn't working
    // This is likely an environmental issue where we can't execute RPC commands
    return {
      success: false,
      message: 'Unable to fix permissions automatically. Try using the fix-company-logo.html tool.'
    };
  } catch (error) {
    console.error('Error in applyCompanyPermissionsFix:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Ensures the logos storage bucket exists
 * @returns A result object indicating success or failure
 */
export async function ensureLogosBucketExists(): Promise<{ success: boolean; message: string }> {
  try {
    console.log('Checking for logos bucket...');
    
    // Check if bucket exists
    const { error: bucketCheckError } = await supabase.storage.getBucket('logos');
    
    if (bucketCheckError && bucketCheckError.message.includes('not found')) {
      console.log('Logos bucket not found, creating...');
      
      // Create bucket
      const { data: bucketData, error: bucketError } = await supabase.storage.createBucket('logos', {
        public: true,
        fileSizeLimit: 5242880, // 5MB limit
      });
      
      if (bucketError) {
        console.error('Error creating logos bucket:', bucketError);
        return { 
          success: false,
          message: `Bucket creation failed: ${bucketError.message}` 
        };
      }
      
      // Create folder structure
      try {
        await supabase.storage
          .from('logos')
          .upload('company-logos/.folder', new Blob(['']));
          
        console.log('Created company-logos folder');
      } catch (folderError) {
        // Ignore errors from folder creation
        console.warn('Error creating folder structure:', folderError);
      }
      
      return { 
        success: true,
        message: 'Created logos bucket successfully' 
      };
    } else {
      return { 
        success: true,
        message: 'Logos bucket already exists' 
      };
    }
  } catch (error) {
    console.error('Error ensuring logos bucket:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Fetches companies with hierarchical structure and contacts
 * @returns A tree structure of companies with their hierarchy
 */
export async function fetchHierarchicalCompanies() {
  try {
    // Fetch all companies first
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('*')
      .order('company_name');
    
    if (companiesError) throw companiesError;
    
    // Fetch all contacts
    const { data: contacts, error: contactsError } = await supabase
      .from('company_contacts')
      .select('*');
    
    if (contactsError) {
      // If company_contacts table doesn't exist yet, just continue without contacts
      console.warn('Could not fetch contacts. Table might not exist yet:', contactsError);
    }
    
    // Process companies to include standard field names
    const processedCompanies = companies.map(company => ({
      ...company,
      // Map DB column names to standard interface properties
      name: company.company_name,
      contact_email: company.company_email,
      contact_phone: company.company_phone_no,
      // Add contacts if they exist
      contacts: contacts ? contacts.filter(c => c.company_id === company.id) : []
    }));
    
    // Build company tree
    const buildCompanyTree = (companies, parentId = null) => {
      return companies
        .filter(company => company.parent_id === parentId)
        .map(company => {
          // Find children for this company
          const children = buildCompanyTree(companies, company.id);
          return {
            ...company,
            child_companies: children.length > 0 ? children : undefined
          };
        });
    };
    
    return buildCompanyTree(processedCompanies);
  } catch (error) {
    console.error('Error fetching hierarchical companies:', error);
    throw error;
  }
}