import { useState, useEffect } from 'react'
import type { FilterOptions } from './NewsFilter'
import type { ArticleInsert } from '../types/database.types'
import './SearchButton.css'

const API_BASE_URL = 'http://localhost:3001'

interface SearchButtonProps {
  filters: FilterOptions
  onAddArticles: (articles: ArticleInsert[]) => void
  disabled?: boolean
}

export function SearchButton({ filters, onAddArticles, disabled = false }: SearchButtonProps) {
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [serverStatus, setServerStatus] = useState<'unknown' | 'connected' | 'error'>('unknown')

  // Test server connection on mount and every 30 seconds
  useEffect(() => {
    const testConnection = async () => {
      try {
        console.log('Testing server connection...')
        const response = await fetch(`${API_BASE_URL}/api/test`, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }
        })
        
        if (!response.ok) {
          console.error('Server test failed:', {
            status: response.status,
            statusText: response.statusText
          })
          throw new Error(`Server test failed: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        console.log('Server test response:', data)
        setServerStatus('connected')
        setError(null)
      } catch (err) {
        console.error('Server connection test failed:', err)
        setServerStatus('error')
        setError(`Cannot connect to server (${err instanceof Error ? err.message : 'Unknown error'}). Please ensure the server is running at ${API_BASE_URL}`)
      }
    }

    // Test immediately
    testConnection()

    // Then test every 30 seconds
    const interval = setInterval(testConnection, 30000)

    // Cleanup interval on unmount
    return () => clearInterval(interval)
  }, [])

  const handleSearch = async () => {
    if (serverStatus !== 'connected') {
      setError('Cannot search: Server is not connected')
      return
    }

    setIsSearching(true)
    setError(null)

    try {
      console.log('Sending search request with filters:', filters)
      const response = await fetch(`${API_BASE_URL}/api/search-articles`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filters }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Server error response:', {
          status: response.status,
          statusText: response.statusText,
          data: errorData
        })
        throw new Error(errorData.details || errorData.error || `Server error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (!data.articles) {
        console.error('Unexpected response format:', data)
        throw new Error('Invalid response format from server')
      }
      
      // Transform articles to match our insert type
      const articlesToAdd = data.articles.map((article: any) => ({
        title: article.title,
        url: article.url,
        summary: article.summary,
        relevance_score: article.relevance_score
      }))

      console.log('Successfully fetched articles:', articlesToAdd)
      onAddArticles(articlesToAdd)
    } catch (err) {
      console.error('Search error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred while searching')
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="search-button-container">
      <button 
        className={`search-button ${serverStatus === 'error' ? 'error' : ''}`}
        onClick={handleSearch}
        disabled={disabled || isSearching || serverStatus !== 'connected'}
        title={serverStatus === 'error' ? 'Server is not connected' : undefined}
      >
        {isSearching ? (
          <>
            <div className="search-spinner"></div>
            <span>Searching...</span>
          </>
        ) : serverStatus === 'error' ? (
          <>
            <svg 
              className="error-icon" 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>Server Disconnected</span>
          </>
        ) : (
          <>
            <svg 
              className="search-icon" 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <span>Search with Filters</span>
          </>
        )}
      </button>
      {error && <div className="search-error">{error}</div>}
      <div className="server-status">
        {serverStatus === 'unknown' && 'Checking server connection...'}
        {serverStatus === 'connected' && 'Server connected'}
        {serverStatus === 'error' && 'Server disconnected'}
      </div>
    </div>
  )
} 