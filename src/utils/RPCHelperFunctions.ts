
import { supabase } from "@/integrations/supabase/client";

// This function will create the check_table_exists function if it doesn't exist
export const ensureRPCFunctionsExist = async () => {
  try {
    // Create the check_table_exists function
    await supabase.rpc('create_check_table_exists_function').catch(async () => {
      // If the function to create functions doesn't exist, create it using the raw SQL API
      await supabase.rpc('create_necessary_functions');
    });
  } catch (error) {
    console.error("Error ensuring RPC functions exist:", error);
  }
};

// Call this function at app startup
export const initializeRPCFunctions = async () => {
  await ensureRPCFunctionsExist();
};
