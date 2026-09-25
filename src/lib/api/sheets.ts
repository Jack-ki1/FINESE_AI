import { supabase } from "@/integrations/supabase/client";
export async function importGoogleSheet(sheetId: string, range: string = "Sheet1!A1:Z1000") {
  const { data, error } = await supabase.functions.invoke("sheets-import", { body: { sheetId, range } });
  if (error) throw new Error(error.message);
  return data as { rows: any[]; columns: string[] };
}
