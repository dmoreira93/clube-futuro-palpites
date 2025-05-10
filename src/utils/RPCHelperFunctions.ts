
import { supabase } from "@/integrations/supabase/client";

// This function will create the check_table_exists function if it doesn't exist
export const ensureRPCFunctionsExist = async () => {
  try {
    // First try to create the check_table_exists function
    const { error: createFunctionError } = await supabase.rpc('create_check_table_exists_function');
    
    // If the function to create functions doesn't exist or fails, try using the other approach
    if (createFunctionError) {
      console.log("Attempting to create necessary functions:", createFunctionError.message);
      const { error: fallbackError } = await supabase.rpc('create_necessary_functions');
      
      if (fallbackError) {
        console.error("Error creating necessary RPC functions:", fallbackError);
      }
    }
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
