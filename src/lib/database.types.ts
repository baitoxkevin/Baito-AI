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
          email: string | null
          phone_number: string
          address: string | null
          custom_fields: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          full_name: string
          email?: string | null
          phone_number: string
          address?: string | null
          custom_fields?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          email?: string | null
          phone_number?: string
          address?: string | null
          custom_fields?: Json | null
          created_at?: string
          updated_at?: string
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
    }
    Views: {}
    Functions: {}
    Enums: {}
    CompositeTypes: {}
  }
}