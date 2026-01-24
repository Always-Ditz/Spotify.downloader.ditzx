const axios = require('axios');

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        const { data: s } = await axios.get(`https://spotdown.org/api/song-details?url=${encodeURIComponent(url)}`, {
            headers: {
                origin: 'https://spotdown.org',
                referer: 'https://spotdown.org/',
                'user-agent': 'Mozilla/5.0 (Linux; Android 15; SM-F958 Build/AP3A.240905.015) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.86 Mobile Safari/537.36'
            }
        });

        const song = s.songs[0];
        if (!song) throw new Error('Track not found.');

        return res.status(200).json({
            title: song.title,
            artist: song.artist,
            duration: song.duration,
            cover: song.thumbnail,
            spotifyUrl: song.url,
            is_valid: true
        });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
              }
              
