import { useEffect, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/lib/supabase";
import { recalculateConsumption } from "@/lib/consumption";
import { useAuth } from "@/context/AuthContext";

const RECALC_THROTTLE_MS = 10 * 60 * 1000; // 10 minutes
const STORAGE_KEY = "last_startup_recalc_at";

/**
 * Hook que se ejecuta una sola vez al montar la app (con sesión iniciada).
 * Recorre todos los vehículos del usuario y lanza la función de recálculo
 * en background como red de seguridad.
 */
export function useStartupRecalculation() {
  const { user } = useAuth();
  const hasRun = useRef(false);

  useEffect(() => {
    // Si no hay usuario autenticado o ya se ejecutó en esta instancia, omitir
    if (!user || hasRun.current) return;

    const runRecalculation = async () => {
      try {
        const lastRunStr = await AsyncStorage.getItem(STORAGE_KEY);
        const now = Date.now();

        // Throttle de 10 minutos
        if (lastRunStr) {
          const lastRun = parseInt(lastRunStr, 10);
          if (now - lastRun < RECALC_THROTTLE_MS) {
            return;
          }
        }

        // Obtener IDs de vehículos
        const { data: vehicles, error } = await supabase
          .from("vehicles")
          .select("id")
          .eq("user_id", user.id);

        if (error) throw error;

        if (vehicles && vehicles.length > 0) {
          // Ejecutar sin hacer await individual para no bloquear
          for (const vehicle of vehicles) {
            recalculateConsumption(vehicle.id).catch(() => {
              // Silencioso en caso de fallo individual
            });
          }
        }

        // Marcar tiempo de ejecución
        await AsyncStorage.setItem(STORAGE_KEY, now.toString());
      } catch (error) {
        // Atrapar cualquier error global de forma silenciosa (red de seguridad invisible)
      }
    };

    hasRun.current = true;
    runRecalculation();
  }, [user]);
}
