import { createClient } from "@supabase/supabase-js";

// Call with: node delete_users.js username1 username2 ...
// Or: node delete_users.js --id id1 id2 ...

const SUPABASE_URL = "https://ianxrjcskywenqgntbuu.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhbnhyamNza3l3ZW5xZ250YnV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyNDUwNjcsImV4cCI6MjA4MTgyMTA2N30.5tiDhmAhnI4PIOvdY6su8w1UhBNQuN8vZpZH_edyE2Y";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function deleteUsers() {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.log("Usage: node delete_users.js <username1> <username2> ...");
        console.log("   OR: node delete_users.js --id <id1> <id2> ...");
        return;
    }

    let isIdMode = false;
    let targets = [];

    if (args[0] === '--id') {
        isIdMode = true;
        targets = args.slice(1);
    } else {
        targets = args;
    }

    console.log(`Attempting to delete ${targets.length} users (${isIdMode ? 'IDs' : 'Usernames'})...`);

    for (const target of targets) {
        try {
            let query = supabase.from("profiles").delete({ count: 'exact' });

            if (isIdMode) {
                query = query.eq("id", target);
            } else {
                query = query.eq("username", target);
            }

            const { count, error } = await query;

            if (error) {
                console.error(`Error deleting ${target}:`, error.message);
            } else if (count === 0) {
                console.log(`No user found with ${isIdMode ? 'ID' : 'username'}: ${target}`);
            } else {
                console.log(`Successfully deleted profile: ${target} (${count} rows affected)`);
            }
        } catch (err) {
            console.error(`Unexpected error deleting ${target}:`, err);
        }
    }
}

deleteUsers();
