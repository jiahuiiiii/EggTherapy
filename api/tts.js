const express = require('express');
const axios = require('axios');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = 3000;

// Enable CORS for all routes (adjust origin as needed)
app.use(cors());
app.use(express.json());

// ElevenLabs API base URL
const elevenLabsBaseURL = 'https://api.elevenlabs.io/v1';

// Endpoint to convert text to speech using ElevenLabs
app.post('/api/text-to-speech', async (req, res) => {
  const { text, voiceId } = req.body;

  // Check if voiceId and text are provided
  if (!text || !voiceId) {
    return res.status(400).json({ error: 'Text and Voice ID are required' });
  }

  try {
    const response = await axios.post(
      `${elevenLabsBaseURL}/text-to-speech/${voiceId}`, 
      { text },
      {
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': 'sk_52bcad9d644fe319bb4237ec3209772a6ecfa68c78b95501', // Load API key from environment
        },
        responseType: 'arraybuffer' // Handle audio data
      }
    );

    // Set appropriate headers and send the audio data
    res.set('Content-Type', 'audio/mpeg');
    res.send(response.data);
  } catch (error) {
    console.error('Error calling ElevenLabs API:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to process text-to-speech request' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});