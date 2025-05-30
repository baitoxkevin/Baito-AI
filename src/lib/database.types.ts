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
      "Baito AI": {
        Row: {
          created_at: string
          id: number
        }
        Insert: {
          created_at?: string
          id?: number
        }
        Update: {
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      ban_records: {
        Row: {
          appeal_date: string | null
          appeal_notes: string | null
          appeal_status: Database["public"]["Enums"]["appeal_status"] | null
          ban_date: string
          ban_reason: Database["public"]["Enums"]["ban_reason"]
          banned_by: string | null
          candidate_id: string | null
          created_at: string | null
          detailed_reason: string
          evidence_url: string | null
          id: string
          is_permanent: boolean | null
          reviewed_by: string | null
          updated_at: string | null
        }
        Insert: {
          appeal_date?: string | null
          appeal_notes?: string | null
          appeal_status?: Database["public"]["Enums"]["appeal_status"] | null
          ban_date: string
          ban_reason: Database["public"]["Enums"]["ban_reason"]
          banned_by?: string | null
          candidate_id?: string | null
          created_at?: string | null
          detailed_reason: string
          evidence_url?: string | null
          id?: string
          is_permanent?: boolean | null
          reviewed_by?: string | null
          updated_at?: string | null
        }
        Update: {
          appeal_date?: string | null
          appeal_notes?: string | null
          appeal_status?: Database["public"]["Enums"]["appeal_status"] | null
          ban_date?: string
          ban_reason?: Database["public"]["Enums"]["ban_reason"]
          banned_by?: string | null
          candidate_id?: string | null
          created_at?: string | null
          detailed_reason?: string
          evidence_url?: string | null
          id?: string
          is_permanent?: boolean | null
          reviewed_by?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ban_records_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      benefits: {
        Row: {
          benefit_details: string | null
          benefit_name: string
          benefit_type: Database["public"]["Enums"]["benefit_type"]
          candidate_id: string | null
          created_at: string | null
          expiry_date: string | null
          id: string
          is_active: boolean | null
          start_date: string
        }
        Insert: {
          benefit_details?: string | null
          benefit_name: string
          benefit_type: Database["public"]["Enums"]["benefit_type"]
          candidate_id?: string | null
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          is_active?: boolean | null
          start_date: string
        }
        Update: {
          benefit_details?: string | null
          benefit_name?: string
          benefit_type?: Database["public"]["Enums"]["benefit_type"]
          candidate_id?: string | null
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          is_active?: boolean | null
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "benefits_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_blacklist: {
        Row: {
          candidate_id: string
          created_at: string | null
          id: string
          is_global: boolean | null
          proof_files: Json | null
          reason: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          candidate_id: string
          created_at?: string | null
          id?: string
          is_global?: boolean | null
          proof_files?: Json | null
          reason: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          candidate_id?: string
          created_at?: string | null
          id?: string
          is_global?: boolean | null
          proof_files?: Json | null
          reason?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_blacklist_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_photos: {
        Row: {
          candidate_id: string
          created_at: string | null
          id: string
          is_primary: boolean | null
          photo_order: number | null
          photo_type: string
          photo_url: string
          updated_at: string | null
        }
        Insert: {
          candidate_id: string
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          photo_order?: number | null
          photo_type: string
          photo_url: string
          updated_at?: string | null
        }
        Update: {
          candidate_id?: string
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          photo_order?: number | null
          photo_type?: string
          photo_url?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "candidate_photos_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_project_history: {
        Row: {
          candidate_id: string
          comment: string | null
          completed_at: string
          created_at: string | null
          id: string
          project_id: string
          rating: number | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          candidate_id: string
          comment?: string | null
          completed_at?: string
          created_at?: string | null
          id?: string
          project_id: string
          rating?: number | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          candidate_id?: string
          comment?: string | null
          completed_at?: string
          created_at?: string | null
          id?: string
          project_id?: string
          rating?: number | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_project_history_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_project_history_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_schedule_conflicts: {
        Row: {
          candidate_id: string
          conflict_date: string
          detected_at: string | null
          first_project_id: string
          id: string
          resolution_note: string | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          second_project_id: string
        }
        Insert: {
          candidate_id: string
          conflict_date: string
          detected_at?: string | null
          first_project_id: string
          id?: string
          resolution_note?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          second_project_id: string
        }
        Update: {
          candidate_id?: string
          conflict_date?: string
          detected_at?: string | null
          first_project_id?: string
          id?: string
          resolution_note?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          second_project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_schedule_conflicts_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_schedule_conflicts_first_project_id_fkey"
            columns: ["first_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_schedule_conflicts_second_project_id_fkey"
            columns: ["second_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_verification_logs: {
        Row: {
          candidate_id: string
          client_info: Json | null
          created_at: string
          id: string
          verification_method: string
          verified_at: string
        }
        Insert: {
          candidate_id: string
          client_info?: Json | null
          created_at?: string
          id?: string
          verification_method: string
          verified_at: string
        }
        Update: {
          candidate_id?: string
          client_info?: Json | null
          created_at?: string
          id?: string
          verification_method?: string
          verified_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_verification_logs_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_verification_tokens: {
        Row: {
          candidate_id: string
          client_ip: string | null
          created_at: string
          created_by: string | null
          expires_at: string
          id: string
          token: string
          used_at: string | null
          user_agent: string | null
        }
        Insert: {
          candidate_id: string
          client_ip?: string | null
          created_at?: string
          created_by?: string | null
          expires_at: string
          id?: string
          token: string
          used_at?: string | null
          user_agent?: string | null
        }
        Update: {
          candidate_id?: string
          client_ip?: string | null
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          token?: string
          used_at?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "candidate_verification_tokens_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      candidates: {
        Row: {
          address_business: Json | null
          address_mailing: Json | null
          bank_account_name: string | null
          bank_account_number: string | null
          bank_account_relationship: string | null
          bank_name: string | null
          business_address: string | null
          created_at: string | null
          custom_fields: Json | null
          date_of_birth: string
          email: string
          emergency_contact_name: string
          emergency_contact_number: string
          emergency_contact_relationship: string | null
          field_of_study: string | null
          full_body_photos: Json | null
          full_name: string
          gender: Database["public"]["Enums"]["gender_type"]
          half_body_photos: Json | null
          has_vehicle: boolean | null
          highest_education: string | null
          home_address: string | null
          ic_number: string
          id: string
          is_banned: boolean | null
          languages_spoken: string | null
          nationality: string
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
          address_business?: Json | null
          address_mailing?: Json | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_account_relationship?: string | null
          bank_name?: string | null
          business_address?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          date_of_birth: string
          email: string
          emergency_contact_name: string
          emergency_contact_number: string
          emergency_contact_relationship?: string | null
          field_of_study?: string | null
          full_body_photos?: Json | null
          full_name: string
          gender: Database["public"]["Enums"]["gender_type"]
          half_body_photos?: Json | null
          has_vehicle?: boolean | null
          highest_education?: string | null
          home_address?: string | null
          ic_number: string
          id?: string
          is_banned?: boolean | null
          languages_spoken?: string | null
          nationality: string
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
          address_business?: Json | null
          address_mailing?: Json | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_account_relationship?: string | null
          bank_name?: string | null
          business_address?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          date_of_birth?: string
          email?: string
          emergency_contact_name?: string
          emergency_contact_number?: string
          emergency_contact_relationship?: string | null
          field_of_study?: string | null
          full_body_photos?: Json | null
          full_name?: string
          gender?: Database["public"]["Enums"]["gender_type"]
          half_body_photos?: Json | null
          has_vehicle?: boolean | null
          highest_education?: string | null
          home_address?: string | null
          ic_number?: string
          id?: string
          is_banned?: boolean | null
          languages_spoken?: string | null
          nationality?: string
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
      certifications: {
        Row: {
          candidate_id: string | null
          cert_name: string
          cert_number: string
          cert_url: string | null
          created_at: string | null
          expiry_date: string | null
          id: string
          is_verified: boolean | null
          issue_date: string
          issuing_body: string
        }
        Insert: {
          candidate_id?: string | null
          cert_name: string
          cert_number: string
          cert_url?: string | null
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          is_verified?: boolean | null
          issue_date: string
          issuing_body: string
        }
        Update: {
          candidate_id?: string | null
          cert_name?: string
          cert_number?: string
          cert_url?: string | null
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          is_verified?: boolean | null
          issue_date?: string
          issuing_body?: string
        }
        Relationships: [
          {
            foreignKeyName: "certifications_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          company_name: string | null
          contact_phone: string | null
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          email: string | null
          full_name: string
          id: string
          updated_at: string
        }
        Insert: {
          company_name?: string | null
          contact_phone?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          email?: string | null
          full_name: string
          id?: string
          updated_at?: string
        }
        Update: {
          company_name?: string | null
          contact_phone?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          email?: string | null
          full_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          address: string | null
          company_email: string | null
          company_name: string
          company_phone_no: string
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          id: string
          logo_checked: boolean | null
          logo_status: string | null
          logo_url: string | null
          name: string | null
          parent_id: string | null
          pic_designation: string | null
          pic_email: string | null
          pic_name: string | null
          pic_phone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          company_email?: string | null
          company_name: string
          company_phone_no: string
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          logo_checked?: boolean | null
          logo_status?: string | null
          logo_url?: string | null
          name?: string | null
          parent_id?: string | null
          pic_designation?: string | null
          pic_email?: string | null
          pic_name?: string | null
          pic_phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          company_email?: string | null
          company_name?: string
          company_phone_no?: string
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          logo_checked?: boolean | null
          logo_status?: string | null
          logo_url?: string | null
          name?: string | null
          parent_id?: string | null
          pic_designation?: string | null
          pic_email?: string | null
          pic_name?: string | null
          pic_phone?: string | null
          updated_at?: string | null
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
          company_id: string
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
          company_id: string
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
          company_id?: string
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
      company_logs: {
        Row: {
          action: string | null
          company_id: string | null
          created_at: string | null
          details: Json | null
          id: string
        }
        Insert: {
          action?: string | null
          company_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
        }
        Update: {
          action?: string | null
          company_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      crew_assignments: {
        Row: {
          assigned_at: string | null
          assigned_to: string | null
          created_at: string | null
          id: string
          is_supervisor: boolean | null
          position_number: number
          project_id: string | null
          status: string
          supervisor_id: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_to?: string | null
          created_at?: string | null
          id?: string
          is_supervisor?: boolean | null
          position_number: number
          project_id?: string | null
          status?: string
          supervisor_id?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_to?: string | null
          created_at?: string | null
          id?: string
          is_supervisor?: boolean | null
          position_number?: number
          project_id?: string | null
          status?: string
          supervisor_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crew_assignments_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crew_assignments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crew_assignments_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      csrf_tokens: {
        Row: {
          created_at: string | null
          id: string
          session_id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          session_id: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          session_id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          created_at: string | null
          document_name: string | null
          error_message: string | null
          file_path: string | null
          file_size: number | null
          id: string
          last_processed_at: string | null
          metadata: Json | null
          mime_type: string | null
          retry_count: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          document_name?: string | null
          error_message?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          last_processed_at?: string | null
          metadata?: Json | null
          mime_type?: string | null
          retry_count?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          document_name?: string | null
          error_message?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          last_processed_at?: string | null
          metadata?: Json | null
          mime_type?: string | null
          retry_count?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      expense_claims: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          created_by: string | null
          description: string | null
          expense_date: string
          id: string
          project_id: string | null
          receipt_number: string
          staff_id: string | null
          status: string
          submitted_at: string | null
          submitted_by: string | null
          title: string
          total_amount: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount?: number
          category: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          expense_date: string
          id?: string
          project_id?: string | null
          receipt_number: string
          staff_id?: string | null
          status?: string
          submitted_at?: string | null
          submitted_by?: string | null
          title: string
          total_amount?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          expense_date?: string
          id?: string
          project_id?: string | null
          receipt_number?: string
          staff_id?: string | null
          status?: string
          submitted_at?: string | null
          submitted_by?: string | null
          title?: string
          total_amount?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expense_claims_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_claims_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      experience: {
        Row: {
          candidate_id: string | null
          certification_url: string | null
          created_at: string | null
          id: string
          is_verified: boolean | null
          skill_name: string
          years_experience: number
        }
        Insert: {
          candidate_id?: string | null
          certification_url?: string | null
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          skill_name: string
          years_experience: number
        }
        Update: {
          candidate_id?: string | null
          certification_url?: string | null
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          skill_name?: string
          years_experience?: number
        }
        Relationships: [
          {
            foreignKeyName: "experience_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      fix_logs: {
        Row: {
          action: string | null
          created_at: string | null
          entity_id: string | null
          id: string
        }
        Insert: {
          action?: string | null
          created_at?: string | null
          entity_id?: string | null
          id?: string
        }
        Update: {
          action?: string | null
          created_at?: string | null
          entity_id?: string | null
          id?: string
        }
        Relationships: []
      }
      gig_attendance: {
        Row: {
          attendance_status: Database["public"]["Enums"]["attendance_status"]
          check_in_latitude: number | null
          check_in_longitude: number | null
          check_in_photo_url: string | null
          check_in_time: string | null
          check_out_latitude: number | null
          check_out_longitude: number | null
          check_out_photo_url: string | null
          check_out_time: string | null
          gig_history_id: string | null
          id: string
          remarks: string | null
        }
        Insert: {
          attendance_status: Database["public"]["Enums"]["attendance_status"]
          check_in_latitude?: number | null
          check_in_longitude?: number | null
          check_in_photo_url?: string | null
          check_in_time?: string | null
          check_out_latitude?: number | null
          check_out_longitude?: number | null
          check_out_photo_url?: string | null
          check_out_time?: string | null
          gig_history_id?: string | null
          id?: string
          remarks?: string | null
        }
        Update: {
          attendance_status?: Database["public"]["Enums"]["attendance_status"]
          check_in_latitude?: number | null
          check_in_longitude?: number | null
          check_in_photo_url?: string | null
          check_in_time?: string | null
          check_out_latitude?: number | null
          check_out_longitude?: number | null
          check_out_photo_url?: string | null
          check_out_time?: string | null
          gig_history_id?: string | null
          id?: string
          remarks?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gig_attendance_gig_history_id_fkey"
            columns: ["gig_history_id"]
            isOneToOne: false
            referencedRelation: "gig_history"
            referencedColumns: ["id"]
          },
        ]
      }
      gig_feedback: {
        Row: {
          areas_of_improvement: string | null
          attitude_rating: number | null
          client_feedback: string | null
          created_at: string | null
          gig_history_id: string | null
          id: string
          performance_rating: number | null
          presentation_rating: number | null
          punctuality_rating: number | null
          recommended_for_future: boolean | null
          supervisor_comments: string | null
        }
        Insert: {
          areas_of_improvement?: string | null
          attitude_rating?: number | null
          client_feedback?: string | null
          created_at?: string | null
          gig_history_id?: string | null
          id?: string
          performance_rating?: number | null
          presentation_rating?: number | null
          punctuality_rating?: number | null
          recommended_for_future?: boolean | null
          supervisor_comments?: string | null
        }
        Update: {
          areas_of_improvement?: string | null
          attitude_rating?: number | null
          client_feedback?: string | null
          created_at?: string | null
          gig_history_id?: string | null
          id?: string
          performance_rating?: number | null
          presentation_rating?: number | null
          punctuality_rating?: number | null
          recommended_for_future?: boolean | null
          supervisor_comments?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gig_feedback_gig_history_id_fkey"
            columns: ["gig_history_id"]
            isOneToOne: false
            referencedRelation: "gig_history"
            referencedColumns: ["id"]
          },
        ]
      }
      gig_history: {
        Row: {
          base_pay_rate: number
          candidate_id: string | null
          client_name: string
          created_at: string | null
          dress_code: string | null
          end_time: string
          event_id: string | null
          event_name: string
          gig_date: string
          gig_type: string
          id: string
          location: string
          overtime_eligible: boolean | null
          special_requirements: string | null
          start_time: string
          status: string
          supervisor_name: string | null
        }
        Insert: {
          base_pay_rate: number
          candidate_id?: string | null
          client_name: string
          created_at?: string | null
          dress_code?: string | null
          end_time: string
          event_id?: string | null
          event_name: string
          gig_date: string
          gig_type: string
          id?: string
          location: string
          overtime_eligible?: boolean | null
          special_requirements?: string | null
          start_time: string
          status: string
          supervisor_name?: string | null
        }
        Update: {
          base_pay_rate?: number
          candidate_id?: string | null
          client_name?: string
          created_at?: string | null
          dress_code?: string | null
          end_time?: string
          event_id?: string | null
          event_name?: string
          gig_date?: string
          gig_type?: string
          id?: string
          location?: string
          overtime_eligible?: boolean | null
          special_requirements?: string | null
          start_time?: string
          status?: string
          supervisor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gig_history_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gig_history_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      gig_payments: {
        Row: {
          base_amount: number
          bonus_amount: number | null
          bonus_reason: string | null
          created_at: string | null
          gig_history_id: string | null
          id: string
          meal_allowance: number | null
          overtime_amount: number | null
          overtime_hours: number | null
          payment_date: string | null
          payment_reference: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          total_amount: number
          transport_allowance: number | null
        }
        Insert: {
          base_amount: number
          bonus_amount?: number | null
          bonus_reason?: string | null
          created_at?: string | null
          gig_history_id?: string | null
          id?: string
          meal_allowance?: number | null
          overtime_amount?: number | null
          overtime_hours?: number | null
          payment_date?: string | null
          payment_reference?: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          total_amount: number
          transport_allowance?: number | null
        }
        Update: {
          base_amount?: number
          bonus_amount?: number | null
          bonus_reason?: string | null
          created_at?: string | null
          gig_history_id?: string | null
          id?: string
          meal_allowance?: number | null
          overtime_amount?: number | null
          overtime_hours?: number | null
          payment_date?: string | null
          payment_reference?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          total_amount?: number
          transport_allowance?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "gig_payments_gig_history_id_fkey"
            columns: ["gig_history_id"]
            isOneToOne: false
            referencedRelation: "gig_history"
            referencedColumns: ["id"]
          },
        ]
      }
      gig_tasks: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          assigned_to: string | null
          board_id: string | null
          column_id: string | null
          completed: boolean | null
          completed_at: string | null
          completion_notes: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          end_time: string | null
          estimated_hours: number | null
          gig_history_id: string | null
          id: string
          labels: Json | null
          metadata: Json | null
          position: number | null
          priority: string | null
          project_id: string | null
          start_time: string | null
          status: string | null
          task_description: string | null
          task_name: string
          title: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          assigned_to?: string | null
          board_id?: string | null
          column_id?: string | null
          completed?: boolean | null
          completed_at?: string | null
          completion_notes?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          end_time?: string | null
          estimated_hours?: number | null
          gig_history_id?: string | null
          id?: string
          labels?: Json | null
          metadata?: Json | null
          position?: number | null
          priority?: string | null
          project_id?: string | null
          start_time?: string | null
          status?: string | null
          task_description?: string | null
          task_name: string
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          assigned_to?: string | null
          board_id?: string | null
          column_id?: string | null
          completed?: boolean | null
          completed_at?: string | null
          completion_notes?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          end_time?: string | null
          estimated_hours?: number | null
          gig_history_id?: string | null
          id?: string
          labels?: Json | null
          metadata?: Json | null
          position?: number | null
          priority?: string | null
          project_id?: string | null
          start_time?: string | null
          status?: string | null
          task_description?: string | null
          task_name?: string
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gig_tasks_gig_history_id_fkey"
            columns: ["gig_history_id"]
            isOneToOne: false
            referencedRelation: "gig_history"
            referencedColumns: ["id"]
          },
        ]
      }
      invites: {
        Row: {
          company_id: string | null
          created_at: string | null
          created_by: string
          email: string
          expires_at: string
          id: string
          role: string
          status: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          created_by: string
          email: string
          expires_at: string
          id?: string
          role: string
          status?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
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
          {
            foreignKeyName: "invites_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      ip_blacklist: {
        Row: {
          blocked_at: string | null
          blocked_by: string | null
          expires_at: string | null
          id: string
          ip_address: string
          metadata: Json | null
          reason: string
          severity: string | null
        }
        Insert: {
          blocked_at?: string | null
          blocked_by?: string | null
          expires_at?: string | null
          id?: string
          ip_address: string
          metadata?: Json | null
          reason: string
          severity?: string | null
        }
        Update: {
          blocked_at?: string | null
          blocked_by?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: string
          metadata?: Json | null
          reason?: string
          severity?: string | null
        }
        Relationships: []
      }
      kanban_boards: {
        Row: {
          columns: Json | null
          created_at: string | null
          id: number
          name: string
          project_id: string | null
          updated_at: string | null
        }
        Insert: {
          columns?: Json | null
          created_at?: string | null
          id?: never
          name?: string
          project_id?: string | null
          updated_at?: string | null
        }
        Update: {
          columns?: Json | null
          created_at?: string | null
          id?: never
          name?: string
          project_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kanban_boards_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      language_proficiency: {
        Row: {
          candidate_id: string | null
          id: string
          is_primary: boolean | null
          language: string
          last_updated: string | null
          proficiency_level: Database["public"]["Enums"]["proficiency_level"]
        }
        Insert: {
          candidate_id?: string | null
          id?: string
          is_primary?: boolean | null
          language: string
          last_updated?: string | null
          proficiency_level: Database["public"]["Enums"]["proficiency_level"]
        }
        Update: {
          candidate_id?: string | null
          id?: string
          is_primary?: boolean | null
          language?: string
          last_updated?: string | null
          proficiency_level?: Database["public"]["Enums"]["proficiency_level"]
        }
        Relationships: [
          {
            foreignKeyName: "language_proficiency_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      location_preferences: {
        Row: {
          candidate_id: string | null
          current_address: string | null
          current_latitude: number | null
          current_longitude: number | null
          id: string
          last_location_update: string | null
          preferred_working_zones: Json | null
          public_transport_dependent: boolean | null
          transport_notes: string | null
        }
        Insert: {
          candidate_id?: string | null
          current_address?: string | null
          current_latitude?: number | null
          current_longitude?: number | null
          id?: string
          last_location_update?: string | null
          preferred_working_zones?: Json | null
          public_transport_dependent?: boolean | null
          transport_notes?: string | null
        }
        Update: {
          candidate_id?: string | null
          current_address?: string | null
          current_latitude?: number | null
          current_longitude?: number | null
          id?: string
          last_location_update?: string | null
          preferred_working_zones?: Json | null
          public_transport_dependent?: boolean | null
          transport_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "location_preferences_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_status: {
        Row: {
          candidate_id: string | null
          current_points: number | null
          fast_track_eligible: boolean | null
          id: string
          last_updated: string | null
          points_expiry_date: string | null
          tier_achieved_date: string
          tier_level: Database["public"]["Enums"]["loyalty_tier"]
          total_gigs_completed: number | null
        }
        Insert: {
          candidate_id?: string | null
          current_points?: number | null
          fast_track_eligible?: boolean | null
          id?: string
          last_updated?: string | null
          points_expiry_date?: string | null
          tier_achieved_date: string
          tier_level: Database["public"]["Enums"]["loyalty_tier"]
          total_gigs_completed?: number | null
        }
        Update: {
          candidate_id?: string | null
          current_points?: number | null
          fast_track_eligible?: boolean | null
          id?: string
          last_updated?: string | null
          points_expiry_date?: string | null
          tier_achieved_date?: string
          tier_level?: Database["public"]["Enums"]["loyalty_tier"]
          total_gigs_completed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_status_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      measurements: {
        Row: {
          candidate_id: string | null
          chest_cm: number | null
          height_cm: number
          hip_cm: number | null
          id: string
          inseam_cm: number | null
          last_updated: string | null
          neck_cm: number | null
          shirt_size: string
          shoe_size: string
          shoulder_cm: number | null
          waist_cm: number | null
          weight_kg: number
        }
        Insert: {
          candidate_id?: string | null
          chest_cm?: number | null
          height_cm: number
          hip_cm?: number | null
          id?: string
          inseam_cm?: number | null
          last_updated?: string | null
          neck_cm?: number | null
          shirt_size: string
          shoe_size: string
          shoulder_cm?: number | null
          waist_cm?: number | null
          weight_kg: number
        }
        Update: {
          candidate_id?: string | null
          chest_cm?: number | null
          height_cm?: number
          hip_cm?: number | null
          id?: string
          inseam_cm?: number | null
          last_updated?: string | null
          neck_cm?: number | null
          shirt_size?: string
          shoe_size?: string
          shoulder_cm?: number | null
          waist_cm?: number | null
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "measurements_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      milestone_achievements: {
        Row: {
          achieved_date: string
          candidate_id: string | null
          created_at: string | null
          gigs_count: number | null
          id: string
          milestone_name: string
          milestone_type: Database["public"]["Enums"]["milestone_type"]
          reward_claimed: boolean | null
          reward_details: string | null
        }
        Insert: {
          achieved_date: string
          candidate_id?: string | null
          created_at?: string | null
          gigs_count?: number | null
          id?: string
          milestone_name: string
          milestone_type: Database["public"]["Enums"]["milestone_type"]
          reward_claimed?: boolean | null
          reward_details?: string | null
        }
        Update: {
          achieved_date?: string
          candidate_id?: string | null
          created_at?: string | null
          gigs_count?: number | null
          id?: string
          milestone_name?: string
          milestone_type?: Database["public"]["Enums"]["milestone_type"]
          reward_claimed?: boolean | null
          reward_details?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "milestone_achievements_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_batches: {
        Row: {
          batch_reference: string
          company_bank_account: string
          company_name: string
          company_registration_number: string
          created_at: string | null
          created_by: string | null
          id: string
          notes: string | null
          payment_date: string
          payment_method: string
          payments: Json
          project_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          batch_reference: string
          company_bank_account: string
          company_name: string
          company_registration_number: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          payment_date: string
          payment_method: string
          payments: Json
          project_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          batch_reference?: string
          company_bank_account?: string
          company_name?: string
          company_registration_number?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string
          payments?: Json
          project_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      performance_metrics: {
        Row: {
          avg_rating: number | null
          candidate_id: string | null
          category_ratings: Json | null
          early_terminations: number | null
          id: string
          last_updated: string | null
          late_arrivals: number | null
          no_shows: number | null
          reliability_score: number | null
          response_rate: number | null
          total_gigs_completed: number | null
        }
        Insert: {
          avg_rating?: number | null
          candidate_id?: string | null
          category_ratings?: Json | null
          early_terminations?: number | null
          id?: string
          last_updated?: string | null
          late_arrivals?: number | null
          no_shows?: number | null
          reliability_score?: number | null
          response_rate?: number | null
          total_gigs_completed?: number | null
        }
        Update: {
          avg_rating?: number | null
          candidate_id?: string | null
          category_ratings?: Json | null
          early_terminations?: number | null
          id?: string
          last_updated?: string | null
          late_arrivals?: number | null
          no_shows?: number | null
          reliability_score?: number | null
          response_rate?: number | null
          total_gigs_completed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "performance_metrics_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      photos: {
        Row: {
          candidate_id: string | null
          full_body_url: string | null
          half_body_url: string | null
          id: string
          is_verified: boolean | null
          profile_photo_url: string
          upload_date: string | null
        }
        Insert: {
          candidate_id?: string | null
          full_body_url?: string | null
          half_body_url?: string | null
          id?: string
          is_verified?: boolean | null
          profile_photo_url: string
          upload_date?: string | null
        }
        Update: {
          candidate_id?: string | null
          full_body_url?: string | null
          half_body_url?: string | null
          id?: string
          is_verified?: boolean | null
          profile_photo_url?: string
          upload_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "photos_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      physical_capabilities: {
        Row: {
          candidate_id: string | null
          capability_type: string
          id: string
          is_capable: boolean
          notes: string | null
        }
        Insert: {
          candidate_id?: string | null
          capability_type: string
          id?: string
          is_capable: boolean
          notes?: string | null
        }
        Update: {
          candidate_id?: string | null
          capability_type?: string
          id?: string
          is_capable?: boolean
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "physical_capabilities_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      project_changes: {
        Row: {
          change_reason: string | null
          changed_by: string | null
          created_at: string | null
          field_name: string
          id: string
          new_value: string | null
          old_value: string | null
          project_id: string
        }
        Insert: {
          change_reason?: string | null
          changed_by?: string | null
          created_at?: string | null
          field_name: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          project_id: string
        }
        Update: {
          change_reason?: string | null
          changed_by?: string | null
          created_at?: string | null
          field_name?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_changes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_docs_new: {
        Row: {
          created_at: string | null
          description: string | null
          file_name: string
          file_path: string | null
          file_size: number | null
          file_type: string | null
          file_url: string | null
          id: string
          project_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          file_name: string
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          project_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          file_name?: string
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          project_id?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      project_documents: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          description: string | null
          file_name: string
          file_path: string | null
          file_size: number | null
          file_type: string
          file_url: string | null
          id: number
          is_link: boolean | null
          is_video: boolean | null
          project_id: string
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          file_name: string
          file_path?: string | null
          file_size?: number | null
          file_type: string
          file_url?: string | null
          id?: never
          is_link?: boolean | null
          is_video?: boolean | null
          project_id: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          file_name?: string
          file_path?: string | null
          file_size?: number | null
          file_type?: string
          file_url?: string | null
          id?: never
          is_link?: boolean | null
          is_video?: boolean | null
          project_id?: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: []
      }
      project_documents_simple: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          description: string | null
          file_name: string
          file_path: string | null
          file_size: number | null
          file_type: string | null
          file_url: string | null
          id: number
          is_link: boolean | null
          is_video: boolean | null
          project_id: string
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          file_name: string
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: number
          is_link?: boolean | null
          is_video?: boolean | null
          project_id: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          file_name?: string
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: number
          is_link?: boolean | null
          is_video?: boolean | null
          project_id?: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: []
      }
      project_field_labels: {
        Row: {
          description: string | null
          display_name: string
          field_name: string
          importance: string | null
        }
        Insert: {
          description?: string | null
          display_name: string
          field_name: string
          importance?: string | null
        }
        Update: {
          description?: string | null
          display_name?: string
          field_name?: string
          importance?: string | null
        }
        Relationships: []
      }
      project_staff: {
        Row: {
          apply_type: string | null
          candidate_id: string | null
          created_at: string
          designation: string | null
          id: string
          name: string
          photo: string | null
          project_id: string
          working_dates: string[] | null
          working_dates_with_salary: Json | null
        }
        Insert: {
          apply_type?: string | null
          candidate_id?: string | null
          created_at?: string
          designation?: string | null
          id?: string
          name: string
          photo?: string | null
          project_id: string
          working_dates?: string[] | null
          working_dates_with_salary?: Json | null
        }
        Update: {
          apply_type?: string | null
          candidate_id?: string | null
          created_at?: string
          designation?: string | null
          id?: string
          name?: string
          photo?: string | null
          project_id?: string
          working_dates?: string[] | null
          working_dates_with_salary?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "project_staff_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
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
          applicants: Json | null
          brand_logo: string | null
          brand_name: string | null
          breaks: Json | null
          budget: number | null
          client_id: string | null
          color: string | null
          confirmed_staff: Json | null
          created_at: string | null
          crew_count: number
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          end_date: string | null
          event_type: string
          filled_positions: number
          id: string
          invoice_number: string | null
          manager_id: string | null
          priority: string
          project_type: string | null
          recurrence_days: Json | null
          schedule_type: string | null
          start_date: string
          status: string
          supervisors_required: number
          title: string
          updated_at: string | null
          venue_address: string
          venue_details: string | null
          working_hours_end: string
          working_hours_start: string
        }
        Insert: {
          applicants?: Json | null
          brand_logo?: string | null
          brand_name?: string | null
          breaks?: Json | null
          budget?: number | null
          client_id?: string | null
          color?: string | null
          confirmed_staff?: Json | null
          created_at?: string | null
          crew_count?: number
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          end_date?: string | null
          event_type: string
          filled_positions?: number
          id?: string
          invoice_number?: string | null
          manager_id?: string | null
          priority?: string
          project_type?: string | null
          recurrence_days?: Json | null
          schedule_type?: string | null
          start_date: string
          status?: string
          supervisors_required?: number
          title: string
          updated_at?: string | null
          venue_address: string
          venue_details?: string | null
          working_hours_end: string
          working_hours_start: string
        }
        Update: {
          applicants?: Json | null
          brand_logo?: string | null
          brand_name?: string | null
          breaks?: Json | null
          budget?: number | null
          client_id?: string | null
          color?: string | null
          confirmed_staff?: Json | null
          created_at?: string | null
          crew_count?: number
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          end_date?: string | null
          event_type?: string
          filled_positions?: number
          id?: string
          invoice_number?: string | null
          manager_id?: string | null
          priority?: string
          project_type?: string | null
          recurrence_days?: Json | null
          schedule_type?: string | null
          start_date?: string
          status?: string
          supervisors_required?: number
          title?: string
          updated_at?: string | null
          venue_address?: string
          venue_details?: string | null
          working_hours_end?: string
          working_hours_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      projects_ai_context: {
        Row: {
          content: string
          context_type: string
          created_at: string | null
          id: string
          project_id: string
          related_change_id: string | null
          source: string | null
        }
        Insert: {
          content: string
          context_type: string
          created_at?: string | null
          id?: string
          project_id: string
          related_change_id?: string | null
          source?: string | null
        }
        Update: {
          content?: string
          context_type?: string
          created_at?: string | null
          id?: string
          project_id?: string
          related_change_id?: string | null
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_ai_context_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_ai_context_related_change_id_fkey"
            columns: ["related_change_id"]
            isOneToOne: false
            referencedRelation: "project_changes"
            referencedColumns: ["id"]
          },
        ]
      }
      receipts: {
        Row: {
          amount: number | null
          amount_cents: number | null
          category: string | null
          content_type: string | null
          created_at: string | null
          currency: string | null
          date: string | null
          description: string | null
          expense_claim_id: string
          file_size: number | null
          filename: string
          id: string
          metadata: Json | null
          processed_at: string | null
          receipt_date: string | null
          status: string | null
          tax_cents: number | null
          updated_at: string | null
          uploaded_by: string | null
          url: string
          vendor: string | null
          vendor_id: string | null
        }
        Insert: {
          amount?: number | null
          amount_cents?: number | null
          category?: string | null
          content_type?: string | null
          created_at?: string | null
          currency?: string | null
          date?: string | null
          description?: string | null
          expense_claim_id: string
          file_size?: number | null
          filename: string
          id?: string
          metadata?: Json | null
          processed_at?: string | null
          receipt_date?: string | null
          status?: string | null
          tax_cents?: number | null
          updated_at?: string | null
          uploaded_by?: string | null
          url: string
          vendor?: string | null
          vendor_id?: string | null
        }
        Update: {
          amount?: number | null
          amount_cents?: number | null
          category?: string | null
          content_type?: string | null
          created_at?: string | null
          currency?: string | null
          date?: string | null
          description?: string | null
          expense_claim_id?: string
          file_size?: number | null
          filename?: string
          id?: string
          metadata?: Json | null
          processed_at?: string | null
          receipt_date?: string | null
          status?: string | null
          tax_cents?: number | null
          updated_at?: string | null
          uploaded_by?: string | null
          url?: string
          vendor?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "receipts_expense_claim_id_fkey"
            columns: ["expense_claim_id"]
            isOneToOne: false
            referencedRelation: "expense_claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      security_audit_logs: {
        Row: {
          candidate_id: string | null
          details: Json
          event_type: string
          id: string
          ip_address: string | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string | null
          timestamp: string | null
          user_agent: string | null
        }
        Insert: {
          candidate_id?: string | null
          details?: Json
          event_type: string
          id?: string
          ip_address?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          timestamp?: string | null
          user_agent?: string | null
        }
        Update: {
          candidate_id?: string | null
          details?: Json
          event_type?: string
          id?: string
          ip_address?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          timestamp?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_audit_logs_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      security_rate_limits: {
        Row: {
          action: string
          attempt_metadata: Json | null
          created_at: string | null
          id: string
          identifier: string
          locked_until: string | null
        }
        Insert: {
          action: string
          attempt_metadata?: Json | null
          created_at?: string | null
          id?: string
          identifier: string
          locked_until?: string | null
        }
        Update: {
          action?: string
          attempt_metadata?: Json | null
          created_at?: string | null
          id?: string
          identifier?: string
          locked_until?: string | null
        }
        Relationships: []
      }
      system_logs: {
        Row: {
          action: string | null
          created_at: string | null
          id: string
          record_id: string | null
          table_name: string | null
        }
        Insert: {
          action?: string | null
          created_at?: string | null
          id?: string
          record_id?: string | null
          table_name?: string | null
        }
        Update: {
          action?: string | null
          created_at?: string | null
          id?: string
          record_id?: string | null
          table_name?: string | null
        }
        Relationships: []
      }
      task_templates: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          is_global: boolean | null
          name: string
          template: Json | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: never
          is_global?: boolean | null
          name: string
          template?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: never
          is_global?: boolean | null
          name?: string
          template?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      token_access_attempts: {
        Row: {
          attempted_at: string
          candidate_id: string
          id: number
          ip_address: string | null
          token_used: string | null
          user_agent: string | null
          was_successful: boolean
        }
        Insert: {
          attempted_at?: string
          candidate_id: string
          id?: number
          ip_address?: string | null
          token_used?: string | null
          user_agent?: string | null
          was_successful?: boolean
        }
        Update: {
          attempted_at?: string
          candidate_id?: string
          id?: number
          ip_address?: string | null
          token_used?: string | null
          user_agent?: string | null
          was_successful?: boolean
        }
        Relationships: []
      }
      users: {
        Row: {
          company_name: string | null
          contact_phone: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          is_super_admin: boolean | null
          raw_app_meta_data: Json | null
          raw_user_meta_data: Json | null
          role: Database["public"]["Enums"]["userrole"]
          updated_at: string | null
          username: string
        }
        Insert: {
          company_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id: string
          is_super_admin?: boolean | null
          raw_app_meta_data?: Json | null
          raw_user_meta_data?: Json | null
          role: Database["public"]["Enums"]["userrole"]
          updated_at?: string | null
          username?: string
        }
        Update: {
          company_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          is_super_admin?: boolean | null
          raw_app_meta_data?: Json | null
          raw_user_meta_data?: Json | null
          role?: Database["public"]["Enums"]["userrole"]
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      crew_assignments_with_supervisors: {
        Row: {
          assigned_at: string | null
          assigned_to: string | null
          created_at: string | null
          crew_member_email: string | null
          crew_member_experience: number | null
          crew_member_name: string | null
          id: string | null
          is_supervisor: boolean | null
          position_number: number | null
          project_id: string | null
          status: string | null
          supervisor_email: string | null
          supervisor_experience: number | null
          supervisor_id: string | null
          supervisor_name: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crew_assignments_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crew_assignments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crew_assignments_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      add_staff_to_project: {
        Args: {
          p_project_id: string
          p_staff_data: Json
          p_staff_type?: string
        }
        Returns: boolean
      }
      apply_project_changes: {
        Args: { p_project_id: string }
        Returns: Json
      }
      backfill_project_staff_candidate_ids: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      batch_check_candidate_availability: {
        Args: { p_candidate_id: string; p_check_dates: string[] }
        Returns: {
          check_date: string
          is_available: boolean
          conflict_project_id: string
          conflict_project_title: string
        }[]
      }
      bypass_rls_update_project: {
        Args:
          | {
              p_project_id: string
              p_title?: string
              p_status?: string
              p_priority?: string
              p_start_date?: string
              p_end_date?: string
              p_venue_address?: string
              p_event_type?: string
              p_working_hours_start?: string
              p_working_hours_end?: string
            }
          | { project_id: string; project_data: Json }
        Returns: Json
      }
      check_candidate_availability: {
        Args: {
          p_candidate_id: string
          p_project_id: string
          p_start_date: string
          p_end_date: string
        }
        Returns: boolean
      }
      check_candidate_exists: {
        Args: { p_candidate_id: string }
        Returns: {
          exists_in_db: boolean
          id: string
          full_name: string
          rls_active: boolean
        }[]
      }
      check_candidate_schedule_conflicts: {
        Args: {
          p_candidate_id: string
          p_working_dates: string[]
          p_exclude_project_id?: string
        }
        Returns: {
          date: string
          project_id: string
          project_title: string
        }[]
      }
      check_candidate_verification_token: {
        Args: { p_token: string }
        Returns: {
          candidate_id: string
          full_name: string
          email: string
          phone_number: string
          gender: Database["public"]["Enums"]["gender_type"]
          ic_number: string
          nationality: string
          date_of_birth: string
          emergency_contact_name: string
          emergency_contact_number: string
          custom_fields: Json
          profile_photo: string
        }[]
      }
      check_suspicious_activity: {
        Args: { p_identifier: string; p_window_minutes?: number }
        Returns: {
          is_suspicious: boolean
          risk_score: number
          reasons: string[]
        }[]
      }
      check_table_exists: {
        Args: { table_name: string }
        Returns: boolean
      }
      cleanup_expired_csrf_tokens: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_old_rate_limits: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_security_data: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      direct_insert_document: {
        Args: {
          p_project_id: string
          p_file_name: string
          p_file_type: string
          p_file_path: string
          p_file_url: string
          p_file_size: number
          p_description: string
          p_uploaded_by: string
        }
        Returns: Json
      }
      emergency_update_project: {
        Args: {
          p_project_id: string
          p_title: string
          p_start_date: string
          p_end_date: string
          p_venue_address?: string
          p_event_type?: string
        }
        Returns: string
      }
      emergency_update_project_v2: {
        Args: {
          project_id: string
          title?: string
          status?: string
          priority?: string
          start_date?: string
          end_date?: string
          venue_address?: string
          event_type?: string
        }
        Returns: Json
      }
      extract_working_dates: {
        Args: { dates_with_salary: Json }
        Returns: string[]
      }
      fix_dates_for_project: {
        Args: { p_project_id: string; p_start_date: string; p_end_date: string }
        Returns: string
      }
      fix_malformed_project_dates: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      fix_project_by_id: {
        Args: { p_project_id: string }
        Returns: Json
      }
      fix_project_edit_form: {
        Args: { p_project_id: string; p_project_data: Json }
        Returns: Json
      }
      fix_project_staff_arrays: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      format_ic_number: {
        Args: { p_ic_number: string }
        Returns: string
      }
      generate_candidate_update_link: {
        Args: { p_candidate_id: string; p_base_url?: string }
        Returns: string
      }
      generate_candidate_update_url: {
        Args: { p_candidate_id: string }
        Returns: string
      }
      generate_candidate_verification_token: {
        Args: {
          p_candidate_id: string
          p_created_by?: string
          p_expiration_hours?: number
        }
        Returns: string
      }
      generate_candidate_verification_token_minutes: {
        Args: {
          p_candidate_id: string
          p_created_by?: string
          p_expiration_minutes?: number
        }
        Returns: string
      }
      get_available_candidates_on_date: {
        Args: { p_date: string }
        Returns: {
          candidate_id: string
          full_name: string
          ic_number: string
          phone_number: string
        }[]
      }
      get_candidate_by_id_string: {
        Args: { p_candidate_id: string }
        Returns: Json
      }
      get_candidate_data_by_token: {
        Args: { p_candidate_id: string; p_ic_number?: string; p_token?: string }
        Returns: {
          id: string
          full_name: string
          email: string
          phone_number: string
          gender: Database["public"]["Enums"]["gender_type"]
          ic_number: string
          nationality: string
          date_of_birth: string
          emergency_contact_name: string
          emergency_contact_number: string
          has_vehicle: boolean
          bank_name: string
          bank_account_number: string
          highest_education: string
          custom_fields: Json
          profile_photo: string
          created_at: string
          updated_at: string
        }[]
      }
      get_candidate_data_secure: {
        Args: { p_candidate_id: string; p_token?: string; p_ic_number?: string }
        Returns: Json
      }
      get_candidate_name: {
        Args: { candidate_id: string }
        Returns: string
      }
      get_candidate_verification_info: {
        Args: { p_candidate_id: string }
        Returns: Json
      }
      get_payroll_by_date_range: {
        Args: { p_start_date: string; p_end_date: string }
        Returns: {
          project_id: string
          project_title: string
          staff_id: string
          staff_name: string
          work_date: string
          basic_salary: number
          claims: number
          commission: number
          total_amount: number
        }[]
      }
      get_project_staff_counts: {
        Args: { project_id: string }
        Returns: Json
      }
      insert_activity_log: {
        Args: {
          p_project_id: string
          p_activity_type: string
          p_action: string
          p_description: string
          p_details?: Json
          p_user_id?: string
          p_session_id?: string
        }
        Returns: string
      }
      insert_document_bypass: {
        Args: { doc_data: Json }
        Returns: Json
      }
      is_candidate_available: {
        Args: { p_candidate_id: string; p_check_date: string }
        Returns: boolean
      }
      is_valid_malaysian_ic: {
        Args: { p_ic_number: string }
        Returns: boolean
      }
      log_candidate_schedule_conflict: {
        Args: {
          p_candidate_id: string
          p_conflict_date: string
          p_first_project_id: string
          p_second_project_id: string
          p_note?: string
        }
        Returns: string
      }
      process_project_staff_arrays: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      public_validate_candidate_auth: {
        Args: { candidate_id: string; auth_code: string }
        Returns: {
          is_valid: boolean
          message: string
        }[]
      }
      resolve_candidate_schedule_conflict: {
        Args: { p_conflict_id: string; p_resolution_note?: string }
        Returns: boolean
      }
      save_project_payroll: {
        Args: { p_project_id: string; p_staff_payroll: Json }
        Returns: boolean
      }
      save_staff_payroll: {
        Args: { p_staff_id: string; p_working_dates_with_salary: Json }
        Returns: boolean
      }
      standardize_all_ic_numbers: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      submit_payment_batch: {
        Args: {
          p_project_id: string
          p_payment_date: string
          p_batch_reference: string
          p_company_name: string
          p_company_registration_number: string
          p_company_bank_account: string
          p_payment_method: string
          p_payments: string
          p_notes?: string
        }
        Returns: Json
      }
      update_candidate_by_code: {
        Args: { p_candidate_id: string; p_code: string; p_data: Json }
        Returns: boolean
      }
      update_candidate_by_token: {
        Args: { p_candidate_id: string; p_token: string; p_data: Json }
        Returns: boolean
      }
      update_candidate_with_formatted_ic: {
        Args: { p_candidate_id: string; p_data: Json }
        Returns: boolean
      }
      update_project_field: {
        Args: { p_project_id: string; p_field_name: string; p_value: string }
        Returns: Json
      }
      update_project_with_audit: {
        Args: {
          project_id: string
          project_data: Json
          change_description?: string
        }
        Returns: Json
      }
      validate_candidate_token_secure: {
        Args: {
          p_token: string
          p_candidate_id: string
          p_ic_number: string
          p_ip_address?: string
          p_user_agent?: string
        }
        Returns: {
          valid: boolean
          reason: string
          candidate_data: Json
        }[]
      }
      validate_candidate_verification_token: {
        Args: { p_token: string; p_client_ip?: string; p_user_agent?: string }
        Returns: {
          candidate_id: string
          full_name: string
          email: string
          phone_number: string
          gender: Database["public"]["Enums"]["gender_type"]
          ic_number: string
          nationality: string
          date_of_birth: string
          emergency_contact_name: string
          emergency_contact_number: string
          custom_fields: Json
          profile_photo: string
        }[]
      }
      validate_staff_member: {
        Args: { staff_member: Json }
        Returns: Json
      }
      validate_username: {
        Args: { username: string }
        Returns: boolean
      }
      verify_candidate_token: {
        Args: { p_candidate_id: string; p_token: string }
        Returns: boolean
      }
      verify_candidate_with_ic: {
        Args: { p_candidate_id: string; p_ic_number: string }
        Returns: Json
      }
    }
    Enums: {
      appeal_status: "pending" | "approved" | "rejected" | "under_review"
      attendance_status: "present" | "late" | "absent" | "excused"
      ban_reason:
        | "no_show"
        | "misconduct"
        | "poor_performance"
        | "policy_violation"
        | "other"
      benefit_type: "insurance" | "training" | "equipment" | "bonus" | "other"
      gender_type: "male" | "female" | "other"
      loyalty_tier: "bronze" | "silver" | "gold" | "platinum" | "diamond"
      milestone_type:
        | "gigs_completed"
        | "rating_achieved"
        | "years_active"
        | "special"
      payment_status: "pending" | "paid" | "cancelled" | "disputed"
      proficiency_level: "basic" | "intermediate" | "fluent" | "native"
      taskstatus: "backlog" | "todo" | "doing" | "done"
      userrole: "super_admin" | "admin" | "manager" | "client" | "staff"
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
    Enums: {
      appeal_status: ["pending", "approved", "rejected", "under_review"],
      attendance_status: ["present", "late", "absent", "excused"],
      ban_reason: [
        "no_show",
        "misconduct",
        "poor_performance",
        "policy_violation",
        "other",
      ],
      benefit_type: ["insurance", "training", "equipment", "bonus", "other"],
      gender_type: ["male", "female", "other"],
      loyalty_tier: ["bronze", "silver", "gold", "platinum", "diamond"],
      milestone_type: [
        "gigs_completed",
        "rating_achieved",
        "years_active",
        "special",
      ],
      payment_status: ["pending", "paid", "cancelled", "disputed"],
      proficiency_level: ["basic", "intermediate", "fluent", "native"],
      taskstatus: ["backlog", "todo", "doing", "done"],
      userrole: ["super_admin", "admin", "manager", "client", "staff"],
    },
  },
} as const
