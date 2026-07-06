import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Modal,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, Spacing, Radius, Layout } from "../constants/theme";
import { Text } from "./Typography";
import { Ionicons } from "@expo/vector-icons";

interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps {
  label?: string;
  placeholder?: string;
  value: string;
  options: SelectOption[];
  onSelect: (value: string) => void;
  error?: string;
  leftIcon?: React.ComponentProps<typeof Ionicons>["name"];
}

export const Select: React.FC<SelectProps> = ({
  label,
  placeholder = "Seleccionar...",
  value,
  options,
  onSelect,
  error,
  leftIcon,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (val: string) => {
    onSelect(val);
    setModalVisible(false);
    setSearchQuery("");
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text variant="caption" color="gray600" style={styles.label}>
          {label}
        </Text>
      )}

      <Pressable
        onPress={() => setModalVisible(true)}
        style={[styles.inputWrapper, error ? styles.inputWrapperError : null]}
      >
        {leftIcon && (
          <Ionicons
            name={leftIcon as any}
            size={20}
            color={error ? Colors.danger : Colors.gray500}
            style={styles.leftIcon}
          />
        )}

        <Text
          variant="body"
          color={selectedOption ? "gray900" : "gray400"}
          style={styles.valueText}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </Text>

        <Ionicons name="chevron-down" size={20} color={Colors.gray500} style={styles.rightIcon} />
      </Pressable>

      {error && (
        <Text variant="caption" color="danger" style={styles.errorText}>
          {error}
        </Text>
      )}

      {/* Modal for options */}
      <Modal visible={modalVisible} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.modalSafeArea}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.modalContainer}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity activeOpacity={0.7} onPress={() => setModalVisible(false)} style={styles.closeButton}>
                <Ionicons name="close" size={28} color={Colors.gray900} />
              </TouchableOpacity>
              <Text variant="heading2" color="gray900" weight="700">
                {label || "Seleccionar"}
              </Text>
              <View style={{ width: 44 }} />
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={Colors.gray500} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar..."
                placeholderTextColor={Colors.gray400}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
            </View>

            {/* Options List */}
            <FlatList
              data={filteredOptions}
              keyExtractor={(item) => item.value}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <TouchableOpacity activeOpacity={0.7}
                  style={[
                    styles.optionItem,
                    item.value === value && styles.optionItemSelected,
                  ]}
                  onPress={() => handleSelect(item.value)}
                >
                  <Text
                    variant="body"
                    color={item.value === value ? "primary500" : "gray900"}
                    weight={item.value === value ? "600" : "400"}
                  >
                    {item.label}
                  </Text>
                  {item.value === value && (
                    <Ionicons name="checkmark" size={24} color={Colors.primary500} />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text variant="body" color="gray500" align="center">
                    No se encontraron resultados
                  </Text>
                </View>
              }
            />
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: Spacing.md,
  },
  label: {
    marginBottom: Spacing.xs,
    marginLeft: 4,
    fontFamily: "Montserrat_500Medium",
  },
  inputWrapper: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.gray100,
    borderRadius: Radius.sm, // matching 14px like in Input.tsx
    borderWidth: 1,
    borderColor: "transparent",
    paddingHorizontal: 16,
  },
  inputWrapperError: {
    borderColor: Colors.danger,
    backgroundColor: Colors.white,
  },
  leftIcon: {
    marginRight: Spacing.sm,
  },
  rightIcon: {
    marginLeft: "auto",
  },
  valueText: {
    flex: 1,
    fontFamily: "Montserrat_400Regular",
  },
  errorText: {
    marginTop: Spacing.xs,
    marginLeft: 4,
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Layout.screenPadding,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.gray100,
    marginHorizontal: Layout.screenPadding,
    marginVertical: Spacing.md,
    height: 44,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
  },
  searchIcon: {
    marginRight: Spacing.xs,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    fontSize: 16,
    color: Colors.gray900,
    fontFamily: "Montserrat_400Regular",
  },
  listContent: {
    paddingHorizontal: Layout.screenPadding,
    paddingBottom: Spacing.xl,
  },
  optionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  optionItemSelected: {
    backgroundColor: "transparent",
  },
  emptyState: {
    paddingVertical: Spacing.xl,
    alignItems: "center",
  },
});
