const axios = require('axios');

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    let { url } = req.query;

    if (!url) return res.status(400).json({ error: "Link tidak boleh kosong!" });

    try {
        // --- LOGIKA AUTO-FIX LINK ---
        // Mencari ID lagu (karakter alfanumerik sekitar 22 digit)
        const spotifyIdRegex = /(track\/|track:)([a-zA-Z0-9]{22})/;
        const match = url.match(spotifyIdRegex);

        if (match && match[2]) {
            // Jika ketemu ID-nya, kita paksa ubah jadi format link standar
            url = `https://open.spotify.com/track/${match[2]}`;
        } else if (!url.includes('spotify.com')) {
            // Jika link benar-benar tidak jelas/aneh
            return res.status(400).json({ error: "Format link tidak dikenali. Masukkan link Spotify asli!" });
        }

        // --- PROSES AMBIL DATA ---
        const { data } = await axios.get(`https://spotdown.org/api/song-details?url=${encodeURIComponent(url)}`, {
            headers: {
                'origin': 'https://spotdown.org',
                'referer': 'https://spotdown.org/',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 8000
        });

        const song = data?.songs?.[0];

        if (!song) {
            return res.status(404).json({ error: "Lagu tidak ditemukan meskipun link sudah diperbaiki." });
        }

        return res.status(200).json({
            title: song.title,
            artist: song.artist,
            duration: song.duration,
            cover: song.thumbnail,
            spotifyUrl: song.url
        });

    } catch (error) {
        // Mencegah error 'Unexpected token A' di frontend
        return res.status(500).json({ 
            error: "Terjadi kesalahan pada server", 
            details: error.message 
        });
    }
            }
