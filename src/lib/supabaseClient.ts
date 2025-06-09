import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// More detailed logging
console.log('Environment Variables Check:')
console.log('VITE_SUPABASE_URL:', typeof supabaseUrl, supabaseUrl ? 'exists' : 'missing')
console.log('VITE_SUPABASE_ANON_KEY:', typeof supabaseAnonKey, supabaseAnonKey ? 'exists' : 'missing')

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    `Missing Supabase environment variables. 
     VITE_SUPABASE_URL: ${supabaseUrl ? 'exists' : 'missing'}
     VITE_SUPABASE_ANON_KEY: ${supabaseAnonKey ? 'exists' : 'missing'}
     Please check your Vercel environment variables configuration.`
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Test the connection
async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('articles')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('Supabase connection error:', error)
    } else {
      console.log('Supabase connection successful')
    }
  } catch (err) {
    console.error('Failed to test Supabase connection:', err)
  }
}

testConnection() 