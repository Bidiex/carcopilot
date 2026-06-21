import { StyleSheet, View, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { Text } from "@/components/Typography";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Colors, Spacing, Layout, Radius } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useAlert } from "@/context/AlertContext";
import { useState, useEffect } from "react";
import { BottomSheet } from "@/components/BottomSheet";
import { Input } from "@/components/Input";
import { Switch } from "@/components/Switch";
import { supabase } from "@/lib/supabase";
import * as LocalAuthentication from "expo-local-authentication";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function AccountScreen() {
  const { user, signOut } = useAuth();
  const { showAlert } = useAlert();

  const [profileModal, setProfileModal] = useState(false);
  const [notifModal, setNotifModal] = useState(false);
  const [securityModal, setSecurityModal] = useState(false);

  const [name, setName] = useState(user?.user_metadata?.name || "");
  const [savingProfile, setSavingProfile] = useState(false);

  const [docAlerts, setDocAlerts] = useState(true);
  const [maintAlerts, setMaintAlerts] = useState(true);
  const [promoAlerts, setPromoAlerts] = useState(false);

  const [bioEnabled, setBioEnabled] = useState(false);
  const [hasHardware, setHasHardware] = useState(false);

  useEffect(() => {
    (async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      setHasHardware(compatible);
      if (compatible) {
        const saved = await AsyncStorage.getItem("biometrics_enabled");
        if (saved === "true") setBioEnabled(true);
      }
    })();
  }, []);

  const handleSaveProfile = async () => {
    if (!name.trim()) return showAlert("Error", "El nombre no puede estar vacío", [], "error");
    setSavingProfile(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { name: name.trim() }
      });
      if (error) throw error;
      
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({ name: name.trim() })
        .eq('id', user?.id);

      if (profileErr) throw profileErr;

      showAlert("Perfil Actualizado", "Tu nombre ha sido guardado correctamente.", [], "success");
      setProfileModal(false);
    } catch (e: any) {
      showAlert("Error", "No se pudo actualizar el perfil: " + e.message, [], "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const toggleBiometrics = async (val: boolean) => {
    if (val) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Autentícate para habilitar esta función",
      });
      if (result.success) {
        setBioEnabled(true);
        await AsyncStorage.setItem("biometrics_enabled", "true");
      }
    } else {
      setBioEnabled(false);
      await AsyncStorage.setItem("biometrics_enabled", "false");
    }
  };

  const handleDeleteAccount = () => {
    showAlert(
      "Eliminar Cuenta",
      "Esta acción es irreversible y borrará todos tus vehículos y gastos. ¿Estás seguro?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Eliminar", 
          style: "destructive", 
          onPress: () => showAlert("En Progreso", "Para eliminar tu cuenta, contacta a soporte por ahora.", [], "info") 
        }
      ],
      "warning"
    );
  };

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
    <View style={styles.container}>
      <SafeAreaView edges={["top"]} style={{ flex: 0, backgroundColor: Colors.primary500 }} />
      <SafeAreaView edges={["left", "right", "bottom"]} style={styles.safeArea}>
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
            <TouchableOpacity style={styles.optionRow} onPress={() => setProfileModal(true)}>
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
            <TouchableOpacity style={styles.optionRow} onPress={() => setNotifModal(true)}>
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
            <TouchableOpacity style={styles.optionRow} onPress={() => setSecurityModal(true)}>
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
      
      {/* Profile Modal */}
      <BottomSheet visible={profileModal} onClose={() => setProfileModal(false)} title="Editar Perfil">
        <Input 
          label="Nombre Completo" 
          value={name} 
          onChangeText={setName} 
          placeholder="Tu nombre" 
          leftIcon="person-outline" 
        />
        <Input 
          label="Correo Electrónico" 
          value={user?.email || ""} 
          editable={false} 
          leftIcon="mail-outline" 
        />
        <Button 
          title={savingProfile ? "Guardando..." : "Guardar Cambios"} 
          onPress={handleSaveProfile} 
          disabled={savingProfile} 
          style={{ marginTop: Spacing.md }} 
        />
      </BottomSheet>

      {/* Notifications Modal */}
      <BottomSheet visible={notifModal} onClose={() => setNotifModal(false)} title="Notificaciones y Alertas">
        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Text variant="body" color="gray900" weight="600">Recordatorios de Documentos</Text>
            <Text variant="caption" color="gray500">Avisos 60, 30 y 15 días antes de vencer SOAT, etc.</Text>
          </View>
          <Switch value={docAlerts} onValueChange={setDocAlerts} />
        </View>
        <View style={styles.rowDivider} />
        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Text variant="body" color="gray900" weight="600">Alertas de Mantenimiento</Text>
            <Text variant="caption" color="gray500">Notificaciones basadas en el kilometraje</Text>
          </View>
          <Switch value={maintAlerts} onValueChange={setMaintAlerts} />
        </View>
        <View style={styles.rowDivider} />
        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Text variant="body" color="gray900" weight="600">Novedades Promocionales</Text>
            <Text variant="caption" color="gray500">Recibe ofertas y nuevas características</Text>
          </View>
          <Switch value={promoAlerts} onValueChange={setPromoAlerts} />
        </View>
      </BottomSheet>

      {/* Security Modal */}
      <BottomSheet visible={securityModal} onClose={() => setSecurityModal(false)} title="Seguridad y Privacidad">
        {hasHardware && (
          <>
            <View style={styles.switchRow}>
              <View style={styles.switchInfo}>
                <Text variant="body" color="gray900" weight="600">Inicio de Sesión Biométrico</Text>
                <Text variant="caption" color="gray500">Usa FaceID o huella para entrar más rápido</Text>
              </View>
              <Switch value={bioEnabled} onValueChange={toggleBiometrics} />
            </View>
            <View style={styles.rowDivider} />
          </>
        )}
        
        <TouchableOpacity style={styles.dangerRow} onPress={handleDeleteAccount}>
          <Ionicons name="trash-outline" size={24} color={Colors.danger} style={{ marginRight: Spacing.md }} />
          <View style={styles.switchInfo}>
            <Text variant="body" color="danger" weight="600">Eliminar Cuenta</Text>
            <Text variant="caption" color="gray500">Borrar permanentemente todos tus datos</Text>
          </View>
          <Ionicons name="chevron-forward-outline" size={20} color={Colors.gray400} />
        </TouchableOpacity>
      </BottomSheet>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary500,
  },
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
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  switchInfo: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  dangerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
});
