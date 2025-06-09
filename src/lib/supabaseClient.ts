import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('Supabase URL:', supabaseUrl?.slice(0, 8) + '...')  // Only log the start for security
console.log('Supabase Anon Key:', supabaseAnonKey?.slice(0, 8) + '...')

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
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