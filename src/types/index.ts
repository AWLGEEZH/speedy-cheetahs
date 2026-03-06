export type EventType = "GAME" | "PRACTICE" | "OTHER";
export type CoachRole = "HEAD" | "ASSISTANT";
export type GameStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
export type AttendanceStatus = "PENDING" | "CONFIRMED" | "DECLINED";
export type FieldPosition =
  | "PITCHER"
  | "CATCHER"
  | "FIRST_BASE"
  | "SECOND_BASE"
  | "THIRD_BASE"
  | "SHORTSTOP"
  | "LEFT_FIELD"
  | "CENTER_FIELD"
  | "RIGHT_FIELD"
  | "LEFT_CENTER"
  | "RIGHT_CENTER"
  | "BENCH";

export interface PlayerWithFamily {
  id: string;
  firstName: string;
  lastName: string;
  jerseyNumber: number | null;
  notes: string | null;
  familyId: string;
  family: {
    id: string;
    parentName: string;
    email: string | null;
    phone: string;
  };
}

export interface EventWithDetails {
  id: string;
  type: EventType;
  title: string;
  opponent: string | null;
  date: string;
  endTime: string | null;
  locationName: string;
  locationAddress: string | null;
  notes: string | null;
  isCancelled: boolean;
  volunteerRoles?: VolunteerRoleWithSignups[];
}

export interface VolunteerRoleWithSignups {
  id: string;
  name: string;
  description: string | null;
  slotsNeeded: number;
  eventId: string;
  signups: {
    id: string;
    family: {
      id: string;
      parentName: string;
    };
  }[];
}

export interface UpdateWithCoach {
  id: string;
  title: string;
  message: string;
  smsSent: boolean;
  smsCount: number;
  eventId: string | null;
  createdAt: string;
  coach: {
    name: string;
  };
  event?: {
    title: string;
  } | null;
}

export interface BattingEntryWithPlayer {
  id: string;
  playerId: string;
  battingOrder: number;
  atBatCount: number;
  currentAtBat: boolean;
  player: {
    id: string;
    firstName: string;
    lastName: string;
    jerseyNumber: number | null;
  };
}

export interface FieldingEntryWithPlayer {
  id: string;
  playerId: string;
  inning: number;
  position: FieldPosition;
  outsRecorded: number;
  player: {
    id: string;
    firstName: string;
    lastName: string;
    jerseyNumber: number | null;
  };
}

export interface GameStateWithEntries {
  id: string;
  eventId: string;
  currentInning: number;
  isTopInning: boolean;
  currentBatterIndex: number;
  totalOuts: number;
  status: GameStatus;
  battingEntries: BattingEntryWithPlayer[];
  fieldingEntries: FieldingEntryWithPlayer[];
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
}

export interface CoachInfo {
  id: string;
  name: string;
  email: string;
  role: CoachRole;
  phone: string | null;
  createdAt: string;
}

export interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  relationship: string | null;
  familyId: string;
  createdAt: string;
}

export interface FamilyWithPlayersAndContacts {
  id: string;
  parentName: string;
  email: string | null;
  phone: string;
  smsOptIn: boolean;
  players: {
    id: string;
    firstName: string;
    lastName: string;
    jerseyNumber: number | null;
  }[];
  contacts: Contact[];
}

export type KBType = "PDF" | "URL" | "TEXT";

export interface KnowledgeBaseEntry {
  id: string;
  title: string;
  type: KBType;
  sourceUrl: string | null;
  contentPreview: string;
  coachName: string;
  createdAt: string;
}
