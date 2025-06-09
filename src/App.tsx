import './App.css'
import { useEffect } from 'react'
import { ArticleList } from './components/ArticleList'
import { FetchNewsButton } from './components/FetchNewsButton'

function App() {
  useEffect(() => {
    console.log('App mounted')
    // Log environment variables (only first few characters for security)
    console.log('VITE_SUPABASE_URL exists:', !!import.meta.env.VITE_SUPABASE_URL)
    console.log('VITE_SUPABASE_ANON_KEY exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY)
    console.log('VITE_PERPLEXITY_API_KEY exists:', !!import.meta.env.VITE_PERPLEXITY_API_KEY)
  }, [])

  return (
    <div className="app">
      <header className="app-header">
        <h1>Welcome to PayNews</h1>
      </header>
      <main className="app-main">
        <FetchNewsButton />
        <ArticleList />
      </main>
    </div>
  )
}

export default App
