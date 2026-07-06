import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

type AdminAuthContextType = {
  session: Session | null
  isAdmin: boolean
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined)

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)
        if (session) {
          await verifyAdminRole(session.user.id)
        } else {
          setIsAdmin(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession()
    setSession(session)
    if (session) {
      await verifyAdminRole(session.user.id)
    }
    setLoading(false)
  }

  async function verifyAdminRole(userId: string) {
    const { data } = await supabase
      .from('admin_users')
      .select('id')
      .eq('id', userId)
      .maybeSingle()

    setIsAdmin(!!data)

    // Si tiene sesión pero NO es admin, cerrar sesión inmediatamente
    if (!data) {
      await supabase.auth.signOut()
    }
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AdminAuthContext.Provider value={{ session, isAdmin, loading, signIn, signOut }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth(): AdminAuthContextType {
  const context = useContext(AdminAuthContext)
  if (!context) throw new Error('useAdminAuth debe usarse dentro de AdminAuthProvider')
  return context
}
