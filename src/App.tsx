import './App.css'
import { ArticleList } from './components/ArticleList'
import { FetchNewsButton } from './components/FetchNewsButton'

function App() {
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
