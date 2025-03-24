import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type Database = {
  public: {
    Tables: {
      forms: {
        Row: {
          id: string;
          created_at: string;
          title: string;
          description: string | null;
          prompts: string[];
          user_id: string;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          created_at?: string;
          title: string;
          description?: string | null;
          prompts: string[];
          user_id: string;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          created_at?: string;
          title?: string;
          description?: string | null;
          prompts?: string[];
          user_id?: string;
          is_active?: boolean;
        };
      };
      responses: {
        Row: {
          id: string;
          created_at: string;
          form_id: string;
          user_id: string;
          answers: Record<string, any>;
        };
        Insert: {
          id?: string;
          created_at?: string;
          form_id: string;
          user_id: string;
          answers: Record<string, any>;
        };
        Update: {
          id?: string;
          created_at?: string;
          form_id?: string;
          user_id?: string;
          answers?: Record<string, any>;
        };
      };
      templates: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          title: string;
          description: string | null;
          prompts: string[];
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          title: string;
          description?: string | null;
          prompts: string[];
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          title?: string;
          description?: string | null;
          prompts?: string[];
        };
      };
    };
  };
};
