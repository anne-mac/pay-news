import axios from 'axios'
import type { ArticleInsert } from '../types/database.types'

const API_URL = import.meta.env.PROD ? '/api/chat' : 'http://localhost:3001/api/chat'

const generateNewsPrompt = () => `
Find 5 recent news articles about fintech companies, focusing on:
- Stripe
- PayOS
- Sardine
- Plaid
- Visa/Mastercard

For each article, you MUST provide ALL of the following fields (no fields can be empty or missing):
{
  "title": "Full article title",
  "url": "Complete, direct link to the article",
  "summary": "One sentence summary of the key points"
}

IMPORTANT:
- ALL fields must be provided for each article
- URLs must be complete and valid
- Summaries must be informative and complete
- Do not include any articles with missing information

Format your response as a JSON array of exactly 5 articles. Only include articles from reputable sources.`.trim()

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

      // Validate each article has required fields
      articles = articles.filter(article => {
        const isValid = article.title && article.url && article.summary &&
                       typeof article.title === 'string' && 
                       typeof article.url === 'string' && 
                       typeof article.summary === 'string' &&
                       article.title.trim() !== '' &&
                       article.url.trim() !== '' &&
                       article.summary.trim() !== ''

        if (!isValid) {
          console.warn('Filtering out invalid article:', article)
        }
        return isValid
      })

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