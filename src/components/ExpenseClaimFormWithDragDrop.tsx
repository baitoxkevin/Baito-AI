import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  CalendarIcon, 
  Loader2, 
  Receipt,
  Car,
  Utensils,
  Hotel,
  Package,
  Laptop,
  Phone,
  GraduationCap,
  FileText,
  User,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DocumentDropzoneFiles } from '@/components/ui/document-dropzone-files';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import '@/styles/expense-form.css';

// Expense categories with Lucide icons
const expenseCategories = [
  { value: 'transport', label: 'Transportation', icon: Car, color: 'text-blue-500' },
  { value: 'meals', label: 'Meals & Entertainment', icon: Utensils, color: 'text-orange-500' },
  { value: 'accommodation', label: 'Accommodation', icon: Hotel, color: 'text-purple-500' },
  { value: 'supplies', label: 'Office Supplies', icon: Package, color: 'text-yellow-500' },
  { value: 'equipment', label: 'Equipment', icon: Laptop, color: 'text-gray-500' },
  { value: 'communication', label: 'Communication', icon: Phone, color: 'text-green-500' },
  { value: 'training', label: 'Training & Education', icon: GraduationCap, color: 'text-indigo-500' },
  { value: 'other', label: 'Other', icon: FileText, color: 'text-slate-500' },
];

// Form schema
const formSchema = z.object({
  title: z.string().min(2, { message: 'Title is required and must be at least 2 characters' }),
  description: z.string().optional(),
  receipt_number: z.string().min(1, { message: 'Bill/Receipt/Invoice number is required' }),
  category: z.string().min(1, { message: 'Category is required' }),
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: 'Amount is required and must be a positive number',
  }),
  expense_date: z.date({
    required_error: 'Expense date is required',
  }),
  is_own_claim: z.boolean().default(true),
  staff_id: z.string().optional(),
  documents: z.array(z.instanceof(File)).min(1, { message: 'At least one supporting document is required' }),
});

type FormValues = z.infer<typeof formSchema>;

interface ExpenseClaimFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: FormValues) => Promise<void>;
  projectId: string;
  confirmedStaff?: any[]; // Pass the confirmed staff array from parent
}

// Animated particles component
const AnimatedParticles = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"
          animate={{
            x: [Math.random() * 800, Math.random() * 800],
            y: [Math.random() * 600, Math.random() * 600],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: Math.random() * 20 + 10,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{
            left: Math.random() * 100 + '%',
            top: Math.random() * 100 + '%',
          }}
        />
      ))}
    </div>
  );
};

// Gradient card wrapper
const GradientCard = React.forwardRef<HTMLDivElement, { children: React.ReactNode; className?: string }>(
  ({ children, className = "" }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, scale: 0.99 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "relative p-[1px] rounded-lg",
          className
        )}
      >
        {/* Animated gradient background */}
        <motion.div 
          className="absolute inset-0 pointer-events-none"
          animate={{
            backgroundImage: [
              'linear-gradient(to right, rgba(59, 130, 246, 0.15), rgba(147, 51, 234, 0.15))',
              'linear-gradient(to right, rgba(147, 51, 234, 0.15), rgba(236, 72, 153, 0.15))',
              'linear-gradient(to right, rgba(236, 72, 153, 0.15), rgba(59, 130, 246, 0.15))',
            ],
          }}
          transition={{ duration: 5, repeat: Infinity }}
        />
        
        {/* Border gradient animation */}
        <motion.div 
          className="absolute inset-0 rounded-lg pointer-events-none"
          animate={{
            background: [
              'radial-gradient(circle at 20% 80%, rgba(147, 51, 234, 0.2) 0%, transparent 50%)',
              'radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.2) 0%, transparent 50%)',
              'radial-gradient(circle at 20% 80%, rgba(236, 72, 153, 0.2) 0%, transparent 50%)',
            ],
          }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        
        <div className="relative bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-lg p-2 border border-purple-100/50 dark:border-purple-900/30">
          {children}
        </div>
      </motion.div>
    );
  }
);

GradientCard.displayName = 'GradientCard';

// Glassmorphism card
const GlassCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  return (
    <div className={cn(
      "backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border border-white/20",
      "shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]",
      "rounded-xl overflow-hidden relative z-[1000]", // Higher z-index to ensure it's above everything
      className
    )}>
      {children}
    </div>
  );
};

// Enhanced button with animation
const AnimatedButton = ({ children, className = "", ...props }: any) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="inline-block"
    >
      <Button
        className={cn(
          "relative overflow-hidden transition-all duration-300",
          "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700",
          "text-white border-0 shadow-lg hover:shadow-xl",
          className
        )}
        {...props}
      >
        <div className="relative z-10 flex items-center justify-center">
          {children}
        </div>
      </Button>
    </motion.div>
  );
};

