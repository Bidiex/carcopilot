import { StyleSheet, View, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { Text } from "@/components/Typography";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Colors, Spacing, Layout, Radius } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useAlert } from "@/context/AlertContext";

export default function AccountScreen() {
  const { user, signOut } = useAuth();
  const { showAlert } = useAlert();

  const handleLogout = () => {
    showAlert(
      "Cerrar Sesión",
      "¿Estás seguro de que deseas cerrar sesión en CarCopilot?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Cerrar Sesión",
          style: "destructive",
          onPress: async () => {
            try {
              await signOut();
            } catch {
              showAlert("Error", "No se pudo cerrar la sesión", [], "error");
            }
          },
        },
      ],
      "warning"
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text variant="heading1" color="gray900" weight="700">
            Mi Cuenta
          </Text>
        </View>

        {/* User Card */}
        <Card variant="secondary" style={styles.userCard}>
          <View style={styles.avatarRow}>
            <View style={styles.avatarCircle}>
              <Text variant="heading1" color="white" weight="700">
                {user?.user_metadata?.name?.charAt(0).toUpperCase() || "C"}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text variant="heading2" color="gray900" weight="700">
                {user?.user_metadata?.name || "Conductor"}
              </Text>
              <Text variant="caption" color="gray500">
                {user?.email}
              </Text>
            </View>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.planBadgeRow}>
            <View>
              <Text variant="smallLabel" color="gray500">
                Plan Actual
              </Text>
              <Text variant="body" color="primary500" weight="700" style={styles.planText}>
                Plan Standard (Gratuito)
              </Text>
            </View>
            <TouchableOpacity style={styles.upgradeButton}>
              <Text variant="smallLabel" color="white" weight="600">
                PRO
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Settings Options */}
        <View style={styles.section}>
          <Text variant="sectionTitle" color="gray900" style={styles.sectionTitle}>
            Ajustes
          </Text>

          <Card variant="secondary" style={styles.optionsCard}>
            {/* Option 1 */}
            <TouchableOpacity style={styles.optionRow}>
              <View style={styles.optionIconContainer}>
                <Ionicons name="person-outline" size={20} color={Colors.gray600} />
              </View>
              <Text variant="body" color="gray900" style={styles.optionLabel}>
                Editar Perfil
              </Text>
              <Ionicons name="chevron-forward-outline" size={20} color={Colors.gray400} />
            </TouchableOpacity>

            <View style={styles.rowDivider} />

            {/* Option 2 */}
            <TouchableOpacity style={styles.optionRow}>
              <View style={styles.optionIconContainer}>
                <Ionicons name="notifications-outline" size={20} color={Colors.gray600} />
              </View>
              <Text variant="body" color="gray900" style={styles.optionLabel}>
                Notificaciones y Alertas
              </Text>
              <Ionicons name="chevron-forward-outline" size={20} color={Colors.gray400} />
            </TouchableOpacity>

            <View style={styles.rowDivider} />

            {/* Option 3 */}
            <TouchableOpacity style={styles.optionRow}>
              <View style={styles.optionIconContainer}>
                <Ionicons name="shield-checkmark-outline" size={20} color={Colors.gray600} />
              </View>
              <Text variant="body" color="gray900" style={styles.optionLabel}>
                Seguridad y Privacidad
              </Text>
              <Ionicons name="chevron-forward-outline" size={20} color={Colors.gray400} />
            </TouchableOpacity>
          </Card>
        </View>

        {/* Log out section */}
        <View style={styles.logoutContainer}>
          <Button
            title="Cerrar Sesión"
            variant="ghost"
            onPress={handleLogout}
            textStyle={{ color: Colors.danger }}
            style={styles.logoutButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.gray50,
  },
  scrollContainer: {
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  header: {
    marginBottom: Layout.verticalRhythm,
  },
  userCard: {
    marginBottom: Layout.verticalRhythm,
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary500,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  cardDivider: {
    height: 1,
    backgroundColor: Colors.gray100,
    marginVertical: Spacing.md,
  },
  planBadgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  planText: {
    marginTop: 2,
  },
  upgradeButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    backgroundColor: Colors.warning,
  },
  section: {
    marginBottom: Layout.verticalRhythm,
  },
  sectionTitle: {
    marginBottom: Layout.sectionGap,
    fontWeight: "700",
  },
  optionsCard: {
    paddingVertical: Spacing.xs,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  optionIconContainer: {
    marginRight: Spacing.md,
  },
  optionLabel: {
    flex: 1,
    fontWeight: "500",
  },
  rowDivider: {
    height: 1,
    backgroundColor: Colors.gray100,
    marginLeft: 40,
  },
  logoutContainer: {
    marginTop: Spacing.md,
  },
  logoutButton: {
    borderColor: Colors.danger,
  },
});
