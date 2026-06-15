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
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useAlert } from "@/context/AlertContext";
import { supabase } from "@/lib/supabase";
import { Text } from "@/components/Typography";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { Colors, Spacing, Layout, Radius } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";

export default function FuelLogEditScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const { showAlert } = useAlert();

  const [activeVehicle, setActiveVehicle] = useState<any>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  const [dateStr, setDateStr] = useState("");
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
    if (user && id) {
      loadData();
    }
  }, [user, id]);

  const loadData = async () => {
    try {
      const { data: vData } = await supabase
        .from("vehicles")
        .select("*")
        .eq("user_id", user?.id)
        .eq("is_active", true)
        .single();
      if (vData) setActiveVehicle(vData);

      const { data: record, error } = await supabase
        .from("fuel_logs")
        .select("*")
        .eq("id", id)
        .eq("user_id", user?.id)
        .single();

      if (error || !record) throw error;

      setDateStr(record.date);
      setOdometer(record.odometer.toString());
      setGallons(record.gallons.toString());
      setAmount(record.amount_cop.toString());
      setFullTank(record.full_tank);
    } catch {
      showAlert(
        "Error",
        "No se pudo cargar el registro.",
        [{ text: "Volver", onPress: () => router.back() }],
        "error"
      );
    } finally {
      setInitialLoading(false);
    }
  };

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

  const handleUpdate = async () => {
    if (!user || !activeVehicle || !id) return;
    if (!validate()) return;

    const currentOdo = parseFloat(odometer);
    const currentGal = parseFloat(gallons);
    const currentAmount = parseFloat(amount);

    setLoading(true);

    try {
      if (currentOdo <= activeVehicle.initial_odometer) {
        setOdometerError(`Debe ser mayor al odómetro inicial (${activeVehicle.initial_odometer} km)`);
        setLoading(false);
        return;
      }

      // Validar con registros PREVIOS al que estamos editando
      const { data: previousLogs } = await supabase
        .from("fuel_logs")
        .select("odometer")
        .eq("vehicle_id", activeVehicle.id)
        .lt("odometer", currentOdo) // Solo odómetros menores (anteriores cronológicamente)
        .order("odometer", { ascending: false })
        .limit(1);

      if (previousLogs && previousLogs.length > 0) {
        const latestOdo = parseFloat(previousLogs[0].odometer);
        if (currentOdo <= latestOdo && latestOdo !== parseFloat(odometer)) {
          // El && !== protege de que choque con sí mismo si no cambió de valor
          setOdometerError(`Debe ser mayor al odómetro anterior (${latestOdo} km)`);
          setLoading(false);
          return;
        }
      }

      let calculatedConsumption = null;

      if (fullTank) {
        // Encontrar tanque lleno ANTERIOR al actual
        const { data: lastFullLogs } = await supabase
          .from("fuel_logs")
          .select("odometer")
          .eq("vehicle_id", activeVehicle.id)
          .eq("full_tank", true)
          .lt("odometer", currentOdo)
          .order("odometer", { ascending: false })
          .limit(1);

        let baselineOdo = activeVehicle.initial_odometer;
        let query = supabase
          .from("fuel_logs")
          .select("gallons, id")
          .eq("vehicle_id", activeVehicle.id)
          .lt("odometer", currentOdo); // solo menores a este

        if (lastFullLogs && lastFullLogs.length > 0) {
          baselineOdo = parseFloat(lastFullLogs[0].odometer);
          query = query.gt("odometer", baselineOdo);
        }

        const { data: partialLogs } = await query;
        const partialGals =
          partialLogs?.reduce((acc, log) => log.id !== id ? acc + parseFloat(log.gallons) : acc, 0) || 0;

        const totalGals = currentGal + partialGals;
        const totalKm = currentOdo - baselineOdo;

        if (totalGals > 0) {
          calculatedConsumption = totalKm / totalGals;
        }
      }

      const { error } = await supabase
        .from("fuel_logs")
        .update({
          date: dateStr,
          odometer: currentOdo,
          gallons: currentGal,
          amount_cop: currentAmount,
          full_tank: fullTank,
          consumption_km_gal: calculatedConsumption,
        })
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) {
        showAlert("Error de Actualización", error.message, [], "error");
      } else {
        showAlert(
          "Actualización Exitosa",
          "El tanqueo ha sido modificado.",
          [{ text: "Excelente", onPress: () => router.back() }],
          "success"
        );
      }
    } catch {
      showAlert("Error", "Ocurrió un error inesperado al actualizar", [], "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    showAlert(
      "Eliminar Registro",
      "¿Estás seguro de que deseas eliminar este tanqueo permanentemente?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              const { error } = await supabase
                .from("fuel_logs")
                .delete()
                .eq("id", id)
                .eq("user_id", user?.id);

              if (error) throw error;

              router.back();
            } catch {
              showAlert("Error", "No se pudo eliminar el registro", [], "error");
            } finally {
              setLoading(false);
            }
          },
        },
      ],
      "warning"
    );
  };

  if (initialLoading) {
    return (
      <SafeAreaView style={styles.loadingArea}>
        <ActivityIndicator size="large" color={Colors.primary500} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back-outline" size={24} color={Colors.gray900} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text variant="heading2" color="gray900" weight="700">
              Editar Tanqueo
            </Text>
            {activeVehicle && (
              <Text variant="smallLabel" color="gray500">
                {activeVehicle.custom_brand} {activeVehicle.custom_model}
              </Text>
            )}
          </View>
          <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
            <Ionicons name="trash-outline" size={24} color={Colors.danger} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
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
            value={dateStr}
            onChangeText={setDateStr}
            error={dateError}
          />

          <Input
            label="Odómetro Actual (Kilometraje)"
            value={odometer}
            onChangeText={setOdometer}
            keyboardType="numeric"
            error={odometerError}
          />

          <Input
            label="Cantidad (Galones)"
            value={gallons}
            onChangeText={setGallons}
            keyboardType="numeric"
            error={gallonsError}
          />

          <Input
            label="Costo Total (COP)"
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
                {"El consumo será re-calculado desde el último tanque lleno."}
              </Text>
            </View>
          )}

          <Button
            title="Actualizar Registro"
            onPress={handleUpdate}
            loading={loading}
            style={styles.submitButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.gray50 },
  loadingArea: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.gray50 },
  keyboardView: { flex: 1 },
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
  backButton: { width: 44, height: 44, justifyContent: "center" },
  deleteButton: { width: 44, height: 44, justifyContent: "center", alignItems: "flex-end" },
  headerTitleContainer: { alignItems: "center" },
  scrollContainer: {
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: Layout.verticalRhythm,
    gap: Spacing.sm,
  },
  selectorGroup: { marginBottom: Spacing.md },
  selectorLabel: { marginBottom: Spacing.xs, marginLeft: 4, fontWeight: "500" },
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
  segmentOptionActive: { backgroundColor: Colors.primary500 },
  infoBanner: {
    flexDirection: "row",
    backgroundColor: "rgba(77, 77, 255, 0.05)",
    padding: Spacing.md,
    borderRadius: Radius.sm,
    alignItems: "center",
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  infoIcon: { marginRight: Spacing.sm },
  infoText: { flex: 1, lineHeight: 16 },
  submitButton: { marginTop: Spacing.md, marginBottom: Spacing.xl },
});
