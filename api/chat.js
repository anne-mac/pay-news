import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt } = req.body;
    
    if (!process.env.VITE_PERPLEXITY_API_KEY) {
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
          content: prompt
        }
      ]
    };

    const response = await axios.post(
      'https://api.perplexity.ai/chat/completions',
      requestData,
      {
        headers: {
          'Authorization': `Bearer ${process.env.VITE_PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );

    res.status(200).json(response.data);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      error: 'Failed to get response from Perplexity API',
      details: error.response?.data || error.message
    });
  }
} 