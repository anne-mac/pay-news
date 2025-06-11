import { useArticles } from '../hooks/useArticles'
import type { Article } from '../types/database.types'
import './ArticleList.css'

export function ArticleList() {
  console.log('ArticleList component rendering')
  const { articles, loading, error } = useArticles()

  console.log('ArticleList state:', { articles, loading, error }) // Debug log

  if (loading) {
    console.log('ArticleList: Loading state')
    return <div className="message">Loading...</div>
  }

  if (error) {
    console.log('ArticleList: Error state:', error)
    return <div className="message error">{error}</div>
  }

  if (!articles || articles.length === 0) {
    console.log('ArticleList: No articles state')
    return <div className="message">No articles yet. Click "Fetch Latest News" to get started.</div>
  }

  console.log('ArticleList: Rendering articles:', articles)
  return (
    <div className="articles-container">
      <ul className="articles-list">
        {articles.map((article) => (
          <li key={article.id} className="article-item">
            <h3>
              <a href={article.url} target="_blank" rel="noopener noreferrer">
                {article.title}
              </a>
            </h3>
            <p>{article.summary}</p>
          </li>
        ))}
      </ul>
    </div>
  )
} 