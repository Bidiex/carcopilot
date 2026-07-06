import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text } from "./Typography";
import { Colors, Spacing } from "@/constants/theme";

interface Option {
  label: string;
  value: string;
}

interface RadioGroupProps {
  label?: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  horizontal?: boolean;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  label,
  options,
  value,
  onChange,
  horizontal = false,
}) => {
  return (
    <View style={styles.container}>
      {label && (
        <Text variant="caption" color="gray700" weight="600" style={styles.label}>
          {label}
        </Text>
      )}
      <View style={[styles.optionsContainer, horizontal && styles.optionsContainerHorizontal]}>
        {options.map((option) => {
          const isSelected = value === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              activeOpacity={0.7}
              onPress={() => onChange(option.value)}
              style={[
                styles.optionWrapper,
                horizontal && styles.optionWrapperHorizontal,
                isSelected && styles.optionWrapperSelected
              ]}
            >
              <Text
                variant="body"
                color={isSelected ? "white" : "gray700"}
                weight={isSelected ? "600" : "500"}
                align="center"
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    marginBottom: Spacing.xs,
  },
  optionsContainer: {
    flexDirection: "column",
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  optionsContainerHorizontal: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  optionWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.gray50,
    borderWidth: 1,
    borderColor: Colors.gray200,
    borderRadius: 12,
  },
  optionWrapperHorizontal: {
    flex: 1,
    marginRight: 0,
  },
  optionWrapperSelected: {
    backgroundColor: Colors.primary500,
    borderColor: Colors.primary500,
  }
});
