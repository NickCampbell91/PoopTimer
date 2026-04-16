import React from "react";
import { ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { MessageCard } from "./src/components/MessageCard";
import { SessionButton } from "./src/components/SessionButton";
import { TimerDisplay } from "./src/components/TimerDisplay";
import { IDLE_MESSAGE } from "./src/data/messages";
import { usePoopSession } from "./src/hooks/usePoopSession";

export default function App() {
  const {
    elapsedSeconds,
    isActive,
    currentMessage,
    startSession,
    endSession,
    leftAppDuringSession,
  } = usePoopSession();

  const messageTitle =
    currentMessage.category === "background-return"
      ? "Caught You"
      : isActive
        ? "Current Vibe"
        : "Ready When You Are";

  const messageDetail =
    currentMessage.category === "background-return"
      ? "Background escape attempt logged."
      : leftAppDuringSession && isActive
        ? "App switch detected earlier in this session."
        : currentMessage.id === IDLE_MESSAGE.id
          ? "Tap start when duty calls."
          : "Messages escalate the longer you linger.";

  return (
    <SafeAreaProvider>
      <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
        <ExpoStatusBar style="dark" />
        <StatusBar barStyle="dark-content" />
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Poop Timer</Text>
            <View style={[styles.sessionBadge, isActive ? styles.sessionBadgeActive : styles.sessionBadgeIdle]}>
              <View style={[styles.sessionDot, isActive ? styles.sessionDotActive : styles.sessionDotIdle]} />
              <Text style={styles.sessionLabel}>{isActive ? "Session Active" : "Session Idle"}</Text>
            </View>
          </View>

          <TimerDisplay elapsedSeconds={elapsedSeconds} />

          <MessageCard
            title={messageTitle}
            message={currentMessage.text}
            category={currentMessage.category}
            detail={messageDetail}
          />

          <View style={styles.buttonRow}>
            <SessionButton
              label={isActive ? "End Session" : "Start Session"}
              onPress={isActive ? endSession : startSession}
              variant={isActive ? "end" : "start"}
            />
          </View>

          <View style={styles.footerCard}>
            <Text style={styles.footerTitle}>MVP Notes</Text>
            <Text style={styles.footerText}>
              Messages rotate once per minute, escalate over time, and keep counting accurately even if you duck out of
              the app for a bit.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f6efd8",
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    justifyContent: "center",
    gap: 24,
  },
  header: {
    gap: 14,
    alignItems: "center",
  },
  title: {
    fontSize: 38,
    fontWeight: "800",
    color: "#2f241d",
    letterSpacing: 0.4,
  },
  sessionBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  sessionBadgeActive: {
    backgroundColor: "#edf7ee",
    borderColor: "#8dc69c",
  },
  sessionBadgeIdle: {
    backgroundColor: "#fff8eb",
    borderColor: "#dec9a6",
  },
  sessionDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  sessionDotActive: {
    backgroundColor: "#2d8f4e",
  },
  sessionDotIdle: {
    backgroundColor: "#bd8b44",
  },
  sessionLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#3d3028",
  },
  buttonRow: {
    alignItems: "center",
  },
  footerCard: {
    backgroundColor: "#fffaf0",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#eadcc2",
    gap: 8,
  },
  footerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#2f241d",
  },
  footerText: {
    fontSize: 14,
    lineHeight: 21,
    color: "#5f5149",
  },
});
