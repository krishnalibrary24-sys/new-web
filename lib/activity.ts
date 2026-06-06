import { supabase } from "@/lib/supabase";

export async function logActivity(activeBranch: string, actionType: string, details: string) {
  try {
    const role = localStorage.getItem("krishna_role") || "staff";
    const staffId = localStorage.getItem("krishna_staff_id") || role;

    await supabase.from("activity_logs").insert([{
      branch: activeBranch,
      staff_id: staffId,
      action_type: actionType,
      details: details,
      created_at: new Date().toISOString()
    }]);
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}
