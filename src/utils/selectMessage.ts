import {
  BACKGROUND_RETURN_MESSAGES,
  FALLBACK_MESSAGE,
  PoopMessage,
  SESSION_MESSAGES,
} from "../data/messages";

type SelectMessageParams = {
  minute: number;
  previousMessageId?: string;
};

type BuildSessionMessageSequenceParams = {
  startMinute: number;
  endMinute: number;
  previousMessageId?: string;
};

export type SessionMessageSequenceEntry = {
  minute: number;
  message: PoopMessage;
};

function pickRandomMessage(messages: ReadonlyArray<PoopMessage>): PoopMessage | undefined {
  if (messages.length === 0) {
    return undefined;
  }

  const randomIndex = Math.floor(Math.random() * messages.length);

  return messages[randomIndex];
}

export function selectSessionMessage({
  minute,
  previousMessageId,
}: SelectMessageParams): PoopMessage {
  const eligibleMessages = SESSION_MESSAGES.filter(
    (message) => minute >= message.minMinute && minute <= message.maxMinute
  );

  if (eligibleMessages.length === 0) {
    return FALLBACK_MESSAGE;
  }

  const withoutRepeat = eligibleMessages.filter((message) => message.id !== previousMessageId);
  const pool = withoutRepeat.length > 0 ? withoutRepeat : eligibleMessages;

  return pickRandomMessage(pool) ?? FALLBACK_MESSAGE;
}

export function selectBackgroundReturnMessage(previousMessageId?: string): PoopMessage {
  const withoutRepeat = BACKGROUND_RETURN_MESSAGES.filter(
    (message) => message.id !== previousMessageId
  );
  const pool = withoutRepeat.length > 0 ? withoutRepeat : BACKGROUND_RETURN_MESSAGES;

  return pickRandomMessage(pool) ?? FALLBACK_MESSAGE;
}

export function getMinuteForElapsedSeconds(totalSeconds: number): number {
  return Math.floor(Math.max(0, totalSeconds) / 60);
}

export function buildSessionMessageSequence({
  startMinute,
  endMinute,
  previousMessageId,
}: BuildSessionMessageSequenceParams): SessionMessageSequenceEntry[] {
  const sequence: SessionMessageSequenceEntry[] = [];
  let lastMessageId = previousMessageId;

  for (let minute = startMinute; minute <= endMinute; minute += 1) {
    const message = selectSessionMessage({
      minute,
      previousMessageId: lastMessageId,
    });

    sequence.push({
      minute,
      message,
    });

    lastMessageId = message.id;
  }

  return sequence;
}
