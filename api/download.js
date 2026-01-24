const axios = require('axios');

export default async function handler(req, res) {
    const { url, title } = req.query;

    if (!url) return res.status(400).send("URL required");

    try {
        const response = await axios.post('https://spotdown.org/api/download', {
            url: url
        }, {
            headers: {
                'origin': 'https://spotdown.org',
                'referer': 'https://spotdown.org/',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            responseType: 'stream',
            // Tambahkan timeout internal axios agar tidak menggantung selamanya
            timeout: 25000 
        });

        const cleanTitle = (title || 'spotify-music').replace(/[^a-zA-Z0-9 ]/g, "");

        // Set Headers
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Disposition', `attachment; filename="${cleanTitle}.mp3"`);

        // Pipe data
        response.data.pipe(res);

        // Pastikan fungsi berakhir dengan benar saat streaming selesai
        response.data.on('end', () => {
            res.end();
        });

        // Tangani jika stream putus di tengah jalan
        response.data.on('error', (err) => {
            console.error('Stream Error:', err);
            if (!res.headersSent) {
                res.status(500).send("Stream error occurred");
            } else {
                res.end();
            }
        });

    } catch (error) {
        // Jika error terjadi SEBELUM stream mulai (misal API down)
        console.error("Download Error:", error.message);
        if (!res.headersSent) {
            res.status(500).send("Error downloading file: " + error.message);
        }
    }
            }
