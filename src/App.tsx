// Test comment to trigger Git
import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="app">
      <header className="app-header">
        <h1>🚀 PayNews</h1>
        <p style={{ 
          color: 'rgba(255, 255, 255, 0.9)', 
          textAlign: 'center',
          margin: '1rem 0 0 0',
          fontSize: '1.1rem',
          maxWidth: '1200px',
          marginLeft: 'auto',
          marginRight: 'auto'
        }}>
          Your Gateway to Fintech Innovation
        </p>
      </header>
      <main className="app-main">
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <div className="counter-section">
            <h2>Test Counter</h2>
            <p className="count-display">{count}</p>
            <div className="button-group">
              <button 
                onClick={() => setCount(count - 1)}
                style={{ 
                  padding: '12px 24px', 
                  fontSize: '16px', 
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, background-color 0.2s',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  margin: '0 8px'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                Decrease
              </button>
              <button 
                onClick={() => setCount(count + 1)}
                style={{ 
                  padding: '12px 24px', 
                  fontSize: '16px', 
                  backgroundColor: '#22c55e',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, background-color 0.2s',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  margin: '0 8px'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                Increase
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
