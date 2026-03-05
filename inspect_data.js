
import { createClient } from '@supabase/supabase-js';

const URL = 'https://xnnewfjkibkaehlesipy.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhubmV3ZmpraWJrYWVobGVzaXB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MTk1MzYsImV4cCI6MjA4ODI5NTUzNn0.6BFwHjR1Pd_ml1wYy1I_MOAZX8ikSnr1nVSFTJHy2XA';

const supabase = createClient(URL, KEY);

async function inspectData() {
    console.log('--- Inspecting Table: firsts ---');
    const { data, error } = await supabase.from('firsts').select('*').limit(5);
    if (error) {
        console.error('Error:', error);
        return;
    }
    console.log(JSON.stringify(data, null, 2));

    console.log('\n--- Inspecting Storage: firsts-images ---');
    const { data: files, error: listError } = await supabase.storage.from('firsts-images').list();
    if (listError) {
        console.error('List Error:', listError);
    } else {
        console.log(`Found ${files.length} files in storage.`);
        if (files.length > 0) {
            console.log('Sample file:', files[0].name);
        }
    }
}

inspectData();
