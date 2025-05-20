
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://wdbaoomwhuiztjoazagd.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkYmFvb213aHVpenRqb2F6YWdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5NTI3MzEsImV4cCI6MjA2MTUyODczMX0.iNYeY21EzHT838cxScUgfnYO9h9xSPvJRpMbd0RTHWc";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
