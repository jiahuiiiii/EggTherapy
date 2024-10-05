import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
const PORT = 3001; // Your desired port
const apiKey = 'sk_866ba3f1bfeed949a1dbc5a3902f6567f58af20f6e1f408f';

app.use(cors()); // Allow all origins for simplicity
app.use(express.json());

app.post('/text-to-speech', async (req, res) => {
    try {
        const response = await axios.post('https://api.elevenlabs.io/v1/text-to-speech', req.body, {
            headers: {
                'Authorization': `Bearer ${apiKey}`, // Replace with your actual API key
                'Content-Type': 'application/json'
            }
        });
        res.send(response.data); // Send back the response data
    } catch (error) {
        console.error('Error forwarding request:', error);
        res.status(error.response?.status || 500).send(error.message);
    }
});

app.listen(PORT, () => {
    console.log(`Proxy server running at http://localhost:${PORT}`);
});
