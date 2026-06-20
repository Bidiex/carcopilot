import { supabase } from "./supabase";

export type ChronologyCheckResult = {
  breaksChronology: boolean;
};

/**
 * Verifica si el registro de un odómetro con una fecha específica rompe 
 * el orden cronológico lógico (por ejemplo, registrar un odómetro mayor
 * en una fecha pasada, o un odómetro menor en una fecha futura).
 */
export async function checkChronologyBreak(
  vehicleId: string,
  newDate: string,
  newOdometer: number,
  excludeLogId?: string
): Promise<ChronologyCheckResult> {
  try {
    const [fuelRes, chargeRes, maintRes] = await Promise.all([
      supabase.from("fuel_logs").select("id, date, odometer").eq("vehicle_id", vehicleId),
      supabase.from("electric_charge_logs").select("id, date, odometer").eq("vehicle_id", vehicleId),
      supabase.from("maintenance_logs").select("id, date, odometer").eq("vehicle_id", vehicleId),
    ]);

    let allLogs: any[] = [];
    if (fuelRes.data) allLogs.push(...fuelRes.data);
    if (chargeRes.data) allLogs.push(...chargeRes.data);
    if (maintRes.data) allLogs.push(...maintRes.data);

    if (excludeLogId) {
      allLogs = allLogs.filter(log => String(log.id) !== String(excludeLogId));
    }

    const odoValue = Number(newOdometer);

    for (const log of allLogs) {
      if (!log.date || log.odometer === null || log.odometer === undefined) continue;
      const logDate = log.date;
      const logOdo = Number(log.odometer);

      // Condición 1: Existe un registro con fecha posterior pero con odómetro menor
      if (logDate > newDate && logOdo < odoValue) {
        return { breaksChronology: true };
      }

      // Condición 2: Existe un registro con fecha anterior pero con odómetro mayor
      if (logDate < newDate && logOdo > odoValue) {
        return { breaksChronology: true };
      }
    }

    return { breaksChronology: false };
  } catch (error) {
    console.error("Error checking chronology:", error);
    // En caso de error, preferimos permitir guardar y no bloquear el flujo
    return { breaksChronology: false };
  }
}
