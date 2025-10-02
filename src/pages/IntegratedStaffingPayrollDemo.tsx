import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { IntegratedStaffingPayroll } from '@/components/integrated-staffing-payroll';
import StaffingTab from '@/components/project-form/StaffingTab';
import { ProjectPayroll } from '@/components/project-payroll';

export default function IntegratedStaffingPayrollDemo() {
  // Example project data
  const projectId = "1";
  const projectStartDate = new Date('2025-03-10');
  const projectEndDate = new Date('2025-03-14');
  
  return (
    <div className="container py-8">
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Staff & Payroll Management</CardTitle>
            <CardDescription>
              Compare integrated vs. separate approaches to staffing and payroll management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="integrated">Integrated View</TabsTrigger>
                <TabsTrigger value="separate">Separate Views</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="pt-6">
                <div className="space-y-6">
                  <div className="prose max-w-none">
                    <h3>Why Integrate Staffing & Payroll?</h3>
                    <p>
                      Currently, staff management and payroll exist as separate tabs with overlapping 
                      functionality. This creates several challenges:
                    </p>
                    <ul>
                      <li>Duplicate data entry across multiple interfaces</li>
                      <li>Disconnected workflow between staff scheduling and payment</li>
                      <li>No real-time visibility of financial impact when making staffing decisions</li>
                      <li>Siloed information requiring users to switch contexts</li>
                    </ul>
                    
                    <h3>Benefits of Integration</h3>
                    <p>The integrated approach offers several advantages:</p>
                    <ul>
                      <li><strong>Data Consistency:</strong> Staff and payment information remain in sync</li>
                      <li><strong>Workflow Efficiency:</strong> Complete related tasks in one interface</li>
                      <li><strong>Financial Oversight:</strong> See cost implications of staffing decisions</li>
                      <li><strong>Time Savings:</strong> Eliminate duplicate data entry and cross-checking</li>
                    </ul>
                    
                    <p>
                      Select the tabs above to compare the integrated approach with the current separate interfaces.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <Card>
                      <CardHeader className="bg-gray-50">
                        <CardTitle className="text-lg">Integrated Approach</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <ul className="space-y-2">
                          <li className="flex items-start">
                            <CheckIcon className="h-5 w-5 mr-2 text-green-500 flex-shrink-0" />
                            <span>Single interface for staff management and payroll</span>
                          </li>
                          <li className="flex items-start">
                            <CheckIcon className="h-5 w-5 mr-2 text-green-500 flex-shrink-0" />
                            <span>Direct connection between scheduling and payment</span>
                          </li>
                          <li className="flex items-start">
                            <CheckIcon className="h-5 w-5 mr-2 text-green-500 flex-shrink-0" />
                            <span>Real-time financial impact visualization</span>
                          </li>
                          <li className="flex items-start">
                            <CheckIcon className="h-5 w-5 mr-2 text-green-500 flex-shrink-0" />
                            <span>Multiple views of the same data (list, calendar, matrix)</span>
                          </li>
                          <li className="flex items-start">
                            <CheckIcon className="h-5 w-5 mr-2 text-green-500 flex-shrink-0" />
                            <span>Comprehensive financial reporting and analytics</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="bg-gray-50">
                        <CardTitle className="text-lg">Separate Approaches</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <ul className="space-y-2">
                          <li className="flex items-start">
                            <CrossIcon className="h-5 w-5 mr-2 text-red-500 flex-shrink-0" />
                            <span>Siloed interfaces requiring context switching</span>
                          </li>
                          <li className="flex items-start">
                            <CrossIcon className="h-5 w-5 mr-2 text-red-500 flex-shrink-0" />
                            <span>Duplicated data entry and synchronization issues</span>
                          </li>
                          <li className="flex items-start">
                            <CrossIcon className="h-5 w-5 mr-2 text-red-500 flex-shrink-0" />
                            <span>No real-time cost visibility when scheduling staff</span>
                          </li>
                          <li className="flex items-start">
                            <CrossIcon className="h-5 w-5 mr-2 text-red-500 flex-shrink-0" />
                            <span>Limited views focused on specific tasks only</span>
                          </li>
                          <li className="flex items-start">
                            <CrossIcon className="h-5 w-5 mr-2 text-red-500 flex-shrink-0" />
                            <span>Fragmented reporting requiring manual consolidation</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="integrated" className="pt-6">
                <IntegratedStaffingPayroll
                  projectId={projectId}
                  projectStartDate={projectStartDate}
                  projectEndDate={projectEndDate}
                  budget={10000}
                  showSeparateViews={false}
                />
              </TabsContent>
              
              <TabsContent value="separate" className="pt-6 space-y-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Staffing Tab (Original)</CardTitle>
                    <CardDescription>
                      Staff management interface without payroll integration
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="border-t pt-6">
                    <StaffingTab
                      confirmedStaff={[]}
                      setConfirmedStaff={() => {}}
                      applicants={[]}
                      setApplicants={() => {}}
                      showAddStaffForm={false}
                      setShowAddStaffForm={() => {}}
                      handleRemoveStaff={() => {}}
                      projectStartDate={projectStartDate}
                      projectEndDate={projectEndDate}
                      projectId={projectId}
                      isAutosaving={false}
                    />
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Payroll Tab (Original)</CardTitle>
                    <CardDescription>
                      Payroll management interface without integrated staffing
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="border-t pt-6">
                    <ProjectPayroll
                      project={{ id: projectId, start_date: projectStartDate.toISOString() }}
                      confirmedStaff={[]}
                      setConfirmedStaff={() => {}}
                      loadingStaff={false}
                      projectStartDate={projectStartDate}
                      projectEndDate={projectEndDate}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper icon components
function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function CrossIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}