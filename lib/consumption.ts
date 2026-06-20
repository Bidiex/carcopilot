import { supabase } from "./supabase";

export async function recalculateConsumption(vehicleId: string): Promise<void> {
  try {
    // 1. Obtener odómetro inicial del vehículo como línea base de respaldo
    const { data: vehicleData } = await supabase
      .from("vehicles")
      .select("initial_odometer")
      .eq("id", vehicleId)
      .single();
    
    const initialOdometer = vehicleData?.initial_odometer ? Number(vehicleData.initial_odometer) : 0;

    // 2. Traer registros de combustible y cargas eléctricas
    const [fuelRes, chargeRes] = await Promise.all([
      supabase.from("fuel_logs").select("*").eq("vehicle_id", vehicleId),
      supabase.from("electric_charge_logs").select("*").eq("vehicle_id", vehicleId),
    ]);

    const fuelLogs = fuelRes.data || [];
    const chargeLogs = chargeRes.data || [];

    // --- RECALCULAR FUEL LOGS ---
    // Ordenamos cronológicamente ascendente
    fuelLogs.sort((a, b) => {
      const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateDiff === 0) return Number(a.odometer) - Number(b.odometer);
      return dateDiff;
    });

    const fuelUpdates: any[] = [];
    let lastFullOdometer = initialOdometer;
    let accumulatedGallons = 0;

    for (let i = 0; i < fuelLogs.length; i++) {
      const log = fuelLogs[i];
      const currentOdo = Number(log.odometer);
      const currentGal = Number(log.gallons);
      
      let newConsumption: number | null = null;
      accumulatedGallons += currentGal;

      if (log.full_tank) {
        const totalKm = currentOdo - lastFullOdometer;
        if (totalKm > 0 && accumulatedGallons > 0 && lastFullOdometer !== 0) {
          newConsumption = totalKm / accumulatedGallons;
        }
        // Reseteamos acumuladores
        lastFullOdometer = currentOdo;
        accumulatedGallons = 0;
      }

      // Evitar updates innecesarios (comparar con una tolerancia decimal pequeña para evitar falsos positivos)
      const currentConsumption = log.consumption_km_gal !== null ? Number(log.consumption_km_gal) : null;
      const isDifferent = 
        (newConsumption === null && currentConsumption !== null) ||
        (newConsumption !== null && currentConsumption === null) ||
        (newConsumption !== null && currentConsumption !== null && Math.abs(newConsumption - currentConsumption) > 0.001);

      if (isDifferent) {
        fuelUpdates.push({
          id: log.id,
          consumption_km_gal: newConsumption
        });
      }
    }

    // --- RECALCULAR ELECTRIC CHARGE LOGS ---
    // Ordenamos cronológicamente ascendente
    chargeLogs.sort((a, b) => {
      const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateDiff === 0) return Number(a.odometer) - Number(b.odometer);
      return dateDiff;
    });

    const chargeUpdates: any[] = [];
    let lastChargeOdometer = initialOdometer;

    for (let i = 0; i < chargeLogs.length; i++) {
      const log = chargeLogs[i];
      const currentOdo = Number(log.odometer);
      const currentKwh = Number(log.kwh_charged);
      
      let newConsumption: number | null = null;
      const totalKm = currentOdo - lastChargeOdometer;
      
      if (totalKm > 0 && currentKwh > 0 && lastChargeOdometer !== 0) {
        newConsumption = totalKm / currentKwh;
      }
      
      lastChargeOdometer = currentOdo;

      const currentConsumption = log.consumption_km_kwh !== null ? Number(log.consumption_km_kwh) : null;
      const isDifferent = 
        (newConsumption === null && currentConsumption !== null) ||
        (newConsumption !== null && currentConsumption === null) ||
        (newConsumption !== null && currentConsumption !== null && Math.abs(newConsumption - currentConsumption) > 0.001);

      if (isDifferent) {
        chargeUpdates.push({
          id: log.id,
          consumption_km_kwh: newConsumption
        });
      }
    }

    // 3. Ejecutar los updates en batch a Supabase
    // Supabase JS no tiene un bulk update directo mediante primary key si no es upsert completo sin todos los campos requeridos, 
    // pero como solo estamos actualizando un campo y hay pocos registros por vehículo, lo haremos de forma iterativa asíncrona pero paralela.
    const promises = [];

    for (const update of fuelUpdates) {
      promises.push(
        supabase
          .from("fuel_logs")
          .update({ consumption_km_gal: update.consumption_km_gal })
          .eq("id", update.id)
      );
    }

    for (const update of chargeUpdates) {
      promises.push(
        supabase
          .from("electric_charge_logs")
          .update({ consumption_km_kwh: update.consumption_km_kwh })
          .eq("id", update.id)
      );
    }

    await Promise.all(promises);
    
  } catch (error) {
    console.error("Error recalculating consumption:", error);
  }
}
