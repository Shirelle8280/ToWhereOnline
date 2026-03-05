import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fakokuvqtlpijcukvekj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZha29rdXZxdGxwaWpjdWt2ZWtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5MTk0MzcsImV4cCI6MjA4MzQ5NTQzN30.Xy542SBt6AG_kEAySkHjbggJGZAGIa0wif0yOU0wuFg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const pointsData = [
    { name: '深圳', lng: 114.0579, lat: 22.5431, color: '#FFFF00' },
    { name: '香港', lng: 114.1694, lat: 22.3193, color: '#FFFF00' },
    { name: '惠州', lng: 114.4168, lat: 23.1115, color: '#FFFF00' },
    { name: '珠海', lng: 113.5767, lat: 22.2707, color: '#FFFF00' },
    { name: '中山', lng: 113.392, lat: 22.521, color: '#FFFF00' },
    { name: '东莞', lng: 113.760, lat: 23.020, color: '#FFFF00' },
    { name: '外伶仃岛', lng: 114.0050, lat: 22.1150, color: '#FFFF00' },
    { name: '南澳岛', lng: 117.0700, lat: 23.4400, color: '#FFFF00' },
    { name: '河源', lng: 114.7000, lat: 23.7333, color: '#FFFF00' },
    { name: '桂林', lng: 110.2990, lat: 25.2740, color: '#00FF00' },
    { name: '重庆', lng: 106.5516, lat: 29.5630, color: '#FF00FF' },
    { name: '成都', lng: 104.0665, lat: 30.5728, color: '#0000FF' },
    { name: '广元', lng: 105.8436, lat: 32.4416, color: '#0000FF' },
    { name: '绵阳', lng: 104.6794, lat: 31.4677, color: '#0000FF' },
    { name: '阿坝州', lng: 102.2214, lat: 31.8994, color: '#0000FF' },
    { name: '台北', lng: 121.5654, lat: 25.0330, color: '#FF0000' },
    { name: '台南', lng: 120.2133, lat: 22.9908, color: '#FF0000' },
    { name: '高雄', lng: 120.3014, lat: 22.6273, color: '#FF0000' },
    { name: '马来西亚', lng: 101.9758, lat: 4.2105, color: '#FF0000' },
];

async function syncCoordinates() {
    console.log('Starting coordinate synchronization...');
    for (const pt of pointsData) {
        console.log(`Updating ${pt.name}...`);
        const { error } = await supabase
            .from('cities')
            .update({
                lng: pt.lng,
                lat: pt.lat,
                color: pt.color
            })
            .eq('name', pt.name);

        if (error) {
            console.error(`Error updating ${pt.name}:`, error);
        }
    }
    console.log('Synchronization complete!');
}

syncCoordinates();
