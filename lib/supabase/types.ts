/**
 * Temporary local types for the current auth + restaurant onboarding slice.
 * Regenerate from Supabase once the remote schema is available.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      restaurants: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          slug: string;
          city: string | null;
          address: string | null;
          phone: string | null;
          language_default: string;
          customer_languages: string[];
          logo_url: string | null;
          tier: string;
          subscription_status: string;
          current_period_ends_at: string | null;
          trial_started_at: string | null;
          trial_ends_at: string | null;
          trial_used_at: string | null;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          onboarding_completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          slug: string;
          city?: string | null;
          address?: string | null;
          phone?: string | null;
          language_default?: string;
          customer_languages?: string[];
          logo_url?: string | null;
          tier?: string;
          subscription_status?: string;
          current_period_ends_at?: string | null;
          trial_started_at?: string | null;
          trial_ends_at?: string | null;
          trial_used_at?: string | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          onboarding_completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          slug?: string;
          city?: string | null;
          address?: string | null;
          phone?: string | null;
          language_default?: string;
          customer_languages?: string[];
          logo_url?: string | null;
          tier?: string;
          subscription_status?: string;
          current_period_ends_at?: string | null;
          trial_started_at?: string | null;
          trial_ends_at?: string | null;
          trial_used_at?: string | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          onboarding_completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      menu_items: {
        Row: {
          id: string;
          restaurant_id: string;
          name_bg: string;
          name_en: string | null;
          description_bg: string | null;
          description_en: string | null;
          category: string | null;
          price: number | null;
          image_url: string | null;
          is_active: boolean;
          sort_order: number;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          name_bg: string;
          name_en?: string | null;
          description_bg?: string | null;
          description_en?: string | null;
          category?: string | null;
          price?: number | null;
          image_url?: string | null;
          is_active?: boolean;
          sort_order?: number;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          name_bg?: string;
          name_en?: string | null;
          description_bg?: string | null;
          description_en?: string | null;
          category?: string | null;
          price?: number | null;
          image_url?: string | null;
          is_active?: boolean;
          sort_order?: number;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      receipt_aliases: {
        Row: {
          id: string;
          restaurant_id: string;
          alias: string;
          menu_item_id: string;
          confidence: string;
          times_seen: number;
          last_seen_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          alias: string;
          menu_item_id: string;
          confidence?: string;
          times_seen?: number;
          last_seen_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          alias?: string;
          menu_item_id?: string;
          confidence?: string;
          times_seen?: number;
          last_seen_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      feedback_sessions: {
        Row: {
          id: string;
          restaurant_id: string;
          table_number: string | null;
          receipt_image_path: string | null;
          extracted_items: Json;
          customer_language: string;
          overall_rating: string | null;
          overall_comment: string | null;
          started_at: string;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          table_number?: string | null;
          receipt_image_path?: string | null;
          extracted_items?: Json;
          customer_language?: string;
          overall_rating?: string | null;
          overall_comment?: string | null;
          started_at?: string;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          table_number?: string | null;
          receipt_image_path?: string | null;
          extracted_items?: Json;
          customer_language?: string;
          overall_rating?: string | null;
          overall_comment?: string | null;
          started_at?: string;
          completed_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      usage_counters: {
        Row: {
          restaurant_id: string;
          period: string;
          feedback_count: number;
          receipt_scans_count: number;
        };
        Insert: {
          restaurant_id: string;
          period: string;
          feedback_count?: number;
          receipt_scans_count?: number;
        };
        Update: {
          restaurant_id?: string;
          period?: string;
          feedback_count?: number;
          receipt_scans_count?: number;
        };
        Relationships: [];
      };
      scan_credit_grants: {
        Row: {
          id: string;
          restaurant_id: string;
          source: string;
          credits_granted: number;
          credits_used: number;
          starts_at: string;
          expires_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          source: string;
          credits_granted: number;
          credits_used?: number;
          starts_at?: string;
          expires_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          source?: string;
          credits_granted?: number;
          credits_used?: number;
          starts_at?: string;
          expires_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      ai_usage_events: {
        Row: {
          id: string;
          restaurant_id: string;
          event_type: string;
          model: string;
          input_tokens: number;
          output_tokens: number;
          total_tokens: number;
          estimated_cost_usd: number;
          success: boolean;
          failure_reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          event_type: string;
          model: string;
          input_tokens?: number;
          output_tokens?: number;
          total_tokens?: number;
          estimated_cost_usd?: number;
          success: boolean;
          failure_reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          event_type?: string;
          model?: string;
          input_tokens?: number;
          output_tokens?: number;
          total_tokens?: number;
          estimated_cost_usd?: number;
          success?: boolean;
          failure_reason?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
