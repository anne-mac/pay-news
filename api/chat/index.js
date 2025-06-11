export const config = {
  runtime: 'edge'
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  try {
    const body = await req.json();
    const { prompt } = body;
    
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

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.VITE_PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });

    const data = await response.json();
    
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
} 