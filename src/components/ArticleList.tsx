import { useState } from 'react'
import { useArticles } from '../hooks/useArticles'
import type { Article } from '../types/database.types'
import { FilterBar, type FilterOptions } from './FilterBar'
import { FetchNewsButton } from './FetchNewsButton'
import './ArticleList.css'
import axios from 'axios'

export function ArticleList() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAllArticles, setShowAllArticles] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    companies: [],
    topics: [],
    dateRange: 'all',
    minRelevanceScore: 7
  });

  const filterArticles = (articles: Article[]) => {
    if (!articles) return []
    
    const filtered = articles.filter(article => {
      // Filter by minimum relevance score
      if (article.relevance_score < filters.minRelevanceScore) {
        return false
      }

      // Filter by companies
      if (filters.companies.length > 0) {
        const hasMatchingCompany = filters.companies.some(company =>
          article.companies?.includes(company)
        )
        if (!hasMatchingCompany) return false
      }

      // Filter by topics
      if (filters.topics.length > 0) {
        const hasMatchingTopic = filters.topics.some(topic =>
          article.topics?.includes(topic)
        )
        if (!hasMatchingTopic) return false
      }

      // Filter by date range
      if (filters.dateRange !== 'all' && article.published_at) {
        const articleDate = new Date(article.published_at)
        const now = new Date()
        const daysDiff = (now.getTime() - articleDate.getTime()) / (1000 * 60 * 60 * 24)

        switch (filters.dateRange) {
          case 'today':
            if (daysDiff >= 1) return false
            break
          case 'week':
            if (daysDiff >= 7) return false
            break
          case 'month':
            if (daysDiff >= 30) return false
            break
        }
      }

      return true
    })

    // If no filters are active and not showing all articles, return only top 9
    const noFiltersActive = filters.companies.length === 0 && 
                          filters.topics.length === 0 && 
                          filters.dateRange === 'all' &&
                          filters.minRelevanceScore === 7

    if (noFiltersActive && !showAllArticles) {
      return filtered.slice(0, 9)
    }

    return filtered
  }

  const filteredArticles = filterArticles(articles)

  const fetchArticles = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('/api/chat', { message: 'Get latest news about AI in fintech' });
      const data = response.data;
      
      // Ensure we have an array of articles
      if (!Array.isArray(data)) {
        console.error('Received non-array response:', data);
        setError('Invalid response format from server');
        return;
      }
      
      // Validate each article has required fields
      const validArticles = data.filter(article => 
        article && 
        typeof article === 'object' && 
        article.title && 
        article.url && 
        article.summary
      );
      
      if (validArticles.length === 0) {
        setError('No valid articles found in response');
        return;
      }
      
      setArticles(validArticles);
    } catch (err) {
      console.error('Error fetching articles:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch articles');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="articles-container">
      <FilterBar filters={filters} onFiltersChange={setFilters} />
      <FetchNewsButton filters={filters} />
      
      {loading ? (
        <div className="message">Loading articles...</div>
      ) : error ? (
        <div className="message error">{error}</div>
      ) : filteredArticles.length === 0 ? (
        <div className="message">No articles found matching your criteria.</div>
      ) : (
        <>
          <div className="articles-grid">
            {filteredArticles.map((article) => (
              <div key={article.url} className="article-card">
                <div className="article-content">
                  <h3 className="article-title">
                    <a href={article.url} target="_blank" rel="noopener noreferrer">
                      {article.title}
                    </a>
                  </h3>
                  <p className="article-summary">{article.summary}</p>
                  <div className="article-metadata">
                    {article.companies?.map((company) => (
                      <span key={company} className="article-tag">
                        {company}
                      </span>
                    ))}
                    {article.topics?.map((topic) => (
                      <span key={topic} className="article-tag">
                        {topic}
                      </span>
                    ))}
                  </div>
                  <div className="article-source-date">
                    <span>{article.source}</span>
                    <span>{new Date(article.published_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {filteredArticles.length > 9 && !showAllArticles && (
            <button 
              className="show-more-button"
              onClick={() => setShowAllArticles(true)}
            >
              Show All Articles
            </button>
          )}
        </>
      )}
    </div>
  )
} 