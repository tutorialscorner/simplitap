import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ianxrjcskywenqgntbuu.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhbnhyamNza3l3ZW5xZ250YnV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyNDUwNjcsImV4cCI6MjA4MTgyMTA2N30.5tiDhmAhnI4PIOvdY6su8w1UhBNQuN8vZpZH_edyE2Y";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkDuplicates() {
    const email = "bizwave1409@gmail.com";
    console.log(`Checking duplicates for ${email}...`);

    const { data, error } = await supabase
        .from("profiles")
        .select("id, username, email, clerk_user_id, created_at")
        .eq("email", email);

    if (error) {
        console.error("Error:", error);
    } else {
        console.log(`Found ${data.length} profiles:`);
        data.forEach(p => console.log(JSON.stringify(p, null, 2)));
    }
}

checkDuplicates();
