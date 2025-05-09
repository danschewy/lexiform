import { createClient } from "@/utils/supabase/client";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient();

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
          email: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          form_id: string;
          user_id: string;
          answers: Record<string, any>;
          email?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          form_id?: string;
          user_id?: string;
          answers?: Record<string, any>;
          email?: string | null;
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
