/**
 * Formats a license plate input in real-time according to Colombia's standards:
 * - Car: 3 letters followed by 3 numbers (e.g., ABC123). Length 6.
 * - Moto: 3 letters, 2 numbers, and 1 letter (e.g., ABC12A). Length 6.
 */
export function formatPlate(text: string, type: "car" | "moto"): string {
  // Keep only alphanumeric characters and uppercase them
  const clean = text.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  let result = "";

  for (let i = 0; i < Math.min(clean.length, 6); i++) {
    const char = clean[i];
    if (i < 3) {
      // Index 0, 1, 2 must be letters
      if (/[A-Z]/.test(char)) {
        result += char;
      }
    } else if (i < 5) {
      // Index 3, 4 must be numbers
      if (/[0-9]/.test(char)) {
        result += char;
      }
    } else {
      // Index 5
      if (type === "car") {
        // Car: must be a number
        if (/[0-9]/.test(char)) {
          result += char;
        }
      } else {
        // Moto: must be a letter
        if (/[A-Z]/.test(char)) {
          result += char;
        }
      }
    }
  }
  return result;
}

/**
 * Validates a license plate according to Colombia's strict format.
 * Returns true if valid, false otherwise.
 */
export function validatePlate(text: string, type: "car" | "moto"): boolean {
  const cleanPlate = text.trim().toUpperCase();
  if (type === "car") {
    return /^[A-Z]{3}[0-9]{3}$/.test(cleanPlate);
  } else {
    // Motorcycle: 3 letters, 2 numbers, 1 letter
    return /^[A-Z]{3}[0-9]{2}[A-Z]$/.test(cleanPlate);
  }
}
