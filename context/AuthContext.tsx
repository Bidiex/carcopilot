import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/app';
import {
  PlanStatus,
  getPlanStatus,
  getTrialDaysRemaining,
  canPerformActionsForProfile,
} from '@/utils/planUtils';
import { registerPushToken } from '@/utils/registerPushToken';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  // Plan & Profile
  profile: Profile | null;
  planStatus: PlanStatus;
  canPerformActions: boolean;
  trialDaysRemaining: number;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);

  const loadProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setProfile(data as Profile);
      }
    } catch (e) {
      // console.error('Error loading profile:', e);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await loadProfile(user.id);
    }
  }, [user, loadProfile]);

  useEffect(() => {
    // Obtener sesión inicial y manejar estado de carga
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await loadProfile(session.user.id);
        registerPushToken(session.user.id).catch(() => {
          // Silencioso — no crítico para el flujo de la app
        });
      }
      setIsLoading(false);
    };

    getInitialSession();

    // Sincronizar estado automáticamente ante cualquier cambio (login, logout, refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await loadProfile(session.user.id);
        registerPushToken(session.user.id).catch(() => {
          // Silencioso — no crítico para el flujo de la app
        });
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  // Calcular valores derivados del plan
  const planStatus: PlanStatus = profile ? getPlanStatus(profile) : 'expired';
  const canPerformActions: boolean = profile
    ? canPerformActionsForProfile(profile)
    : false;
  const trialDaysRemaining: number = profile
    ? getTrialDaysRemaining(profile)
    : 0;

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        isLoading,
        signOut,
        profile,
        planStatus,
        canPerformActions,
        trialDaysRemaining,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
