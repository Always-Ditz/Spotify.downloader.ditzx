import axios from 'axios';

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    let { url } = req.query;

    if (!url) {
        return res.status(400).json({ 
            error: "Link tidak boleh kosong!",
            example: "https://open.spotify.com/track/612bl0KHzyyxEhPzuMqM6e"
        });
    }

    try {
        // --- AUTO-FIX SPOTIFY LINK ---
        // Extract track ID (22 alphanumeric characters)
        const spotifyIdRegex = /(track\/|track:)([a-zA-Z0-9]{22})/;
        const match = url.match(spotifyIdRegex);

        if (match && match[2]) {
            // Force standard Spotify URL format
            url = `https://open.spotify.com/track/${match[2]}`;
            console.log('Fixed URL:', url);
        } else if (!url.includes('spotify.com')) {
            return res.status(400).json({ 
                error: "Format link tidak valid. Gunakan link Spotify yang benar!" 
            });
        }

        // --- FETCH SONG DATA (Primary API) ---
        let songData;
        
        try {
            const response = await axios.get(
                `https://spotdown.org/api/song-details?url=${encodeURIComponent(url)}`, 
                {
                    headers: {
                        'origin': 'https://spotdown.org',
                        'referer': 'https://spotdown.org/',
                        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                        'accept': 'application/json'
                    },
                    timeout: 15000,
                    validateStatus: (status) => status < 500
                }
            );

            const song = response.data?.songs?.[0];

            if (!song) {
                throw new Error('Song not found in primary API');
            }

            songData = {
                title: song.title,
                artist: song.artist,
                duration: song.duration,
                cover: song.thumbnail,
                spotifyUrl: song.url || url
            };

        } catch (primaryError) {
            console.log('Primary API failed, trying fallback...');
            
            // --- FALLBACK API (Alternative) ---
            try {
                const fallbackResponse = await axios.get(
                    `https://api.fabdl.com/spotify/get?url=${encodeURIComponent(url)}`,
                    {
                        headers: {
                            'accept': 'application/json',
                            'user-agent': 'Mozilla/5.0'
                        },
                        timeout: 15000
                    }
                );

                const result = fallbackResponse.data?.result;

                if (!result) {
                    throw new Error('No data from fallback API');
                }

                songData = {
                    title: result.name,
                    artist: result.artists,
                    duration: Math.floor(result.duration_ms / 1000) + 's',
                    cover: result.image,
                    spotifyUrl: url
                };

            } catch (fallbackError) {
                throw new Error('Both APIs failed: ' + fallbackError.message);
            }
        }

        return res.status(200).json({
            success: true,
            data: songData
        });

    } catch (error) {
        console.error('Error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
        
        return res.status(500).json({ 
            success: false,
            error: "Terjadi kesalahan pada server", 
            details: error.message,
            hint: "Coba lagi dalam beberapa saat atau gunakan link Spotify yang berbeda"
        });
    }
                            }
