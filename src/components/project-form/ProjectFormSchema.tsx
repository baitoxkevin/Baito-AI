import * as z from "zod";

/**
 * Schema for working dates with salary information
 */
export const workingDateWithSalarySchema = z.object({
  date: z.date(),
  basicSalary: z.number().default(0),
  claims: z.number().default(0),
  commission: z.number().default(0),
});

export type WorkingDateWithSalary = z.infer<typeof workingDateWithSalarySchema>;

/**
 * Validation schema for project forms
 */
export const projectFormSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  status: z.string().min(1, { message: "Status is required" }),
  priority: z.string().min(1, { message: "Priority is required" }),
  start_date: z.date({ required_error: "Start date is required" }),
  end_date: z.date().nullable().optional(),
  crew_count: z.coerce.number().int().min(0),
  filled_positions: z.coerce.number().int().min(0),
  working_hours_start: z.string().min(1, { message: "Working hours start is required" }),
  working_hours_end: z.string().min(1, { message: "Working hours end is required" }),
  event_type: z.string().min(1, { message: "Event type is required" }),
  venue_address: z.string().min(1, { message: "Venue address is required" }),
  venue_details: z.string().optional(),
  supervisors_required: z.coerce.number().int().min(0),
  color: z.string().optional(),
  client_id: z.string().optional().nullable(),
  manager_id: z.string().optional().nullable(),
  schedule_type: z.enum(["single", "recurring", "multiple"]).default("single"),
  recurrence_pattern: z.enum(["daily", "weekly", "biweekly", "monthly"]).optional(),
  recurrence_days: z.array(z.number()).optional(),
  project_type: z.enum(["recruitment", "internal_event", "custom"]).default("recruitment"),
  // IMPORTANT: logo_url field is not in the database schema
  // This field is excluded from database operations in projects.ts
  // It's kept here only for form state management
  logo_url: z.string().optional().nullable(),
});

export type ProjectFormValues = z.infer<typeof projectFormSchema>;

/**
 * Default values for project form
 */
export const defaultProjectValues: ProjectFormValues = {
  title: "",
  status: "planning", 
  priority: "medium",
  start_date: new Date(),
  end_date: null,
  crew_count: 0,
  filled_positions: 0,
  working_hours_start: "09:00",
  working_hours_end: "17:00",
  event_type: "Standard Event",
  venue_address: "",
  venue_details: "",
  supervisors_required: 0,
  color: "#2563eb", // Default blue color
  client_id: null,
  manager_id: null,
  schedule_type: "single",
  project_type: "recruitment",
};

/**
 * Validation schema for staff or crew member
 */
export const staffMemberSchema = z.object({
  id: z.string(),
  name: z.string().min(1, { message: "Name is required" }),
  designation: z.string().optional(),
  photo: z.string().optional(),
  status: z.enum(["confirmed", "pending", "kiv", "rejected"]).default("pending"),
  appliedDate: z.date().optional(),
  applyType: z.enum(["full", "specific"]).default("full"),
  workingDates: z.array(z.date()).optional(),
  workingDatesWithSalary: z.array(workingDateWithSalarySchema).optional(),
});