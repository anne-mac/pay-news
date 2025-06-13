import axios from 'axios'
import type { ArticleInsert } from '../types/database.types'

const API_URL = import.meta.env.PROD ? '/api/chat' : 'http://localhost:3001/api/chat'

const generateNewsPrompt = () => `
Find the top 100 most relevant and recent news articles about AI and agentic payments in fintech, focusing on these companies and topics:

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

export async function fetchPerplexityNews(filters = {}): Promise<ArticleInsert[]> {
  try {
    console.log('Starting Perplexity API call...')

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        message: generateNewsPrompt(),
        filters
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('API Error:', errorText)
      throw new Error(`Chat API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log('Received response:', data)

    if (!data.articles || !Array.isArray(data.articles)) {
      throw new Error('Invalid response format: articles array not found')
    }

    // Add fetched_at timestamp to each article
    return data.articles.map((article: ArticleInsert) => ({
      ...article,
      fetched_at: new Date().toISOString()
    }))
  } catch (error) {
    console.error('Error fetching news from Perplexity:', error)
    throw error
  }
}

export async function fetchAndStorePerplexityNews(
  addArticle: (article: ArticleInsert) => Promise<any>,
  filters = {}
) {
  try {
    console.log('Fetching news from Perplexity...')
    const articles = await fetchPerplexityNews(filters)
    
    // Store each article
    for (const article of articles) {
      await addArticle(article)
    }

    return articles
  } catch (error) {
    console.error('Error in fetchAndStorePerplexityNews:', error)
    throw error
  }
} 