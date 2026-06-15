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

const TAX_TYPES = [
  { label: "SOAT", value: "soat" },
  { label: "Impuesto Departamental", value: "tax_dept" },
  { label: "Impuesto Municipal", value: "tax_muni" },
];

export default function TaxEditScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const { showAlert } = useAlert();

  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);

  const [recordType, setRecordType] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [amount, setAmount] = useState("");
  const [provider, setProvider] = useState("");
  const [taxYear, setTaxYear] = useState("");
  const [taxCity, setTaxCity] = useState("");

  const [typeError, setTypeError] = useState("");
  const [dateError, setDateError] = useState("");
  const [amountError, setAmountError] = useState("");
  const [providerError, setProviderError] = useState("");
  const [yearError, setYearError] = useState("");
  const [cityError, setCityError] = useState("");

  useEffect(() => {
    if (user && id) {
      loadRecord();
    }
  }, [user, id]);

  const loadRecord = async () => {
    try {
      const { data, error } = await supabase
        .from("annual_records")
        .select("*")
        .eq("id", id)
        .eq("user_id", user?.id)
        .single();

      if (error || !data) throw error;

      let determinedRecordType = data.type;
      if (data.type === "tax") {
        if (data.tax_city) determinedRecordType = "tax_muni";
        else determinedRecordType = "tax_dept";
      }

      setRecordType(determinedRecordType);
      setIssueDate(data.issue_date);
      setAmount(data.amount_cop.toString());
      setProvider(data.type === "tax" ? data.tax_department || "" : data.provider || "");
      setTaxYear(data.tax_year ? data.tax_year.toString() : "");
      setTaxCity(data.tax_city || "");
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
      if (!taxYear || isNaN(yearNum) || yearNum < 2000 || yearNum > new Date().getFullYear() + 1) {
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

  const handleUpdate = async () => {
    if (!user || !id) return;
    if (!validate()) return;

    setLoading(true);

    const issueDateObj = new Date(issueDate);
    const expiryDateObj = new Date(issueDateObj.getTime() + issueDateObj.getTimezoneOffset() * 60000);
    expiryDateObj.setFullYear(expiryDateObj.getFullYear() + 1);
    
    const yy = expiryDateObj.getFullYear();
    const mm = String(expiryDateObj.getMonth() + 1).padStart(2, "0");
    const dd = String(expiryDateObj.getDate()).padStart(2, "0");
    const expiryDate = `${yy}-${mm}-${dd}`;

    let dbType = recordType;
    if (recordType === "tax_dept" || recordType === "tax_muni") {
      dbType = "tax";
    }

    try {
      const { error } = await supabase
        .from("annual_records")
        .update({
          type: dbType,
          issue_date: issueDate,
          expiry_date: expiryDate,
          amount_cop: parseFloat(amount),
          provider: recordType === "soat" ? provider.trim() : null,
          tax_year: dbType === "tax" ? parseInt(taxYear) : null,
          tax_department: dbType === "tax" ? provider.trim() : null,
          tax_city: recordType === "tax_muni" ? taxCity.trim() : null,
        })
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) {
        showAlert("Error de Actualización", error.message, [], "error");
      } else {
        showAlert(
          "Actualización Exitosa",
          "El registro ha sido actualizado.",
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
      "¿Estás seguro de que deseas eliminar este registro permanentemente?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              const { error } = await supabase
                .from("annual_records")
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
          <Text variant="heading2" color="gray900" weight="700">
            Editar Registro
          </Text>
          <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
            <Ionicons name="trash-outline" size={24} color={Colors.danger} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <Select
            label="Tipo de Registro *"
            placeholder="Seleccionar..."
            value={recordType}
            options={TAX_TYPES}
            onSelect={(val) => {
              setRecordType(val);
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
  scrollContainer: {
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: Layout.verticalRhythm,
    gap: Spacing.sm,
  },
  submitButton: { marginTop: Spacing.md, marginBottom: Spacing.xl },
});
