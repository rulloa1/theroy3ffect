export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      automation_jobs: {
        Row: {
          consecutive_failures: number
          items_processed: number
          job_key: string
          last_error: string | null
          last_run_at: string | null
          lease_expires_at: string | null
          lease_owner: string | null
          paused_reason: string | null
          status: string
          updated_at: string
        }
        Insert: {
          consecutive_failures?: number
          items_processed?: number
          job_key: string
          last_error?: string | null
          last_run_at?: string | null
          lease_expires_at?: string | null
          lease_owner?: string | null
          paused_reason?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          consecutive_failures?: number
          items_processed?: number
          job_key?: string
          last_error?: string | null
          last_run_at?: string | null
          lease_expires_at?: string | null
          lease_owner?: string | null
          paused_reason?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      contact_inquiries: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          project_type: string | null
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          project_type?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          project_type?: string | null
          status?: string
        }
        Relationships: []
      }
      followup_drafts: {
        Row: {
          body: string
          created_at: string
          cta_label: string | null
          cta_url: string | null
          error_message: string | null
          id: string
          lead_id: string | null
          model: string | null
          playbook: string
          rationale: string | null
          recipient_email: string
          recipient_name: string
          sent_at: string | null
          source_id: string
          source_table: string
          status: string
          subject: string
          trigger_key: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          cta_label?: string | null
          cta_url?: string | null
          error_message?: string | null
          id?: string
          lead_id?: string | null
          model?: string | null
          playbook: string
          rationale?: string | null
          recipient_email: string
          recipient_name: string
          sent_at?: string | null
          source_id: string
          source_table: string
          status?: string
          subject: string
          trigger_key: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          cta_label?: string | null
          cta_url?: string | null
          error_message?: string | null
          id?: string
          lead_id?: string | null
          model?: string | null
          playbook?: string
          rationale?: string | null
          recipient_email?: string
          recipient_name?: string
          sent_at?: string | null
          source_id?: string
          source_table?: string
          status?: string
          subject?: string
          trigger_key?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "followup_drafts_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "voice_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          amount_refunded: number
          amount_total: number
          balance_due_cents: number
          balance_invoice_id: string | null
          balance_invoice_url: string | null
          balance_status: string
          created_at: string
          currency: string
          customer_email: string | null
          customer_name: string | null
          emails_sent: boolean
          environment: string
          id: string
          is_deposit: boolean
          payment_status: string
          price_id: string | null
          product_name: string | null
          purchase_kind: string
          session_status: string | null
          stripe_customer_id: string | null
          stripe_payment_intent_id: string | null
          stripe_session_id: string
          stripe_subscription_id: string | null
          tier_label: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount_refunded?: number
          amount_total?: number
          balance_due_cents?: number
          balance_invoice_id?: string | null
          balance_invoice_url?: string | null
          balance_status?: string
          created_at?: string
          currency?: string
          customer_email?: string | null
          customer_name?: string | null
          emails_sent?: boolean
          environment?: string
          id?: string
          is_deposit?: boolean
          payment_status?: string
          price_id?: string | null
          product_name?: string | null
          purchase_kind?: string
          session_status?: string | null
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_session_id: string
          stripe_subscription_id?: string | null
          tier_label?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount_refunded?: number
          amount_total?: number
          balance_due_cents?: number
          balance_invoice_id?: string | null
          balance_invoice_url?: string | null
          balance_status?: string
          created_at?: string
          currency?: string
          customer_email?: string | null
          customer_name?: string | null
          emails_sent?: boolean
          environment?: string
          id?: string
          is_deposit?: boolean
          payment_status?: string
          price_id?: string | null
          product_name?: string | null
          purchase_kind?: string
          session_status?: string | null
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string
          stripe_subscription_id?: string | null
          tier_label?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          stripe_customer_id: string | null
          updated_at: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          stripe_customer_id?: string | null
          updated_at?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          stripe_customer_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      project_briefs: {
        Row: {
          audience: string | null
          budget: string | null
          company: string | null
          created_at: string
          deliverables: string | null
          email: string
          extra: string | null
          goals: string
          id: string
          name: string
          pdf_path: string | null
          project_links: string | null
          project_notes: string | null
          project_status: string
          project_type: string
          references_links: string | null
          stripe_session_id: string | null
          timeline: string | null
          user_id: string | null
        }
        Insert: {
          audience?: string | null
          budget?: string | null
          company?: string | null
          created_at?: string
          deliverables?: string | null
          email: string
          extra?: string | null
          goals: string
          id?: string
          name: string
          pdf_path?: string | null
          project_links?: string | null
          project_notes?: string | null
          project_status?: string
          project_type: string
          references_links?: string | null
          stripe_session_id?: string | null
          timeline?: string | null
          user_id?: string | null
        }
        Update: {
          audience?: string | null
          budget?: string | null
          company?: string | null
          created_at?: string
          deliverables?: string | null
          email?: string
          extra?: string | null
          goals?: string
          id?: string
          name?: string
          pdf_path?: string | null
          project_links?: string | null
          project_notes?: string | null
          project_status?: string
          project_type?: string
          references_links?: string | null
          stripe_session_id?: string | null
          timeline?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      project_proposals: {
        Row: {
          balance_cents: number
          brief_id: string | null
          client_company: string | null
          client_email: string
          client_name: string
          client_signature_name: string | null
          client_signed_at: string | null
          created_at: string
          deposit_cents: number
          id: string
          project_title: string
          scope_deliverables: string
          share_token: string
          status: string
          terms: string
          timeline_weeks: string
          total_price_cents: number
        }
        Insert: {
          balance_cents?: number
          brief_id?: string | null
          client_company?: string | null
          client_email: string
          client_name: string
          client_signature_name?: string | null
          client_signed_at?: string | null
          created_at?: string
          deposit_cents?: number
          id?: string
          project_title: string
          scope_deliverables: string
          share_token: string
          status?: string
          terms?: string
          timeline_weeks?: string
          total_price_cents?: number
        }
        Update: {
          balance_cents?: number
          brief_id?: string | null
          client_company?: string | null
          client_email?: string
          client_name?: string
          client_signature_name?: string | null
          client_signed_at?: string | null
          created_at?: string
          deposit_cents?: number
          id?: string
          project_title?: string
          scope_deliverables?: string
          share_token?: string
          status?: string
          terms?: string
          timeline_weeks?: string
          total_price_cents?: number
        }
        Relationships: []
      }
      retainer_subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          customer_email: string | null
          environment: string
          id: string
          latest_invoice_status: string | null
          price_id: string | null
          product_name: string | null
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          customer_email?: string | null
          environment?: string
          id?: string
          latest_invoice_status?: string | null
          price_id?: string | null
          product_name?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          customer_email?: string | null
          environment?: string
          id?: string
          latest_invoice_status?: string | null
          price_id?: string | null
          product_name?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      showcase_projects: {
        Row: {
          category: string | null
          created_at: string
          description: string
          id: string
          is_published: boolean
          metric: string | null
          sort_order: number
          tagline: string | null
          tags: string[]
          title: string
          url: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description: string
          id?: string
          is_published?: boolean
          metric?: string | null
          sort_order?: number
          tagline?: string | null
          tags?: string[]
          title: string
          url?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string
          id?: string
          is_published?: boolean
          metric?: string | null
          sort_order?: number
          tagline?: string | null
          tags?: string[]
          title?: string
          url?: string | null
        }
        Relationships: []
      }
      subscription_invoices: {
        Row: {
          amount_due: number
          amount_paid: number
          billing_reason: string | null
          created_at: string
          currency: string
          customer_email: string | null
          description: string | null
          environment: string
          hosted_invoice_url: string | null
          id: string
          invoice_pdf: string | null
          period_end: string | null
          period_start: string | null
          status: string
          stripe_customer_id: string | null
          stripe_invoice_id: string
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount_due?: number
          amount_paid?: number
          billing_reason?: string | null
          created_at?: string
          currency?: string
          customer_email?: string | null
          description?: string | null
          environment?: string
          hosted_invoice_url?: string | null
          id?: string
          invoice_pdf?: string | null
          period_end?: string | null
          period_start?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_invoice_id: string
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount_due?: number
          amount_paid?: number
          billing_reason?: string | null
          created_at?: string
          currency?: string
          customer_email?: string | null
          description?: string | null
          environment?: string
          hosted_invoice_url?: string | null
          id?: string
          invoice_pdf?: string | null
          period_end?: string | null
          period_start?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_invoice_id?: string
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      voice_agent_logs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          ok: boolean
          request_payload: Json
          result_payload: Json
          tool_name: string
          vapi_call_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          ok?: boolean
          request_payload?: Json
          result_payload?: Json
          tool_name: string
          vapi_call_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          ok?: boolean
          request_payload?: Json
          result_payload?: Json
          tool_name?: string
          vapi_call_id?: string | null
        }
        Relationships: []
      }
      voice_audit_requests: {
        Row: {
          consent_to_email: boolean
          created_at: string
          email: string
          full_name: string
          id: string
          lead_id: string | null
          primary_bottleneck: string | null
          status: string
          updated_at: string
          vapi_call_id: string | null
          website_url: string
        }
        Insert: {
          consent_to_email?: boolean
          created_at?: string
          email: string
          full_name: string
          id?: string
          lead_id?: string | null
          primary_bottleneck?: string | null
          status?: string
          updated_at?: string
          vapi_call_id?: string | null
          website_url: string
        }
        Update: {
          consent_to_email?: boolean
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          lead_id?: string | null
          primary_bottleneck?: string | null
          status?: string
          updated_at?: string
          vapi_call_id?: string | null
          website_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "voice_audit_requests_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "voice_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_bookings: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          lead_id: string | null
          meeting_reference: string | null
          phone: string | null
          slot_end: string
          slot_start: string
          status: string
          time_zone: string
          updated_at: string
          vapi_call_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          lead_id?: string | null
          meeting_reference?: string | null
          phone?: string | null
          slot_end: string
          slot_start: string
          status?: string
          time_zone?: string
          updated_at?: string
          vapi_call_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          lead_id?: string | null
          meeting_reference?: string | null
          phone?: string | null
          slot_end?: string
          slot_start?: string
          status?: string
          time_zone?: string
          updated_at?: string
          vapi_call_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "voice_bookings_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "voice_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_call_records: {
        Row: {
          created_at: string
          ended_at: string | null
          ended_reason: string | null
          id: string
          messages: Json
          raw_payload: Json
          recording_url: string | null
          started_at: string | null
          status: string
          summary: string | null
          transcript: string | null
          updated_at: string
          vapi_call_id: string
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          ended_reason?: string | null
          id?: string
          messages?: Json
          raw_payload?: Json
          recording_url?: string | null
          started_at?: string | null
          status?: string
          summary?: string | null
          transcript?: string | null
          updated_at?: string
          vapi_call_id: string
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          ended_reason?: string | null
          id?: string
          messages?: Json
          raw_payload?: Json
          recording_url?: string | null
          started_at?: string | null
          status?: string
          summary?: string | null
          transcript?: string | null
          updated_at?: string
          vapi_call_id?: string
        }
        Relationships: []
      }
      voice_followups: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          lead_id: string | null
          phone: string | null
          preferred_method: string | null
          reason: string
          status: string
          summary: string
          updated_at: string
          urgency: string
          vapi_call_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          lead_id?: string | null
          phone?: string | null
          preferred_method?: string | null
          reason: string
          status?: string
          summary: string
          updated_at?: string
          urgency?: string
          vapi_call_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          lead_id?: string | null
          phone?: string | null
          preferred_method?: string | null
          reason?: string
          status?: string
          summary?: string
          updated_at?: string
          urgency?: string
          vapi_call_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "voice_followups_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "voice_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_leads: {
        Row: {
          budget_range: string | null
          company_name: string | null
          consent_to_follow_up: boolean
          created_at: string
          email: string | null
          full_name: string
          id: string
          notes: string | null
          phone: string | null
          primary_goal: string | null
          project_type: string
          source: string
          stage: string
          target_audience: string | null
          timeline: string | null
          updated_at: string
          vapi_call_id: string | null
          website_url: string | null
        }
        Insert: {
          budget_range?: string | null
          company_name?: string | null
          consent_to_follow_up?: boolean
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          notes?: string | null
          phone?: string | null
          primary_goal?: string | null
          project_type?: string
          source?: string
          stage?: string
          target_audience?: string | null
          timeline?: string | null
          updated_at?: string
          vapi_call_id?: string | null
          website_url?: string | null
        }
        Update: {
          budget_range?: string | null
          company_name?: string | null
          consent_to_follow_up?: boolean
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string | null
          primary_goal?: string | null
          project_type?: string
          source?: string
          stage?: string
          target_audience?: string | null
          timeline?: string | null
          updated_at?: string
          vapi_call_id?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      app_role: "admin" | "client"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "client"],
    },
  },
} as const
