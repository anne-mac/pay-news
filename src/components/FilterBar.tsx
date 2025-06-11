import { useState } from 'react';
import './FilterBar.css';

export interface FilterOptions {
  companies: string[];
  topics: string[];
  dateRange: 'all' | 'today' | 'week' | 'month';
  minRelevanceScore: number;
}

interface FilterBarProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
}

const COMPANIES = ['Stripe', 'PayOS', 'Sardine', 'Plaid', 'Visa', 'Mastercard'];
const TOPICS = ['AI', 'Fraud', 'Payments', 'Risk', 'Compliance', 'Machine Learning', 'Automation', 'Security'];

export function FilterBar({ filters, onFiltersChange }: FilterBarProps) {
  const handleCompanyChange = (company: string) => {
    const newCompanies = filters.companies.includes(company)
      ? filters.companies.filter(c => c !== company)
      : [...filters.companies, company];
    
    const newFilters = { ...filters, companies: newCompanies };
    onFiltersChange(newFilters);
  };

  const handleTopicChange = (topic: string) => {
    const newTopics = filters.topics.includes(topic)
      ? filters.topics.filter(t => t !== topic)
      : [...filters.topics, topic];
    
    const newFilters = { ...filters, topics: newTopics };
    onFiltersChange(newFilters);
  };

  const handleDateRangeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newFilters = {
      ...filters,
      dateRange: event.target.value as FilterOptions['dateRange']
    };
    onFiltersChange(newFilters);
  };

  return (
    <div className="filter-bar">
      <div className="filter-section">
        <h3>Companies</h3>
        <div className="filter-pills">
          {COMPANIES.map(company => (
            <button
              key={company}
              className={`filter-pill ${filters.companies.includes(company) ? 'active' : ''}`}
              onClick={() => handleCompanyChange(company)}
            >
              {company}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <h3>Topics</h3>
        <div className="filter-pills">
          {TOPICS.map(topic => (
            <button
              key={topic}
              className={`filter-pill ${filters.topics.includes(topic) ? 'active' : ''}`}
              onClick={() => handleTopicChange(topic)}
            >
              {topic}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <h3>Date Range</h3>
        <select
          value={filters.dateRange}
          onChange={handleDateRangeChange}
          className="date-range-select"
        >
          <option value="all">All Time</option>
          <option value="today">Last 24 Hours</option>
          <option value="week">Last Week</option>
          <option value="month">Last Month</option>
        </select>
      </div>
    </div>
  );
} 