const axios = require('axios');

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const { url } = req.query;

    if (!url) return res.status(400).json({ error: 'URL is required' });

    try {
        const { data } = await axios.get(`https://spotdown.org/api/song-details?url=${encodeURIComponent(url)}`, {
            headers: {
                'origin': 'https://spotdown.org',
                'referer': 'https://spotdown.org/',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        if (!data.songs || data.songs.length === 0) {
            return res.status(404).json({ error: 'Lagu tidak ditemukan' });
        }

        const song = data.songs[0];
        return res.status(200).json({
            title: song.title,
            artist: song.artist,
            duration: song.duration, // Tambahkan ini agar muncul di HTML
            cover: song.thumbnail,
            spotifyUrl: song.url,
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
