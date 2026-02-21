import { useAuth } from "@clerk/clerk-react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { CONFIG } from "@/lib/config";

let memoizedSupabaseClient: SupabaseClient | null = null;

// Token cache to prevent spamming Clerk (reduces 429 chances)
let cachedToken: string | null = null;
let cachedAt = 0;
const TOKEN_TTL_MS = 30_000;

export function useSupabase() {
    const { getToken } = useAuth();

    if (!memoizedSupabaseClient) {
        console.log("Initializing Singleton Supabase Client...");

        memoizedSupabaseClient = createClient(
            CONFIG.SUPABASE_URL,
            CONFIG.SUPABASE_ANON_KEY,
            {
                global: {
                    fetch: async (url, options = {}) => {
                        // Cache token for 30 seconds to avoid hitting Clerk too frequently
                        const now = Date.now();

                        if (!cachedToken || now - cachedAt > TOKEN_TTL_MS) {
                            cachedToken = await getToken({ template: "supabase" });
                            cachedAt = now;
                        }

                        const headers = new Headers((options as any)?.headers);

                        if (cachedToken) {
                            headers.set("Authorization", `Bearer ${cachedToken}`);
                        }

                        return fetch(url, {
                            ...options,
                            headers,
                        });
                    },
                },
            }
        );
    }

    return memoizedSupabaseClient;
}
