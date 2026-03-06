
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xnnewfjkibkaehlesipy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhubmV3ZmpraWJrYWVobGVzaXB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MTk1MzYsImV4cCI6MjA4ODI5NTUzNn0.6BFwHjR1Pd_ml1wYy1I_MOAZX8ikSnr1nVSFTJHy2XA';
const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanup() {
    console.log('--- Starting Data Cleanup for Online Version ---');

    // 1. Delete all city images (except cover images which are in 'cities' table)
    console.log('\n🗑️ Deleting all records from city_images...');
    const { count: imagesCount, error: imagesError } = await supabase
        .from('city_images')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all by using a dummy filter

    if (imagesError) {
        console.error('❌ Error deleting city images:', imagesError.message);
    } else {
        console.log('✅ Successfully cleared city_images table.');
    }

    // 2. Clear letter content
    console.log('\n📝 Updating letters content...');
    // Using a more universal filter that works for both numeric and UUID IDs
    const { data: letters, error: lettersError } = await supabase
        .from('letters')
        .update({ content: '这里是秘密哦，去试试自己写信吧！' })
        .not('id', 'is', null);

    if (lettersError) {
        console.error('❌ Error updating letters:', lettersError.message);
    } else {
        console.log('✅ Successfully updated all letters content.');
    }

    console.log('\n--- Cleanup Complete ---');
    console.log('Note: Planet Keywords (checkins/keyword_tasks) and Firsts (firsts) were not touched as requested.');
}

cleanup();
