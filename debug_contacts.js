import { createClient } from "@supabase/supabase-js";

// Hardcoding keys
const SUPABASE_URL = "https://ianxrjcskywenqgntbuu.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhbnhyamNza3l3ZW5xZ250YnV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyNDUwNjcsImV4cCI6MjA4MTgyMTA2N30.5tiDhmAhnI4PIOvdY6su8w1UhBNQuN8vZpZH_edyE2Y";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const CARD_OWNER_ID = "30faebaf-f4ef-42a1-b580-43d14777f48c"; // Derived from user list

async function debugContacts() {
    console.log(`Debugging contacts for Profile ID: ${CARD_OWNER_ID}`);

    // 1. Check existing contacts
    try {
        const { data, error, count } = await supabase
            .from("contact_exchanges")
            .select("*", { count: 'exact' })
            .eq("card_owner_id", CARD_OWNER_ID);

        if (error) {
            console.error("Error fetching contacts:", error);
        } else {
            console.log(`Found ${count} existing contacts.`);
            if (data.length > 0) {
                console.log("Sample contact:", data[0]);
            }
        }
    } catch (err) {
        console.error("Unexpected error fetching:", err);
    }

    // 2. Try to insert a test contact
    console.log("\nAttempting to insert test contact...");
    try {
        const { data, error } = await supabase
            .from("contact_exchanges")
            .insert({
                card_owner_id: CARD_OWNER_ID,
                visitor_name: "Test Visitor",
                visitor_email: "test@visitor.com",
                visitor_job_title: "Tester",
                visitor_company: "Test Corp",
                created_at: new Date().toISOString()
            })
            .select();

        if (error) {
            console.error("Insert Failed:", error);
        } else {
            console.log("Insert Successful!", data);
        }
    } catch (err) {
        console.error("Unexpected error inserting:", err);
    }
}

debugContacts();
