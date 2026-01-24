const axios = require('axios');

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    const { url } = req.query;

    // 1. Validasi awal: Harus ada URL dan harus mengandung kata 'spotify'
    if (!url || !url.includes('spotify.com')) {
        return res.status(400).json({ error: 'Mohon masukkan link Spotify yang valid!' });
    }

    try {
        const { data } = await axios.get(`https://spotdown.org/api/song-details?url=${encodeURIComponent(url)}`, {
            headers: {
                'origin': 'https://spotdown.org',
                'referer': 'https://spotdown.org/',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 8000 // Batasi 8 detik agar tidak kena timeout Vercel
        });

        // 2. Cek apakah properti songs ada sebelum diakses
        if (!data || !data.songs || data.songs.length === 0) {
            return res.status(404).json({ error: 'Lagu tidak ditemukan atau link salah.' });
        }

        const song = data.songs[0];
        return res.status(200).json({
            title: song.title,
            artist: song.artist,
            duration: song.duration,
            cover: song.thumbnail,
            spotifyUrl: song.url,
        });

    } catch (error) {
        console.error("API Error:", error.message);
        // Kirim balik JSON, bukan teks biasa, agar frontend tidak bingung
        return res.status(500).json({ 
            error: 'Gagal mengambil data dari server Spotify.',
            details: error.message 
        });
    }
}
    
