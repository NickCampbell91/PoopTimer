import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";

type SessionButtonProps = {
  label: string;
  onPress: () => void;
  variant: "start" | "end";
};

export function SessionButton({ label, onPress, variant }: SessionButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === "start" ? styles.startButton : styles.endButton,
        pressed && styles.buttonPressed,
      ]}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minWidth: 220,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#3d3028",
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 2,
  },
  startButton: {
    backgroundColor: "#2f7d5b",
  },
  endButton: {
    backgroundColor: "#b44931",
  },
  buttonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  label: {
    fontSize: 18,
    fontWeight: "800",
    color: "#fffdf8",
  },
});
