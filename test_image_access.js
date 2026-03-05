
const testUrl = 'https://xnnewfjkibkaehlesipy.supabase.co/storage/v1/object/public/firsts-images/1772007238366_cws9eahjg6k.jpg';

async function testImage() {
    console.log(`Testing URL: ${testUrl}`);
    try {
        const res = await fetch(testUrl);
        console.log(`Status: ${res.status} ${res.statusText}`);
        if (res.status === 200) {
            console.log('✅ Image is publically accessible!');
        } else {
            console.log('❌ Image is NOT accessible. Check RLS policies.');
        }
    } catch (e) {
        console.error('Error:', e.message);
    }
}

testImage();
