import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Article, ArticleInsert } from '../types/database.types'

export function useArticles() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchArticles()
  }, [])

  const fetchArticles = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      setArticles(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching articles')
    } finally {
      setLoading(false)
    }
  }

  const addArticle = async (article: ArticleInsert) => {
    try {
      const { data, error } = await supabase
        .from('articles')
        .insert([article])
        .select()

      if (error) {
        throw error
      }

      setArticles(prev => [...(data as Article[]), ...prev])
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while adding the article')
      throw err
    }
  }

  const deleteArticle = async (id: string) => {
    try {
      const { error } = await supabase
        .from('articles')
        .delete()
        .eq('id', id)

      if (error) {
        throw error
      }

      setArticles(prev => prev.filter(article => article.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while deleting the article')
      throw err
    }
  }

  return {
    articles,
    loading,
    error,
    fetchArticles,
    addArticle,
    deleteArticle
  }
} 