import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { formatElapsedTime } from "../utils/formatTime";

type TimerDisplayProps = {
  elapsedSeconds: number;
};

export function TimerDisplay({ elapsedSeconds }: TimerDisplayProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Elapsed Time</Text>
      <Text adjustsFontSizeToFit numberOfLines={1} style={styles.time}>
        {formatElapsedTime(elapsedSeconds)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fffaf0",
    borderRadius: 28,
    paddingVertical: 28,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "#eadcc2",
    shadowColor: "#5e4a2f",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    elevation: 3,
  },
  label: {
    fontSize: 15,
    fontWeight: "700",
    color: "#705f52",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  time: {
    fontSize: 64,
    fontWeight: "800",
    color: "#2b211b",
    letterSpacing: 2,
    fontVariant: ["tabular-nums"],
  },
});
