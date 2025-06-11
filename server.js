import express from 'express';
import cors from 'cors';
import axios from 'axios';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

// Debug environment variables
console.log('Environment variables loaded:', {
  PERPLEXITY_KEY_EXISTS: !!process.env.VITE_PERPLEXITY_API_KEY,
  PERPLEXITY_KEY_LENGTH: process.env.VITE_PERPLEXITY_API_KEY?.length,
  ENV_KEYS: Object.keys(process.env).filter(key => key.startsWith('VITE_')),
  DIRNAME: __dirname
});

const app = express();
app.use(cors());
app.use(express.json());

const PERPLEXITY_API_KEY = process.env.VITE_PERPLEXITY_API_KEY;

// Debug log
console.log('API Key available:', !!PERPLEXITY_API_KEY);
console.log('API Key length:', PERPLEXITY_API_KEY?.length);

app.post('/api/chat', async (req, res) => {
  try {
    console.log('Received request:', req.body);
    
    if (!PERPLEXITY_API_KEY) {
      console.error('API Key missing. Environment:', {
        key_exists: !!process.env.VITE_PERPLEXITY_API_KEY,
        key_length: process.env.VITE_PERPLEXITY_API_KEY?.length
      });
      throw new Error('Perplexity API key is not configured');
    }

    const requestData = {
      model: 'sonar',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful AI assistant focused on providing accurate and concise information about finance and technology news.'
        },
        {
          role: 'user',
          content: req.body.prompt
        }
      ]
    };

    console.log('Sending request to Perplexity:', requestData);

    try {
      const response = await axios.post(
        'https://api.perplexity.ai/chat/completions',
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      console.log('Received response:', response.data);
      res.json(response.data);
    } catch (axiosError) {
      console.error('Axios error details:', {
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        data: axiosError.response?.data,
        headers: axiosError.response?.headers,
        message: axiosError.message
      });
      throw axiosError;
    }
  } catch (error) {
    console.error('Detailed error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      headers: error.response?.headers
    });
    
    res.status(500).json({
      error: 'Failed to get response from Perplexity API',
      details: error.response?.data || error.message
    });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
}); 