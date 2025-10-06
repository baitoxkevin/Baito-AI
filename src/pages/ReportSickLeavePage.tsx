/**
 * Report Sick Leave Page
 * Mobile-first page for crew members to report sick leave
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertCircle,
  Calendar as CalendarIcon,
  Upload,
  Send,
  Check,
  Clock,
  FileText
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

const formSchema = z.object({
  project_id: z.string().min(1, 'Please select a project'),
  sick_date: z.date({ required_error: 'Please select a date' }),
  sick_date_end: z.date().optional(),
  reason: z.string().min(10, 'Please provide a detailed reason (minimum 10 characters)'),
  sick_note_file: z.any().optional(),
})

type FormData = z.infer<typeof formSchema>

interface Project {
  id: string
  title: string
  start_date: string
  end_date: string
  status: string
}

export default function ReportSickLeavePage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [userProjects, setUserProjects] = useState<Project[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [otp, setOtp] = useState('')
  const [showOtpInput, setShowOtpInput] = useState(false)
  const [sickLeaveId, setSickLeaveId] = useState<string | null>(null)
  const [sickNoteUrl, setSickNoteUrl] = useState<string | null>(null)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sick_date: new Date(),
      reason: '',
    },
  })

  // Get current user
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate('/login')
        return
      }
      setCurrentUser(user)

      // Fetch user's assigned projects
      await fetchUserProjects(user.id)
    }

    fetchUser()
  }, [navigate])

  const fetchUserProjects = async (userId: string) => {
    try {
      // Get projects where user is assigned as crew
      const { data, error } = await supabase
        .from('projects')
        .select('id, title, start_date, end_date, status')
        .contains('confirmed_staff', [{ candidate_id: userId }])
        .in('status', ['confirmed', 'in_progress'])
        .gte('end_date', new Date().toISOString())
        .order('start_date', { ascending: true })

      if (error) throw error

      setUserProjects(data || [])
    } catch (error) {
      console.error('Error fetching projects:', error)
      toast({
        title: 'Error',
        description: 'Failed to load your projects',
        variant: 'destructive',
      })
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${currentUser.id}/${Date.now()}.${fileExt}`

      const { data, error } = await supabase.storage
        .from('sick-notes')
        .upload(fileName, file)

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('sick-notes')
        .getPublicUrl(fileName)

      setSickNoteUrl(publicUrl)

      toast({
        title: 'File uploaded',
        description: 'Sick note uploaded successfully',
      })
    } catch (error) {
      console.error('Error uploading file:', error)
      toast({
        title: 'Upload failed',
        description: 'Failed to upload sick note',
        variant: 'destructive',
      })
    }
  }

  const onSubmit = async (values: FormData) => {
    if (!currentUser) return

    setIsSubmitting(true)

    try {
      // Create sick leave record
      const { data: sickLeave, error } = await supabase
        .from('sick_leaves')
        .insert({
          crew_id: currentUser.id,
          project_id: values.project_id,
          sick_date: format(values.sick_date, 'yyyy-MM-dd'),
          sick_date_end: values.sick_date_end ? format(values.sick_date_end, 'yyyy-MM-dd') : null,
          reason: values.reason,
          sick_note_url: sickNoteUrl,
          verification_status: 'pending',
          replacement_status: 'pending',
          created_by: currentUser.id,
        })
        .select()
        .single()

      if (error) throw error

      // Generate and send OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString()

      const { error: otpError } = await supabase
        .from('sick_leaves')
        .update({
          verification_otp: otpCode,
          otp_sent_at: new Date().toISOString(),
        })
        .eq('id', sickLeave.id)

      if (otpError) throw otpError

      setSickLeaveId(sickLeave.id)
      setShowOtpInput(true)

      // In production, send SMS here
      console.log('OTP:', otpCode) // For development

      toast({
        title: 'Sick leave submitted',
        description: 'Please enter the OTP sent to your phone',
      })
    } catch (error) {
      console.error('Error submitting sick leave:', error)
      toast({
        title: 'Submission failed',
        description: 'Failed to submit sick leave report',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const verifyOtp = async () => {
    if (!sickLeaveId || !otp) return

    try {
      const { data, error } = await supabase
        .from('sick_leaves')
        .select('verification_otp')
        .eq('id', sickLeaveId)
        .single()

      if (error) throw error

      if (data.verification_otp === otp) {
        await supabase
          .from('sick_leaves')
          .update({
            verification_status: 'verified',
            otp_verified_at: new Date().toISOString(),
          })
          .eq('id', sickLeaveId)

        setShowSuccess(true)

        toast({
          title: 'Verified successfully',
          description: 'Your sick leave has been reported and will be reviewed by your manager',
        })

        setTimeout(() => {
          navigate('/dashboard')
        }, 3000)
      } else {
        toast({
          title: 'Invalid OTP',
          description: 'Please check the code and try again',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error verifying OTP:', error)
      toast({
        title: 'Verification failed',
        description: 'Failed to verify OTP',
        variant: 'destructive',
      })
    }
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900 p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-green-500 rounded-full flex items-center justify-center">
            <Check className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Sick Leave Reported
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Your manager will be notified and will arrange a replacement.
          </p>
          <p className="text-sm text-gray-500">
            Redirecting to dashboard...
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900 p-4">
      <div className="max-w-2xl mx-auto py-8">
        <Card className="shadow-xl">
          <CardHeader className="bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-t-lg">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-8 h-8" />
              <div>
                <CardTitle className="text-2xl">Report Sick Leave</CardTitle>
                <CardDescription className="text-red-50">
                  Notify your project manager and request a replacement
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            {!showOtpInput ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Project Selection */}
                  <FormField
                    control={form.control}
                    name="project_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select project" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {userProjects.map((project) => (
                              <SelectItem key={project.id} value={project.id}>
                                {project.title} ({format(new Date(project.start_date), 'MMM d, yyyy')})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Sick Date */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="sick_date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Sick Date *</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    'w-full pl-3 text-left font-normal',
                                    !field.value && 'text-muted-foreground'
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, 'PPP')
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date < new Date(new Date().setHours(0, 0, 0, 0))
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="sick_date_end"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>End Date (if multi-day)</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    'w-full pl-3 text-left font-normal',
                                    !field.value && 'text-muted-foreground'
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, 'PPP')
                                  ) : (
                                    <span>Optional</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date < (form.watch('sick_date') || new Date())
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormDescription>
                            Leave blank for single day sick leave
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Reason */}
                  <FormField
                    control={form.control}
                    name="reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reason *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Please describe your illness or medical condition..."
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Please provide details about your condition
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Sick Note Upload */}
                  <div className="space-y-2">
                    <FormLabel>Medical Certificate (Optional)</FormLabel>
                    <div className="flex items-center gap-4">
                      <Input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileUpload}
                        className="flex-1"
                      />
                      {sickNoteUrl && (
                        <Check className="w-5 h-5 text-green-500" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Upload medical certificate if available (PDF, JPG, PNG)
                    </p>
                  </div>

                  {/* Info Alert */}
                  <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertDescription>
                      After submission, you'll receive an OTP via SMS to verify this report.
                      Your project manager will be notified immediately.
                    </AlertDescription>
                  </Alert>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white"
                    size="lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Clock className="w-5 h-5 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        Report Sick Leave
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            ) : (
              <div className="space-y-6 text-center">
                <div className="w-20 h-20 mx-auto bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <FileText className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2">Verify Your Report</h3>
                  <p className="text-muted-foreground">
                    Enter the 6-digit code sent to your phone number
                  </p>
                </div>

                <div className="max-w-xs mx-auto">
                  <Input
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="text-center text-2xl tracking-widest"
                    maxLength={6}
                  />
                </div>

                <Button
                  onClick={verifyOtp}
                  disabled={otp.length !== 6}
                  className="w-full"
                  size="lg"
                >
                  <Check className="w-5 h-5 mr-2" />
                  Verify & Submit
                </Button>

                <button
                  onClick={() => setShowOtpInput(false)}
                  className="text-sm text-muted-foreground hover:text-foreground underline"
                >
                  Go back to edit
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card className="mt-6">
          <CardContent className="pt-6">
            <h4 className="font-semibold mb-3">What happens next?</h4>
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li>1. Your project manager will be notified immediately via SMS and email</li>
              <li>2. The system will find suitable replacements based on availability and skills</li>
              <li>3. Your manager will select and assign a replacement crew member</li>
              <li>4. You'll be notified once a replacement has been confirmed</li>
              <li>5. Focus on your recovery - we'll take care of the rest!</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
