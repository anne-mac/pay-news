import { useState } from 'react'
import { queryPerplexity } from '../lib/perplexity'

export function Chat() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Array<{role: 'user' | 'assistant' | 'error', content: string}>>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setError(null)
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    try {
      console.log('Sending message:', userMessage) // Debug log
      const response = await queryPerplexity(userMessage)
      console.log('Received response:', response) // Debug log
      setMessages(prev => [...prev, { role: 'assistant', content: response }])
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      setError(errorMessage)
      setMessages(prev => [...prev, { role: 'error', content: `Error: ${errorMessage}` }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="chat-container">
      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}
      <div className="messages">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.role}`}>
            <div className="message-header">
              {message.role === 'user' ? '👤 You' : message.role === 'assistant' ? '🤖 AI' : '⚠️ Error'}
            </div>
            <div className="message-content">
              {message.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message assistant loading">
            <div className="message-header">🤖 AI</div>
            <div className="message-content">
              Thinking<span className="loading-dots">...</span>
            </div>
          </div>
        )}
      </div>
      <form onSubmit={handleSubmit} className="input-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask something..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !input.trim()}>
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  )
} 