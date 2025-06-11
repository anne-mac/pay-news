export async function queryPerplexity(prompt: string) {
  const response = await fetch('http://localhost:3001/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ prompt })
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('API Error:', errorText)
    throw new Error(`Chat API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  console.log('API Response:', data)
  
  if (!data.choices || !data.choices[0]?.message?.content) {
    throw new Error('Invalid response format from Chat API')
  }

  return data.choices[0].message.content
} 