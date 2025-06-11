// Test comment to trigger Git
import { useState, useEffect } from 'react'
import { Chat } from './components/Chat'
import { ArticleList } from './components/ArticleList'
import './App.css'

function App() {
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    // Add error logging
    const handleError = (error: ErrorEvent) => {
      console.error('Runtime error:', error)
      setError(error.error)
    }
    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [])

  if (error) {
    return (
      <div className="error-boundary">
        <h1>Something went wrong</h1>
        <pre>{error.message}</pre>
      </div>
    )
  }

  console.log('App component rendering')
  return (
    <div className="app">
      <header className="app-header">
        <h1>🚀 PayNews Pro</h1>
      </header>
      <main>
        <ArticleList />
        <div className="chat-section">
          <h2>AI Chat Assistant</h2>
          <Chat />
        </div>
      </main>
    </div>
  )
}

export default App
