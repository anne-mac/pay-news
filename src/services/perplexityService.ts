import axios from 'axios'
import type { ArticleInsert } from '../types/database.types'

const PERPLEXITY_API_KEY = import.meta.env.VITE_PERPLEXITY_API_KEY
const API_URL = 'https://api.perplexity.ai/chat/completions'

const generateNewsPrompt = () => `
You are a fintech industry analyst specializing in payment infrastructure and venture capital. Find 5-10 recent, high-impact news articles focusing on:

Primary Focus (High Priority):
1. PayOS and their partner Sardine - any news, partnerships, or developments
2. Agentic payments and autonomous payment systems
3. VC investments in payment infrastructure startups
4. Major developments from key players in agentic payments:
   - Stripe
   - Plaid
   - Modern Treasury
   - Circle
   - Visa/Mastercard's autonomous payment initiatives

Secondary Focus:
- Embedded finance platforms enabling autonomous transactions
- AI-driven payment processing and automation
- Regulatory developments affecting autonomous payment systems
- New startups in the agentic payments space
- Strategic partnerships between payment providers and AI companies

Format your response as a JSON array. For each article, provide:
[
  {
    "title": "Article title",
    "url": "Full article URL",
    "summary": "2-3 sentence summary highlighting relevance to agentic payments or VC activity",
    "fetched_at": "${new Date().toISOString()}"
  }
]

Prioritize articles from the last two weeks. Only include articles from reputable financial and technology news sources. Ensure all URLs are valid direct links.`.trim()

export async function fetchPerplexityNews(): Promise<ArticleInsert[]> {
  try {
    if (!PERPLEXITY_API_KEY) {
      throw new Error('Perplexity API key is not configured')
    }

    console.log('Starting Perplexity API call...')

    const response = await axios.post(
      API_URL,
      {
        model: 'sonar',
        messages: [
          {
            role: 'user',
            content: generateNewsPrompt()
          }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.data || !response.data.choices || !response.data.choices[0]) {
      console.error('Unexpected API response structure:', response.data)
      throw new Error('Invalid response structure from Perplexity API')
    }

    console.log('Perplexity API Response:', JSON.stringify(response.data, null, 2))

    // Parse the response content as JSON
    const content = response.data.choices[0].message.content.trim()
    let articles: ArticleInsert[]
    
    try {
      // Try to clean the response if it's not pure JSON
      const jsonStart = content.indexOf('[')
      const jsonEnd = content.lastIndexOf(']') + 1
      
      if (jsonStart === -1 || jsonEnd === -1) {
        console.error('Could not find JSON array in response:', content)
        throw new Error('No JSON array found in response')
      }
      
      const jsonContent = content.slice(jsonStart, jsonEnd)
      console.log('Attempting to parse JSON:', jsonContent)
      
      articles = JSON.parse(jsonContent)
    } catch (error: any) {
      console.error('Failed to parse Perplexity response:', error)
      console.error('Raw content:', content)
      throw new Error(`Failed to parse JSON response: ${error.message || 'Unknown parsing error'}`)
    }

    // Validate the articles
    const validArticles = articles.filter(article => 
      article.title && 
      article.url && 
      article.url.startsWith('http') && 
      article.summary
    )

    console.log(`Found ${validArticles.length} valid articles out of ${articles.length} total`)

    if (validArticles.length === 0) {
      console.error('No valid articles after filtering:', articles)
      throw new Error('No valid articles found in Perplexity response')
    }

    return validArticles
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const errorData = error.response?.data
      console.error('Perplexity API network error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: errorData,
        message: error.message
      })
      const errorMessage = errorData?.error?.message || error.message
      throw new Error(`Perplexity API error: ${errorMessage}`)
    }
    console.error('Error fetching news from Perplexity:', error)
    throw error
  }
}

export async function fetchAndStorePerplexityNews(
  addArticle: (article: ArticleInsert) => Promise<any>
) {
  try {
    console.log('Fetching news from Perplexity...')
    const articles = await fetchPerplexityNews()
    
    console.log('Storing articles in Supabase...')
    const promises = articles.map(article => addArticle(article))
    const results = await Promise.all(promises)
    console.log('Articles stored successfully:', results)
    
    return articles
  } catch (error) {
    console.error('Error in fetchAndStorePerplexityNews:', error)
    throw error
  }
} 