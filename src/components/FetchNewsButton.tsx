import { useState } from 'react'
import { fetchAndStorePerplexityNews } from '../services/perplexityService'
import { useArticles } from '../hooks/useArticles'
import type { FilterOptions } from './FilterBar'
import './FetchNewsButton.css'

interface FetchNewsButtonProps {
  filters: FilterOptions
}

export function FetchNewsButton({ filters }: FetchNewsButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { addArticle } = useArticles()

  const handleFetchNews = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      console.log('Starting to fetch news with filters:', filters)
      const articles = await fetchAndStorePerplexityNews(addArticle, filters)
      console.log('Successfully fetched articles:', articles)
    } catch (error: any) {
      console.error('Failed to fetch news:', error)
      setError(error.message || 'Failed to fetch news. Please try again later.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fetch-news-container">
      <button 
        className="fetch-news-button"
        onClick={handleFetchNews}
        disabled={isLoading}
      >
        {isLoading ? 'Fetching...' : 'Fetch Latest News'}
      </button>
      {error && (
        <p className="fetch-news-error" style={{ whiteSpace: 'pre-line' }}>
          {error}
        </p>
      )}
    </div>
  )
} 