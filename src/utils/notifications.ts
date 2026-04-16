import { AppState, Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { buildSessionMessageSequence } from "./selectMessage";

export const SESSION_NOTIFICATION_CHANNEL_ID = "poop-session-reminders";
export const SESSION_NOTIFICATION_KIND = "session-reminder";
export const NOTIFICATION_LOOKAHEAD_MINUTES = 60;

Notifications.setNotificationHandler({
  handleNotification: async () => {
    const shouldPresentSystemNotification = AppState.currentState !== "active";

    return {
      // Foreground sessions already show messages in-app. Once the app is no
      // longer active, let Android/iOS surface the local reminder normally.
      shouldShowBanner: shouldPresentSystemNotification,
      shouldShowList: shouldPresentSystemNotification,
      shouldPlaySound: false,
      shouldSetBadge: false,
    };
  },
});

export async function configureNotificationsAsync(): Promise<void> {
  if (Platform.OS !== "android") {
    return;
  }

  await Notifications.setNotificationChannelAsync(SESSION_NOTIFICATION_CHANNEL_ID, {
    name: "Poop Timer reminders",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 200, 250],
    lightColor: "#2f7d5b",
  });
}

export async function getNotificationPermissionStatusAsync(): Promise<boolean> {
  await configureNotificationsAsync();

  const existingPermissions = await Notifications.getPermissionsAsync();

  return existingPermissions.granted;
}

export async function requestNotificationPermissionsAsync(): Promise<boolean> {
  await configureNotificationsAsync();

  const existingPermissions = await Notifications.getPermissionsAsync();

  if (existingPermissions.granted) {
    return true;
  }

  const requestedPermissions = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: false,
      allowSound: true,
    },
  });

  return requestedPermissions.granted;
}

type ScheduleSessionReminderNotificationsParams = {
  startedAt: number;
  fromMinute: number;
  toMinute: number;
  previousMessageId?: string;
};

type ScheduleSessionReminderNotificationsResult = {
  notificationIds: string[];
  lastMessageId?: string;
};

export async function scheduleSessionReminderNotificationsAsync({
  startedAt,
  fromMinute,
  toMinute,
  previousMessageId,
}: ScheduleSessionReminderNotificationsParams): Promise<ScheduleSessionReminderNotificationsResult> {
  const notificationIds: string[] = [];
  let lastPlannedMessageId = previousMessageId;
  const reminderPlan = buildSessionMessageSequence({
    startMinute: fromMinute,
    endMinute: toMinute,
    previousMessageId,
  });

  for (const reminder of reminderPlan) {
    const targetDate = new Date(startedAt + reminder.minute * 60_000);
    const secondsUntilTrigger = Math.ceil((targetDate.getTime() - Date.now()) / 1000);

    if (secondsUntilTrigger <= 0) {
      lastPlannedMessageId = reminder.message.id;
      continue;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Poop Timer",
        body: reminder.message.text,
        data: {
          kind: SESSION_NOTIFICATION_KIND,
          minute: reminder.minute,
          messageId: reminder.message.id,
          startedAt,
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: secondsUntilTrigger,
        ...(Platform.OS === "android" ? { channelId: SESSION_NOTIFICATION_CHANNEL_ID } : {}),
      },
    });

    notificationIds.push(notificationId);
    lastPlannedMessageId = reminder.message.id;
  }

  return {
    notificationIds,
    lastMessageId: lastPlannedMessageId,
  };
}

export async function cancelSessionReminderNotificationsAsync(notificationIds: string[]): Promise<void> {
  await Promise.all(
    notificationIds.map(async (notificationId) => {
      try {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
      } catch {
        // Ignore already-fired or already-cancelled notifications during a
        // refresh because they no longer affect the active session state.
      }
    })
  );
}

export async function dismissPresentedSessionNotificationsAsync(): Promise<void> {
  try {
    const presentedNotifications = await Notifications.getPresentedNotificationsAsync();
    const sessionNotificationIds = presentedNotifications
      .filter((notification) => {
        const notificationData = notification.request.content.data as
          | { kind?: unknown }
          | undefined;

        return (
          notification.request.content.title === "Poop Timer" ||
          notificationData?.kind === SESSION_NOTIFICATION_KIND
        );
      })
      .map((notification) => notification.request.identifier);

    await Promise.all(
      sessionNotificationIds.map(async (notificationId) => {
        try {
          await Notifications.dismissNotificationAsync(notificationId);
        } catch {
          // A notification may already be gone by the time we try to dismiss it.
        }
      })
    );
  } catch {
    // Reading presented notifications is best-effort cleanup and should never
    // interrupt the session flow if the runtime does not support it.
  }
}
