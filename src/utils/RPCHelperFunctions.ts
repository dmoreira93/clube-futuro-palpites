
import { supabase } from "@/integrations/supabase/client";

// This function will create the check_table_exists function if it doesn't exist
export const ensureRPCFunctionsExist = async () => {
  try {
    // Create the check_table_exists function
    await supabase.rpc('create_check_table_exists_function').catch(async () => {
      // If the function to create functions doesn't exist, create it using raw SQL API
      await supabase.rpc('create_necessary_functions');
    });
  } catch (error) {
    console.error("Error ensuring RPC functions exist:", error);
  }
};

// Function to check if a table exists
export const checkTableExists = async (tableName: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('check_table_exists', { 
      table_name: tableName 
    });
    
    if (error) {
      console.error("Error checking if table exists:", error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error(`Error checking if table "${tableName}" exists:`, error);
    return false;
  }
};

// Call this function at app startup
export const initializeRPCFunctions = async () => {
  await ensureRPCFunctionsExist();
};
