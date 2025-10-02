export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          company_name: string
          company_email: string | null
          company_phone_no: string
          address: string | null
          pic_name: string | null
          pic_designation: string | null
          pic_email: string | null
          pic_phone: string | null
          logo_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_name: string
          company_email?: string | null
          company_phone_no: string
          address?: string | null
          pic_name?: string | null
          pic_designation?: string | null
          pic_email?: string | null
          pic_phone?: string | null
          logo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_name?: string
          company_email?: string | null
          company_phone_no?: string
          address?: string | null
          pic_name?: string | null
          pic_designation?: string | null
          pic_email?: string | null
          pic_phone?: string | null
          logo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          id: string
          email: string
          full_name: string
          role: string
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name: string
          role?: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          id: string
          title: string
          description: string | null
          status: string
          priority: string
          client_id: string
          company_id: string
          start_date: string
          end_date: string | null
          budget: number | null
          color: string
          event_type: string | null
          venue_name: string | null
          venue_address: string | null
          created_at: string
          updated_at: string
          working_hours_start: string | null
          working_hours_end: string | null
          crew_count: number
          filled_positions: number
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          status?: string
          priority?: string
          client_id: string
          company_id: string
          start_date: string
          end_date?: string | null
          budget?: number | null
          color?: string
          event_type?: string | null
          venue_name?: string | null
          venue_address?: string | null
          created_at?: string
          updated_at?: string
          working_hours_start?: string | null
          working_hours_end?: string | null
          crew_count?: number
          filled_positions?: number
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          status?: string
          priority?: string
          client_id?: string
          company_id?: string
          start_date?: string
          end_date?: string | null
          budget?: number | null
          color?: string
          event_type?: string | null
          venue_name?: string | null
          venue_address?: string | null
          created_at?: string
          updated_at?: string
          working_hours_start?: string | null
          working_hours_end?: string | null
          crew_count?: number
          filled_positions?: number
        }
        Relationships: []
      }
      receipts: {
        Row: {
          id: string
          amount: number
          date: string
          vendor: string
          category: string | null
          description: string | null
          image_url: string | null
          user_id: string
          project_id: string | null
          expense_claim_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          amount: number
          date: string
          vendor: string
          category?: string | null
          description?: string | null
          image_url?: string | null
          user_id: string
          project_id?: string | null
          expense_claim_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          amount?: number
          date?: string
          vendor?: string
          category?: string | null
          description?: string | null
          image_url?: string | null
          user_id?: string
          project_id?: string | null
          expense_claim_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      expense_claims: {
        Row: {
          id: string
          title: string
          description: string | null
          amount: number
          status: string
          user_id: string
          project_id: string | null
          submitted_at: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          amount: number
          status?: string
          user_id: string
          project_id?: string | null
          submitted_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          amount?: number
          status?: string
          user_id?: string
          project_id?: string | null
          submitted_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      candidates: {
        Row: {
          id: string
          full_name: string
          ic_number: string | null
          date_of_birth: string | null
          phone_number: string
          gender: string | null
          email: string | null
          nationality: string | null
          emergency_contact_name: string | null
          emergency_contact_number: string | null
          emergency_contact_relationship: string | null
          bank_name: string | null
          bank_account_number: string | null
          bank_account_name: string | null
          bank_account_relationship: string | null
          not_own_account: boolean | null
          highest_education: string | null
          field_of_study: string | null
          work_experience: string | null
          has_vehicle: boolean | null
          vehicle_type: string | null
          is_banned: boolean | null
          status: string | null
          unique_id: string | null
          profile_photo: string | null
          full_body_photos: Json | null
          half_body_photos: Json | null
          address_business: Json | null
          address_mailing: Json | null
          home_address: string | null
          business_address: string | null
          shirt_size: string | null
          languages_spoken: string | null
          race: string | null
          passport_number: string | null
          custom_fields: Json | null
          created_at: string
          updated_at: string
          address: string | null
          address_home: string | null
        }
        Insert: {
          id?: string
          full_name: string
          ic_number?: string | null
          date_of_birth?: string | null
          phone_number: string
          gender?: string | null
          email?: string | null
          nationality?: string | null
          emergency_contact_name?: string | null
          emergency_contact_number?: string | null
          emergency_contact_relationship?: string | null
          bank_name?: string | null
          bank_account_number?: string | null
          bank_account_name?: string | null
          bank_account_relationship?: string | null
          not_own_account?: boolean | null
          highest_education?: string | null
          field_of_study?: string | null
          work_experience?: string | null
          has_vehicle?: boolean | null
          vehicle_type?: string | null
          is_banned?: boolean | null
          status?: string | null
          unique_id?: string | null
          profile_photo?: string | null
          full_body_photos?: Json | null
          half_body_photos?: Json | null
          address_business?: Json | null
          address_mailing?: Json | null
          home_address?: string | null
          business_address?: string | null
          shirt_size?: string | null
          languages_spoken?: string | null
          race?: string | null
          passport_number?: string | null
          custom_fields?: Json | null
          created_at?: string
          updated_at?: string
          address?: string | null
          address_home?: string | null
        }
        Update: {
          id?: string
          full_name?: string
          ic_number?: string | null
          date_of_birth?: string | null
          phone_number?: string
          gender?: string | null
          email?: string | null
          nationality?: string | null
          emergency_contact_name?: string | null
          emergency_contact_number?: string | null
          emergency_contact_relationship?: string | null
          bank_name?: string | null
          bank_account_number?: string | null
          bank_account_name?: string | null
          bank_account_relationship?: string | null
          not_own_account?: boolean | null
          highest_education?: string | null
          field_of_study?: string | null
          work_experience?: string | null
          has_vehicle?: boolean | null
          vehicle_type?: string | null
          is_banned?: boolean | null
          status?: string | null
          unique_id?: string | null
          profile_photo?: string | null
          full_body_photos?: Json | null
          half_body_photos?: Json | null
          address_business?: Json | null
          address_mailing?: Json | null
          home_address?: string | null
          business_address?: string | null
          shirt_size?: string | null
          languages_spoken?: string | null
          race?: string | null
          passport_number?: string | null
          custom_fields?: Json | null
          created_at?: string
          updated_at?: string
          address?: string | null
          address_home?: string | null
        }
        Relationships: []
      }
      project_staff: {
        Row: {
          id: string
          project_id: string
          user_id: string | null
          candidate_id: string | null
          role: string
          rate_per_hour: number | null
          working_dates: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id?: string | null
          candidate_id?: string | null
          role: string
          rate_per_hour?: number | null
          working_dates?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string | null
          candidate_id?: string | null
          role?: string
          rate_per_hour?: number | null
          working_dates?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          id: string
          title: string
          description: string | null
          project_id: string
          status: string
          priority: string
          assigned_to: string | null
          due_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          project_id: string
          status?: string
          priority?: string
          assigned_to?: string | null
          due_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          project_id?: string
          status?: string
          priority?: string
          assigned_to?: string | null
          due_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_documents: {
        Row: {
          id: string
          project_id: string
          name: string
          type: string
          size: number
          url: string
          uploaded_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          type: string
          size: number
          url: string
          uploaded_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          name?: string
          type?: string
          size?: number
          url?: string
          uploaded_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      candidate_project_history: {
        Row: {
          id: string
          candidate_id: string
          project_id: string
          user_id: string
          completed_at: string | null
          rating: number | null
          comment: string | null
          status: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          candidate_id: string
          project_id: string
          user_id: string
          completed_at?: string | null
          rating?: number | null
          comment?: string | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          candidate_id?: string
          project_id?: string
          user_id?: string
          completed_at?: string | null
          rating?: number | null
          comment?: string | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      gig_tasks: {
        Row: {
          id: string
          gig_history_id: string | null
          task_name: string
          task_description: string | null
          start_time: string | null
          end_time: string | null
          completed: boolean | null
          completion_notes: string | null
          created_at: string | null
          description: string | null
          status: string | null
          priority: string | null
          updated_at: string | null
          title: string | null
          due_date: string | null
          assigned_to: string | null
          assigned_by: string | null
          assigned_at: string | null
          column_id: string | null
          board_id: string | null
          position: number | null
          labels: Json | null
          estimated_hours: number | null
          completed_at: string | null
          project_id: string | null
          metadata: Json | null
        }
        Insert: {
          id?: string
          gig_history_id?: string | null
          task_name: string
          task_description?: string | null
          start_time?: string | null
          end_time?: string | null
          completed?: boolean | null
          completion_notes?: string | null
          created_at?: string | null
          description?: string | null
          status?: string | null
          priority?: string | null
          updated_at?: string | null
          title?: string | null
          due_date?: string | null
          assigned_to?: string | null
          assigned_by?: string | null
          assigned_at?: string | null
          column_id?: string | null
          board_id?: string | null
          position?: number | null
          labels?: Json | null
          estimated_hours?: number | null
          completed_at?: string | null
          project_id?: string | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          gig_history_id?: string | null
          task_name?: string
          task_description?: string | null
          start_time?: string | null
          end_time?: string | null
          completed?: boolean | null
          completion_notes?: string | null
          created_at?: string | null
          description?: string | null
          status?: string | null
          priority?: string | null
          updated_at?: string | null
          title?: string | null
          due_date?: string | null
          assigned_to?: string | null
          assigned_by?: string | null
          assigned_at?: string | null
          column_id?: string | null
          board_id?: string | null
          position?: number | null
          labels?: Json | null
          estimated_hours?: number | null
          completed_at?: string | null
          project_id?: string | null
          metadata?: Json | null
        }
        Relationships: []
      }
      candidate_blacklist: {
        Row: {
          id: string
          candidate_id: string
          user_id: string
          reason: string | null
          proof_files: Json | null
          is_global: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          candidate_id: string
          user_id: string
          reason?: string | null
          proof_files?: Json | null
          is_global?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          candidate_id?: string
          user_id?: string
          reason?: string | null
          proof_files?: Json | null
          is_global?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      activity_logs: {
        Row: {
          id: string
          project_id: string | null
          user_id: string | null
          user_name: string | null
          activity_type: string | null
          action: string | null
          details: Json | null
          timestamp: string | null
          session_id: string | null
          page_url: string | null
          user_agent: string | null
          created_at: string | null
          description: string | null
        }
        Insert: {
          id?: string
          project_id?: string | null
          user_id?: string | null
          user_name?: string | null
          activity_type?: string | null
          action?: string | null
          details?: Json | null
          timestamp?: string | null
          session_id?: string | null
          page_url?: string | null
          user_agent?: string | null
          created_at?: string | null
          description?: string | null
        }
        Update: {
          id?: string
          project_id?: string | null
          user_id?: string | null
          user_name?: string | null
          activity_type?: string | null
          action?: string | null
          details?: Json | null
          timestamp?: string | null
          session_id?: string | null
          page_url?: string | null
          user_agent?: string | null
          created_at?: string | null
          description?: string | null
        }
        Relationships: []
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
    CompositeTypes: {}
  }
}