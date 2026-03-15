export const FIELD_POSITIONS = [
  { value: "PITCHER", label: "Pitcher", short: "P" },
  { value: "CATCHER", label: "Catcher", short: "C" },
  { value: "FIRST_BASE", label: "1st Base", short: "1B" },
  { value: "SECOND_BASE", label: "2nd Base", short: "2B" },
  { value: "THIRD_BASE", label: "3rd Base", short: "3B" },
  { value: "SHORTSTOP", label: "Shortstop", short: "SS" },
  { value: "LEFT_FIELD", label: "Left Field", short: "LF" },
  { value: "CENTER_FIELD", label: "Center Field", short: "CF" },
  { value: "RIGHT_FIELD", label: "Right Field", short: "RF" },
  { value: "LEFT_CENTER", label: "Left Center", short: "LC" },
  { value: "RIGHT_CENTER", label: "Right Center", short: "RC" },
  { value: "BENCH", label: "Bench", short: "BN" },
] as const;

export const EVENT_TYPES = [
  { value: "GAME", label: "Game" },
  { value: "PRACTICE", label: "Practice" },
  { value: "OTHER", label: "Other" },
] as const;

export const VOLUNTEER_ROLE_TEMPLATES = [
  "Snacks",
  "Drinks",
  "Practice Traffic Manager",
  "Scorekeeper",
  "Base Coach (1st)",
  "Base Coach (3rd)",
  "Equipment Setup",
  "Equipment Cleanup",
  "Team Parent",
  "Photo/Video",
] as const;

export const OUTS_PER_INNING = 6;

export const TEAM_NAME = "3D Printed Diamonds";
export const LEAGUE_NAME = "Farm-1";