export function ExpenseClaimFormWithDragDrop({
  open,
  onOpenChange,
  onSubmit,
  projectId,
  confirmedStaff = []
}: ExpenseClaimFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      receipt_number: '',
      category: '',
      amount: '',
      expense_date: new Date(),
      is_own_claim: true,
      staff_id: '',
      documents: [],
    },
  });

  const handleSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      await onSubmit(values);
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to submit expense claim:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isOwnClaim = form.watch('is_own_claim');

  return (
    <Dialog 
      open={open} 
      onOpenChange={(newOpen) => {
        console.log('Dialog open state changing to:', newOpen);
        onOpenChange(newOpen);
      }}
      modal={true} // Ensure it's a true modal dialog
      aria-hidden={false} // Make sure it's not hidden from accessibility tools
    >
      <DialogContent 
        className="max-w-3xl bg-transparent border-0 shadow-none overflow-hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <GlassCard className="relative">
          <AnimatedParticles />
          
          <div className="relative z-10 p-4 pb-0">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <motion.div
                  initial={{ rotate: 0 }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg blur-md opacity-60" />
                  <div className="relative p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg shadow-lg">
                    <Receipt className="w-5 h-5 text-white" />
                  </div>
                </motion.div>
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                  New Expense Claim
                </span>
                <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
              </DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400">
                Submit project-related expenses for reimbursement
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  form.handleSubmit(handleSubmit)(e);
                }} 
                className="space-y-4 mt-4"
              >
                {/* Own Claim Toggle */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5 text-gray-600" />
                      <span className="font-medium">Claim Type</span>
                    </div>
                    <FormField
                      control={form.control}
                      name="is_own_claim"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="flex items-center gap-3">
                              <span className={cn(
                                "text-sm font-medium",
                                field.value ? "text-blue-600" : "text-purple-600"
                              )}>
                                {field.value ? 'Own Claim' : 'Staff Claim'}
                              </span>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Main content grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Left column - Details */}
                  <div className="space-y-3">
                    {/* Staff Selection (when is_own_claim is false) */}
                    <AnimatePresence>
                      {!isOwnClaim && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <FormField
                            control={form.control}
                            name="staff_id"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-medium bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent font-semibold">
                                  Select Staff Member
                                </FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="h-11">
                                      <SelectValue placeholder="Choose staff member" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-purple-200/50 dark:border-purple-800/50">
                                    {confirmedStaff.map((staff) => (
                                      <SelectItem key={staff.id} value={staff.id} className="focus:bg-purple-50 dark:focus:bg-purple-900/20">
                                        <motion.div 
                                          className="flex items-center gap-3"
                                          whileHover={{ scale: 1.05 }}
                                          transition={{ type: "spring", stiffness: 300 }}
                                        >
                                          <motion.div
                                            whileHover={{ scale: 1.1 }}
                                            transition={{ type: "spring", stiffness: 400 }}
                                          >
                                            <Avatar className="h-7 w-7 ring-2 ring-purple-400/30 transition-all duration-300 hover:ring-purple-500/50">
                                              <AvatarImage 
                                                src={staff.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${staff.name}`} 
                                                alt={staff.name} 
                                              />
                                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xs">
                                                {staff.name.slice(0, 2).toUpperCase()}
                                              </AvatarFallback>
                                            </Avatar>
                                          </motion.div>
                                          <span className="font-medium">{staff.name}</span>
                                        </motion.div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Title */}
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent font-semibold">
                            Title *
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter expense title" 
                              {...field} 
                              className="h-11" 
                              required
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Receipt Number */}
                    <FormField
                      control={form.control}
                      name="receipt_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent font-semibold">
                            Bill/Receipt/Invoice Number *
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter bill, receipt, or invoice number" 
                              {...field} 
                              className="h-11" 
                              required
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-3">
                      {/* Category */}
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent font-semibold">
                              Category *
                            </FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-11">
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-purple-200/50 dark:border-purple-800/50">
                                {expenseCategories.map((category) => (
                                  <SelectItem key={category.value} value={category.value} className="focus:bg-purple-50 dark:focus:bg-purple-900/20">
                                    <motion.div 
                                      className="flex items-center gap-3"
                                      whileHover={{ scale: 1.05 }}
                                      transition={{ type: "spring", stiffness: 300 }}
                                    >
                                      <motion.div 
                                        className={cn(
                                          "p-1.5 rounded-md bg-gradient-to-br",
                                          category.color === 'text-blue-500' && "from-blue-500/20 to-blue-600/20",
                                          category.color === 'text-orange-500' && "from-orange-500/20 to-orange-600/20",
                                          category.color === 'text-purple-500' && "from-purple-500/20 to-purple-600/20",
                                          category.color === 'text-yellow-500' && "from-yellow-500/20 to-yellow-600/20",
                                          category.color === 'text-gray-500' && "from-gray-500/20 to-gray-600/20",
                                          category.color === 'text-green-500' && "from-green-500/20 to-green-600/20",
                                          category.color === 'text-indigo-500' && "from-indigo-500/20 to-indigo-600/20",
                                          category.color === 'text-slate-500' && "from-slate-500/20 to-slate-600/20",
                                        )}
                                        whileHover={{ rotate: 360 }}
                                        transition={{ duration: 0.5 }}
                                      >
                                        <category.icon className={cn("h-4 w-4", category.color)} />
                                      </motion.div>
                                      <span className="font-medium">{category.label}</span>
                                    </motion.div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Amount */}
                      <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent font-semibold">
                              Amount (RM) *
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500">
                                  RM
                                </span>
                                <Input
                                  placeholder="0.00"
                                  className="pl-10 h-11"
                                  type="number"
                                  step="0.01"
                                  {...field}
                                  required
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Date */}
                    <FormField
                      control={form.control}
                      name="expense_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent font-semibold">
                            Expense Date *
                          </FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full justify-start text-left font-normal h-11",
                                    !field.value && "text-muted-foreground"
                                  )}
                                  type="button"
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 z-[9999]" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date > new Date() || date < new Date("1900-01-01")
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Description */}
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent font-semibold">
                            Description (Optional)
                          </FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Add any additional details"
                              className="min-h-[80px] resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Right column - Documents */}
                  <div className="space-y-2 h-full flex flex-col min-h-[300px]">
                    <FormField
                      control={form.control}
                      name="documents"
                      render={({ field }) => (
                        <FormItem className="h-full flex flex-col flex-1">
                          <FormLabel className="text-sm font-medium flex items-center gap-2 flex-shrink-0">
                            <motion.div
                              whileHover={{ rotate: 180 }}
                              className="p-1.5 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg"
                            >
                              <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            </motion.div>
                            <span className="bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent font-semibold">
                              Supporting Documents *
                            </span>
                          </FormLabel>
                          <FormControl className="flex-1 flex">
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3 }}
                              className="h-full flex flex-col flex-1"
                            >
                              <div className="h-full relative overflow-hidden flex flex-col flex-1 rounded-xl border border-purple-200/50 dark:border-purple-800/50">
                                {/* Animated background pattern */}
                                <div className="absolute inset-0 opacity-30">
                                  <div className="absolute inset-0 bg-gradient-to-br from-purple-200 via-blue-200 to-pink-200 dark:from-purple-900 dark:via-blue-900 dark:to-pink-900" />
                                  <motion.div
                                    className="absolute inset-0"
                                    animate={{
                                      backgroundImage: [
                                        'radial-gradient(circle at 20% 80%, rgba(147, 51, 234, 0.1) 0%, transparent 50%)',
                                        'radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)',
                                        'radial-gradient(circle at 20% 80%, rgba(236, 72, 153, 0.1) 0%, transparent 50%)',
                                      ],
                                    }}
                                    transition={{ duration: 10, repeat: Infinity }}
                                  />
                                </div>
                                
                                <div className="relative z-10 p-4 h-full flex flex-col flex-1">
                                  <DocumentDropzoneFiles
                                    value={field.value || []}
                                    onChange={field.onChange}
                                    className="min-h-[250px] h-full flex-1"
                                  />
                                </div>
                                
                                {/* Decorative elements */}
                                <div className="absolute top-2 right-2">
                                  <Sparkles className="h-4 w-4 text-purple-400 animate-pulse" />
                                </div>
                                <div className="absolute bottom-2 left-2">
                                  <Sparkles className="h-4 w-4 text-blue-400 animate-pulse delay-150" />
                                </div>
                              </div>
                            </motion.div>
                          </FormControl>
                          <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <motion.div whileHover={{ scale: 1.05 }} className="cursor-pointer">
                                <Badge variant="outline" className="text-xs border-purple-300 text-purple-700 dark:border-purple-700 dark:text-purple-300">
                                  PDF
                                </Badge>
                              </motion.div>
                              <motion.div whileHover={{ scale: 1.05 }} className="cursor-pointer">
                                <Badge variant="outline" className="text-xs border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-300">
                                  JPG
                                </Badge>
                              </motion.div>
                              <motion.div whileHover={{ scale: 1.05 }} className="cursor-pointer">
                                <Badge variant="outline" className="text-xs border-green-300 text-green-700 dark:border-green-700 dark:text-green-300">
                                  PNG
                                </Badge>
                              </motion.div>
                              <span className="text-gray-500 dark:text-gray-400">• Max 5MB per file</span>
                            </div>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="p-4 pt-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md">
                  <DialogFooter className="flex justify-end gap-3">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isSubmitting}
                        className="border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        Cancel
                      </Button>
                    </motion.div>
                    
                    <AnimatedButton type="submit" disabled={isSubmitting} className="min-w-[150px]">
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          <span className="animate-pulse">Submitting...</span>
                        </>
                      ) : (
                        <div className="flex items-center justify-center">
                          <Sparkles className="mr-2 h-4 w-4" />
                          <span>Submit Claim</span>
                        </div>
                      )}
                    </AnimatedButton>
                  </DialogFooter>
                </div>
              </form>
            </Form>
          </div>
        </GlassCard>
      </DialogContent>
    </Dialog>
  );
}