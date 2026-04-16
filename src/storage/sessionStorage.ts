import AsyncStorage from "@react-native-async-storage/async-storage";

const ACTIVE_SESSION_STORAGE_KEY = "poop-timer/active-session";

export type StoredPoopSession = {
  startedAt: number;
  currentMessageId: string;
  lastMessageId?: string;
  leftAppDuringSession: boolean;
  scheduledNotificationIds: string[];
};

export async function loadStoredSessionAsync(): Promise<StoredPoopSession | null> {
  const rawValue = await AsyncStorage.getItem(ACTIVE_SESSION_STORAGE_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as StoredPoopSession;
  } catch {
    await AsyncStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
    return null;
  }
}

export async function saveStoredSessionAsync(session: StoredPoopSession): Promise<void> {
  await AsyncStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, JSON.stringify(session));
}

export async function clearStoredSessionAsync(): Promise<void> {
  await AsyncStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
}
