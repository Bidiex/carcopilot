import React from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/context/AuthContext";
import { Text } from "@/components/Typography";
import { Button } from "@/components/Button";
import { Colors, Spacing, Layout } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";

export default function TrialExplainScreen() {
  const router = useRouter();
  const { session } = useAuth();

  const handleContinue = async () => {
    if (session?.user?.id) {
      await AsyncStorage.setItem(`has_seen_trial_${session.user.id}`, "true");
    }
    router.replace("/(tabs)");
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Ionicons name="rocket-outline" size={48} color={Colors.primary500} />
            <Text variant="heading1" color="gray900" weight="700" style={styles.title}>
              Bienvenido a CarCopilot
            </Text>
            <Text variant="body" color="gray600" style={styles.subtitle}>
              Estás a punto de iniciar tu prueba gratuita de 15 días con acceso a todas las funcionalidades Pro.
            </Text>
          </View>

          <View style={styles.timeline}>
            {/* Día 1 */}
            <View style={styles.timelineItem}>
              <View style={styles.iconContainer}>
                <Ionicons name="play-circle" size={28} color={Colors.primary500} />
              </View>
              <View style={styles.timelineContent}>
                <Text variant="smallLabel" color="primary500" weight="700">DÍA 1</Text>
                <Text variant="body" color="gray900" weight="600">Comienza tu prueba gratuita</Text>
                <Text variant="caption" color="gray600">Disfruta de la app sin límites.</Text>
              </View>
            </View>

            {/* Line connector */}
            <View style={styles.line} />

            {/* Día 7 */}
            <View style={styles.timelineItem}>
              <View style={styles.iconContainer}>
                <Ionicons name="notifications" size={28} color={Colors.primary500} />
              </View>
              <View style={styles.timelineContent}>
                <Text variant="smallLabel" color="primary500" weight="700">DÍA 7</Text>
                <Text variant="body" color="gray900" weight="600">Aviso de mitad de período</Text>
                <Text variant="caption" color="gray600">Te recordaremos que llevas 7 días de prueba.</Text>
              </View>
            </View>

            {/* Line connector */}
            <View style={styles.line} />

            {/* Día 15 */}
            <View style={styles.timelineItem}>
              <View style={styles.iconContainer}>
                <Ionicons name="time" size={28} color={Colors.primary500} />
              </View>
              <View style={styles.timelineContent}>
                <Text variant="smallLabel" color="primary500" weight="700">DÍA 15</Text>
                <Text variant="body" color="gray900" weight="600">Fin de la prueba gratuita</Text>
                <Text variant="caption" color="gray600">Te avisaremos cuando haya expirado.</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Button
            title="¡Entendido, vamos!"
            onPress={handleContinue}
            style={styles.button}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Spacing.xl,
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing.xxl,
  },
  title: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    paddingHorizontal: Spacing.md,
  },
  timeline: {
    paddingHorizontal: Spacing.md,
  },
  timelineItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  iconContainer: {
    width: 48,
    alignItems: "center",
    zIndex: 2,
    backgroundColor: Colors.white,
  },
  timelineContent: {
    flex: 1,
    marginLeft: Spacing.md,
    paddingTop: 4,
  },
  line: {
    width: 2,
    height: 40,
    backgroundColor: Colors.primary200,
    marginLeft: 23,
    marginTop: -8,
    marginBottom: -8,
    zIndex: 1,
  },
  footer: {
    paddingHorizontal: Layout.screenPadding,
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.md,
    backgroundColor: Colors.white,
  },
  button: {
    width: "100%",
  },
});
