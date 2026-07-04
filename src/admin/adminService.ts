import supabase from "@/supabase";

export interface AdminDevice {
  id: number;
  serialNumber: string;
  type: string;
  user_id: string;
  owner_email: string | null;
  plantName: string | null;
  lastHumidity: number | null;
  lastBattery: number | null;
  lastSeenAt: string | null;
}

export interface AdminLog {
  id: number;
  serialNumber: string;
  level: "error" | "warning" | "info";
  message: string;
  createdAt: string;
}

export async function fetchAdminDevices(): Promise<AdminDevice[]> {
  const { data, error } = await supabase.rpc("get_admin_devices");
  if (error) throw error;
  return (data ?? []) as AdminDevice[];
}

export async function fetchAdminLogs(serialNumber?: string): Promise<AdminLog[]> {
  let query = supabase
    .from("device_logs")
    .select(`id, serialNumber, level, message, createdAt`)
    .order("createdAt", { ascending: false })
    .limit(500);

  if (serialNumber) {
    query = query.eq("serialNumber", serialNumber);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as AdminLog[];
}
