import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PaymentsPage from './PaymentsPage';
import ExpenseClaimsPage from './ExpenseClaimsPage';
import { CreditCard, Receipt } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState('payments');

  return (
    <div className="flex-1 h-full overflow-auto bg-gray-50">
      <div className="h-full flex flex-col">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            {/* Tab Navigation with Color Layering & Two-Layer Shadow */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-100">
              <TabsList className="inline-flex p-1 bg-gradient-to-b from-gray-200 to-gray-300 rounded-lg shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_2px_4px_rgba(0,0,0,0.1)]">
                <TabsTrigger
                  value="payments"
                  className="
                    relative px-4 sm:px-6 py-2 sm:py-2.5
                    rounded-md font-medium text-sm sm:text-base
                    transition-all duration-200
                    flex items-center gap-2
                    text-gray-700
                    data-[state=active]:bg-gradient-to-b
                    data-[state=active]:from-white
                    data-[state=active]:to-gray-50
                    data-[state=active]:text-blue-600
                    data-[state=active]:shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_1px_2px_rgba(0,0,0,0.1)]
                    hover:bg-gray-200/50
                  "
                >
                  <CreditCard className="h-4 w-4 flex-shrink-0" />
                  <span className="hidden sm:inline">Payments</span>
                  <span className="sm:hidden">Pay</span>
                </TabsTrigger>
                <TabsTrigger
                  value="expenses"
                  className="
                    relative px-4 sm:px-6 py-2 sm:py-2.5
                    rounded-md font-medium text-sm sm:text-base
                    transition-all duration-200
                    flex items-center gap-2
                    text-gray-700
                    data-[state=active]:bg-gradient-to-b
                    data-[state=active]:from-white
                    data-[state=active]:to-gray-50
                    data-[state=active]:text-emerald-600
                    data-[state=active]:shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_1px_2px_rgba(0,0,0,0.1)]
                    hover:bg-gray-200/50
                  "
                >
                  <Receipt className="h-4 w-4 flex-shrink-0" />
                  <span className="hidden sm:inline">Expenses</span>
                  <span className="sm:hidden">Exp</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Content Area with Proper Layering */}
            <div className="flex-1 overflow-hidden bg-gray-50">
              <TabsContent
                value="payments"
                className="h-full m-0 overflow-auto data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:duration-200"
              >
                <div className="h-full bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_3px_6px_rgba(0,0,0,0.1)]">
                  <PaymentsPage />
                </div>
              </TabsContent>

              <TabsContent
                value="expenses"
                className="h-full m-0 overflow-auto data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:duration-200"
              >
                <div className="h-full bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_3px_6px_rgba(0,0,0,0.1)]">
                  <ExpenseClaimsPage />
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
