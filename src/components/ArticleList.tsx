import { useArticles } from '../hooks/useArticles'
import type { Article } from '../types/database.types'
import './ArticleList.css'

function ArticleCard({ article }: { article: Article }) {
  const formattedDate = new Date(article.fetched_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  return (
    <article className="article-card">
      <div className="article-content">
        <h2 className="article-title">
          <a href={article.url} target="_blank" rel="noopener noreferrer">
            {article.title}
          </a>
        </h2>
        <p className="article-summary">{article.summary}</p>
        <div className="article-footer">
          <span className="article-date">{formattedDate}</span>
          <a 
            href={article.url} 
            className="read-more"
            target="_blank" 
            rel="noopener noreferrer"
          >
            Read More →
          </a>
        </div>
      </div>
    </article>
  )
}

export function ArticleList() {
  const { articles, loading, error } = useArticles()

  if (loading) {
    return (
      <div className="articles-loading">
        <div className="loading-spinner"></div>
        <p>Loading latest fintech news...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="articles-error">
        <p>Error: {error}</p>
      </div>
    )
  }

  if (articles.length === 0) {
    return (
      <div className="articles-empty">
        <p>No articles found. Click the "Fetch Latest News" button to get started.</p>
      </div>
    )
  }

  return (
    <div className="articles-container">
      <div className="article-list">
        {articles.map(article => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </div>
  )
} 