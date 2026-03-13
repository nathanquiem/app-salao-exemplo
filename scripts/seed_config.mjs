import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const EMPRESA_ID = '7e2d9b4f-c1a6-4f83-d0e5-2b8a5f7c3e1d'
  
  // Create business config
  const { data, error } = await supabase.from('business_config').upsert({
    empresa_id: EMPRESA_ID,
    open_time: '09:00',
    close_time: '19:00',
    open_days: [1,2,3,4,5,6], // Mon-Sat
    cancel_limit_hours: 2,
    closed_dates: []
  }, { onConflict: 'empresa_id' })

  if (error) {
    console.error("Error creating business config:", error)
    process.exit(1)
  }

  console.log("Business config created successfully for Seu Salão!")
}

run()
