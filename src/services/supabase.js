import { createClient } from "@supabase/supabase-js";
const url = process.env.REACT_APP_SUPABASE_URL;
const key = process.env.REACT_APP_SUPABASE_PUBLISHABLE_KEY;
export const supabase = url && key ? createClient(url, key) : null;
// Keyingi bosqich: demo repository o‘rniga Supabase Auth, RLS va Storage adapteri ulanadi.
