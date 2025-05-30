import React, { useState } from 'react';
import { PayrollManager, StaffMember, PayrollData } from './index';

// Example usage showing how to integrate PayrollManager in different scenarios

// Example 1: Basic usage in a project dialog
export function ProjectDialogExample() {
  const [confirmedStaff, setConfirmedStaff] = useState<StaffMember[]>([
    {
      id: '1',
      name: 'John Doe',
      designation: 'Project Manager',
      workingDates: [
        new Date('2024-01-01'),
        new Date('2024-01-02'),
        new Date('2024-01-03'),
      ],
      workingDatesWithSalary: [
        { date: new Date('2024-01-01'), basicSalary: '150', claims: '50', commission: '' },
        { date: new Date('2024-01-02'), basicSalary: '150', claims: '50', commission: '' },
        { date: new Date('2024-01-03'), basicSalary: '150', claims: '50', commission: '' },
      ]
    },
    {
      id: '2',
      name: 'Jane Smith',
      designation: 'Developer',
      workingDates: [
        new Date('2024-01-01'),
        new Date('2024-01-02'),
      ],
      workingDatesWithSalary: [
        { date: new Date('2024-01-01'), basicSalary: '200', claims: '30', commission: '20' },
        { date: new Date('2024-01-02'), basicSalary: '200', claims: '30', commission: '20' },
      ]
    }
  ]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Project Payroll Management</h2>
      <PayrollManager
        confirmedStaff={confirmedStaff}
        setConfirmedStaff={setConfirmedStaff}
        projectStartDate={new Date('2024-01-01')}
        projectEndDate={new Date('2024-01-31')}
        projectId="project-example-123"
      />
    </div>
  );
}

// Example 2: With custom save handler
export function CustomSaveExample() {
  const [confirmedStaff, setConfirmedStaff] = useState<StaffMember[]>([]);
  const [savedData, setSavedData] = useState<PayrollData | null>(null);

  const handleCustomSave = async (payrollData: PayrollData) => {
    // console.log('Custom save handler called with:', payrollData);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Store the data locally for demonstration
    setSavedData(payrollData);
    
    // In a real app, you might:
    // - Send to your API
    // - Update Redux/Context state
    // - Show success notification
    // - Navigate to another page
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold mb-4">Custom Save Implementation</h2>
      
      <PayrollManager
        confirmedStaff={confirmedStaff}
        setConfirmedStaff={setConfirmedStaff}
        projectStartDate={new Date('2024-01-01')}
        projectEndDate={new Date('2024-01-31')}
        projectId="custom-save-example"
        onSave={handleCustomSave}
        disableAutoSave={true}
      />
      
      {savedData && (
        <div className="mt-6 p-4 bg-gray-100 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Last Saved Data:</h3>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(savedData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

// Example 3: Integration with existing project form
export function ProjectFormIntegration({ projectId }: { projectId: string }) {
  const [activeTab, setActiveTab] = useState('details');
  const [projectData, setProjectData] = useState({
    id: projectId,
    name: 'Example Project',
    start_date: new Date('2024-01-01'),
    end_date: new Date('2024-01-31'),
    staff: [] as StaffMember[]
  });

  const updateProjectStaff = (staff: StaffMember[]) => {
    setProjectData(prev => ({ ...prev, staff }));
  };

  return (
    <div className="space-y-4">
      <div className="flex space-x-4 border-b">
        <button
          className={`px-4 py-2 ${activeTab === 'details' ? 'border-b-2 border-blue-500' : ''}`}
          onClick={() => setActiveTab('details')}
        >
          Project Details
        </button>
        <button
          className={`px-4 py-2 ${activeTab === 'staff' ? 'border-b-2 border-blue-500' : ''}`}
          onClick={() => setActiveTab('staff')}
        >
          Staff
        </button>
        <button
          className={`px-4 py-2 ${activeTab === 'payroll' ? 'border-b-2 border-blue-500' : ''}`}
          onClick={() => setActiveTab('payroll')}
        >
          Payroll
        </button>
      </div>

      <div className="p-4">
        {activeTab === 'details' && (
          <div>
            <h3 className="text-lg font-semibold">Project Details</h3>
            <p>Project Name: {projectData.name}</p>
            <p>Duration: {projectData.start_date.toLocaleDateString()} - {projectData.end_date.toLocaleDateString()}</p>
          </div>
        )}

        {activeTab === 'staff' && (
          <div>
            <h3 className="text-lg font-semibold">Staff Management</h3>
            <p>Add and manage project staff here...</p>
          </div>
        )}

        {activeTab === 'payroll' && (
          <PayrollManager
            confirmedStaff={projectData.staff}
            setConfirmedStaff={updateProjectStaff}
            projectStartDate={projectData.start_date}
            projectEndDate={projectData.end_date}
            projectId={projectData.id}
          />
        )}
      </div>
    </div>
  );
}

// Example 4: Standalone page with routing
export function PayrollPageExample() {
  // In a real app, you might get this from route params or API
  const projectId = 'standalone-project-123';
  const [isLoading, setIsLoading] = useState(true);
  const [projectData, setProjectData] = useState<unknown>(null);

  React.useEffect(() => {
    // Simulate loading project data
    setTimeout(() => {
      setProjectData({
        id: projectId,
        name: 'Construction Project Alpha',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-02-29'),
        staff: [
          {
            id: '1',
            name: 'Bob Builder',
            designation: 'Site Manager',
            workingDates: [
              new Date('2024-01-01'),
              new Date('2024-01-02'),
              new Date('2024-01-03'),
            ]
          }
        ]
      });
      setIsLoading(false);
    }, 1000);
  }, [projectId]);

  if (isLoading) {
    return <div className="p-6">Loading project data...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Payroll: {projectData.name}
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <PayrollManager
          confirmedStaff={projectData.staff}
          setConfirmedStaff={(staff) => setProjectData({ ...projectData, staff })}
          projectStartDate={projectData.start_date}
          projectEndDate={projectData.end_date}
          projectId={projectData.id}
        />
      </main>
    </div>
  );
}