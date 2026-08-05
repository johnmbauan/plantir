export const ADMIN_PAGE_SIZE = 50;

export const UNASSIGNED_OWNER_FILTER = "__unassigned__";
export const UNASSIGNED_PLANT_FILTER = "__unassigned_plant__";

export const LOG_LEVEL_COLOR: Record<string, string> = {
  error: "red",
  warning: "yellow",
  info: "blue",
};

export type AdminTab = "devices" | "logs" | "firmware";
