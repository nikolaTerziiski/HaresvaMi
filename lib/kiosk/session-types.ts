export type KioskSession = {
  id: string;
  restaurant_id: string;
  label: string | null;
  status: "active" | "revoked";
  expires_at: string;
  last_used_at: string | null;
  created_by: string | null;
  created_at: string;
};
