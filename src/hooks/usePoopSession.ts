import { useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus } from "react-native";
import { getMessageById, IDLE_MESSAGE, PoopMessage } from "../data/messages";
import {
  clearStoredSessionAsync,
  loadStoredSessionAsync,
  saveStoredSessionAsync,
  StoredPoopSession,
} from "../storage/sessionStorage";
import {
  cancelSessionReminderNotificationsAsync,
  dismissPresentedSessionNotificationsAsync,
  getNotificationPermissionStatusAsync,
  NOTIFICATION_LOOKAHEAD_MINUTES,
  requestNotificationPermissionsAsync,
  scheduleSessionReminderNotificationsAsync,
} from "../utils/notifications";
import { getMinuteForElapsedSeconds, selectBackgroundReturnMessage, selectSessionMessage } from "../utils/selectMessage";

export function usePoopSession() {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [currentMessage, setCurrentMessage] = useState<PoopMessage>(IDLE_MESSAGE);
  const [leftAppDuringSession, setLeftAppDuringSession] = useState(false);
  const currentMessageRef = useRef<PoopMessage>(IDLE_MESSAGE);
  const sessionStartedAtRef = useRef<number | null>(null);
  const lastShownMinuteRef = useRef<number | null>(null);
  const lastMessageIdRef = useRef<string | undefined>(undefined);
  const lastScheduledNotificationMessageIdRef = useRef<string | undefined>(undefined);
  const scheduledNotificationIdsRef = useRef<string[]>([]);
  const scheduledUntilMinuteRef = useRef(0);
  const notificationPermissionGrantedRef = useRef(false);
  const notificationSyncInFlightRef = useRef(false);
  const isActiveRef = useRef(false);
  const leftAppDuringSessionRef = useRef(false);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const updateCurrentMessage = (nextMessage: PoopMessage) => {
    currentMessageRef.current = nextMessage;
    setCurrentMessage(nextMessage);
  };

  const getElapsedSecondsNow = () => {
    const startedAt = sessionStartedAtRef.current;

    if (!startedAt) {
      return 0;
    }

    return Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
  };

  const persistSessionAsync = async (
    overrides: Partial<StoredPoopSession> = {}
  ): Promise<void> => {
    const startedAt = sessionStartedAtRef.current;

    if (!startedAt || !isActiveRef.current) {
      await clearStoredSessionAsync();
      return;
    }

    await saveStoredSessionAsync({
      startedAt,
      currentMessageId: overrides.currentMessageId ?? currentMessageRef.current.id,
      lastMessageId: overrides.lastMessageId ?? lastMessageIdRef.current,
      leftAppDuringSession: overrides.leftAppDuringSession ?? leftAppDuringSessionRef.current,
      scheduledNotificationIds: overrides.scheduledNotificationIds ?? scheduledNotificationIdsRef.current,
    });
  };

  const syncScheduledNotificationsAsync = async (
    currentElapsedSeconds: number,
    options: { resetExisting: boolean; allowPermissionPrompt: boolean }
  ): Promise<void> => {
    const startedAtSnapshot = sessionStartedAtRef.current;

    if (!startedAtSnapshot || notificationSyncInFlightRef.current) {
      return;
    }

    notificationSyncInFlightRef.current = true;

    try {
      const currentMinute = getMinuteForElapsedSeconds(currentElapsedSeconds);
      const schedulingStartMinute = options.resetExisting
        ? currentMinute + 1
        : Math.max(currentMinute + 1, scheduledUntilMinuteRef.current + 1);
      const schedulingEndMinute = currentMinute + NOTIFICATION_LOOKAHEAD_MINUTES;

      if (options.resetExisting) {
        await cancelSessionReminderNotificationsAsync(scheduledNotificationIdsRef.current);

        if (sessionStartedAtRef.current !== startedAtSnapshot || !isActiveRef.current) {
          return;
        }

        scheduledNotificationIdsRef.current = [];
        scheduledUntilMinuteRef.current = currentMinute;
        lastScheduledNotificationMessageIdRef.current = lastMessageIdRef.current;
      }

      if (schedulingStartMinute > schedulingEndMinute) {
        await persistSessionAsync({
          scheduledNotificationIds: scheduledNotificationIdsRef.current,
        });
        return;
      }

      notificationPermissionGrantedRef.current = options.allowPermissionPrompt
        ? await requestNotificationPermissionsAsync()
        : await getNotificationPermissionStatusAsync();

      if (!notificationPermissionGrantedRef.current) {
        await persistSessionAsync({
          scheduledNotificationIds: scheduledNotificationIdsRef.current,
        });
        return;
      }

      if (sessionStartedAtRef.current !== startedAtSnapshot || !isActiveRef.current) {
        return;
      }

      const scheduledNotifications = await scheduleSessionReminderNotificationsAsync({
        startedAt: startedAtSnapshot,
        fromMinute: schedulingStartMinute,
        toMinute: schedulingEndMinute,
        previousMessageId: lastScheduledNotificationMessageIdRef.current,
      });

      if (sessionStartedAtRef.current !== startedAtSnapshot || !isActiveRef.current) {
        await cancelSessionReminderNotificationsAsync(scheduledNotifications.notificationIds);
        return;
      }

      scheduledNotificationIdsRef.current = [
        ...scheduledNotificationIdsRef.current,
        ...scheduledNotifications.notificationIds,
      ];
      scheduledUntilMinuteRef.current = schedulingEndMinute;
      lastScheduledNotificationMessageIdRef.current = scheduledNotifications.lastMessageId;

      await persistSessionAsync({
        scheduledNotificationIds: scheduledNotificationIdsRef.current,
      });
    } catch (error) {
      console.warn("Poop Timer could not sync session reminders.", error);
      await persistSessionAsync({
        scheduledNotificationIds: scheduledNotificationIdsRef.current,
      });
    } finally {
      notificationSyncInFlightRef.current = false;
    }
  };

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const syncElapsedTime = () => {
      setElapsedSeconds(getElapsedSecondsNow());
    };

    // The timer derives elapsed time from the session start timestamp, which
    // keeps it honest even after brief app backgrounding or timer drift.
    syncElapsedTime();
    const intervalId = setInterval(() => {
      syncElapsedTime();
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [isActive]);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const currentMinute = getMinuteForElapsedSeconds(elapsedSeconds);

    if (lastShownMinuteRef.current === currentMinute) {
      if (currentMinute >= scheduledUntilMinuteRef.current - 5) {
        void syncScheduledNotificationsAsync(elapsedSeconds, {
          resetExisting: false,
          allowPermissionPrompt: false,
        });
      }
      return;
    }

    const nextMessage = selectSessionMessage({
      minute: currentMinute,
      previousMessageId: lastMessageIdRef.current,
    });

    updateCurrentMessage(nextMessage);
    lastMessageIdRef.current = nextMessage.id;
    lastShownMinuteRef.current = currentMinute;

    void persistSessionAsync({
      currentMessageId: nextMessage.id,
      lastMessageId: nextMessage.id,
    });

    if (currentMinute >= scheduledUntilMinuteRef.current - 5) {
      void syncScheduledNotificationsAsync(elapsedSeconds, {
        resetExisting: false,
        allowPermissionPrompt: false,
      });
    }
  }, [elapsedSeconds, isActive]);

  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  useEffect(() => {
    leftAppDuringSessionRef.current = leftAppDuringSession;
  }, [leftAppDuringSession]);

  useEffect(() => {
    // Restore the active session after a full close so scheduled reminders can
    // continue to make sense when the user comes back later.
    let isMounted = true;

    const restoreSessionAsync = async () => {
      const storedSession = await loadStoredSessionAsync();

      if (!storedSession || !isMounted) {
        return;
      }

      const restoredElapsedSeconds = Math.max(
        0,
        Math.floor((Date.now() - storedSession.startedAt) / 1000)
      );
      const restoredMinute = getMinuteForElapsedSeconds(restoredElapsedSeconds);
      const restoredMessage = storedSession.leftAppDuringSession
        ? selectBackgroundReturnMessage(storedSession.lastMessageId)
        : getMessageById(storedSession.currentMessageId) ??
          selectSessionMessage({
            minute: restoredMinute,
            previousMessageId: storedSession.lastMessageId,
          });

      sessionStartedAtRef.current = storedSession.startedAt;
      scheduledNotificationIdsRef.current = storedSession.scheduledNotificationIds;
      scheduledUntilMinuteRef.current = restoredMinute;
      isActiveRef.current = true;
      leftAppDuringSessionRef.current = storedSession.leftAppDuringSession;
      lastShownMinuteRef.current = restoredMinute;
      lastMessageIdRef.current = restoredMessage.id;
      lastScheduledNotificationMessageIdRef.current = restoredMessage.id;
      appStateRef.current = AppState.currentState;

      updateCurrentMessage(restoredMessage);
      setElapsedSeconds(restoredElapsedSeconds);
      setIsActive(true);
      setLeftAppDuringSession(storedSession.leftAppDuringSession);

      await dismissPresentedSessionNotificationsAsync();
      await syncScheduledNotificationsAsync(restoredElapsedSeconds, {
        resetExisting: true,
        allowPermissionPrompt: false,
      });
    };

    void restoreSessionAsync();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    // Track whether the user backgrounds the app during an active session so we
    // can call it out when they return, while the native notification schedule
    // keeps reminders firing if the app is no longer foregrounded.
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      const previousAppState = appStateRef.current;
      const sessionIsActive = isActiveRef.current;

      if (sessionIsActive && previousAppState === "active" && nextAppState.match(/inactive|background/)) {
        setLeftAppDuringSession(true);
        leftAppDuringSessionRef.current = true;
        void persistSessionAsync({
          leftAppDuringSession: true,
        });
        void syncScheduledNotificationsAsync(getElapsedSecondsNow(), {
          resetExisting: false,
          allowPermissionPrompt: false,
        });
      }

      if (
        sessionIsActive &&
        leftAppDuringSessionRef.current &&
        previousAppState.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        const refreshedElapsedSeconds = getElapsedSecondsNow();
        const currentMinute = getMinuteForElapsedSeconds(refreshedElapsedSeconds);
        const returnMessage = selectBackgroundReturnMessage(lastMessageIdRef.current);

        setElapsedSeconds(refreshedElapsedSeconds);
        lastShownMinuteRef.current = currentMinute;
        void dismissPresentedSessionNotificationsAsync();
        updateCurrentMessage(returnMessage);
        lastMessageIdRef.current = returnMessage.id;
        void persistSessionAsync({
          currentMessageId: returnMessage.id,
          lastMessageId: returnMessage.id,
        });
        void syncScheduledNotificationsAsync(refreshedElapsedSeconds, {
          resetExisting: false,
          allowPermissionPrompt: false,
        });
      }

      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const startSession = async () => {
    const startedAt = Date.now();
    const firstMessage = selectSessionMessage({
      minute: 0,
      previousMessageId: undefined,
    });

    sessionStartedAtRef.current = startedAt;
    isActiveRef.current = true;
    leftAppDuringSessionRef.current = false;
    scheduledNotificationIdsRef.current = [];
    scheduledUntilMinuteRef.current = 0;
    notificationPermissionGrantedRef.current = false;
    setElapsedSeconds(0);
    setIsActive(true);
    setLeftAppDuringSession(false);
    appStateRef.current = AppState.currentState;
    updateCurrentMessage(firstMessage);
    lastMessageIdRef.current = firstMessage.id;
    lastScheduledNotificationMessageIdRef.current = firstMessage.id;
    lastShownMinuteRef.current = 0;

    await persistSessionAsync({
      currentMessageId: firstMessage.id,
      lastMessageId: firstMessage.id,
      leftAppDuringSession: false,
      scheduledNotificationIds: [],
    });

    await dismissPresentedSessionNotificationsAsync();
    await syncScheduledNotificationsAsync(0, {
      resetExisting: true,
      allowPermissionPrompt: true,
    });
  };

  const endSession = async () => {
    const scheduledNotificationIds = [...scheduledNotificationIdsRef.current];

    sessionStartedAtRef.current = null;
    isActiveRef.current = false;
    leftAppDuringSessionRef.current = false;
    lastScheduledNotificationMessageIdRef.current = undefined;
    scheduledNotificationIdsRef.current = [];
    scheduledUntilMinuteRef.current = 0;
    notificationPermissionGrantedRef.current = false;
    setElapsedSeconds(0);
    setIsActive(false);
    setLeftAppDuringSession(false);
    updateCurrentMessage(IDLE_MESSAGE);
    lastShownMinuteRef.current = null;
    lastMessageIdRef.current = undefined;

    await cancelSessionReminderNotificationsAsync(scheduledNotificationIds);
    await dismissPresentedSessionNotificationsAsync();
    await clearStoredSessionAsync();
  };

  return {
    elapsedSeconds,
    isActive,
    currentMessage,
    leftAppDuringSession,
    startSession,
    endSession,
  };
}
