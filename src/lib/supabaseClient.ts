import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// More detailed logging
console.log('Supabase Configuration:')
console.log('URL:', supabaseUrl)
console.log('Anon Key:', supabaseAnonKey ? 'Present (length: ' + supabaseAnonKey.length + ')' : 'Missing')

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    `Missing Supabase environment variables. 
     VITE_SUPABASE_URL: ${supabaseUrl ? 'exists' : 'missing'}
     VITE_SUPABASE_ANON_KEY: ${supabaseAnonKey ? 'exists' : 'missing'}
     Please check your environment variables configuration.`
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Test the connection
async function testConnection() {
  try {
    console.log('Testing Supabase connection...')
    const { data, error } = await supabase
      .from('payarticles')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('Supabase connection error:', error)
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
    } else {
      console.log('Supabase connection successful')
      console.log('Test query result:', data)
    }
  } catch (err) {
    console.error('Failed to test Supabase connection:', err)
    if (err instanceof Error) {
      console.error('Error details:', {
        message: err.message,
        stack: err.stack
      })
    }
  }
}

console.log('Initializing Supabase client...')
testConnection() 