import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { MESSAGE_CATEGORY_LABELS, MessageCategory } from "../data/messages";

type MessageCardProps = {
  title: string;
  message: string;
  category: MessageCategory;
  detail?: string;
};

export function MessageCard({ title, message, category, detail }: MessageCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {detail ? <Text style={styles.detail}>{detail}</Text> : null}
      <Text style={styles.category}>{MESSAGE_CATEGORY_LABELS[category]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#2f241d",
    borderRadius: 24,
    padding: 22,
    gap: 14,
  },
  title: {
    fontSize: 14,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#f8d88f",
  },
  message: {
    fontSize: 24,
    lineHeight: 34,
    fontWeight: "700",
    color: "#fffaf2",
  },
  detail: {
    fontSize: 14,
    lineHeight: 21,
    color: "#f0e2c9",
  },
  category: {
    fontSize: 13,
    fontWeight: "700",
    color: "#d7c7b0",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});
