import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database schema
export interface EmbeddingRow {
  id: string;
  content_id: string;
  content_type: string;
  chunk_index: number;
  chunk_text: string;
  embedding: number[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}