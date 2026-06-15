import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useAlert } from "@/context/AlertContext";
import { supabase } from "@/lib/supabase";
import { Text } from "@/components/Typography";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { Colors, Spacing, Layout, Radius } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";

export default function FuelLogNewScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { showAlert } = useAlert();

  const [activeVehicle, setActiveVehicle] = useState<any>(null);
  const [fetchingVehicle, setFetchingVehicle] = useState(true);

  const [dateStr, setDateStr] = useState(new Date().toISOString().split("T")[0]);
  const [odometer, setOdometer] = useState("");
  const [gallons, setGallons] = useState("");
  const [amount, setAmount] = useState("");
  const [fullTank, setFullTank] = useState(true);

  const [loading, setLoading] = useState(false);

  // Errors state
  const [dateError, setDateError] = useState("");
  const [odometerError, setOdometerError] = useState("");
  const [gallonsError, setGallonsError] = useState("");
  const [amountError, setAmountError] = useState("");

  useEffect(() => {
    if (user) {
      const fetchActiveVehicle = async () => {
        try {
          const { data, error } = await supabase
            .from("vehicles")
            .select("*")
            .eq("user_id", user.id)
            .eq("is_active", true)
            .limit(1)
            .single();

          if (error || !data) {
            setActiveVehicle(null);
          } else {
            setActiveVehicle(data);
          }
        } catch {
          setActiveVehicle(null);
        } finally {
          setFetchingVehicle(false);
        }
      };

      fetchActiveVehicle();
    }
  }, [user]);

  const validate = () => {
    let isValid = true;
    setDateError("");
    setOdometerError("");
    setGallonsError("");
    setAmountError("");

    if (!dateStr.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      setDateError("Formato de fecha inválido (AAAA-MM-DD)");
      isValid = false;
    }

    const odoNum = parseFloat(odometer);
    if (!odometer) {
      setOdometerError("El odómetro es requerido");
      isValid = false;
    } else if (isNaN(odoNum) || odoNum < 0) {
      setOdometerError("El odómetro no puede ser negativo");
      isValid = false;
    }

    const galNum = parseFloat(gallons);
    if (!gallons) {
      setGallonsError("Los galones son requeridos");
      isValid = false;
    } else if (isNaN(galNum) || galNum <= 0) {
      setGallonsError("Los galones deben ser mayores a 0");
      isValid = false;
    }

    const amtNum = parseFloat(amount);
    if (!amount) {
      setAmountError("El monto es requerido");
      isValid = false;
    } else if (isNaN(amtNum) || amtNum <= 0) {
      setAmountError("El monto debe ser mayor a 0");
      isValid = false;
    }

    return isValid;
  };

  const handleCreate = async () => {
    if (!user || !activeVehicle) return;
    if (!validate()) return;

    const currentOdo = parseFloat(odometer);
    const currentGal = parseFloat(gallons);
    const currentAmount = parseFloat(amount);

    setLoading(true);

    try {
      // 1. Validar que el odómetro sea mayor que el inicial del vehículo
      if (currentOdo <= activeVehicle.initial_odometer) {
        setOdometerError(
          `Debe ser mayor al odómetro inicial del vehículo (${activeVehicle.initial_odometer} km)`
        );
        setLoading(false);
        return;
      }

      // 2. Validar que el odómetro sea mayor que el último registro de combustible
      const { data: previousLogs } = await supabase
        .from("fuel_logs")
        .select("odometer")
        .eq("vehicle_id", activeVehicle.id)
        .order("odometer", { ascending: false })
        .limit(1);

      if (previousLogs && previousLogs.length > 0) {
        const latestOdo = parseFloat(previousLogs[0].odometer);
        if (currentOdo <= latestOdo) {
          setOdometerError(
            `Debe ser mayor al odómetro del último tanqueo (${latestOdo} km)`
          );
          setLoading(false);
          return;
        }
      }

      let calculatedConsumption = null;

      // 3. Si marca Tanque Lleno, calcular consumo (tanque lleno a tanque lleno)
      if (fullTank) {
        // Obtener el último tanque lleno
        const { data: lastFullLogs } = await supabase
          .from("fuel_logs")
          .select("odometer")
          .eq("vehicle_id", activeVehicle.id)
          .eq("full_tank", true)
          .order("odometer", { ascending: false })
          .limit(1);

        let baselineOdo = activeVehicle.initial_odometer;
        let query = supabase
          .from("fuel_logs")
          .select("gallons")
          .eq("vehicle_id", activeVehicle.id);

        if (lastFullLogs && lastFullLogs.length > 0) {
          baselineOdo = parseFloat(lastFullLogs[0].odometer);
          query = query.gt("odometer", baselineOdo);
        }

        const { data: partialLogs } = await query;
        const partialGals =
          partialLogs?.reduce((acc, log) => acc + parseFloat(log.gallons), 0) || 0;

        const totalGals = currentGal + partialGals;
        const totalKm = currentOdo - baselineOdo;

        if (totalGals > 0) {
          calculatedConsumption = totalKm / totalGals;
        }
      }

      // 4. Insertar en base de datos
      const { error } = await supabase.from("fuel_logs").insert({
        vehicle_id: activeVehicle.id,
        user_id: user.id,
        date: dateStr,
        odometer: currentOdo,
        gallons: currentGal,
        amount_cop: currentAmount,
        full_tank: fullTank,
        consumption_km_gal: calculatedConsumption,
      });

      if (error) {
        showAlert("Error de Tanqueo", error.message, [], "error");
      } else {
        showAlert(
          "Tanqueo Registrado",
          calculatedConsumption
            ? `¡Carga exitosa! Consumo calculado: ${calculatedConsumption.toFixed(2)} km/gal`
            : "¡Carga parcial registrada con éxito!",
          [
            {
              text: "Entendido",
              onPress: () => {
                router.back();
              },
            },
          ],
          "success"
        );
      }
    } catch {
      showAlert("Error", "Ocurrió un error inesperado al guardar el tanqueo", [], "error");
    } finally {
      setLoading(false);
    }
  };

  if (fetchingVehicle) {
    return (
      <SafeAreaView style={styles.loadingArea}>
        <ActivityIndicator size="large" color={Colors.primary500} />
      </SafeAreaView>
    );
  }

  if (!activeVehicle) {
    return (
      <SafeAreaView style={styles.errorArea}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.danger} />
        <Text variant="heading2" color="gray900" weight="700" align="center" style={styles.errorTitle}>
          No tienes vehículos activos
        </Text>
        <Text variant="body" color="gray600" align="center" style={styles.errorText}>
          Necesitas registrar un vehículo de combustión antes de poder ingresar registros de gasolina.
        </Text>
        <Button
          title="Registrar Vehículo"
          onPress={() => router.replace("/vehicle-new")}
          style={styles.errorButton}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back-outline" size={24} color={Colors.gray900} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text variant="heading2" color="gray900" weight="700">
              Registrar Tanqueo
            </Text>
            <Text variant="smallLabel" color="gray500">
              {activeVehicle.custom_brand} {activeVehicle.custom_model} ({activeVehicle.plate || "Sin Placa"})
            </Text>
          </View>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Segment Selector: Full Tank */}
          <View style={styles.selectorGroup}>
            <Text variant="caption" color="gray600" style={styles.selectorLabel}>
              Tipo de Carga
            </Text>
            <View style={styles.segmentedControl}>
              <TouchableOpacity
                onPress={() => setFullTank(true)}
                style={[
                  styles.segmentOption,
                  fullTank === true && styles.segmentOptionActive,
                ]}
              >
                <Text
                  variant="caption"
                  color={fullTank === true ? "white" : "gray600"}
                  weight="600"
                >
                  Tanque Lleno
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setFullTank(false)}
                style={[
                  styles.segmentOption,
                  fullTank === false && styles.segmentOptionActive,
                ]}
              >
                <Text
                  variant="caption"
                  color={fullTank === false ? "white" : "gray600"}
                  weight="600"
                >
                  Carga Parcial
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <Input
            label="Fecha (AAAA-MM-DD)"
            placeholder="Ej: 2026-06-15"
            value={dateStr}
            onChangeText={setDateStr}
            error={dateError}
          />

          <Input
            label="Odómetro Actual (Kilometraje)"
            placeholder="Ej: 10550"
            value={odometer}
            onChangeText={setOdometer}
            keyboardType="numeric"
            error={odometerError}
          />

          <Input
            label="Cantidad (Galones)"
            placeholder="Ej: 8.5"
            value={gallons}
            onChangeText={setGallons}
            keyboardType="numeric"
            error={gallonsError}
          />

          <Input
            label="Costo Total (COP)"
            placeholder="Ej: 120000"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            error={amountError}
          />

          {fullTank && (
            <View style={styles.infoBanner}>
              <Ionicons
                name="information-circle-outline"
                size={20}
                color={Colors.primary500}
                style={styles.infoIcon}
              />
              <Text variant="caption" color="gray600" style={styles.infoText}>
                {"Marcar como \"Tanque Lleno\" calculará automáticamente el consumo en km/galón desde el último tanque lleno."}
              </Text>
            </View>
          )}

          <Button
            title="Guardar Registro"
            onPress={handleCreate}
            loading={loading}
            style={styles.submitButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.gray50,
  },
  loadingArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.gray50,
  },
  errorArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Layout.screenPadding,
    backgroundColor: Colors.gray50,
  },
  errorTitle: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  errorText: {
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  errorButton: {
    width: "60%",
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Layout.screenPadding,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
    backgroundColor: Colors.white,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
  },
  headerTitleContainer: {
    alignItems: "center",
  },
  scrollContainer: {
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: Layout.verticalRhythm,
    gap: Spacing.sm,
  },
  selectorGroup: {
    marginBottom: Spacing.md,
  },
  selectorLabel: {
    marginBottom: Spacing.xs,
    marginLeft: 4,
    fontWeight: "500",
  },
  segmentedControl: {
    height: 52,
    flexDirection: "row",
    backgroundColor: Colors.gray100,
    borderRadius: Radius.sm,
    padding: 4,
  },
  segmentOption: {
    flex: 1,
    height: "100%",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  segmentOptionActive: {
    backgroundColor: Colors.primary500,
  },
  infoBanner: {
    flexDirection: "row",
    backgroundColor: "rgba(77, 77, 255, 0.05)",
    padding: Spacing.md,
    borderRadius: Radius.sm,
    alignItems: "center",
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  infoIcon: {
    marginRight: Spacing.sm,
  },
  infoText: {
    flex: 1,
    lineHeight: 16,
  },
  submitButton: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
});
