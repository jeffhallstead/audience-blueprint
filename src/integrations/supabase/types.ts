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
      ai_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          message_key: string | null
          model: string | null
          parts: Json
          role: string
          session_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          message_key?: string | null
          model?: string | null
          parts?: Json
          role: string
          session_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          message_key?: string | null
          model?: string | null
          parts?: Json
          role?: string
          session_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "ai_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_sessions: {
        Row: {
          assessment_id: string | null
          created_at: string
          favorite: boolean
          id: string
          objective: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assessment_id?: string | null
          created_at?: string
          favorite?: boolean
          id?: string
          objective?: string
          status?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assessment_id?: string | null
          created_at?: string
          favorite?: boolean
          id?: string
          objective?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_sessions_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_answers: {
        Row: {
          assessment_id: string
          created_at: string
          id: string
          question_key: string
          section: string
          updated_at: string
          user_id: string
          value: Json
        }
        Insert: {
          assessment_id: string
          created_at?: string
          id?: string
          question_key: string
          section: string
          updated_at?: string
          user_id: string
          value?: Json
        }
        Update: {
          assessment_id?: string
          created_at?: string
          id?: string
          question_key?: string
          section?: string
          updated_at?: string
          user_id?: string
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "assessment_answers_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_events: {
        Row: {
          assessment_id: string | null
          created_at: string
          event_name: string
          id: string
          metadata: Json
          section: string | null
          user_id: string
        }
        Insert: {
          assessment_id?: string | null
          created_at?: string
          event_name: string
          id?: string
          metadata?: Json
          section?: string | null
          user_id: string
        }
        Update: {
          assessment_id?: string | null
          created_at?: string
          event_name?: string
          id?: string
          metadata?: Json
          section?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_events_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_scores: {
        Row: {
          alignment_score: number
          assessment_id: string
          audience_score: number
          config_version: string
          content_score: number
          created_at: string
          distribution_score: number
          id: string
          maturity_level: number
          maturity_title: string
          operations_score: number
          overall_score: number
          strategy_score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          alignment_score?: number
          assessment_id: string
          audience_score?: number
          config_version?: string
          content_score?: number
          created_at?: string
          distribution_score?: number
          id?: string
          maturity_level?: number
          maturity_title?: string
          operations_score?: number
          overall_score?: number
          strategy_score?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          alignment_score?: number
          assessment_id?: string
          audience_score?: number
          config_version?: string
          content_score?: number
          created_at?: string
          distribution_score?: number
          id?: string
          maturity_level?: number
          maturity_title?: string
          operations_score?: number
          overall_score?: number
          strategy_score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_scores_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: true
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          completed_at: string | null
          created_at: string
          current_step: number
          id: string
          organization_id: string | null
          started_at: string
          status: Database["public"]["Enums"]["assessment_status"]
          updated_at: string
          user_id: string
          version: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_step?: number
          id?: string
          organization_id?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["assessment_status"]
          updated_at?: string
          user_id: string
          version?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_step?: number
          id?: string
          organization_id?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["assessment_status"]
          updated_at?: string
          user_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      blueprints: {
        Row: {
          assessment_id: string
          created_at: string
          generated_by: string
          id: string
          next_90_days: string | null
          overall_score: number | null
          publisher_level: string | null
          recommended_priority: string | null
          section_scores: Json
          summary: string | null
          top_opportunity: string | null
          top_risk: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          assessment_id: string
          created_at?: string
          generated_by?: string
          id?: string
          next_90_days?: string | null
          overall_score?: number | null
          publisher_level?: string | null
          recommended_priority?: string | null
          section_scores?: Json
          summary?: string | null
          top_opportunity?: string | null
          top_risk?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          assessment_id?: string
          created_at?: string
          generated_by?: string
          id?: string
          next_90_days?: string | null
          overall_score?: number | null
          publisher_level?: string | null
          recommended_priority?: string | null
          section_scores?: Json
          summary?: string | null
          top_opportunity?: string | null
          top_risk?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blueprints_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_events: {
        Row: {
          amount_cents: number | null
          created_at: string
          currency: string | null
          event_name: string
          id: string
          metadata: Json
          price_id: string | null
          tier: string | null
          user_id: string
        }
        Insert: {
          amount_cents?: number | null
          created_at?: string
          currency?: string | null
          event_name: string
          id?: string
          metadata?: Json
          price_id?: string | null
          tier?: string | null
          user_id: string
        }
        Update: {
          amount_cents?: number | null
          created_at?: string
          currency?: string | null
          event_name?: string
          id?: string
          metadata?: Json
          price_id?: string | null
          tier?: string | null
          user_id?: string
        }
        Relationships: []
      }
      generated_documents: {
        Row: {
          assessment_id: string | null
          body: Json
          created_at: string
          favorite: boolean
          id: string
          kind: string
          markdown: string
          model: string | null
          parent_document_id: string | null
          session_id: string | null
          status: string
          summary: string | null
          title: string
          updated_at: string
          user_id: string
          version: number
        }
        Insert: {
          assessment_id?: string | null
          body?: Json
          created_at?: string
          favorite?: boolean
          id?: string
          kind: string
          markdown?: string
          model?: string | null
          parent_document_id?: string | null
          session_id?: string | null
          status?: string
          summary?: string | null
          title: string
          updated_at?: string
          user_id: string
          version?: number
        }
        Update: {
          assessment_id?: string | null
          body?: Json
          created_at?: string
          favorite?: boolean
          id?: string
          kind?: string
          markdown?: string
          model?: string | null
          parent_document_id?: string | null
          session_id?: string | null
          status?: string
          summary?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "generated_documents_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_documents_parent_document_id_fkey"
            columns: ["parent_document_id"]
            isOneToOne: false
            referencedRelation: "generated_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_documents_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "ai_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          industry: string | null
          marketer_count: number | null
          name: string
          owner_id: string
          revenue_range: string | null
          team_size: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          industry?: string | null
          marketer_count?: number | null
          name: string
          owner_id: string
          revenue_range?: string | null
          team_size?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          industry?: string | null
          marketer_count?: number | null
          name?: string
          owner_id?: string
          revenue_range?: string | null
          team_size?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          job_title: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          job_title?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          job_title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      prompt_templates: {
        Row: {
          body: string
          category: string
          created_at: string
          description: string
          favorite: boolean
          id: string
          is_system: boolean
          slug: string
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          body: string
          category?: string
          created_at?: string
          description?: string
          favorite?: boolean
          id?: string
          is_system?: boolean
          slug: string
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          body?: string
          category?: string
          created_at?: string
          description?: string
          favorite?: boolean
          id?: string
          is_system?: boolean
          slug?: string
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      purchases: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          environment: string
          id: string
          included_os_access_until: string | null
          invoice_url: string | null
          paddle_customer_id: string | null
          paddle_transaction_id: string
          price_id: string
          product_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_cents?: number
          created_at?: string
          currency?: string
          environment?: string
          id?: string
          included_os_access_until?: string | null
          invoice_url?: string | null
          paddle_customer_id?: string | null
          paddle_transaction_id: string
          price_id: string
          product_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          environment?: string
          id?: string
          included_os_access_until?: string | null
          invoice_url?: string | null
          paddle_customer_id?: string | null
          paddle_transaction_id?: string
          price_id?: string
          product_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recommendations: {
        Row: {
          blueprint_id: string
          category: string
          created_at: string
          effort: string
          id: string
          impact: string
          position: number
          rationale: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          blueprint_id: string
          category: string
          created_at?: string
          effort?: string
          id?: string
          impact?: string
          position?: number
          rationale?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          blueprint_id?: string
          category?: string
          created_at?: string
          effort?: string
          id?: string
          impact?: string
          position?: number
          rationale?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recommendations_blueprint_id_fkey"
            columns: ["blueprint_id"]
            isOneToOne: false
            referencedRelation: "blueprints"
            referencedColumns: ["id"]
          },
        ]
      }
      roadmaps: {
        Row: {
          blueprint_id: string
          created_at: string
          description: string | null
          id: string
          month: number
          owner: string | null
          position: number
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          blueprint_id: string
          created_at?: string
          description?: string | null
          id?: string
          month: number
          owner?: string | null
          position?: number
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          blueprint_id?: string
          created_at?: string
          description?: string | null
          id?: string
          month?: number
          owner?: string | null
          position?: number
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roadmaps_blueprint_id_fkey"
            columns: ["blueprint_id"]
            isOneToOne: false
            referencedRelation: "blueprints"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_recommendations: {
        Row: {
          body: string
          category: string
          created_at: string
          document_id: string | null
          effort: string
          favorite: boolean
          id: string
          impact: string
          position: number
          session_id: string | null
          source: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string
          category?: string
          created_at?: string
          document_id?: string | null
          effort?: string
          favorite?: boolean
          id?: string
          impact?: string
          position?: number
          session_id?: string | null
          source?: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          category?: string
          created_at?: string
          document_id?: string | null
          effort?: string
          favorite?: boolean
          id?: string
          impact?: string
          position?: number
          session_id?: string | null
          source?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_recommendations_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "generated_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_recommendations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "ai_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          id: string
          paddle_customer_id: string
          paddle_subscription_id: string
          price_id: string
          product_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          paddle_customer_id: string
          paddle_subscription_id: string
          price_id: string
          product_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          paddle_customer_id?: string
          paddle_subscription_id?: string
          price_id?: string
          product_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_feedback: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          metadata: Json
          rating: string
          target_id: string | null
          target_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          rating?: string
          target_id?: string | null
          target_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          rating?: string
          target_id?: string | null
          target_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      entitlement_tier: {
        Args: { check_env?: string; user_uuid: string }
        Returns: string
      }
      has_active_subscription: {
        Args: { check_env?: string; user_uuid: string }
        Returns: boolean
      }
    }
    Enums: {
      assessment_status: "draft" | "in_progress" | "completed"
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
      assessment_status: ["draft", "in_progress", "completed"],
    },
  },
} as const
