import React, { useState, useEffect } from "react";
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
import { Select } from "@/components/Select";
import { Button } from "@/components/Button";
import { Colors, Spacing, Layout } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { scheduleDocumentReminder } from "@/lib/notifications";
import { getColombiaDateString, getColombiaYear, addYearsToDateString } from "@/lib/date";
import { useActionGuard } from "@/hooks/useActionGuard";
import { UpgradeModal } from "@/components/UpgradeModal";

const TAX_TYPES = [
  { label: "SOAT", value: "soat" },
  { label: "Impuesto Departamental", value: "tax_dept" },
  { label: "Impuesto Municipal", value: "tax_muni" },
];

export default function TaxNewScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const { guardAction, showUpgradeModal, closeUpgradeModal } = useActionGuard();

  const [loading, setLoading] = useState(false);
  const [fetchingVehicle, setFetchingVehicle] = useState(true);
  const { vehicleId } = useLocalSearchParams<{ vehicleId: string }>();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  const activeVehicle = vehicles.find(v => v.id === selectedVehicleId) || null;
  const activeVehicleId = selectedVehicleId;

  const [recordType, setRecordType] = useState("");
  const [issueDate, setIssueDate] = useState(getColombiaDateString());
  const [amount, setAmount] = useState("");
  const [provider, setProvider] = useState(""); // Aseguradora o Departamento
  const [taxYear, setTaxYear] = useState(getColombiaYear().toString());
  const [taxCity, setTaxCity] = useState("");

  const [typeError, setTypeError] = useState("");
  const [dateError, setDateError] = useState("");
  const [amountError, setAmountError] = useState("");
  const [providerError, setProviderError] = useState("");
  const [yearError, setYearError] = useState("");
  const [cityError, setCityError] = useState("");

  useEffect(() => {
    if (user) {
      const fetchVehicles = async () => {
        const { data, error } = await supabase
          .from("vehicles")
          .select("*")
          .eq("user_id", user.id);

        if (!error && data && data.length > 0) {
          setVehicles(data);
          const initialId = vehicleId || data.find((v: any) => v.is_active)?.id || data[0].id;
          setSelectedVehicleId(initialId);
        } else {
          showAlert(
            "Vehículo requerido",
            "Debes tener un vehículo activo para registrar impuestos o SOAT.",
            [{ text: "Entendido", onPress: () => router.back() }],
            "warning"
          );
        }
      };

      fetchVehicles().finally(() => setFetchingVehicle(false));
    } else {
      setFetchingVehicle(false);
    }
  }, [user, vehicleId]);

  const validate = () => {
    let isValid = true;
    setTypeError("");
    setDateError("");
    setAmountError("");
    setProviderError("");
    setYearError("");
    setCityError("");

    if (!recordType) {
      setTypeError("Selecciona el tipo de registro");
      isValid = false;
    }
    
    if (!issueDate || !/^\d{4}-\d{2}-\d{2}$/.test(issueDate)) {
      setDateError("Fecha inválida (AAAA-MM-DD)");
      isValid = false;
    }

    const amtNum = parseFloat(amount);
    if (!amount || isNaN(amtNum) || amtNum <= 0) {
      setAmountError("Ingresa un valor válido");
      isValid = false;
    }

    if (recordType === "soat") {
      if (!provider.trim()) {
        setProviderError("La aseguradora es requerida");
        isValid = false;
      }
    } else if (recordType === "tax_dept" || recordType === "tax_muni") {
      if (!provider.trim()) {
        setProviderError("El departamento es requerido");
        isValid = false;
      }
      const yearNum = parseInt(taxYear);
      if (!taxYear || isNaN(yearNum) || yearNum < 2000 || yearNum > getColombiaYear() + 1) {
        setYearError("Año inválido");
        isValid = false;
      }
      if (recordType === "tax_muni" && !taxCity.trim()) {
        setCityError("El municipio es requerido");
        isValid = false;
      }
    }

    return isValid;
  };

  const handleCreate = async () => {
    if (!user || !activeVehicleId) return;
    if (!validate()) return;

    setLoading(true);

    // Calculate expiry date (+ 1 year exactly)
    const expiryDate = addYearsToDateString(issueDate, 1);

    let dbType = recordType;
    if (recordType === "tax_dept" || recordType === "tax_muni") {
      dbType = "tax";
    }

    try {
      const { data: insertedRecord, error } = await supabase
        .from("annual_records")
        .insert({
          user_id: user.id,
          vehicle_id: activeVehicleId,
          type: dbType,
          issue_date: issueDate,
          expiry_date: expiryDate,
          amount_cop: parseFloat(amount),
          provider: recordType === "soat" ? provider.trim() : null,
          tax_year: dbType === "tax" ? parseInt(taxYear) : null,
          tax_department: dbType === "tax" ? provider.trim() : null,
          tax_city: recordType === "tax_muni" ? taxCity.trim() : null,
        })
        .select()
        .single();

      if (error) {
        showAlert("Error de Creación", error.message, [], "error");
      } else {
        if (insertedRecord && activeVehicle) {
          const vehicleName = `${activeVehicle.custom_brand} ${activeVehicle.custom_model}`;
          const plateStr = activeVehicle.plate || "Sin Placa";
          await scheduleDocumentReminder(
            insertedRecord.id,
            dbType as any,
            vehicleName,
            plateStr,
            expiryDate
          );
        }
        showAlert(
          "Registro Exitoso",
          "El registro ha sido guardado.",
          [{ text: "Excelente", onPress: () => router.back() }],
          "success"
        );
      }
    } catch {
      showAlert("Error", "Ocurrió un error inesperado al guardar", [], "error");
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <TouchableOpacity activeOpacity={0.7} onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back-outline" size={24} color={Colors.gray900} />
          </TouchableOpacity>
          <Text variant="heading2" color="gray900" weight="700">
            Registrar Impuesto / SOAT
          </Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {vehicles.length > 1 && (
            <Select
              label="Vehículo"
              value={selectedVehicleId || ""}
              options={vehicles.map((v: any) => ({
                label: `${v.custom_brand} ${v.custom_model} (${v.plate || "Sin Placa"})`,
                value: v.id
              }))}
              onSelect={setSelectedVehicleId}
            />
          )}

          <Select
            label="Tipo de Registro *"
            placeholder="Seleccionar..."
            value={recordType}
            options={TAX_TYPES}
            onSelect={(val) => {
              setRecordType(val);
              // Reset values when switching types
              setProvider("");
              setTaxCity("");
            }}
            error={typeError}
          />

          <Input
            label="Fecha de Expedición / Pago (AAAA-MM-DD) *"
            value={issueDate}
            onChangeText={setIssueDate}
            keyboardType="number-pad"
            error={dateError}
          />

          <Input
            label="Valor Pagado (COP) *"
            placeholder="Ej: 450000"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            format="currency"
            error={amountError}
          />

          {recordType === "soat" && (
            <Input
              label="Aseguradora *"
              placeholder="Ej: Sura, Bolivar, Previsora..."
              value={provider}
              onChangeText={setProvider}
              error={providerError}
            />
          )}

          {(recordType === "tax_dept" || recordType === "tax_muni") && (
            <>
              <Input
                label="Año Gravable *"
                placeholder="Ej: 2024"
                value={taxYear}
                onChangeText={setTaxYear}
                keyboardType="number-pad"
                error={yearError}
              />
              <Input
                label="Departamento *"
                placeholder="Ej: Atlántico, Cundinamarca..."
                value={provider} 
                onChangeText={setProvider}
                error={providerError}
              />
            </>
          )}

          {recordType === "tax_muni" && (
            <Input
              label="Ciudad o Municipio *"
              placeholder="Ej: Barranquilla, Envigado..."
              value={taxCity}
              onChangeText={setTaxCity}
              error={cityError}
            />
          )}

          <Button
            title="Guardar Registro"
            onPress={() => guardAction(handleCreate)}
            loading={loading}
            style={styles.submitButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
      <UpgradeModal
        visible={showUpgradeModal}
        onClose={closeUpgradeModal}
        onUpgrade={() => { closeUpgradeModal(); router.push('/upgrade' as any); }}
      />
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
  scrollContainer: {
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: Layout.verticalRhythm,
    gap: Spacing.sm,
  },
  submitButton: { marginTop: Spacing.md, marginBottom: Spacing.xl },
});
