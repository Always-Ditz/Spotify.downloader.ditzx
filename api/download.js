import axios from 'axios';

export default async function handler(req, res) {
    const { url, title } = req.query;

    if (!url) {
        return res.status(400).json({ 
            error: "URL required",
            example: "/api/download?url=https://open.spotify.com/track/xxx&title=Song Name"
        });
    }

    try {
        // Request download stream dari API
        const response = await axios.post(
            'https://spotdown.org/api/download', 
            { url: url },
            {
                headers: {
                    'origin': 'https://spotdown.org',
                    'referer': 'https://spotdown.org/',
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                    'content-type': 'application/json'
                },
                responseType: 'stream',
                timeout: 25000,
                maxRedirects: 5
            }
        );

        // Clean filename - hapus karakter illegal
        const cleanTitle = (title || 'spotify-music')
            .replace(/[^a-zA-Z0-9 \-_]/g, '')
            .trim()
            .substring(0, 100); // Limit panjang filename

        // Set response headers
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Disposition', `attachment; filename="${cleanTitle}.mp3"`);
        res.setHeader('Cache-Control', 'no-cache');

        // Pipe stream langsung ke response
        response.data.pipe(res);

        // Handle stream completion
        response.data.on('end', () => {
            console.log('Download completed:', cleanTitle);
            if (!res.writableEnded) {
                res.end();
            }
        });

        // Handle stream errors
        response.data.on('error', (err) => {
            console.error('Stream Error:', err.message);
            if (!res.headersSent) {
                res.status(500).json({ 
                    error: "Stream error occurred",
                    details: err.message 
                });
            } else {
                res.end();
            }
        });

        // Handle client disconnect
        req.on('close', () => {
            if (!res.writableEnded) {
                console.log('Client disconnected during download');
                response.data.destroy();
            }
        });

    } catch (error) {
        console.error("Download Error:", error.message);
        
        // Error handling sebelum stream dimulai
        if (!res.headersSent) {
            const statusCode = error.response?.status || 500;
            res.status(statusCode).json({ 
                error: "Error downloading file",
                details: error.message,
                apiError: error.response?.data || null
            });
        } else {
            // Kalau headers sudah terkirim, paksa end
            res.end();
        }
    }
                         }
