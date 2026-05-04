import fs from 'fs';
import { pipeline } from 'stream/promises';

const urls = {
    'click.mp3': 'https://upload.wikimedia.org/wikipedia/commons/2/23/Mouse_click_sound.mp3'
};

async function download() {
    for (const [filename, url] of Object.entries(urls)) {
        try {
            const res = await fetch(url, {
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            
            const dest = fs.createWriteStream(`public/sounds/${filename}`);
            await pipeline(res.body, dest);
            console.log(`Downloaded ${filename}`);
        } catch (e) {
            console.error(`Failed ${filename}:`, e.message);
        }
    }
}
download();
