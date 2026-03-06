
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xnnewfjkibkaehlesipy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhubmV3ZmpraWJrYWVobGVzaXB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MTk1MzYsImV4cCI6MjA4ODI5NTUzNn0.6BFwHjR1Pd_ml1wYy1I_MOAZX8ikSnr1nVSFTJHy2XA';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOtherCities() {
    const { data } = await supabase.from('cities').select('name, main_image').in('name', ['台南', '高雄']);
    if (data) {
        console.log(JSON.stringify(data, null, 2));
    }
}

checkOtherCities();
