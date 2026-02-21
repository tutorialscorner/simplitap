import { createClient } from "@supabase/supabase-js";
import * as fs from 'fs';

// Hardcoding keys from test-supabase.ts
const SUPABASE_URL = "https://ianxrjcskywenqgntbuu.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhbnhyamNza3l3ZW5xZ250YnV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyNDUwNjcsImV4cCI6MjA4MTgyMTA2N30.5tiDhmAhnI4PIOvdY6su8w1UhBNQuN8vZpZH_edyE2Y";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function listUsers() {
    console.log("Fetching profiles...");
    try {
        const { data, error } = await supabase
            .from("profiles")
            .select("id, username, email, first_name, last_name, job_title, company, created_at");

        if (error) {
            console.error("Supabase Error:", error);
            return;
        }

        if (data && data.length > 0) {
            console.log(`\nFound ${data.length} profiles:`);
            let fileContent = `Found ${data.length} profiles:\n`;
            data.forEach((user, index) => {
                const name = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'No Name';
                const line = `${index + 1}. Username: ${user.username || '[NULL]'} | Email: ${user.email} | Name: ${name} | Title: ${user.job_title} | Company: ${user.company} | ID: ${user.id}\n`;
                console.log(line.trim());
                fileContent += line;
            });
            fs.writeFileSync('users_list_detailed.txt', fileContent, 'utf8');
            console.log("List saved to users_list_detailed.txt");
        } else {
            console.log("No profiles found.");
        }
    } catch (err) {
        console.error("Unexpected Error:", err);
    }
}

listUsers();
