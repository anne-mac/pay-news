export const config = {
  runtime: 'edge'
};

// Helper function to extract JSON array from text
function extractJsonArray(text) {
  try {
    // First try direct JSON parse
    const parsed = JSON.parse(text);
    
    // If it's the Perplexity API response structure
    if (parsed.choices && parsed.choices[0]?.message?.content) {
      const content = parsed.choices[0].message.content;
      
      // Try to extract JSON from code blocks first
      const jsonMatch = content.match(/```(?:json)?\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        try {
          const jsonStr = jsonMatch[1];
          const extracted = JSON.parse(jsonStr);
          if (Array.isArray(extracted)) {
            return extracted;
          }
        } catch (e) {
          console.log('Failed to parse JSON from code block:', e);
        }
      }
      
      // If no code block or parsing failed, try to find JSON array in the content
      const arrayMatch = content.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (arrayMatch) {
        try {
          const extracted = JSON.parse(arrayMatch[0]);
          if (Array.isArray(extracted)) {
            return extracted;
          }
        } catch (e) {
          console.log('Failed to parse JSON array from content:', e);
        }
      }
    }
    
    // If it's already an array, return it
    if (Array.isArray(parsed)) {
      return parsed;
    }
    
    // If it's an object with articles array
    if (parsed.articles && Array.isArray(parsed.articles)) {
      return parsed.articles;
    }
    
    throw new Error('No valid article array found in response');
  } catch (error) {
    console.error('Error parsing JSON:', error);
    throw new Error(`Failed to extract JSON: ${error.message}`);
  }
}

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
    const { message, prompt } = body;
    const userMessage = message || prompt;
    
    if (!userMessage || typeof userMessage !== 'string' || userMessage.trim() === '') {
      throw new Error('Message is required and must be a non-empty string');
    }
    
    if (!process.env.VITE_PERPLEXITY_API_KEY) {
      throw new Error('Perplexity API key is not configured');
    }

    const requestData = {
      model: 'sonar',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that provides news articles in a specific JSON format. Always respond with a JSON array of articles, each containing title, url, summary, and relevance_score fields. Wrap the JSON array in ```json``` code blocks.'
        },
        {
          role: 'user',
          content: userMessage.trim()
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

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Perplexity API error: ${response.status} ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0]?.message?.content) {
      throw new Error('Invalid response format from Perplexity API');
    }

    const content = data.choices[0].message.content;
    console.log('Raw content from Perplexity:', content);
    
    const articles = extractJsonArray(content);
    
    if (!Array.isArray(articles) || articles.length === 0) {
      throw new Error('No valid articles found in response');
    }

    return new Response(JSON.stringify({ articles }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to get response from Perplexity API',
      details: error.message 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
} 