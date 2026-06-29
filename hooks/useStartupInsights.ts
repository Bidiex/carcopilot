import { useEffect, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

const INSIGHTS_THROTTLE_MS = 6 * 60 * 60 * 1000; // 6 hours
const STORAGE_KEY = "last_insights_generated_at";

/**
 * Hook que se ejecuta una sola vez al montar la app (con sesión iniciada).
 * Llama a la Edge Function `ai-insights` para generar nuevos insights
 * con un throttle de 6 horas.
 */
export function useStartupInsights() {
  const { user } = useAuth();
  const hasRun = useRef(false);

  useEffect(() => {
    // Si no hay usuario autenticado o ya se ejecutó en esta instancia, omitir
    if (!user || hasRun.current) return;

    const runInsightsGeneration = async () => {
      try {
        const lastRunStr = await AsyncStorage.getItem(STORAGE_KEY);
        const now = Date.now();

        // Throttle de 6 horas
        if (lastRunStr) {
          const lastRun = parseInt(lastRunStr, 10);
          if (now - lastRun < INSIGHTS_THROTTLE_MS) {
            return;
          }
        }

        // Llamar a la Edge Function
        // Fire and forget
        supabase.functions.invoke('ai-insights').catch(() => {
          // Fallo silencioso
        });

        // Marcar tiempo de ejecución local
        await AsyncStorage.setItem(STORAGE_KEY, now.toString());
      } catch (error) {
        // Atrapar cualquier error global de forma silenciosa
      }
    };

    hasRun.current = true;
    runInsightsGeneration();
  }, [user]);
}
