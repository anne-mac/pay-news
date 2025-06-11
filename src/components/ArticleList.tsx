import { useArticles } from '../hooks/useArticles'
import type { Article } from '../types/database.types'
import './ArticleList.css'

export function ArticleList() {
  console.log('ArticleList component rendering')
  const { articles, loading, error } = useArticles()

  console.log('ArticleList state:', { articles, loading, error }) // Debug log

  if (loading) {
    return (
      <div className="articles-loading">
        <div className="loading-spinner"></div>
        <p>Loading articles...</p>
      </div>
    )
  }

  if (error) {
    return <div className="articles-error">{error}</div>
  }

  if (!articles || articles.length === 0) {
    return <div className="articles-empty">No articles yet. Click "Fetch Latest News" to get started.</div>
  }

  // Take only the first 9 articles
  const displayedArticles = articles.slice(0, 9)

  return (
    <div className="articles-container">
      <div className="articles-grid">
        {displayedArticles.map((article) => (
          <div key={article.id} className="article-card">
            <div className="article-content">
              <h3 className="article-title">
                <a href={article.url} target="_blank" rel="noopener noreferrer">
                  {article.title}
                </a>
              </h3>
              <p className="article-summary">{article.summary}</p>
              <div className="article-footer">
                <div className="article-meta">
                  <span className="article-date">
                    {new Date(article.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                  <span className="article-score" title="AI Relevance Score">
                    🎯 {(article.relevance_score ?? 7.0).toFixed(1)}
                  </span>
                </div>
                <a 
                  href={article.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="article-link"
                  aria-label={`Read more about ${article.title}`}
                >
                  <svg 
                    className="arrow-icon" 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 