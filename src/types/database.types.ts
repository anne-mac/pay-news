export interface Article {
  id: string
  title: string
  url: string
  summary: string
  relevance_score: number
  fetched_at: string
  created_at: string
}

export type ArticleInsert = Omit<Article, 'id' | 'created_at'> 