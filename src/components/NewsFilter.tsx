import { useState } from 'react'
import type { ArticleInsert } from '../types/database.types'
import { SearchButton } from './SearchButton'
import './NewsFilter.css'

export interface FilterOptions {
  minRelevanceScore: number
  companies: string[]
  dateRange: 'all' | 'today' | 'week' | 'month'
  topics: string[]
}

interface NewsFilterProps {
  onFilterChange: (filters: FilterOptions) => void
  onAddArticles: (articles: ArticleInsert[]) => void
}

const DEFAULT_COMPANIES = ['Stripe', 'PayOS', 'Sardine', 'Plaid', 'Visa', 'Mastercard']
const DEFAULT_TOPICS = ['AI', 'Payments', 'Fraud', 'Banking', 'Crypto', 'Regulation']

export function NewsFilter({ onFilterChange, onAddArticles }: NewsFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [filters, setFilters] = useState<FilterOptions>({
    minRelevanceScore: 7,
    companies: [],
    dateRange: 'all',
    topics: []
  })

  const handleFilterChange = (updates: Partial<FilterOptions>) => {
    const newFilters = { ...filters, ...updates }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  return (
    <div className="news-filter">
      <button 
        className="filter-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span>Filter News</span>
        <svg 
          className={`toggle-icon ${isExpanded ? 'expanded' : ''}`}
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      {isExpanded && (
        <div className="filter-panel">
          <div className="filter-section">
            <label>Minimum Relevance Score</label>
            <input
              type="range"
              min="1"
              max="10"
              step="0.5"
              value={filters.minRelevanceScore}
              onChange={(e) => handleFilterChange({ minRelevanceScore: parseFloat(e.target.value) })}
            />
            <span className="score-value">{filters.minRelevanceScore}</span>
          </div>

          <div className="filter-section">
            <label>Companies</label>
            <div className="tag-grid">
              {DEFAULT_COMPANIES.map(company => (
                <button
                  key={company}
                  className={`tag ${filters.companies.includes(company) ? 'active' : ''}`}
                  onClick={() => {
                    const newCompanies = filters.companies.includes(company)
                      ? filters.companies.filter(c => c !== company)
                      : [...filters.companies, company]
                    handleFilterChange({ companies: newCompanies })
                  }}
                >
                  {company}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-section">
            <label>Date Range</label>
            <div className="date-buttons">
              {(['all', 'today', 'week', 'month'] as const).map(range => (
                <button
                  key={range}
                  className={`date-button ${filters.dateRange === range ? 'active' : ''}`}
                  onClick={() => handleFilterChange({ dateRange: range })}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-section">
            <label>Topics</label>
            <div className="tag-grid">
              {DEFAULT_TOPICS.map(topic => (
                <button
                  key={topic}
                  className={`tag ${filters.topics.includes(topic) ? 'active' : ''}`}
                  onClick={() => {
                    const newTopics = filters.topics.includes(topic)
                      ? filters.topics.filter(t => t !== topic)
                      : [...filters.topics, topic]
                    handleFilterChange({ topics: newTopics })
                  }}
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>

          <SearchButton 
            filters={filters}
            onAddArticles={onAddArticles}
            disabled={filters.companies.length === 0 && filters.topics.length === 0}
          />
        </div>
      )}
    </div>
  )
} 