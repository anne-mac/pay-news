import axios from 'axios'
import type { ArticleInsert } from '../types/database.types'

const API_URL = import.meta.env.PROD ? '/api/chat' : 'http://localhost:3001/api/chat'

const generateNewsPrompt = () => `
Find the top 20 most relevant and recent news articles about AI and agentic payments in fintech, focusing on these companies and topics:

COMPANIES:
- Stripe (AI payment processing, autonomous payments)
- PayOS (AI-driven payment infrastructure)
- Sardine (AI fraud prevention, autonomous risk)
- Plaid (AI financial connections, autonomous banking)
- Visa/Mastercard (AI payment networks)

KEY TOPICS:
- AI-powered payment processing
- Autonomous/agentic payment systems
- AI fraud detection in payments
- Machine learning in financial transactions
- AI-driven financial automation

For each article, you MUST provide ALL of the following fields:
{
  "title": "Full article title",
  "url": "Complete, direct link to the article",
  "summary": "One sentence summary focusing on AI/autonomous payment aspects",
  "relevance_score": "Score from 1-10 based on relevance to AI payments"
}

REQUIREMENTS:
1. ALL fields must be provided for each article
2. URLs must be complete, valid, and directly accessible
3. Summaries must specifically highlight AI/autonomous payment aspects
4. Only include articles from verifiable sources
5. Articles must have a relevance score of 7 or higher
6. Do not include articles without specific, working URLs
7. Sort results by relevance_score (descending)

Format your response as a JSON array. Return only the most relevant articles that meet ALL criteria.`.trim()

export async function fetchPerplexityNews(): Promise<ArticleInsert[]> {
  try {
    console.log('Starting Perplexity API call...')

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt: generateNewsPrompt() })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('API Error:', errorText)
      throw new Error(`Chat API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log('Raw API Response:', data)

    if (!data.choices || !data.choices[0]?.message?.content) {
      console.error('Invalid API response structure:', data)
      throw new Error('Invalid response format from Chat API')
    }

    // Parse the response content as JSON
    const content = data.choices[0].message.content.trim()
    console.log('Content to parse:', content)
    
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
      console.log('Successfully parsed articles:', articles)

      // Validate each article has required fields and meets criteria
      articles = articles.filter(article => {
        const isValid = article.title && 
                       article.url && 
                       article.summary &&
                       article.relevance_score &&
                       typeof article.title === 'string' && 
                       typeof article.url === 'string' && 
                       typeof article.summary === 'string' &&
                       typeof article.relevance_score === 'number' &&
                       article.title.trim() !== '' &&
                       article.url.trim() !== '' &&
                       article.summary.trim() !== '' &&
                       article.relevance_score >= 7 &&
                       article.url.startsWith('http')

        if (!isValid) {
          console.warn('Filtering out invalid article:', article)
        }
        return isValid
      })

      // Sort by relevance score
      articles.sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0))

      // Take top 9 articles for the 3x3 grid
      articles = articles.slice(0, 9)

      if (articles.length === 0) {
        throw new Error('No valid articles found in response')
      }

    } catch (error: any) {
      console.error('Failed to parse Perplexity response:', error)
      console.error('Raw content:', content)
      throw new Error(`Failed to parse JSON response: ${error.message || 'Unknown parsing error'}`)
    }

    // Add fetched_at timestamp to each article
    articles = articles.map(article => ({
      ...article,
      fetched_at: new Date().toISOString()
    }))

    return articles
  } catch (error) {
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
    
    console.log('Storing articles...')
    const promises = articles.map(article => addArticle(article))
    const results = await Promise.all(promises)
    console.log('Articles stored successfully:', results)
    
    return articles
  } catch (error) {
    console.error('Error in fetchAndStorePerplexityNews:', error)
    throw error
  }
} 