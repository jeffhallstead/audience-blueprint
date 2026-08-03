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
      customer_lifecycle: {
        Row: {
          churned_at: string | null
          created_at: string
          first_seen_at: string
          highest_stage: Database["public"]["Enums"]["lifecycle_stage"]
          id: string
          last_active_at: string | null
          organization_id: string | null
          previous_stage: Database["public"]["Enums"]["lifecycle_stage"] | null
          stage: Database["public"]["Enums"]["lifecycle_stage"]
          stage_entered_at: string
          stage_reason: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          churned_at?: string | null
          created_at?: string
          first_seen_at?: string
          highest_stage?: Database["public"]["Enums"]["lifecycle_stage"]
          id?: string
          last_active_at?: string | null
          organization_id?: string | null
          previous_stage?: Database["public"]["Enums"]["lifecycle_stage"] | null
          stage?: Database["public"]["Enums"]["lifecycle_stage"]
          stage_entered_at?: string
          stage_reason?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          churned_at?: string | null
          created_at?: string
          first_seen_at?: string
          highest_stage?: Database["public"]["Enums"]["lifecycle_stage"]
          id?: string
          last_active_at?: string | null
          organization_id?: string | null
          previous_stage?: Database["public"]["Enums"]["lifecycle_stage"] | null
          stage?: Database["public"]["Enums"]["lifecycle_stage"]
          stage_entered_at?: string
          stage_reason?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_lifecycle_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_qualification: {
        Row: {
          created_at: string
          engagement_score: number
          fit_score: number
          highest_tier: Database["public"]["Enums"]["qualification_tier"]
          id: string
          organization_id: string | null
          previous_tier:
            | Database["public"]["Enums"]["qualification_tier"]
            | null
          scored_at: string
          signals: Json
          tier: Database["public"]["Enums"]["qualification_tier"]
          tier_entered_at: string
          tier_reason: string | null
          total_score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          engagement_score?: number
          fit_score?: number
          highest_tier?: Database["public"]["Enums"]["qualification_tier"]
          id?: string
          organization_id?: string | null
          previous_tier?:
            | Database["public"]["Enums"]["qualification_tier"]
            | null
          scored_at?: string
          signals?: Json
          tier?: Database["public"]["Enums"]["qualification_tier"]
          tier_entered_at?: string
          tier_reason?: string | null
          total_score?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          engagement_score?: number
          fit_score?: number
          highest_tier?: Database["public"]["Enums"]["qualification_tier"]
          id?: string
          organization_id?: string | null
          previous_tier?:
            | Database["public"]["Enums"]["qualification_tier"]
            | null
          scored_at?: string
          signals?: Json
          tier?: Database["public"]["Enums"]["qualification_tier"]
          tier_entered_at?: string
          tier_reason?: string | null
          total_score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_qualification_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      export_targets: {
        Row: {
          airtable_table: string | null
          asana_project_id: string | null
          asana_project_name: string | null
          created_at: string
          id: string
          last_exported_at: string | null
          provider: string
          updated_at: string
          user_id: string
        }
        Insert: {
          airtable_table?: string | null
          asana_project_id?: string | null
          asana_project_name?: string | null
          created_at?: string
          id?: string
          last_exported_at?: string | null
          provider: string
          updated_at?: string
          user_id: string
        }
        Update: {
          airtable_table?: string | null
          asana_project_id?: string | null
          asana_project_name?: string | null
          created_at?: string
          id?: string
          last_exported_at?: string | null
          provider?: string
          updated_at?: string
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
      integration_outbox: {
        Row: {
          attempts: number
          created_at: string
          dedupe_key: string | null
          event_name: string
          id: string
          last_error: string | null
          next_attempt_at: string
          payload: Json
          processed_at: string | null
          provider: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          attempts?: number
          created_at?: string
          dedupe_key?: string | null
          event_name: string
          id?: string
          last_error?: string | null
          next_attempt_at?: string
          payload?: Json
          processed_at?: string | null
          provider: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          attempts?: number
          created_at?: string
          dedupe_key?: string | null
          event_name?: string
          id?: string
          last_error?: string | null
          next_attempt_at?: string
          payload?: Json
          processed_at?: string | null
          provider?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      organization_audit: {
        Row: {
          actor_id: string | null
          created_at: string
          field: string
          id: string
          new_value: string | null
          old_value: string | null
          organization_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          field: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          organization_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          field?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_audit_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          archived_at: string | null
          business_model: string | null
          created_at: string
          domain: string | null
          id: string
          industry: string | null
          marketer_count: number | null
          name: string
          owner_id: string
          profile_completeness: number
          region: string | null
          revenue_range: string | null
          team_size: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          archived_at?: string | null
          business_model?: string | null
          created_at?: string
          domain?: string | null
          id?: string
          industry?: string | null
          marketer_count?: number | null
          name: string
          owner_id: string
          profile_completeness?: number
          region?: string | null
          revenue_range?: string | null
          team_size?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          archived_at?: string | null
          business_model?: string | null
          created_at?: string
          domain?: string | null
          id?: string
          industry?: string | null
          marketer_count?: number | null
          name?: string
          owner_id?: string
          profile_completeness?: number
          region?: string | null
          revenue_range?: string | null
          team_size?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      platform_events: {
        Row: {
          context: Json
          created_at: string
          dedupe_key: string | null
          environment: string
          event_type: string
          event_version: number
          id: string
          occurred_at: string
          organization_id: string | null
          payload: Json
          processed_at: string | null
          product: string
          source: string
          user_id: string | null
        }
        Insert: {
          context?: Json
          created_at?: string
          dedupe_key?: string | null
          environment?: string
          event_type: string
          event_version?: number
          id?: string
          occurred_at?: string
          organization_id?: string | null
          payload?: Json
          processed_at?: string | null
          product?: string
          source?: string
          user_id?: string | null
        }
        Update: {
          context?: Json
          created_at?: string
          dedupe_key?: string | null
          environment?: string
          event_type?: string
          event_version?: number
          id?: string
          occurred_at?: string
          organization_id?: string | null
          payload?: Json
          processed_at?: string | null
          product?: string
          source?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          job_title: string | null
          updated_at: string
          welcome_email_sent_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          job_title?: string | null
          updated_at?: string
          welcome_email_sent_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          job_title?: string | null
          updated_at?: string
          welcome_email_sent_at?: string | null
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
      user_integration_credentials: {
        Row: {
          account_label: string | null
          airtable_base_id: string | null
          created_at: string
          id: string
          provider: string
          token_ciphertext: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_label?: string | null
          airtable_base_id?: string | null
          created_at?: string
          id?: string
          provider: string
          token_ciphertext: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_label?: string | null
          airtable_base_id?: string | null
          created_at?: string
          id?: string
          provider?: string
          token_ciphertext?: string
          updated_at?: string
          user_id?: string
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_org_member: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      assessment_status: "draft" | "in_progress" | "completed"
      lifecycle_stage:
        | "visitor"
        | "registered"
        | "assessment_started"
        | "assessment_completed"
        | "blueprint_owner"
        | "os_subscriber"
        | "churned"
      qualification_tier:
        | "unqualified"
        | "lead"
        | "marketing_qualified"
        | "sales_qualified"
        | "customer"
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
      app_role: ["admin", "user"],
      assessment_status: ["draft", "in_progress", "completed"],
      lifecycle_stage: [
        "visitor",
        "registered",
        "assessment_started",
        "assessment_completed",
        "blueprint_owner",
        "os_subscriber",
        "churned",
      ],
      qualification_tier: [
        "unqualified",
        "lead",
        "marketing_qualified",
        "sales_qualified",
        "customer",
      ],
    },
  },
} as const
