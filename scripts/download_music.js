const https = require('https');
const fs = require('fs');
const path = require('path');

const musicDir = path.join(__dirname, '..', 'public', 'music');

// Ensure directory exists
if (!fs.existsSync(musicDir)) {
    fs.mkdirSync(musicDir, { recursive: true });
}

const tracks = [
    { name: 'home.mp3', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
    { name: 'travel.mp3', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
    { name: 'firsts.mp3', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
    { name: 'letters.mp3', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' }
];

const download = (url, dest) => {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => reject(err));
        });
    });
};

async function run() {
    console.log('Downloading placeholder music tracks...');
    for (const track of tracks) {
        const dest = path.join(musicDir, track.name);
        if (!fs.existsSync(dest)) {
            console.log(`Downloading ${track.name}...`);
            try {
                await download(track.url, dest);
                console.log(`Successfully downloaded ${track.name}`);
            } catch (e) {
                console.error(`Error downloading ${track.name}:`, e.message);
            }
        } else {
            console.log(`${track.name} already exists, skipping.`);
        }
    }
    console.log('Done.');
}

run();
