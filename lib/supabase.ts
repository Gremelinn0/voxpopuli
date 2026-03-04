import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://eqjqwwjfiyxnmivgplsx.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxanF3d2pmaXl4bm1pdmdwbHN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMTI0MzQsImV4cCI6MjA4NzY4ODQzNH0.TrZnG9HsIdhkpB0cAEOy3oEtcNdtGLlHLZguS02pQGk";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
