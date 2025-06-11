export interface Article {
  id: string
  title: string
  url: string
  summary: string
  relevance_score: number
  fetched_at: string
  published_at: string
  source: string
  companies: string[]
  topics: string[]
}

export type ArticleInsert = Omit<Article, 'id' | 'companies' | 'topics' | 'created_at'> 