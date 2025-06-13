import express from 'express';
import cors from 'cors';
import axios from 'axios';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createClient } from '@supabase/supabase-js';

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

// More explicit CORS configuration
app.use(cors({
  origin: /^http:\/\/localhost:\d+$/,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true
}));

app.use(express.json());

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Add a test endpoint
app.get('/api/test', (req, res) => {
  res.json({ status: 'Server is running correctly' });
});

const PERPLEXITY_API_KEY = process.env.VITE_PERPLEXITY_API_KEY;

// Debug log
console.log('API Key available:', !!PERPLEXITY_API_KEY);
console.log('API Key length:', PERPLEXITY_API_KEY?.length);

// Helper function to extract JSON array from text
function extractJsonArray(text) {
  try {
    // First try direct JSON parse
    const parsed = JSON.parse(text);
    
    // If it's the Perplexity API response structure
    if (parsed.choices && parsed.choices[0]?.message?.content) {
      // Extract the JSON string from the content
      const content = parsed.choices[0].message.content;
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[1];
        console.log('Extracted JSON string:', jsonStr);
        return JSON.parse(jsonStr);
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

// Helper function to construct search prompt based on filters
function constructSearchPrompt(filters) {
  let prompt = `Find the top 100 most relevant and recent news articles`;

  // Add company filters
  if (filters.companies && filters.companies.length > 0) {
    prompt += ` about ${filters.companies.join(', ')}`;
  }

  // Add topic filters
  if (filters.topics && filters.topics.length > 0) {
    prompt += ` focusing on ${filters.topics.join(', ')}`;
  }

  prompt += `

For each article, you MUST provide ALL of the following fields:
{
  "title": "Full article title",
  "url": "Complete, direct link to the article",
  "summary": "One sentence summary focusing on AI/autonomous payment aspects",
  "relevance_score": "Score from 1-10 based on relevance to AI payments",
  "published_at": "YYYY-MM-DD date when the article was published",
  "source": "Abbreviated source name (e.g., TechCrunch -> TC, The Verge -> Verge)",
  "companies": ["Array of mentioned companies"],
  "topics": ["Array of relevant topics"]
}

REQUIREMENTS:
1. ALL fields must be provided for each article
2. URLs must be complete, valid, and directly accessible
3. Summaries must specifically highlight AI/autonomous payment aspects
4. Only include articles from verifiable sources
5. Articles must have a relevance score of 7 or higher
6. Do not include articles without specific, working URLs
7. Sort results by relevance_score (descending)

Format your response as a JSON array. Return only the most relevant articles that meet ALL criteria.`

  return prompt;
}

// Helper function to extract companies from text
function extractCompanies(text) {
  const companies = [
    'Stripe', 'PayOS', 'Sardine', 'Plaid', 'Visa', 'Mastercard'
  ];
  return companies.filter(company => 
    text.toLowerCase().includes(company.toLowerCase())
  );
}

// Helper function to extract topics from text
function extractTopics(text) {
  const topics = [
    'AI', 'Fraud', 'Payments', 'Risk', 'Compliance',
    'Machine Learning', 'Automation', 'Security'
  ];
  return topics.filter(topic => 
    text.toLowerCase().includes(topic.toLowerCase())
  );
}

// Helper function to process articles with metadata
function processArticles(articles) {
  return articles.map(article => {
    const text = `${article.title} ${article.summary}`;
    return {
      ...article,
      companies: extractCompanies(text),
      topics: extractTopics(text),
      published_at: new Date().toISOString() // In a real app, we'd parse this from the article
    };
  });
}

// Helper function to fetch supplementary articles from Supabase
async function fetchSupplementaryArticles(filters, limit = 100) {
  try {
    let query = supabase
      .from('payarticles')
      .select('*')
      .order('relevance_score', { ascending: false });

    // Apply filters
    if (filters.companies && filters.companies.length > 0) {
      query = query.contains('companies', filters.companies);
    }
    if (filters.topics && filters.topics.length > 0) {
      query = query.contains('topics', filters.topics);
    }
    if (filters.minRelevanceScore) {
      query = query.gte('relevance_score', filters.minRelevanceScore);
    }
    if (filters.dateRange && filters.dateRange !== 'all') {
      const now = new Date();
      let startDate;
      switch (filters.dateRange) {
        case 'today':
          startDate = new Date(now.setDate(now.getDate() - 1));
          break;
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
      }
      query = query.gte('published_at', startDate.toISOString());
    }

    query = query.limit(limit);
    const { data, error } = await query;

    if (error) {
      console.error('Error fetching from Supabase:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchSupplementaryArticles:', error);
    return [];
  }
}

// Helper function to deduplicate articles
function deduplicateArticles(articles) {
  const seen = new Set();
  return articles.filter(article => {
    const key = article.url;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

// Helper function to combine and sort articles
function combineAndSortArticles(perplexityArticles, supabaseArticles, limit = 100) {
  const combined = [...perplexityArticles, ...supabaseArticles];
  const deduplicated = deduplicateArticles(combined);
  const sorted = deduplicated.sort((a, b) => b.relevance_score - a.relevance_score);
  return sorted.slice(0, limit);
}

// Helper function to fetch articles from Perplexity
async function fetchArticlesFromPerplexity(prompt) {
  if (!PERPLEXITY_API_KEY) {
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
        content: prompt
      }
    ]
  };

  try {
    const response = await axios.post('https://api.perplexity.ai/chat/completions', requestData, {
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.data || !response.data.choices || !response.data.choices[0]?.message?.content) {
      throw new Error('Invalid response format from Perplexity API');
    }

    const content = response.data.choices[0].message.content;
    const articles = extractJsonArray(content);
    
    if (!Array.isArray(articles) || articles.length === 0) {
      throw new Error('No valid articles found in response');
    }

    return articles;
  } catch (error) {
    console.error('Error fetching from Perplexity:', error);
    throw error;
  }
}

// Helper function to clean and validate article data
function cleanArticleData(article) {
  // Ensure all required fields exist and are strings
  const cleaned = {
    title: String(article.title || '').trim(),
    url: String(article.url || '').trim(),
    summary: String(article.summary || '').trim(),
    relevance_score: Number(article.relevance_score) || 0
  };

  // Validate URL format
  try {
    new URL(cleaned.url);
  } catch {
    return null; // Invalid URL, return null to filter out
  }

  // Return null if any required field is empty
  if (!cleaned.title || !cleaned.url || !cleaned.summary || cleaned.relevance_score <= 0) {
    return null;
  }

  return cleaned;
}

// Helper function to extract and clean JSON array from text
function extractAndCleanJsonArray(content) {
  try {
    // First try to parse the entire content as JSON
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) {
      return parsed.map(cleanArticleData).filter(Boolean);
    }
  } catch (e) {
    console.log('Direct JSON parse failed, attempting to extract JSON array');
  }

  // If direct parse fails, try to extract JSON array
  const start = content.indexOf('[');
  const end = content.lastIndexOf(']') + 1;
  
  if (start === -1 || end <= 0) {
    throw new Error('No JSON array found in response');
  }
  
  const jsonContent = content.substring(start, end);
  console.log('Attempting to parse extracted JSON array:', jsonContent);
  
  try {
    const parsed = JSON.parse(jsonContent);
    if (Array.isArray(parsed)) {
      return parsed.map(cleanArticleData).filter(Boolean);
    }
  } catch (e) {
    // If JSON parsing fails, try to manually parse the array
    const articles = [];
    let currentArticle = {};
    let inArticle = false;
    let currentField = '';
    let currentValue = '';
    
    const lines = jsonContent.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed === '{') {
        inArticle = true;
        currentArticle = {};
      } else if (trimmed === '}') {
        inArticle = false;
        const cleaned = cleanArticleData(currentArticle);
        if (cleaned) articles.push(cleaned);
      } else if (inArticle) {
        const match = trimmed.match(/^"([^"]+)":\s*(.+)$/);
        if (match) {
          const [, field, value] = match;
          currentArticle[field] = value.replace(/,$/, '').replace(/^"|"$/g, '');
        }
      }
    }
    
    return articles;
  }
  
  throw new Error('Failed to parse articles from response');
}

app.post('/api/chat', async (req, res) => {
  try {
    const { message, prompt } = req.body;
    const userMessage = message || prompt;
    console.log('Received message:', userMessage);

    if (!userMessage || typeof userMessage !== 'string' || userMessage.trim() === '') {
      throw new Error('Message is required and must be a non-empty string');
    }

    const response = await axios.post(
      'https://api.perplexity.ai/chat/completions',
      {
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
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.VITE_PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Perplexity API response:', JSON.stringify(response.data, null, 2));
    
    const articles = extractJsonArray(JSON.stringify(response.data));
    console.log('Extracted articles:', articles);
    
    res.json({ articles });
  } catch (error) {
    console.error('Error in /api/chat:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/search-articles', async (req, res) => {
  try {
    console.log('Received filtered search request:', req.body);
    
    if (!PERPLEXITY_API_KEY) {
      throw new Error('Perplexity API key is not configured');
    }

    if (!req.body.filters) {
      throw new Error('No filters provided in request');
    }

    const searchPrompt = constructSearchPrompt(req.body.filters);
    console.log('Constructed search prompt:', searchPrompt);

    const requestData = {
      model: 'sonar',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful AI assistant focused on finding and summarizing relevant news articles. IMPORTANT: Your response must be a valid JSON array ONLY, with no additional text before or after the array. Each article must have a title, url, summary, and relevance_score. The url must be a valid HTTP/HTTPS URL.'
        },
        {
          role: 'user',
          content: searchPrompt
        }
      ]
    };

    console.log('Sending request to Perplexity...');
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

    console.log('Received response from Perplexity');
    
    if (!response.data?.choices?.[0]?.message?.content) {
      console.error('Invalid response structure:', response.data);
      throw new Error('Invalid response structure from Perplexity API');
    }

    const content = response.data.choices[0].message.content;
    console.log('Raw content from Perplexity:', content);
    
    const articles = extractAndCleanJsonArray(content);

    if (!Array.isArray(articles) || articles.length === 0) {
      throw new Error('No valid articles found that match the criteria');
    }

    // Process articles to add metadata
    const processedArticles = processArticles(articles);

    // Sort by relevance score
    processedArticles.sort((a, b) => b.relevance_score - a.relevance_score);

    res.json({ articles: processedArticles });
  } catch (error) {
    console.error('Search articles error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    
    res.status(500).json({
      error: 'Failed to search articles',
      details: error.message
    });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
}); 

function extractJSONFromText(text) {
  try {
    // First try direct JSON parse
    const jsonMatch = text.match(/\[\s*\{.*\}\s*\]/s)
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0])
      } catch (e) {
        console.log('Direct JSON parse failed, attempting to extract JSON array')
      }
    }

    // If direct parse fails, try to extract and fix the JSON array
    const arrayMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/)
    if (arrayMatch) {
      let jsonStr = arrayMatch[0]
      console.log('Attempting to parse JSON array:', jsonStr)

      // Fix unquoted summary values
      jsonStr = jsonStr.replace(/"summary":\s*([^"][^,}]*[^"}\s])/g, '"summary": "$1"')
      
      // Fix other common JSON formatting issues
      jsonStr = jsonStr
        // Fix missing quotes around property names
        .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3')
        // Fix missing commas between objects
        .replace(/}\s*{/g, '},{')
        // Fix trailing commas
        .replace(/,(\s*[}\]])/g, '$1')

      try {
        return JSON.parse(jsonStr)
      } catch (e) {
        console.error('JSON extraction failed:', e)
        throw new Error(`Failed to extract JSON: ${e.message}`)
      }
    }

    throw new Error('No JSON array found in response')
  } catch (error) {
    console.error('Error in extractJSONFromText:', error)
    throw error
  }
} 