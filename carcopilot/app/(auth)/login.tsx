import React, { useState } from "react";
import {
  StyleSheet,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Text } from "@/components/Typography";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { Colors, Spacing, Layout } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useAlert } from "@/context/AlertContext";

export default function LoginScreen() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const validate = () => {
    let isValid = true;
    setEmailError("");
    setPasswordError("");

    if (!email) {
      setEmailError("El correo electrónico es requerido");
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError("Correo electrónico inválido");
      isValid = false;
    }

    if (!password) {
      setPasswordError("La contraseña es requerida");
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError("La contraseña debe tener al menos 6 caracteres");
      isValid = false;
    }

    return isValid;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        showAlert("Error de Inicio de Sesión", error.message, [], "error");
      }
    } catch {
      showAlert("Error", "Ocurrió un error inesperado al iniciar sesión", [], "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top"]} style={{ flex: 0, backgroundColor: Colors.primary500 }} />
      <SafeAreaView edges={["left", "right", "bottom"]} style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo / Brand Header */}
          <View style={styles.headerContainer}>
            <View style={styles.logoCircle}>
              <Ionicons name="car-outline" size={32} color={Colors.white} />
            </View>
            <Text variant="display" color="primary" weight="700" style={styles.brandTitle}>
              CarCopilot
            </Text>
            <Text variant="body" color="gray500" align="center" style={styles.brandSubtitle}>
              Gestiona los gastos de tus vehículos de forma inteligente
            </Text>
          </View>

          {/* Form Container */}
          <View style={styles.formContainer}>
            <Input
              label="Correo Electrónico"
              placeholder="ejemplo@correo.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon="mail-outline"
              error={emailError}
            />

            <Input
              label="Contraseña"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              isPassword
              leftIcon="lock-closed-outline"
              error={passwordError}
            />

            <Button
              title="Iniciar Sesión"
              onPress={handleLogin}
              loading={loading}
              style={styles.loginButton}
            />

            <View style={styles.signupLinkContainer}>
              <Text variant="body" color="gray500">
                ¿No tienes una cuenta?{" "}
              </Text>
              <Text
                variant="body"
                color="primary"
                weight="600"
                onPress={() => router.replace({ pathname: "/onboarding", params: { step: "2" } })}
              >
                Regístrate
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary500 },
  safeArea: {
    flex: 1,
    backgroundColor: Colors.gray50, // level 1 background
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: Layout.screenPadding, // Matches paddingHorizontal: 20
    paddingVertical: Spacing.xl,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: Layout.verticalRhythm, // Matches vertical spacing of 24
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
    // Soft premium shadow
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  brandTitle: {
    marginBottom: Spacing.xs,
  },
  brandSubtitle: {
    paddingHorizontal: Spacing.lg,
  },
  formContainer: {
    width: "100%",
    backgroundColor: Colors.white, // level 2 background (card aesthetic)
    borderRadius: 20,
    padding: Spacing.lg,
    // Soft card shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  loginButton: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  signupLinkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.xs,
  },
});
