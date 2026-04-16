export type MessageCategory =
  | "idle"
  | "supportive"
  | "distraction"
  | "passive-aggressive"
  | "roasting"
  | "background-return"
  | "fallback";

export interface PoopMessage {
  id: string;
  text: string;
  category: MessageCategory;
  minMinute: number;
  maxMinute: number;
}

export const MESSAGE_CATEGORY_LABELS: Record<MessageCategory, string> = {
  idle: "Idle",
  supportive: "Supportive",
  distraction: "Distraction",
  "passive-aggressive": "Reality Check",
  roasting: "Roasting",
  "background-return": "Caught in 4K",
  fallback: "Fallback",
};

export const IDLE_MESSAGE: PoopMessage = {
  id: "idle-ready",
  text: "Tap start when duty calls. Keep it efficient, keep it classy.",
  category: "idle",
  minMinute: 0,
  maxMinute: 999,
};

export const SESSION_MESSAGES: ReadonlyArray<PoopMessage> = [
  {
    id: "supportive-master-colon",
    text: "You are the master of your colon.",
    category: "supportive",
    minMinute: 0,
    maxMinute: 5,
  },
  {
    id: "supportive-stay-focused",
    text: "Strong start. Stay focused.",
    category: "supportive",
    minMinute: 0,
    maxMinute: 5,
  },
  {
    id: "supportive-in-and-out",
    text: "This is a quick in-and-out operation.",
    category: "supportive",
    minMinute: 0,
    maxMinute: 5,
  },
  {
    id: "supportive-business-only",
    text: "Handle your business and leave with dignity.",
    category: "supportive",
    minMinute: 0,
    maxMinute: 5,
  },
  {
    id: "supportive-heroic-efficiency",
    text: "Be the kind of hero who does not scroll here.",
    category: "supportive",
    minMinute: 0,
    maxMinute: 5,
  },
  {
    id: "distraction-switch-apps",
    text: "I did see you switch apps.",
    category: "distraction",
    minMinute: 6,
    maxMinute: 10,
  },
  {
    id: "distraction-vibing",
    text: "Are we making progress, or just vibing?",
    category: "distraction",
    minMinute: 6,
    maxMinute: 10,
  },
  {
    id: "distraction-opened-video",
    text: "You opened another video, didn't you.",
    category: "distraction",
    minMinute: 6,
    maxMinute: 10,
  },
  {
    id: "distraction-lost-plot",
    text: "This started as a mission. Now it feels like a hangout.",
    category: "distraction",
    minMinute: 6,
    maxMinute: 10,
  },
  {
    id: "distraction-bathroom-office",
    text: "The bathroom is not your satellite office.",
    category: "distraction",
    minMinute: 6,
    maxMinute: 10,
  },
  {
    id: "passive-comfortable",
    text: "You've been here long enough to get comfortable. That's a problem.",
    category: "passive-aggressive",
    minMinute: 11,
    maxMinute: 20,
  },
  {
    id: "passive-lifestyle",
    text: "This has become less of a task and more of a lifestyle.",
    category: "passive-aggressive",
    minMinute: 11,
    maxMinute: 20,
  },
  {
    id: "passive-honest",
    text: "Twenty minutes. Let's be honest with ourselves.",
    category: "passive-aggressive",
    minMinute: 11,
    maxMinute: 20,
  },
  {
    id: "passive-tenancy",
    text: "At this point you're paying emotional rent in here.",
    category: "passive-aggressive",
    minMinute: 11,
    maxMinute: 20,
  },
  {
    id: "passive-rethink",
    text: "You have crossed from productive to suspicious.",
    category: "passive-aggressive",
    minMinute: 11,
    maxMinute: 20,
  },
  {
    id: "roasting-admit-defeat",
    text: "If nothing is floating in that bowl yet, it's time to admit defeat.",
    category: "roasting",
    minMinute: 21,
    maxMinute: 999,
  },
  {
    id: "roasting-anything-else",
    text: "You could've done literally anything else by now.",
    category: "roasting",
    minMinute: 21,
    maxMinute: 999,
  },
  {
    id: "roasting-rejoin-society",
    text: "Stand up. Rejoin society. We'll try again later.",
    category: "roasting",
    minMinute: 21,
    maxMinute: 999,
  },
  {
    id: "roasting-bathroom-throne",
    text: "The throne has rejected your long-term lease.",
    category: "roasting",
    minMinute: 21,
    maxMinute: 999,
  },
  {
    id: "roasting-orbit",
    text: "You've been in bathroom orbit too long. Prepare for re-entry.",
    category: "roasting",
    minMinute: 21,
    maxMinute: 999,
  },
];

export const BACKGROUND_RETURN_MESSAGES: ReadonlyArray<PoopMessage> = [
  {
    id: "background-return-mission",
    text: "Welcome back. I noticed you abandoned the app but not the mission.",
    category: "background-return",
    minMinute: 0,
    maxMinute: 999,
  },
  {
    id: "background-return-videos",
    text: "You left to watch videos, didn't you.",
    category: "background-return",
    minMinute: 0,
    maxMinute: 999,
  },
  {
    id: "background-return-detected",
    text: "App closed, cheeks parked. Bold strategy.",
    category: "background-return",
    minMinute: 0,
    maxMinute: 999,
  },
];

export const FALLBACK_MESSAGE: PoopMessage = {
  id: "fallback-default",
  text: "Let's wrap this up with some urgency and a little self-respect.",
  category: "fallback",
  minMinute: 0,
  maxMinute: 999,
};

const ALL_MESSAGES: ReadonlyArray<PoopMessage> = [
  IDLE_MESSAGE,
  FALLBACK_MESSAGE,
  ...SESSION_MESSAGES,
  ...BACKGROUND_RETURN_MESSAGES,
];

export function getMessageById(messageId?: string): PoopMessage | undefined {
  return ALL_MESSAGES.find((message) => message.id === messageId);
}
