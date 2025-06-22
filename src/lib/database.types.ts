export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      action_items_tracking: {
        Row: {
          action_item_index: number
          completed_at: string | null
          created_at: string | null
          id: string
          is_completed: boolean | null
          meeting_minutes_id: string | null
          task_id: string | null
          updated_at: string | null
        }
        Insert: {
          action_item_index: number
          completed_at?: string | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          meeting_minutes_id?: string | null
          task_id?: string | null
          updated_at?: string | null
        }
        Update: {
          action_item_index?: number
          completed_at?: string | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          meeting_minutes_id?: string | null
          task_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "action_items_tracking_meeting_minutes_id_fkey"
            columns: ["meeting_minutes_id"]
            isOneToOne: false
            referencedRelation: "meeting_minutes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_items_tracking_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_logs: {
        Row: {
          action: string
          activity_type: string
          created_at: string | null
          description: string | null
          details: Json | null
          id: string
          page_url: string | null
          project_id: string | null
          session_id: string | null
          timestamp: string | null
          user_agent: string | null
          user_id: string
          user_name: string | null
        }
        Insert: {
          action: string
          activity_type: string
          created_at?: string | null
          description?: string | null
          details?: Json | null
          id?: string
          page_url?: string | null
          project_id?: string | null
          session_id?: string | null
          timestamp?: string | null
          user_agent?: string | null
          user_id: string
          user_name?: string | null
        }
        Update: {
          action?: string
          activity_type?: string
          created_at?: string | null
          description?: string | null
          details?: Json | null
          id?: string
          page_url?: string | null
          project_id?: string | null
          session_id?: string | null
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      availability: {
        Row: {
          blackout_dates: Json | null
          candidate_id: string | null
          id: string
          last_updated: string | null
          notice_period_days: number | null
          preferred_working_hours: Json
          public_holiday_available: boolean | null
          weekend_available: boolean | null
        }
        Insert: {
          blackout_dates?: Json | null
          candidate_id?: string | null
          id?: string
          last_updated?: string | null
          notice_period_days?: number | null
          preferred_working_hours: Json
          public_holiday_available?: boolean | null
          weekend_available?: boolean | null
        }
        Update: {
          blackout_dates?: Json | null
          candidate_id?: string | null
          id?: string
          last_updated?: string | null
          notice_period_days?: number | null
          preferred_working_hours?: Json
          public_holiday_available?: boolean | null
          weekend_available?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "availability_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      blacklisted_candidates: {
        Row: {
          ban_date: string | null
          ban_reason: string | null
          banned_by: string | null
          candidate_id: string | null
          created_at: string | null
          id: string
          is_permanent: boolean | null
          project_id: string | null
        }
        Insert: {
          ban_date?: string | null
          ban_reason?: string | null
          banned_by?: string | null
          candidate_id?: string | null
          created_at?: string | null
          id?: string
          is_permanent?: boolean | null
          project_id?: string | null
        }
        Update: {
          ban_date?: string | null
          ban_reason?: string | null
          banned_by?: string | null
          candidate_id?: string | null
          created_at?: string | null
          id?: string
          is_permanent?: boolean | null
          project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blacklisted_candidates_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blacklisted_candidates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_applications: {
        Row: {
          application_status: string | null
          applied_at: string | null
          candidate_id: string | null
          id: string
          notes: string | null
          project_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
        }
        Insert: {
          application_status?: string | null
          applied_at?: string | null
          candidate_id?: string | null
          id?: string
          notes?: string | null
          project_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
        }
        Update: {
          application_status?: string | null
          applied_at?: string | null
          candidate_id?: string | null
          id?: string
          notes?: string | null
          project_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "candidate_applications_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_applications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_feedback: {
        Row: {
          candidate_id: string | null
          created_at: string | null
          feedback_type: string | null
          id: string
          notes: string | null
          project_id: string | null
          rating: number | null
          submitted_by: string | null
        }
        Insert: {
          candidate_id?: string | null
          created_at?: string | null
          feedback_type?: string | null
          id?: string
          notes?: string | null
          project_id?: string | null
          rating?: number | null
          submitted_by?: string | null
        }
        Update: {
          candidate_id?: string | null
          created_at?: string | null
          feedback_type?: string | null
          id?: string
          notes?: string | null
          project_id?: string | null
          rating?: number | null
          submitted_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "candidate_feedback_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_feedback_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_history: {
        Row: {
          candidate_id: string | null
          created_at: string | null
          event_type: string
          field_name: string | null
          id: string
          new_value: string | null
          old_value: string | null
          project_id: string | null
          user_id: string | null
        }
        Insert: {
          candidate_id?: string | null
          created_at?: string | null
          event_type: string
          field_name?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          project_id?: string | null
          user_id?: string | null
        }
        Update: {
          candidate_id?: string | null
          created_at?: string | null
          event_type?: string
          field_name?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          project_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "candidate_history_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_history_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_public_links: {
        Row: {
          candidate_id: string | null
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          link_token: string
          last_accessed_at: string | null
        }
        Insert: {
          candidate_id?: string | null
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          link_token: string
          last_accessed_at?: string | null
        }
        Update: {
          candidate_id?: string | null
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          link_token?: string
          last_accessed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "candidate_public_links_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_security_tokens: {
        Row: {
          candidate_id: string | null
          created_at: string | null
          expires_at: string
          id: string
          is_active: boolean | null
          is_whitelisted: boolean | null
          last_validated_at: string | null
          project_id: string | null
          token: string
          validation_attempts: number | null
        }
        Insert: {
          candidate_id?: string | null
          created_at?: string | null
          expires_at: string
          id?: string
          is_active?: boolean | null
          is_whitelisted?: boolean | null
          last_validated_at?: string | null
          project_id?: string | null
          token: string
          validation_attempts?: number | null
        }
        Update: {
          candidate_id?: string | null
          created_at?: string | null
          expires_at?: string
          id?: string
          is_active?: boolean | null
          is_whitelisted?: boolean | null
          last_validated_at?: string | null
          project_id?: string | null
          token?: string
          validation_attempts?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "candidate_security_tokens_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_security_tokens_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      candidates: {
        Row: {
          address: string | null
          address_business: Json | null
          address_home: string | null
          address_mailing: Json | null
          bank_account_name: string | null
          bank_account_number: string | null
          bank_account_relationship: string | null
          bank_name: string | null
          business_address: string | null
          created_at: string | null
          created_by: string | null
          created_by_user_id: string | null
          custom_fields: Json | null
          date_of_birth: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_number: string | null
          emergency_contact_relationship: string | null
          field_of_study: string | null
          full_body_photos: Json | null
          full_name: string
          gender: string | null
          half_body_photos: Json | null
          has_vehicle: boolean | null
          highest_education: string | null
          home_address: string | null
          ic_number: string | null
          id: string
          is_banned: boolean | null
          languages_spoken: string | null
          nationality: string | null
          not_own_account: boolean | null
          passport_number: string | null
          phone_number: string
          profile_photo: string | null
          race: string | null
          shirt_size: string | null
          status: string | null
          unique_id: string | null
          updated_at: string | null
          vehicle_type: string | null
          work_experience: string | null
        }
        Insert: {
          address?: string | null
          address_business?: Json | null
          address_home?: string | null
          address_mailing?: Json | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_account_relationship?: string | null
          bank_name?: string | null
          business_address?: string | null
          created_at?: string | null
          created_by?: string | null
          created_by_user_id?: string | null
          custom_fields?: Json | null
          date_of_birth?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_number?: string | null
          emergency_contact_relationship?: string | null
          field_of_study?: string | null
          full_body_photos?: Json | null
          full_name: string
          gender?: string | null
          half_body_photos?: Json | null
          has_vehicle?: boolean | null
          highest_education?: string | null
          home_address?: string | null
          ic_number?: string | null
          id?: string
          is_banned?: boolean | null
          languages_spoken?: string | null
          nationality?: string | null
          not_own_account?: boolean | null
          passport_number?: string | null
          phone_number: string
          profile_photo?: string | null
          race?: string | null
          shirt_size?: string | null
          status?: string | null
          unique_id?: string | null
          updated_at?: string | null
          vehicle_type?: string | null
          work_experience?: string | null
        }
        Update: {
          address?: string | null
          address_business?: Json | null
          address_home?: string | null
          address_mailing?: Json | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_account_relationship?: string | null
          bank_name?: string | null
          business_address?: string | null
          created_at?: string | null
          created_by?: string | null
          created_by_user_id?: string | null
          custom_fields?: Json | null
          date_of_birth?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_number?: string | null
          emergency_contact_relationship?: string | null
          field_of_study?: string | null
          full_body_photos?: Json | null
          full_name?: string
          gender?: string | null
          half_body_photos?: Json | null
          has_vehicle?: boolean | null
          highest_education?: string | null
          home_address?: string | null
          ic_number?: string | null
          id?: string
          is_banned?: boolean | null
          languages_spoken?: string | null
          nationality?: string | null
          not_own_account?: boolean | null
          passport_number?: string | null
          phone_number?: string
          profile_photo?: string | null
          race?: string | null
          shirt_size?: string | null
          status?: string | null
          unique_id?: string | null
          updated_at?: string | null
          vehicle_type?: string | null
          work_experience?: string | null
        }
        Relationships: []
      }
      cc_stakeholders: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string
          project_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          name: string
          project_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cc_stakeholders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string | null
          company_email: string
          company_name: string
          company_phone_no: string
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          id: string
          logo_url: string | null
          parent_id: string | null
          pic_designation: string | null
          pic_email: string | null
          pic_name: string | null
          pic_phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          company_email: string
          company_name: string
          company_phone_no: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          logo_url?: string | null
          parent_id?: string | null
          pic_designation?: string | null
          pic_email?: string | null
          pic_name?: string | null
          pic_phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          company_email?: string
          company_name?: string
          company_phone_no?: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          logo_url?: string | null
          parent_id?: string | null
          pic_designation?: string | null
          pic_email?: string | null
          pic_name?: string | null
          pic_phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "companies_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_contacts: {
        Row: {
          company_id: string | null
          created_at: string | null
          designation: string | null
          email: string | null
          id: string
          is_primary: boolean | null
          name: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          designation?: string | null
          email?: string | null
          id?: string
          is_primary?: boolean | null
          name: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          designation?: string | null
          email?: string | null
          id?: string
          is_primary?: boolean | null
          name?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      document_uploads: {
        Row: {
          created_at: string | null
          file_name: string
          file_size: number
          file_url: string
          id: string
          upload_type: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_size: number
          file_url: string
          id?: string
          upload_type: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_size?: number
          file_url?: string
          id?: string
          upload_type?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          project_id: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          project_id: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          project_id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      edit_sessions: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          project_id: string | null
          session_token: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          project_id?: string | null
          session_token: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          project_id?: string | null
          session_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "edit_sessions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_claim_approvals: {
        Row: {
          approved_at: string
          approved_by: string | null
          expense_claim_id: string | null
          id: string
          notes: string | null
        }
        Insert: {
          approved_at?: string
          approved_by?: string | null
          expense_claim_id?: string | null
          id?: string
          notes?: string | null
        }
        Update: {
          approved_at?: string
          approved_by?: string | null
          expense_claim_id?: string | null
          id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expense_claim_approvals_expense_claim_id_fkey"
            columns: ["expense_claim_id"]
            isOneToOne: true
            referencedRelation: "expense_claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_claim_approvals_expense_claim_id_fkey"
            columns: ["expense_claim_id"]
            isOneToOne: true
            referencedRelation: "expense_claims_view"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_claims: {
        Row: {
          amount: number | null
          approved_at: string | null
          approved_by: string | null
          bank_account_name: string | null
          bank_account_number: string | null
          bank_name: string | null
          claim_date: string
          created_at: string | null
          created_by: string | null
          description: string | null
          expense_date: string
          expense_type: string | null
          id: string
          paid_at: string | null
          project_id: string | null
          receipts: string[] | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          status: string | null
          submitted_by_user_id: string | null
          submitter_email: string
          submitter_name: string
          submitter_phone: string | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          claim_date?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          expense_date: string
          expense_type?: string | null
          id?: string
          paid_at?: string | null
          project_id?: string | null
          receipts?: string[] | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          status?: string | null
          submitted_by_user_id?: string | null
          submitter_email: string
          submitter_name: string
          submitter_phone?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          claim_date?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          expense_date?: string
          expense_type?: string | null
          id?: string
          paid_at?: string | null
          project_id?: string | null
          receipts?: string[] | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          status?: string | null
          submitted_by_user_id?: string | null
          submitter_email?: string
          submitter_name?: string
          submitter_phone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expense_claims_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      invites: {
        Row: {
          company_id: string | null
          created_at: string
          created_by: string
          email: string
          expires_at: string
          id: string
          role: string
          status: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          created_by: string
          email: string
          expires_at: string
          id?: string
          role: string
          status?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          created_by?: string
          email?: string
          expires_at?: string
          id?: string
          role?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "invites_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      links: {
        Row: {
          created_at: string | null
          id: string
          project_id: string
          title: string
          type: string
          updated_at: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          project_id: string
          title: string
          type?: string
          updated_at?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          id?: string
          project_id?: string
          title?: string
          type?: string
          updated_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "links_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_minutes: {
        Row: {
          action_items: string[] | null
          agenda: string | null
          attendees: string[] | null
          chunk_count: number | null
          created_at: string | null
          extracted_from: string | null
          id: string
          is_chunked: boolean | null
          meeting_date: string
          next_meeting_date: string | null
          notes: string
          project_id: string
          raw_content: string | null
          summary: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          action_items?: string[] | null
          agenda?: string | null
          attendees?: string[] | null
          chunk_count?: number | null
          created_at?: string | null
          extracted_from?: string | null
          id?: string
          is_chunked?: boolean | null
          meeting_date: string
          next_meeting_date?: string | null
          notes: string
          project_id: string
          raw_content?: string | null
          summary?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          action_items?: string[] | null
          agenda?: string | null
          attendees?: string[] | null
          chunk_count?: number | null
          created_at?: string | null
          extracted_from?: string | null
          id?: string
          is_chunked?: boolean | null
          meeting_date?: string
          next_meeting_date?: string | null
          notes?: string
          project_id?: string
          raw_content?: string | null
          summary?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      meeting_minutes_chunks: {
        Row: {
          chunk_index: number
          content: string
          created_at: string | null
          id: string
          meeting_minutes_id: string | null
        }
        Insert: {
          chunk_index: number
          content: string
          created_at?: string | null
          id?: string
          meeting_minutes_id?: string | null
        }
        Update: {
          chunk_index?: number
          content?: string
          created_at?: string | null
          id?: string
          meeting_minutes_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_minutes_chunks_meeting_minutes_id_fkey"
            columns: ["meeting_minutes_id"]
            isOneToOne: false
            referencedRelation: "meeting_minutes"
            referencedColumns: ["id"]
          },
        ]
      }
      password_reset_tokens: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string
          id: string
          is_used: boolean | null
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          is_used?: boolean | null
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          is_used?: boolean | null
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      payment_batches: {
        Row: {
          batch_number: string
          claim_ids: string[]
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          export_file_url: string | null
          id: string
          staff_count: number | null
          status: string | null
          total_amount: number | null
          updated_at: string | null
        }
        Insert: {
          batch_number: string
          claim_ids: string[]
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          export_file_url?: string | null
          id?: string
          staff_count?: number | null
          status?: string | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          batch_number?: string
          claim_ids?: string[]
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          export_file_url?: string | null
          id?: string
          staff_count?: number | null
          status?: string | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      pin_codes: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          pin_code: string
          project_id: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          pin_code: string
          project_id?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          pin_code?: string
          project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pin_codes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_applications: {
        Row: {
          applied_at: string | null
          candidate_id: string | null
          id: string
          project_id: string | null
          status: string | null
        }
        Insert: {
          applied_at?: string | null
          candidate_id?: string | null
          id?: string
          project_id?: string | null
          status?: string | null
        }
        Update: {
          applied_at?: string | null
          candidate_id?: string | null
          id?: string
          project_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_applications_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_applications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_change_log: {
        Row: {
          changed_by: string | null
          changed_by_name: string | null
          created_at: string | null
          description: string | null
          field_name: string
          id: string
          new_value: string | null
          old_value: string | null
          project_id: string | null
        }
        Insert: {
          changed_by?: string | null
          changed_by_name?: string | null
          created_at?: string | null
          description?: string | null
          field_name: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          project_id?: string | null
        }
        Update: {
          changed_by?: string | null
          changed_by_name?: string | null
          created_at?: string | null
          description?: string | null
          field_name?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_change_log_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_documents: {
        Row: {
          created_at: string | null
          file_name: string
          file_size: number
          file_type: string | null
          file_url: string
          id: string
          project_id: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_size: number
          file_type?: string | null
          file_url: string
          id?: string
          project_id?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_size?: number
          file_type?: string | null
          file_url?: string
          id?: string
          project_id?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_files: {
        Row: {
          created_at: string | null
          file_name: string
          file_size: number
          file_type: string | null
          file_url: string
          id: string
          project_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_size: number
          file_type?: string | null
          file_url: string
          id?: string
          project_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_size?: number
          file_type?: string | null
          file_url?: string
          id?: string
          project_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_job_posts: {
        Row: {
          content: Json | null
          created_at: string | null
          id: string
          platforms: string[] | null
          project_id: string | null
          published_at: string | null
          published_by: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          content?: Json | null
          created_at?: string | null
          id?: string
          platforms?: string[] | null
          project_id?: string | null
          published_at?: string | null
          published_by?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: Json | null
          created_at?: string | null
          id?: string
          platforms?: string[] | null
          project_id?: string | null
          published_at?: string | null
          published_by?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_job_posts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_locations: {
        Row: {
          address: string
          created_at: string | null
          date: string
          id: string
          is_primary: boolean | null
          notes: string | null
          project_id: string
          updated_at: string | null
        }
        Insert: {
          address: string
          created_at?: string | null
          date: string
          id?: string
          is_primary?: boolean | null
          notes?: string | null
          project_id: string
          updated_at?: string | null
        }
        Update: {
          address?: string
          created_at?: string | null
          date?: string
          id?: string
          is_primary?: boolean | null
          notes?: string | null
          project_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_locations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_staff: {
        Row: {
          apply_type: string | null
          assigned_date: string | null
          designation: string | null
          hourly_rate: number | null
          id: string
          notes: string | null
          person_id: string | null
          person_name: string
          photo: string | null
          project_id: string | null
          role: string | null
          start_date: string | null
          status: string | null
          travel_allowance: number | null
          work_date: string | null
        }
        Insert: {
          apply_type?: string | null
          assigned_date?: string | null
          designation?: string | null
          hourly_rate?: number | null
          id?: string
          notes?: string | null
          person_id?: string | null
          person_name: string
          photo?: string | null
          project_id?: string | null
          role?: string | null
          start_date?: string | null
          status?: string | null
          travel_allowance?: number | null
          work_date?: string | null
        }
        Update: {
          apply_type?: string | null
          assigned_date?: string | null
          designation?: string | null
          hourly_rate?: number | null
          id?: string
          notes?: string | null
          person_id?: string | null
          person_name?: string
          photo?: string | null
          project_id?: string | null
          role?: string | null
          start_date?: string | null
          status?: string | null
          travel_allowance?: number | null
          work_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_staff_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          brand_logo: string | null
          budget: number | null
          client_id: string | null
          color: string
          created_at: string
          crew_count: number
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          end_date: string | null
          event_type: string
          filled_positions: number
          id: string
          invoice_number: string | null
          logo_url: string | null
          manager_id: string | null
          priority: string
          project_type: string | null
          recurrence_days: number[] | null
          recurrence_pattern: string | null
          schedule_type: string | null
          start_date: string
          status: string
          supervisors_required: number
          title: string
          updated_at: string
          venue_address: string
          venue_details: string | null
          working_hours_end: string
          working_hours_start: string
        }
        Insert: {
          brand_logo?: string | null
          budget?: number | null
          client_id?: string | null
          color?: string
          created_at?: string
          crew_count?: number
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          end_date?: string | null
          event_type?: string
          filled_positions?: number
          id?: string
          invoice_number?: string | null
          logo_url?: string | null
          manager_id?: string | null
          priority?: string
          project_type?: string | null
          recurrence_days?: number[] | null
          recurrence_pattern?: string | null
          schedule_type?: string | null
          start_date: string
          status?: string
          supervisors_required?: number
          title: string
          updated_at?: string
          venue_address: string
          venue_details?: string | null
          working_hours_end?: string
          working_hours_start?: string
        }
        Update: {
          brand_logo?: string | null
          budget?: number | null
          client_id?: string | null
          color?: string
          created_at?: string
          crew_count?: number
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          end_date?: string | null
          event_type?: string
          filled_positions?: number
          id?: string
          invoice_number?: string | null
          logo_url?: string | null
          manager_id?: string | null
          priority?: string
          project_type?: string | null
          recurrence_days?: number[] | null
          recurrence_pattern?: string | null
          schedule_type?: string | null
          start_date?: string
          status?: string
          supervisors_required?: number
          title?: string
          updated_at?: string
          venue_address?: string
          venue_details?: string | null
          working_hours_end?: string
          working_hours_start?: string
        }
        Relationships: []
      }
      receipts: {
        Row: {
          claim_id: string | null
          created_at: string | null
          expense_type: string | null
          file_name: string
          file_size: number
          file_url: string
          id: string
          total_amount: number | null
          uploaded_by: string | null
        }
        Insert: {
          claim_id?: string | null
          created_at?: string | null
          expense_type?: string | null
          file_name: string
          file_size: number
          file_url: string
          id?: string
          total_amount?: number | null
          uploaded_by?: string | null
        }
        Update: {
          claim_id?: string | null
          created_at?: string | null
          expense_type?: string | null
          file_name?: string
          file_size?: number
          file_url?: string
          id?: string
          total_amount?: number | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "receipts_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "expense_claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "expense_claims_view"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_events: {
        Row: {
          all_day: boolean | null
          color: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          end_time: string
          id: string
          project_id: string | null
          start_time: string
          title: string
          updated_at: string | null
        }
        Insert: {
          all_day?: boolean | null
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_time: string
          id?: string
          project_id?: string | null
          start_time: string
          title: string
          updated_at?: string | null
        }
        Update: {
          all_day?: boolean | null
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_time?: string
          id?: string
          project_id?: string | null
          start_time?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      security_logs: {
        Row: {
          created_at: string | null
          details: Json | null
          event_type: string
          id: string
          ip_address: string | null
          severity: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          event_type: string
          id?: string
          ip_address?: string | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          event_type?: string
          id?: string
          ip_address?: string | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      staff_payroll: {
        Row: {
          amount: number | null
          created_at: string | null
          id: string
          paid_at: string | null
          payment_method: string | null
          payment_reference: string | null
          payment_status: string | null
          period_end: string | null
          period_start: string | null
          project_id: string | null
          staff_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          id?: string
          paid_at?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          period_end?: string | null
          period_start?: string | null
          project_id?: string | null
          staff_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          id?: string
          paid_at?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          period_end?: string | null
          period_start?: string | null
          project_id?: string | null
          staff_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_payroll_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_working_dates: {
        Row: {
          candidate_id: string | null
          created_at: string | null
          daily_salary: number | null
          hourly_rate: number | null
          id: string
          notes: string | null
          payment_method: string | null
          payment_reference: string | null
          payment_status: string | null
          project_staff_id: string | null
          status: string | null
          total_salary: number | null
          updated_at: string | null
          work_date: string
          working_hours: number | null
        }
        Insert: {
          candidate_id?: string | null
          created_at?: string | null
          daily_salary?: number | null
          hourly_rate?: number | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          project_staff_id?: string | null
          status?: string | null
          total_salary?: number | null
          updated_at?: string | null
          work_date: string
          working_hours?: number | null
        }
        Update: {
          candidate_id?: string | null
          created_at?: string | null
          daily_salary?: number | null
          hourly_rate?: number | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          project_staff_id?: string | null
          status?: string | null
          total_salary?: number | null
          updated_at?: string | null
          work_date?: string
          working_hours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_working_dates_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_working_dates_project_staff_id_fkey"
            columns: ["project_staff_id"]
            isOneToOne: false
            referencedRelation: "project_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      subtasks: {
        Row: {
          created_at: string | null
          end_date: string | null
          id: string
          is_done: boolean | null
          name: string
          notes: string | null
          person: string[] | null
          start_date: string | null
          task_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_done?: boolean | null
          name: string
          notes?: string | null
          person?: string[] | null
          start_date?: string | null
          task_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_done?: boolean | null
          name?: string
          notes?: string | null
          person?: string[] | null
          start_date?: string | null
          task_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subtasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          assigned_to: string | null
          board_id: string | null
          column_id: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          estimated_hours: number | null
          id: string
          labels: string[] | null
          position: number | null
          priority: string
          project_id: string
          status: string
          template_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          assigned_to?: string | null
          board_id?: string | null
          column_id?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          labels?: string[] | null
          position?: number | null
          priority?: string
          project_id: string
          status?: string
          template_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          assigned_to?: string | null
          board_id?: string | null
          column_id?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          labels?: string[] | null
          position?: number | null
          priority?: string
          project_id?: string
          status?: string
          template_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      team_users: {
        Row: {
          created_at: string | null
          id: string
          role: string | null
          team_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: string | null
          team_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string | null
          team_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_users_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          name: string
          project_id: string | null
          team_type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          project_id?: string | null
          team_type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          project_id?: string | null
          team_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      typhoid_certificates: {
        Row: {
          certificate_url: string | null
          created_at: string | null
          doctor_address: string | null
          doctor_name: string | null
          expiry_date: string
          hospital_name: string | null
          id: string
          issue_date: string
          person_id: string | null
          person_name: string
          updated_at: string | null
        }
        Insert: {
          certificate_url?: string | null
          created_at?: string | null
          doctor_address?: string | null
          doctor_name?: string | null
          expiry_date: string
          hospital_name?: string | null
          id?: string
          issue_date: string
          person_id?: string | null
          person_name: string
          updated_at?: string | null
        }
        Update: {
          certificate_url?: string | null
          created_at?: string | null
          doctor_address?: string | null
          doctor_name?: string | null
          expiry_date?: string
          hospital_name?: string | null
          id?: string
          issue_date?: string
          person_id?: string | null
          person_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_notification_settings: {
        Row: {
          created_at: string | null
          email_candidate_assignment: boolean | null
          email_expense_claim: boolean | null
          email_project_completion: boolean | null
          email_project_creation: boolean | null
          email_project_update: boolean | null
          email_staff_confirmation: boolean | null
          email_task_assignment: boolean | null
          email_task_completion: boolean | null
          id: string
          push_candidate_assignment: boolean | null
          push_expense_claim: boolean | null
          push_project_completion: boolean | null
          push_project_creation: boolean | null
          push_project_update: boolean | null
          push_staff_confirmation: boolean | null
          push_task_assignment: boolean | null
          push_task_completion: boolean | null
          sms_candidate_assignment: boolean | null
          sms_expense_claim: boolean | null
          sms_project_completion: boolean | null
          sms_project_creation: boolean | null
          sms_project_update: boolean | null
          sms_staff_confirmation: boolean | null
          sms_task_assignment: boolean | null
          sms_task_completion: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_candidate_assignment?: boolean | null
          email_expense_claim?: boolean | null
          email_project_completion?: boolean | null
          email_project_creation?: boolean | null
          email_project_update?: boolean | null
          email_staff_confirmation?: boolean | null
          email_task_assignment?: boolean | null
          email_task_completion?: boolean | null
          id?: string
          push_candidate_assignment?: boolean | null
          push_expense_claim?: boolean | null
          push_project_completion?: boolean | null
          push_project_creation?: boolean | null
          push_project_update?: boolean | null
          push_staff_confirmation?: boolean | null
          push_task_assignment?: boolean | null
          push_task_completion?: boolean | null
          sms_candidate_assignment?: boolean | null
          sms_expense_claim?: boolean | null
          sms_project_completion?: boolean | null
          sms_project_creation?: boolean | null
          sms_project_update?: boolean | null
          sms_staff_confirmation?: boolean | null
          sms_task_assignment?: boolean | null
          sms_task_completion?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_candidate_assignment?: boolean | null
          email_expense_claim?: boolean | null
          email_project_completion?: boolean | null
          email_project_creation?: boolean | null
          email_project_update?: boolean | null
          email_staff_confirmation?: boolean | null
          email_task_assignment?: boolean | null
          email_task_completion?: boolean | null
          id?: string
          push_candidate_assignment?: boolean | null
          push_expense_claim?: boolean | null
          push_project_completion?: boolean | null
          push_project_creation?: boolean | null
          push_project_update?: boolean | null
          push_staff_confirmation?: boolean | null
          push_task_assignment?: boolean | null
          push_task_completion?: boolean | null
          sms_candidate_assignment?: boolean | null
          sms_expense_claim?: boolean | null
          sms_project_completion?: boolean | null
          sms_project_creation?: boolean | null
          sms_project_update?: boolean | null
          sms_staff_confirmation?: boolean | null
          sms_task_assignment?: boolean | null
          sms_task_completion?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_seed: string | null
          avatar_url: string | null
          company_name: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          is_active: boolean | null
          is_super_admin: boolean | null
          role: string
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_seed?: string | null
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          is_active?: boolean | null
          is_super_admin?: boolean | null
          role?: string
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_seed?: string | null
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          is_super_admin?: boolean | null
          role?: string
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      expense_claims_view: {
        Row: {
          amount: number | null
          approved_at: string | null
          approved_by: string | null
          approved_by_name: string | null
          bank_account_name: string | null
          bank_account_number: string | null
          bank_name: string | null
          claim_date: string | null
          created_at: string | null
          created_by: string | null
          created_by_name: string | null
          description: string | null
          expense_date: string | null
          expense_type: string | null
          id: string | null
          paid_at: string | null
          project_id: string | null
          project_title: string | null
          receipts: string[] | null
          rejected_at: string | null
          rejected_by: string | null
          rejected_by_name: string | null
          rejection_reason: string | null
          status: string | null
          submitted_by_user_id: string | null
          submitted_by_user_name: string | null
          submitter_email: string | null
          submitter_name: string | null
          submitter_phone: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expense_claims_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      calculate_staff_salary: {
        Args: {
          staff_id: string
          hourly: number
          hours: number
        }
        Returns: number
      }
      clear_project_staff_working_hours: {
        Args: {
          project_id: string
        }
        Returns: undefined
      }
      confirm_payment_approval: {
        Args: {
          batch_id: string
        }
        Returns: undefined
      }
      create_payment_batch: {
        Args: {
          claim_ids: string[]
        }
        Returns: string
      }
      delete_document_directly: {
        Args: {
          doc_id: string
        }
        Returns: boolean
      }
      generate_batch_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_payment_batch_details: {
        Args: {
          batch_id: string
        }
        Returns: Json
      }
      get_staff_working_dates: {
        Args: {
          project_id?: string
          staff_id?: string
        }
        Returns: {
          id: string
          project_staff_id: string
          candidate_id: string
          work_date: string
          working_hours: number
          hourly_rate: number
          daily_salary: number
          total_salary: number
          payment_status: string
          payment_method: string
          payment_reference: string
          notes: string
          status: string
          created_at: string
          updated_at: string
        }[]
      }
      soft_delete_user: {
        Args: {
          user_id: string
        }
        Returns: undefined
      }
      update_project_filled_positions: {
        Args: {
          project_id: string
        }
        Returns: undefined
      }
      update_task_position: {
        Args: {
          task_id: string
          new_column_id: string
          new_position: number
        }
        Returns: undefined
      }
      update_working_hours: {
        Args: {
          project_id: string
          staff_id: string
          hours: number
        }
        Returns: undefined
      }
      upsert_staff_working_date: {
        Args: {
          p_project_staff_id: string
          p_candidate_id: string
          p_work_date: string
          p_working_hours?: number
          p_hourly_rate?: number
          p_daily_salary?: number
          p_total_salary?: number
          p_payment_status?: string
          p_payment_method?: string
          p_payment_reference?: string
          p_notes?: string
          p_status?: string
        }
        Returns: Json
      }
      validate_candidate_token: {
        Args: {
          p_token: string
          p_ic_number: string
        }
        Returns: {
          success: boolean
          error: string
          candidate_id: string
          project_id: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const