// api/text-to-speech.js
import axios from 'axios';

export default async function handler(req, res) {
    //const apiKey = process.env.TTS_API_KEY;
    const apiKey = "sk_866ba3f1bfeed949a1dbc5a3902f6567f58af20f6e1f408f";
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { text, voice } = req.body;

    if (!text) {
        return res.status(400).json({ message: 'Text is required' });
    }

    try {
        const response = await axios.post('https://your-tts-api-endpoint', {
            text,
            voice
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            responseType: 'arraybuffer' // Adjust based on API requirements
        });

        res.setHeader('Content-Type', 'audio/mpeg'); // Adjust MIME type if necessary
        res.status(200).send(response.data);
    } catch (error) {
        console.error("Error with TTS API:", error.response?.data || error.message);
        res.status(500).json({ message: 'TTS Service Error' });
    }
}
