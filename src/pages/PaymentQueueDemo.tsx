import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import MainAppLayout from '@/components/MainAppLayout';
import { PaymentApprovalWorkflow } from '@/components/payroll-manager/PaymentApprovalWorkflow';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { PaymentBatchStatus } from '@/lib/payment-queue-service';
import { Clock, CheckCircle, AlertCircle, Download, CreditCard } from 'lucide-react';

export default function PaymentQueueDemo() {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState<PaymentBatchStatus | 'all'>('pending');
  const [showDemo, setShowDemo] = useState(false);

  // Handler for when a batch is selected
  const handleBatchSelected = (batchId: string) => {
    toast({
      title: "Batch Selected",
      description: `Selected batch ID: ${batchId.substring(0, 8)}...`,
    });
  };

  // Animation settings
  const containerAnimation = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemAnimation = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <MainAppLayout>
      <div className="container max-w-7xl mx-auto px-4 py-8 min-h-[calc(100vh-4rem)]">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400">
                Payment Queue System
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                Manage and process staff payment batches with approval workflow
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => window.open('/ProjectsPageRedesign', '_blank')}
                variant="outline"
              >
                Go to Projects
              </Button>
              <Button
                onClick={() => setShowDemo(!showDemo)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {showDemo ? "Hide Demo Cards" : "Show Demo Cards"}
              </Button>
            </div>
          </div>
        </motion.div>

        {showDemo && (
          <motion.div
            variants={containerAnimation}
            initial="hidden"
            animate="show"
            className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4"
          >
            <motion.div variants={itemAnimation}>
              <Card className="overflow-hidden border-2 border-amber-200 dark:border-amber-800">
                <CardHeader className="bg-amber-50 dark:bg-amber-900/20">
                  <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                    <Clock className="h-5 w-5" />
                    Pending Payments
                  </CardTitle>
                  <CardDescription className="text-amber-600 dark:text-amber-400">
                    Awaiting approval from finance team
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Pending payments need to be reviewed and either approved or rejected by an authorized finance team member.
                  </p>
                </CardContent>
                <CardFooter className="bg-amber-50/50 dark:bg-amber-900/10 border-t border-amber-100 dark:border-amber-800/40">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300"
                    onClick={() => setSelectedTab('pending')}
                  >
                    View Pending
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>

            <motion.div variants={itemAnimation}>
              <Card className="overflow-hidden border-2 border-blue-200 dark:border-blue-800">
                <CardHeader className="bg-blue-50 dark:bg-blue-900/20">
                  <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                    <CheckCircle className="h-5 w-5" />
                    Approved Payments
                  </CardTitle>
                  <CardDescription className="text-blue-600 dark:text-blue-400">
                    Ready for bank processing
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Approved payments have been reviewed and authorized. They are ready to be exported for bank processing.
                  </p>
                </CardContent>
                <CardFooter className="bg-blue-50/50 dark:bg-blue-900/10 border-t border-blue-100 dark:border-blue-800/40">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300"
                    onClick={() => setSelectedTab('approved')}
                  >
                    View Approved
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>

            <motion.div variants={itemAnimation}>
              <Card className="overflow-hidden border-2 border-purple-200 dark:border-purple-800">
                <CardHeader className="bg-purple-50 dark:bg-purple-900/20">
                  <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                    <Download className="h-5 w-5" />
                    Processing Payments
                  </CardTitle>
                  <CardDescription className="text-purple-600 dark:text-purple-400">
                    Submitted to bank for payment
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Processing payments have been exported and submitted to the bank for disbursement to staff accounts.
                  </p>
                </CardContent>
                <CardFooter className="bg-purple-50/50 dark:bg-purple-900/10 border-t border-purple-100 dark:border-purple-800/40">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300"
                    onClick={() => setSelectedTab('processing')}
                  >
                    View Processing
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>

            <motion.div variants={itemAnimation}>
              <Card className="overflow-hidden border-2 border-green-200 dark:border-green-800">
                <CardHeader className="bg-green-50 dark:bg-green-900/20">
                  <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
                    <CreditCard className="h-5 w-5" />
                    All Payments
                  </CardTitle>
                  <CardDescription className="text-green-600 dark:text-green-400">
                    Complete payment history
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    View and manage all payment batches including completed, rejected, and cancelled payments.
                  </p>
                </CardContent>
                <CardFooter className="bg-green-50/50 dark:bg-green-900/10 border-t border-green-100 dark:border-green-800/40">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-green-300 dark:border-green-700 text-green-700 dark:text-green-300"
                    onClick={() => setSelectedTab('all')}
                  >
                    View All
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as PaymentBatchStatus | 'all')}>
            <TabsList className="mb-6 bg-slate-100 dark:bg-slate-800/50">
              <TabsTrigger value="pending" className="data-[state=active]:bg-amber-100 data-[state=active]:text-amber-900 dark:data-[state=active]:bg-amber-900/30 dark:data-[state=active]:text-amber-50">
                Pending
              </TabsTrigger>
              <TabsTrigger value="approved" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900 dark:data-[state=active]:bg-blue-900/30 dark:data-[state=active]:text-blue-50">
                Approved
              </TabsTrigger>
              <TabsTrigger value="processing" className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-900 dark:data-[state=active]:bg-purple-900/30 dark:data-[state=active]:text-purple-50">
                Processing
              </TabsTrigger>
              <TabsTrigger value="completed" className="data-[state=active]:bg-green-100 data-[state=active]:text-green-900 dark:data-[state=active]:bg-green-900/30 dark:data-[state=active]:text-green-50">
                Completed
              </TabsTrigger>
              <TabsTrigger value="all" className="data-[state=active]:bg-slate-300 data-[state=active]:text-slate-900 dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:text-slate-50">
                All
              </TabsTrigger>
            </TabsList>

            <TabsContent value={selectedTab} forceMount>
              <PaymentApprovalWorkflow
                initialStatus={selectedTab}
                onSelectBatch={handleBatchSelected}
                showStatistics={true}
                defaultItemsPerPage={10}
                className="min-h-[calc(100vh-16rem)]"
              />
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </MainAppLayout>
  );
}