import { useState, useEffect } from 'react'
import type { Article, ArticleInsert } from '../types/database.types'
import { supabase } from '../lib/supabaseClient'

const STORAGE_KEY = 'paynews_articles'

export function useArticles() {
  const [articles, setArticles] = useState<Article[]>(() => {
    // Load initial state from localStorage
    const saved = localStorage.getItem(STORAGE_KEY)
    console.log('Initial load from localStorage:', saved ? JSON.parse(saved) : [])
    return saved ? JSON.parse(saved) : []
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Save to localStorage whenever articles change
  useEffect(() => {
    console.log('Saving articles to localStorage:', articles)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(articles))
  }, [articles])

  const fetchArticles = async () => {
    setLoading(true)
    try {
      console.log('Fetching articles from Supabase')
      const { data, error } = await supabase
        .from('payarticles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      console.log('Loaded articles from Supabase:', data)
      setArticles(data)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (err) {
      console.error('Error fetching articles:', err)
      // Fallback to localStorage if Supabase fails
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const loadedArticles = JSON.parse(saved)
        console.log('Fallback: Loaded articles from localStorage:', loadedArticles)
        setArticles(loadedArticles)
      }
      setError(err instanceof Error ? err.message : 'Failed to fetch articles')
    } finally {
      setLoading(false)
    }
  }

  const addArticle = async (article: ArticleInsert) => {
    try {
      console.log('Adding new article:', article)
      
      // First check if article exists in Supabase
      const { data: existingArticles } = await supabase
        .from('payarticles')
        .select('*')
        .eq('url', article.url)
        .order('created_at', { ascending: false })
        .limit(1)

      if (existingArticles && existingArticles.length > 0) {
        // If article exists in Supabase, use that version
        console.log('Using existing article from Supabase:', existingArticles[0])
        setArticles(prev => {
          // Only add if not already in the list
          if (!prev.some(a => a.id === existingArticles[0].id)) {
            return [existingArticles[0], ...prev]
          }
          return prev
        })
      } else {
        // If article doesn't exist in Supabase, create new one
        const { data: newArticle, error } = await supabase
          .from('payarticles')
          .insert([article])
          .select()
          .single()

        if (error) {
          console.error('Error storing in Supabase:', error)
          // Create temporary article for display
          const tempArticle: Article = {
            ...article,
            id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
            companies: [],
            topics: []
          }
          setArticles(prev => [tempArticle, ...prev])
        } else if (newArticle) {
          console.log('Successfully added new article to Supabase:', newArticle)
          setArticles(prev => [newArticle, ...prev])
        }
      }
    } catch (err) {
      console.error('Error processing article:', err)
      setError(err instanceof Error ? err.message : 'Failed to process article')
    }
  }

  // Load articles from Supabase on mount
  useEffect(() => {
    fetchArticles()
  }, [])

  const deleteArticle = async (id: string) => {
    try {
      console.log('Deleting article:', id)
      setArticles(prev => prev.filter(article => article.id !== id))
    } catch (err) {
      console.error('Error deleting article:', err)
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while deleting the article'
      setError(errorMessage)
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