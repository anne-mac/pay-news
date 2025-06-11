// Test comment to trigger Git
import { Chat } from './components/Chat'
import { ArticleList } from './components/ArticleList'
import { FetchNewsButton } from './components/FetchNewsButton'
import './App.css'

function App() {
  console.log('App component rendering')
  return (
    <div className="app">
      <header className="app-header">
        <h1>🚀 PayNews Pro</h1>
      </header>
      <main>
        <div className="news-section">
          <FetchNewsButton />
          <ArticleList />
        </div>
        <div className="chat-section">
          <h2>AI Chat Assistant</h2>
          <Chat />
        </div>
      </main>
    </div>
  )
}

export default App
