import React, { useRef } from "react";
import { View, StyleSheet, TextInput, TextInputKeyPressEventData, NativeSyntheticEvent } from "react-native";
import { Text } from "./Typography";
import { Colors, Spacing, Radius } from "@/constants/theme";

interface PlateInputProps {
  value: string;
  onChange: (plate: string) => void;
  error?: string;
  label?: string;
  optional?: boolean;
}

export const PlateInput: React.FC<PlateInputProps> = ({ value, onChange, error, label, optional }) => {
  const inputs = useRef<Array<TextInput | null>>([]);
  
  // Pad the value to always be length 6 for mapping
  const chars = value.padEnd(6, "").split("").slice(0, 6);

  const handleChange = (text: string, index: number) => {
    const newChar = text.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(-1);
    
    // Create new array of characters
    const newChars = [...chars];
    newChars[index] = newChar;
    
    const newValue = newChars.join("").trim();
    onChange(newValue);

    if (newChar && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !chars[index] && index > 0) {
      inputs.current[index - 1]?.focus();
      // Also clear the previous character
      const newChars = [...chars];
      newChars[index - 1] = "";
      onChange(newChars.join("").trim());
    }
  };

  return (
    <View style={styles.container} collapsable={false}>
      {(label || optional) && (
        <View style={styles.labelContainer}>
          {label && (
            <Text variant="caption" color="gray700" weight="600" style={styles.label}>
              {label}
            </Text>
          )}
          {optional && (
            <Text variant="caption" color="gray500" style={styles.optional}>
              (Opcional)
            </Text>
          )}
        </View>
      )}
      
      <View style={styles.boxesContainer}>
        {Array(6).fill(0).map((_, index) => (
          <React.Fragment key={index}>
            <View 
              collapsable={false}
              style={[
                styles.boxWrapper,
                error ? styles.boxWrapperError : null,
                chars[index] ? styles.boxWrapperFilled : null
              ]}
            >
              <TextInput
                ref={el => { inputs.current[index] = el; }}
                style={[
                  styles.input,
                  error ? styles.inputError : null
                ]}
                value={chars[index]}
                onChangeText={(text) => handleChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                maxLength={2}
                autoCapitalize="characters"
                selectTextOnFocus
                keyboardType={index < 3 ? "default" : "default"}
              />
            </View>
            {index === 2 && <View style={styles.separator} />}
          </React.Fragment>
        ))}
      </View>
      
      {error ? (
        <Text variant="caption" color="error" style={styles.errorText}>
          {error}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  label: {
    marginRight: Spacing.xs,
  },
  optional: {
    fontStyle: "italic",
  },
  boxesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  boxWrapper: {
    flex: 1,
    aspectRatio: 0.8,
    maxWidth: 45,
    borderRadius: Radius.sm,
    backgroundColor: Colors.gray50,
    borderWidth: 1,
    borderColor: Colors.gray300,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 2,
  },
  boxWrapperFilled: {
    borderColor: Colors.primary500,
    backgroundColor: Colors.white,
  },
  boxWrapperError: {
    borderColor: "#EF4444",
    backgroundColor: "#FEF2F2",
  },
  input: {
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 22,
    color: Colors.gray900,
    textAlign: "center",
    width: "100%",
    height: "100%",
  },
  inputError: {
    color: "#EF4444",
  },
  separator: {
    width: 8,
    height: 2,
    backgroundColor: Colors.gray400,
    marginHorizontal: 4,
  },
  errorText: {
    marginTop: Spacing.xs,
  },
});
