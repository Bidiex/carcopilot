import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

interface ExcludeLog {
  id: string;
  type: "fuel" | "electric" | "maintenance";
}

interface UseLastOdometerResult {
  data: number | null;
  loading: boolean;
  error: any;
  refetch: () => void;
}

export function useLastOdometer(
  vehicleId: string | null | undefined,
  excludeLog?: ExcludeLog
): UseLastOdometerResult {
  const [data, setData] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<any>(null);

  const fetchOdometer = useCallback(async () => {
    if (!vehicleId) {
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Query vehicle initial odometer
      const vehiclePromise = supabase
        .from("vehicles")
        .select("initial_odometer")
        .eq("id", vehicleId)
        .single();

      // 2. Query max odometer from fuel logs
      let fuelQuery = supabase
        .from("fuel_logs")
        .select("odometer")
        .eq("vehicle_id", vehicleId)
        .order("odometer", { ascending: false })
        .limit(1);

      if (excludeLog && excludeLog.type === "fuel") {
        fuelQuery = fuelQuery.neq("id", excludeLog.id);
      }

      // 3. Query max odometer from electric charge logs
      let chargeQuery = supabase
        .from("electric_charge_logs")
        .select("odometer")
        .eq("vehicle_id", vehicleId)
        .order("odometer", { ascending: false })
        .limit(1);

      if (excludeLog && excludeLog.type === "electric") {
        chargeQuery = chargeQuery.neq("id", excludeLog.id);
      }

      // 4. Query max odometer from maintenance logs
      let maintQuery = supabase
        .from("maintenance_logs")
        .select("odometer")
        .eq("vehicle_id", vehicleId)
        .order("odometer", { ascending: false })
        .limit(1);

      if (excludeLog && excludeLog.type === "maintenance") {
        maintQuery = maintQuery.neq("id", excludeLog.id);
      }

      const [vRes, fRes, cRes, mRes] = await Promise.all([
        vehiclePromise,
        fuelQuery,
        chargeQuery,
        maintQuery,
      ]);

      if (vRes.error) throw vRes.error;

      let maxOdo = parseFloat(vRes.data?.initial_odometer ?? "0");

      if (fRes.data?.[0]) {
        maxOdo = Math.max(maxOdo, parseFloat(fRes.data[0].odometer));
      }
      if (cRes.data?.[0]) {
        maxOdo = Math.max(maxOdo, parseFloat(cRes.data[0].odometer));
      }
      if (mRes.data?.[0]) {
        maxOdo = Math.max(maxOdo, parseFloat(mRes.data[0].odometer));
      }

      setData(maxOdo);
    } catch (err: any) {
      console.error("Error fetching last odometer:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [vehicleId, excludeLog?.id, excludeLog?.type]);

  useEffect(() => {
    fetchOdometer();
  }, [fetchOdometer]);

  return { data, loading, error, refetch: fetchOdometer };
}
