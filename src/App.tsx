import './App.css'

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>🚀 PayNews - Your Fintech News Hub</h1>
      </header>
      <main className="app-main">
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <button 
            style={{ 
              padding: '10px 20px', 
              fontSize: '16px', 
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Fetch Latest News
          </button>
        </div>
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <p>Your fintech news will appear here!</p>
        </div>
      </main>
    </div>
  )
}

export default App
