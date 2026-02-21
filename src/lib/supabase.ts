import { createClient } from "@supabase/supabase-js";
import { CONFIG } from "./config";

// Create a single instance
export const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

// For Clerk integration, we still want to inject the token.
// Instead of creating new clients, we should use the singleton if possible, 
// or ensure it's managed centrally.
export const createClerkSupabaseClient = (clerkToken: string | null) => {
    return createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY, {
        global: {
            headers: {
                Authorization: clerkToken ? `Bearer ${clerkToken}` : "",
            },
        },
    });
};

