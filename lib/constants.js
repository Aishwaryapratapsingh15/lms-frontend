// Mirrors the enums documented in the backend's swagger.json (CreateUserDto,
// CreateLeadDto, UpdateLeadStatusDto, FollowUpDto).

export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  SALES: "SALES",
};

export const ROLE_LABELS = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  SALES: "Sales",
};

// Both Super Admin and Admin can see every lead and manage users; Sales can
// only see leads assigned to them.
export const FULL_ACCESS_ROLES = [ROLES.SUPER_ADMIN, ROLES.ADMIN];

export const LEAD_STATUSES = [
  "NEW",
  "CONTACTED",
  "FOLLOW_UP",
  "QUALIFIED",
  "PROPOSAL",
  "WON",
  "LOST",
  "PROJECT_IS_OURS",
];

export const LEAD_STATUS_LABELS = {
  NEW: "New",
  CONTACTED: "Contacted",
  FOLLOW_UP: "Follow-up",
  QUALIFIED: "Qualified",
  PROPOSAL: "Proposal",
  WON: "Won",
  LOST: "Lost",
  PROJECT_IS_OURS: "Project Is Ours",
};

export const LEAD_SOURCES = [
  "WEBSITE",
  "CALL",
  "SOCIAL_MEDIA",
  "REFERENCE",
  "PARTNER",
  "EMAIL",
  "OTHER",
];

export const LEAD_TYPES = ["INTERNAL", "EXTERNAL"];

export const LEAD_PRIORITIES = ["LOW", "MEDIUM", "HIGH"];

export const FOLLOW_UP_TYPES = ["CALL", "EMAIL", "MEETING", "NOTE"];
