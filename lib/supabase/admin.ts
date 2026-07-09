import { createClient } from '@supabase/supabase-js'

/**
 * Creates a Supabase client with the SERVICE_ROLE_KEY.
 * ONLY use this in Server Actions or API routes with strict role checks.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey || serviceRoleKey === 'your-service-role-key') {
    throw new Error('Supabase Admin client could not be initialized. Check SUPABASE_SERVICE_ROLE_KEY in .env.local')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}
