const axios = require('axios');

export default async function handler(req, res) {
    const { url, title } = req.query;

    if (!url) return res.status(400).send("URL required");

    try {
        const response = await axios.post('https://spotdown.org/api/download', {
            url: url
        }, {
            headers: {
                origin: 'https://spotdown.org',
                referer: 'https://spotdown.org/',
                'user-agent': 'Mozilla/5.0 (Linux; Android 15; SM-F958 Build/AP3A.240905.015) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.86 Mobile Safari/537.36'
            },
            responseType: 'stream'
        });

        const cleanTitle = (title || 'spotify-music').replace(/[^a-zA-Z0-9 ]/g, "");

        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Disposition', `attachment; filename="${cleanTitle}.mp3"`);

        response.data.pipe(res);

    } catch (error) {
        res.status(500).send("Error downloading file: " + error.message);
    }
                                                              }
