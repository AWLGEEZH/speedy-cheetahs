import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const createEventSchema = z.object({
  type: z.enum(["GAME", "PRACTICE", "OTHER"]),
  title: z.string().min(1).max(200),
  opponent: z.string().max(100).optional(),
  date: z.string(),
  endTime: z.string().optional(),
  locationName: z.string().min(1).max(200),
  locationAddress: z.string().max(500).optional(),
  notes: z.string().max(2000).optional(),
});

export const updateEventSchema = createEventSchema.partial().extend({
  isCancelled: z.boolean().optional(),
});

export const createPlayerSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  jerseyNumber: z.number().int().min(0).max(99).optional(),
  notes: z.string().max(2000).optional(),
  familyId: z.string(),
});

export const updatePlayerSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  jerseyNumber: z.number().int().min(0).max(99).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  familyId: z.string().optional(),
});

export const createFamilySchema = z.object({
  parentName: z.string().min(1).max(100),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().min(10).max(20),
  smsOptIn: z.boolean().optional(),
});

export const updateFamilySchema = z.object({
  parentName: z.string().min(1).max(100).optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().min(10).max(20).optional(),
  smsOptIn: z.boolean().optional(),
});

export const familyRegistrationSchema = z.object({
  parentName: z.string().min(1).max(100),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().min(10).max(20),
  playerFirstName: z.string().min(1).max(50),
  playerLastName: z.string().min(1).max(50),
});

export const createVolunteerRoleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  slotsNeeded: z.number().int().min(1).max(10),
  eventId: z.string(),
});

export const volunteerSignupSchema = z.object({
  familyId: z.string(),
  roleId: z.string(),
});

export const postUpdateSchema = z.object({
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(2000),
  eventId: z.string().optional(),
  sendSms: z.boolean().default(false),
});

export const attendanceRsvpSchema = z.object({
  playerId: z.string(),
  familyId: z.string(),
  status: z.enum(["CONFIRMED", "DECLINED"]),
});

export const battingActionSchema = z.object({
  action: z.enum(["NEXT_BATTER", "UNDO", "RESET"]),
});

export const initBattingSchema = z.object({
  playerOrder: z.array(z.string()).min(1),
});

export const fieldingAssignmentSchema = z.object({
  inning: z.number().int().min(1),
  assignments: z.array(
    z.object({
      playerId: z.string(),
      position: z.enum([
        "PITCHER",
        "CATCHER",
        "FIRST_BASE",
        "SECOND_BASE",
        "THIRD_BASE",
        "SHORTSTOP",
        "LEFT_FIELD",
        "CENTER_FIELD",
        "RIGHT_FIELD",
        "LEFT_CENTER",
        "RIGHT_CENTER",
        "BENCH",
      ]),
    })
  ),
});

export const recordOutSchema = z.object({
  inning: z.number().int().min(1),
});

export const rulesQuerySchema = z.object({
  question: z.string().min(1).max(500),
});

export const coachingRequestSchema = z.object({
  goals: z.string().min(1).max(2000),
  observations: z.string().min(1).max(2000),
  focusArea: z.string().max(100).optional(),
});

export const saveRulesSchema = z.object({
  rulesText: z.string().max(50000),
});

export const createCoachSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  phone: z.string().max(20).optional(),
});

export const updateCoachSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional().nullable(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6).max(100),
});

export const publicFamilyUpdateSchema = z.object({
  parentName: z.string().min(1).max(100).optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().min(10).max(20).optional(),
  smsOptIn: z.boolean().optional(),
});

export const createContactSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(20).optional().or(z.literal("")),
  relationship: z.string().max(50).optional().or(z.literal("")),
});

export const createKBTextSchema = z.object({
  title: z.string().min(1).max(200),
  type: z.literal("TEXT"),
  content: z.string().min(1).max(100000),
});

export const createKBUrlSchema = z.object({
  title: z.string().min(1).max(200),
  type: z.literal("URL"),
  sourceUrl: z.string().url().max(2000),
});
