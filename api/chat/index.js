export const config = {
  runtime: 'edge'
};

// Helper function to validate JSON
function isValidJSON(str) {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
}

// Helper function to extract JSON array from text
function extractJsonArray(text) {
  try {
    // First try direct JSON parse
    if (isValidJSON(text)) {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      if (parsed.articles && Array.isArray(parsed.articles)) {
        return parsed.articles;
      }
    }
    
    // If it's the Perplexity API response structure
    if (text.includes('choices') && text.includes('message')) {
      try {
        const parsed = JSON.parse(text);
        if (parsed.choices && parsed.choices[0]?.message?.content) {
          const content = parsed.choices[0].message.content;
          
          // Try to extract JSON from code blocks first
          const jsonMatch = content.match(/```(?:json)?\n([\s\S]*?)\n```/);
          if (jsonMatch) {
            const jsonStr = jsonMatch[1];
            if (isValidJSON(jsonStr)) {
              const extracted = JSON.parse(jsonStr);
              if (Array.isArray(extracted)) {
                return extracted;
              }
            }
          }
          
          // If no code block or parsing failed, try to find JSON array in the content
          const arrayMatch = content.match(/\[\s*\{[\s\S]*\}\s*\]/);
          if (arrayMatch) {
            const jsonStr = arrayMatch[0];
            if (isValidJSON(jsonStr)) {
              const extracted = JSON.parse(jsonStr);
              if (Array.isArray(extracted)) {
                return extracted;
              }
            }
          }
        }
      } catch (e) {
        console.log('Failed to parse Perplexity response structure:', e);
      }
    }
    
    throw new Error('No valid article array found in response');
  } catch (error) {
    console.error('Error parsing JSON:', error);
    throw new Error(`Failed to extract JSON: ${error.message}`);
  }
}

// Fallback article when parsing fails
const fallbackArticle = {
  title: "Failed to load article",
  summary: "The AI response couldn't be parsed. Please refresh or try again later.",
  url: "#",
  relevance_score: 0
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
    const { message, prompt } = body;
    const userMessage = message || prompt;
    
    if (!userMessage || typeof userMessage !== 'string' || userMessage.trim() === '') {
      throw new Error('Message is required and must be a non-empty string');
    }
    
    if (!process.env.VITE_PERPLEXITY_API_KEY) {
      throw new Error('Perplexity API key is not configured');
    }

    const systemPrompt = `You are a helpful assistant that provides news articles in a specific JSON format. 
    Return ONLY valid JSON with the following structure:
    [
      {
        "title": "Article title",
        "url": "Article URL",
        "summary": "Article summary",
        "relevance_score": number between 0-10
      }
    ]
    Do not include any text outside of the JSON array. Ensure all URLs are valid and start with http:// or https://.`;

    const requestData = {
      model: 'sonar',
      messages: [
        {
          role: 'system',
          content: systemPrompt
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

    // Get raw response text first
    const responseText = await response.text();
    console.log('Raw response from Perplexity:', responseText);

    let articles;
    try {
      articles = extractJsonArray(responseText);
    } catch (error) {
      console.error('Failed to extract articles:', error);
      // Return fallback article if parsing fails
      return new Response(JSON.stringify({ articles: [fallbackArticle] }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    if (!Array.isArray(articles) || articles.length === 0) {
      console.log('No valid articles found, returning fallback');
      return new Response(JSON.stringify({ articles: [fallbackArticle] }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Validate each article has required fields
    articles = articles.filter(article => {
      const isValid = article.title && 
                     article.url && 
                     article.summary && 
                     typeof article.relevance_score === 'number';
      if (!isValid) {
        console.log('Filtered out invalid article:', article);
      }
      return isValid;
    });

    if (articles.length === 0) {
      console.log('No valid articles after filtering, returning fallback');
      return new Response(JSON.stringify({ articles: [fallbackArticle] }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      });
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
      details: error.message,
      articles: [fallbackArticle]
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
} 