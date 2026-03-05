import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://fakokuvqtlpijcukvekj.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZha29rdXZxdGxwaWpjdWt2ZWtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5MTk0MzcsImV4cCI6MjA4MzQ5NTQzN30.Xy542SBt6AG_kEAySkHjbggJGZAGIa0wif0yOU0wuFg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createTables() {
    console.log('Since we cannot run arbitrary SQL via the anon key, please run this in your Supabase SQL Editor:');
    console.log(`
-- 1. Create cities table
CREATE TABLE IF NOT EXISTS public.cities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    main_image TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    sort_order INTEGER DEFAULT 0
);

-- 2. Create city_images table
CREATE TABLE IF NOT EXISTS public.city_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id UUID NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 3. Set up Row Level Security (RLS) policies
-- Allow everyone to read
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.city_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to cities" ON public.cities FOR SELECT USING (true);
CREATE POLICY "Allow public read access to city_images" ON public.city_images FOR SELECT USING (true);

-- Allow authenticated/anon users to insert/update (since you manage it locally, you can restrict this later if needed, but for now allow anon based on your current setup)
CREATE POLICY "Allow anon insert to cities" ON public.cities FOR ALL USING (true);
CREATE POLICY "Allow anon insert to city_images" ON public.city_images FOR ALL USING (true);
  `);
}

createTables();
