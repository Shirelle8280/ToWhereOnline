
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xnnewfjkibkaehlesipy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhubmV3ZmpraWJrYWVobGVzaXB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MTk1MzYsImV4cCI6MjA4ODI5NTUzNn0.6BFwHjR1Pd_ml1wYy1I_MOAZX8ikSnr1nVSFTJHy2XA';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkExactUrl() {
    const { data } = await supabase.from('cities').select('main_image').eq('name', '北京').single();
    if (data) {
        console.log('URL:', data.main_image);
        console.log('Length:', data.main_image.length);
        const filename = data.main_image.split('/').pop();
        console.log('Filename:', filename);
        console.log('Underscores after _0:', filename.split('_0')[1].split('.')[0].length);
    }
}

checkExactUrl();
