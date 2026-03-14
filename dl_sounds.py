import urllib.request
import os

os.makedirs('public/sounds', exist_ok=True)

urls = {
    'pop.mp3': 'https://cdn.pixabay.com/audio/2021/08/04/audio_0625c1539c.mp3',
    'success.mp3': 'https://cdn.pixabay.com/audio/2021/08/04/audio_bb630cc098.mp3',
    'click.mp3': 'https://cdn.pixabay.com/audio/2022/03/15/audio_24e393b7de.mp3'
}

req_headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}

for filename, url in urls.items():
    try:
        req = urllib.request.Request(url, headers=req_headers)
        with urllib.request.urlopen(req) as response, open(f'public/sounds/{filename}', 'wb') as out_file:
            data = response.read()
            out_file.write(data)
        print(f"Downloaded {filename}")
    except Exception as e:
        print(f"Failed to download {filename}: {e}")
