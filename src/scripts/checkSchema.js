import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fakokuvqtlpijcukvekj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZha29rdXZxdGxwaWpjdWt2ZWtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5MTk0MzcsImV4cCI6MjA4MzQ5NTQzN30.Xy542SBt6AG_kEAySkHjbggJGZAGIa0wif0yOU0wuFg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchema() {
    const { data, error } = await supabase.from('cities').select('*').limit(1);
    if (error) {
        console.error('Error fetching cities:', error);
    } else {
        console.log('Sample city data:', data[0]);
    }
}

checkSchema();
