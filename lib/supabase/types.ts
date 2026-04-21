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
          trial_ends_at: string | null;
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
          trial_ends_at?: string | null;
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
          trial_ends_at?: string | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          onboarding_completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
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
