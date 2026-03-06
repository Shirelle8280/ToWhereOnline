
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xnnewfjkibkaehlesipy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhubmV3ZmpraWJrYWVobGVzaXB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MTk1MzYsImV4cCI6MjA4ODI5NTUzNn0.6BFwHjR1Pd_ml1wYy1I_MOAZX8ikSnr1nVSFTJHy2XA';
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectCities() {
    console.log('--- Inspecting Table: cities ---');
    const { data: cities, error: citiesError } = await supabase.from('cities').select('*').order('id', { ascending: false }).limit(5);
    if (citiesError) {
        console.error('Error fetching cities:', citiesError);
        return;
    }
    console.log('Recent Cities:', JSON.stringify(cities, null, 2));

    if (cities.length > 0) {
        // Try to find "北京" city to see its images
        const beijing = cities.find(c => c.name === '北京') || cities[0];
        console.log(`\n--- Inspecting Table: city_images for city_id ${beijing.id} (${beijing.name}) ---`);
        const { data: images, error: imagesError } = await supabase.from('city_images').select('*').eq('city_id', beijing.id).order('id', { ascending: false });
        if (imagesError) {
            console.error('Error fetching city_images:', imagesError);
            return;
        }
        console.log('City Images:', JSON.stringify(images, null, 2));
    }
}

inspectCities();
