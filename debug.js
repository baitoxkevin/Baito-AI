// Debug utility for the "Set Basic Salary" button issue
// This script logs important steps in the process

console.log('Debug utility loaded for Set Basic Salary button');

// Function to enhance a React component with debug logging
export function debugComponent(Component, componentName) {
  return function DebuggedComponent(props) {
    console.log(`Rendering ${componentName} with props:`, props);
    
    // Override key functions to add debug logging
    const enhancedProps = {
      ...props,
      setIsSetBasicDialogOpen: (isOpen) => {
        console.log(`setIsSetBasicDialogOpen called with:`, isOpen);
        if (props.setIsSetBasicDialogOpen) {
          props.setIsSetBasicDialogOpen(isOpen);
        }
      },
      setBasicSalaryForAllDates: () => {
        console.log(`setBasicSalaryForAllDates called`);
        console.log(`- tempBasicValue:`, props.tempBasicValue);
        console.log(`- selectedStaffForBasic:`, props.selectedStaffForBasic);
        if (props.setBasicSalaryForAllDates) {
          props.setBasicSalaryForAllDates();
        }
      }
    };
    
    return <Component {...enhancedProps} />;
  };
}

// Add this to any event handler you want to debug
export function debugEvent(name, ...args) {
  console.log(`[EVENT] ${name}`, ...args);
}

// Function to check if the button click handler is properly set up
export function checkButtonHandlers() {
  console.log('Checking button handlers...');
  setTimeout(() => {
    const setBasicBtn = document.querySelector('button:contains("Set Basic")');
    if (setBasicBtn) {
      console.log('Found Set Basic button', setBasicBtn);
      console.log('onClick handler:', setBasicBtn.onclick);
      
      // Clone and log the event handlers
      const clone = setBasicBtn.cloneNode(true);
      console.log('Clone properties:', Object.getOwnPropertyNames(clone));
    } else {
      console.log('Could not find Set Basic button');
    }
  }, 2000);
}

// Function to debug the dialog state
export function debugDialog() {
  console.log('Dialog state:', {
    isSetBasicDialogOpen: document.querySelector('[role="dialog"]') !== null,
    dialogContent: document.querySelector('[role="dialog"]')?.textContent,
  });
}

// Use this to patch the button click handler if needed
export function patchSetBasicButton() {
  setTimeout(() => {
    const setBasicBtn = document.querySelector('button:contains("Set Basic")');
    if (setBasicBtn) {
      console.log('Patching Set Basic button');
      const originalClick = setBasicBtn.onclick;
      setBasicBtn.onclick = function(e) {
        console.log('Set Basic button clicked');
        if (originalClick) {
          console.log('Calling original handler');
          return originalClick.call(this, e);
        }
      };
    }
  }, 2000);
}