import { createClient } from "@supabase/supabase-js"
import type { Database } from "../types/database"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables")
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Helper para obter o usuário atual
export const getCurrentUser = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

// Helper para verificar se é admin
export const isAdmin = async () => {
  const user = await getCurrentUser()
  if (!user) return false

  const { data } = await supabase
    .from("admins")
    .select("member_id")
    .eq("member_id", user.id)
    .single()

  return !!data
}
