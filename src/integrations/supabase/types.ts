export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      administrators: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          password: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          password: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          password?: string
        }
        Relationships: []
      }
      championships: {
        Row: {
          created_at: string | null
          end_date: string | null
          id: string
          logo_url: string | null
          name: string
          start_date: string | null
        }
        Insert: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          logo_url?: string | null
          name: string
          start_date?: string | null
        }
        Update: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          start_date?: string | null
        }
        Relationships: []
      }
      final_predictions: {
        Row: {
          champion_id: string
          created_at: string
          final_away_score: number
          final_home_score: number
          fourth_place_id: string
          id: string
          runner_up_id: string
          third_place_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          champion_id: string
          created_at?: string
          final_away_score: number
          final_home_score: number
          fourth_place_id: string
          id?: string
          runner_up_id: string
          third_place_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          champion_id?: string
          created_at?: string
          final_away_score?: number
          final_home_score?: number
          fourth_place_id?: string
          id?: string
          runner_up_id?: string
          third_place_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "final_predictions_champion_id_fkey"
            columns: ["champion_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "final_predictions_fourth_place_id_fkey"
            columns: ["fourth_place_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "final_predictions_third_place_id_fkey"
            columns: ["third_place_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "final_predictions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users_custom"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "final_predictions_vice_champion_id_fkey"
            columns: ["runner_up_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      group_predictions: {
        Row: {
          created_at: string
          group_id: string
          id: string
          predicted_first_team_id: string
          predicted_second_team_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          predicted_first_team_id: string
          predicted_second_team_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          predicted_first_team_id?: string
          predicted_second_team_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_predictions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_predictions_predicted_first_team_id_fkey"
            columns: ["predicted_first_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_predictions_predicted_second_team_id_fkey"
            columns: ["predicted_second_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_predictions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_custom"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          championship_id: string | null
          created_at: string
          id: string
          name: string
        }
        Insert: {
          championship_id?: string | null
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          championship_id?: string | null
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "groups_championship_id_fkey"
            columns: ["championship_id"]
            isOneToOne: false
            referencedRelation: "championships"
            referencedColumns: ["id"]
          },
        ]
      }
      groups_results: {
        Row: {
          created_at: string | null
          first_place_team_id: string | null
          group_id: string | null
          id: string
          is_completed: boolean | null
          second_place_team_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          first_place_team_id?: string | null
          group_id?: string | null
          id?: string
          is_completed?: boolean | null
          second_place_team_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          first_place_team_id?: string | null
          group_id?: string | null
          id?: string
          is_completed?: boolean | null
          second_place_team_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "groups_results_first_place_team_id_fkey"
            columns: ["first_place_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "groups_results_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: true
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "groups_results_second_place_team_id_fkey"
            columns: ["second_place_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      match_predictions: {
        Row: {
          away_score: number
          created_at: string
          home_score: number
          id: string
          match_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          away_score: number
          created_at?: string
          home_score: number
          id?: string
          match_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          away_score?: number
          created_at?: string
          home_score?: number
          id?: string
          match_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_predictions_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_predictions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_custom"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          away_score: number | null
          away_team_id: string | null
          championship_id: string | null
          created_at: string
          home_score: number | null
          home_team_id: string | null
          id: string
          is_finished: boolean
          match_date: string
          stadium: string | null
          stage: string
          updated_at: string
        }
        Insert: {
          away_score?: number | null
          away_team_id?: string | null
          championship_id?: string | null
          created_at?: string
          home_score?: number | null
          home_team_id?: string | null
          id?: string
          is_finished?: boolean
          match_date: string
          stadium?: string | null
          stage: string
          updated_at?: string
        }
        Update: {
          away_score?: number | null
          away_team_id?: string | null
          championship_id?: string | null
          created_at?: string
          home_score?: number | null
          home_team_id?: string | null
          id?: string
          is_finished?: boolean
          match_date?: string
          stadium?: string | null
          stage?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_championship_id_fkey"
            columns: ["championship_id"]
            isOneToOne: false
            referencedRelation: "championships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      participations: {
        Row: {
          id: string
          joined_at: string
          points: number
          pool_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          points?: number
          pool_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          points?: number
          pool_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "participations_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "pools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_custom"
            referencedColumns: ["id"]
          },
        ]
      }
      pool_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          pool_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          pool_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          pool_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pool_messages_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "pools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pool_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_custom"
            referencedColumns: ["id"]
          },
        ]
      }
      pools: {
        Row: {
          admin_fee_percent: number | null
          championship_id: string | null
          created_at: string | null
          enable_punishment: boolean | null
          entry_fee: number | null
          id: string
          invite_code: string
          is_public: boolean | null
          max_participants: number | null
          name: string
          owner_id: string
          payment_required: boolean | null
          prediction_deadline: string | null
          prize_percent_1st: number | null
          prize_percent_2nd: number | null
          prize_percent_3rd: number | null
          punishment_description: string | null
        }
        Insert: {
          admin_fee_percent?: number | null
          championship_id?: string | null
          created_at?: string | null
          enable_punishment?: boolean | null
          entry_fee?: number | null
          id?: string
          invite_code: string
          is_public?: boolean | null
          max_participants?: number | null
          name: string
          owner_id: string
          payment_required?: boolean | null
          prediction_deadline?: string | null
          prize_percent_1st?: number | null
          prize_percent_2nd?: number | null
          prize_percent_3rd?: number | null
          punishment_description?: string | null
        }
        Update: {
          admin_fee_percent?: number | null
          championship_id?: string | null
          created_at?: string | null
          enable_punishment?: boolean | null
          entry_fee?: number | null
          id?: string
          invite_code?: string
          is_public?: boolean | null
          max_participants?: number | null
          name?: string
          owner_id?: string
          payment_required?: boolean | null
          prediction_deadline?: string | null
          prize_percent_1st?: number | null
          prize_percent_2nd?: number | null
          prize_percent_3rd?: number | null
          punishment_description?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pools_championship_id_fkey"
            columns: ["championship_id"]
            isOneToOne: false
            referencedRelation: "championships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pools_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users_custom"
            referencedColumns: ["id"]
          },
        ]
      }
      scoring_criteria: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          points: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          points: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          points?: number
          updated_at?: string
        }
        Relationships: []
      }
      teams: {
        Row: {
          api_football_id: number | null
          championship_id: string | null
          created_at: string
          flag_url: string | null
          group_id: string | null
          id: string
          name: string
        }
        Insert: {
          api_football_id?: number | null
          championship_id?: string | null
          created_at?: string
          flag_url?: string | null
          group_id?: string | null
          id?: string
          name: string
        }
        Update: {
          api_football_id?: number | null
          championship_id?: string | null
          created_at?: string
          flag_url?: string | null
          group_id?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_group_id"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_championship_id_fkey"
            columns: ["championship_id"]
            isOneToOne: false
            referencedRelation: "championships"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_results: {
        Row: {
          champion_id: string | null
          created_at: string | null
          final_away_score: number | null
          final_home_score: number | null
          fourth_place_id: string | null
          id: number
          is_completed: boolean | null
          runner_up_id: string | null
          third_place_id: string | null
          updated_at: string | null
        }
        Insert: {
          champion_id?: string | null
          created_at?: string | null
          final_away_score?: number | null
          final_home_score?: number | null
          fourth_place_id?: string | null
          id: number
          is_completed?: boolean | null
          runner_up_id?: string | null
          third_place_id?: string | null
          updated_at?: string | null
        }
        Update: {
          champion_id?: string | null
          created_at?: string | null
          final_away_score?: number | null
          final_home_score?: number | null
          fourth_place_id?: string | null
          id?: number
          is_completed?: boolean | null
          runner_up_id?: string | null
          third_place_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tournament_results_champion_id_fkey"
            columns: ["champion_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_results_fourth_place_id_fkey"
            columns: ["fourth_place_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_results_runner_up_id_fkey"
            columns: ["runner_up_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_results_third_place_id_fkey"
            columns: ["third_place_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      user_points: {
        Row: {
          created_at: string
          id: string
          match_id: string | null
          points: number
          points_type: string | null
          prediction_id: string | null
          related_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          match_id?: string | null
          points?: number
          points_type?: string | null
          prediction_id?: string | null
          related_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          match_id?: string | null
          points?: number
          points_type?: string | null
          prediction_id?: string | null
          related_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_custom"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_points_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      users_custom: {
        Row: {
          avatar_url: string | null
          created_at: string
          first_login: boolean | null
          id: string
          is_admin: boolean
          is_ai: boolean | null
          name: string
          payment_status: string | null
          updated_at: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          first_login?: boolean | null
          id?: string
          is_admin?: boolean
          is_ai?: boolean | null
          name: string
          payment_status?: string | null
          updated_at?: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          first_login?: boolean | null
          id?: string
          is_admin?: boolean
          is_ai?: boolean | null
          name?: string
          payment_status?: string | null
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_pool_membership: {
        Args: { pool_id_to_check: string }
        Returns: boolean
      }
      check_table_exists: { Args: { p_table_name: string }; Returns: boolean }
      create_check_table_exists_function: { Args: never; Returns: undefined }
      create_necessary_functions: { Args: never; Returns: undefined }
      create_pool:
        | {
            Args: {
              p_admin_fee: number
              p_championship_id: string
              p_enable_punishment: boolean
              p_entry_fee: number
              p_is_public: boolean
              p_max_participants: number
              p_owner_id: string
              p_payment_required: boolean
              p_pool_name: string
              p_prediction_deadline: string
              p_prize_1st: number
              p_prize_2nd: number
              p_prize_3rd: number
              p_punishment_desc: string
            }
            Returns: string
          }
        | {
            Args: {
              owner_id_param: string
              pool_name: string
              prize_1st: number
              prize_2nd: number
              prize_3rd: number
            }
            Returns: {
              id: string
              invite_code: string
            }[]
          }
        | {
            Args: {
              enable_punishment_param: boolean
              owner_id_param: string
              pool_name: string
              prize_1st: number
              prize_2nd: number
              prize_3rd: number
              punishment_desc_param: string
            }
            Returns: {
              id: string
              invite_code: string
            }[]
          }
      delete_pool_message: {
        Args: { p_message_id: string }
        Returns: undefined
      }
      get_all_final_predictions: {
        Args: { p_pool_id: string }
        Returns: {
          champion_name: string
          final_away_score: number
          final_home_score: number
          fourth_place_name: string
          runner_up_name: string
          third_place_name: string
          user_avatar: string
          user_id: string
          user_name: string
        }[]
      }
      get_all_group_predictions: {
        Args: { p_pool_id: string }
        Returns: {
          first_team_name: string
          group_name: string
          second_team_name: string
          user_avatar: string
          user_id: string
          user_name: string
        }[]
      }
      get_platform_stats: {
        Args: never
        Returns: {
          participant_count: number
          pool_count: number
        }[]
      }
      get_pool_dashboard_stats: { Args: { p_pool_id: string }; Returns: Json }
      get_pool_data: { Args: { p_pool_id: string }; Returns: Json }
      get_pool_ranking: {
        Args: { p_pool_id: string }
        Returns: {
          avatar_url: string
          exactscores: number
          id: string
          is_admin: boolean
          matchesplayed: number
          name: string
          points: number
          scored_matches: number
          username: string
        }[]
      }
      get_public_pools: {
        Args: { p_championship_id?: string }
        Returns: {
          championship: Json
          entry_fee: number
          id: string
          invite_code: string
          max_participants: number
          name: string
          participant_count: number
          prediction_deadline: string
        }[]
      }
      get_user_final_prediction: {
        Args: { user_id_param: string }
        Returns: Json[]
      }
      get_user_group_predictions: {
        Args: { user_id_param: string }
        Returns: Json[]
      }
      insert_final_prediction:
        | {
            Args: {
              champion_id_param: string
              final_away_score_param: number
              final_home_score_param: number
              fourth_place_id_param: string
              third_place_id_param: string
              user_id_param: string
              vice_champion_id_param: string
            }
            Returns: undefined
          }
        | {
            Args: {
              champion_id_param: string
              final_away_score_param: number
              final_home_score_param: number
              fourth_place_id_param: string
              third_place_id_param: string
              user_id_param: string
              vice_champion_id_param: string
            }
            Returns: undefined
          }
        | {
            Args: {
              champion_id_param: string
              fourth_place_id_param: string
              third_place_id_param: string
              user_id_param: string
              vice_champion_id_param: string
            }
            Returns: undefined
          }
        | { Args: never; Returns: undefined }
      insert_group_prediction: {
        Args: {
          first_team_id_param: string
          group_id_param: string
          second_team_id_param: string
          user_id_param: string
        }
        Returns: string
      }
      insert_match_prediction: {
        Args: {
          away_score_param: number
          home_score_param: number
          match_id_param: string
          user_id_param: string
        }
        Returns: string
      }
      is_admin: { Args: never; Returns: boolean }
      is_current_user_admin: { Args: never; Returns: boolean }
      is_pool_owner: { Args: { pool_id_to_check: string }; Returns: boolean }
      is_pool_participant: {
        Args: { pool_id_to_check: string }
        Returns: boolean
      }
      process_final_results: { Args: never; Returns: undefined }
      process_group_results: {
        Args: { p_group_id: string }
        Returns: undefined
      }
      recalculate_all_match_points: { Args: never; Returns: string }
      update_final_prediction:
        | {
            Args: {
              champion_id_param: string
              final_away_score_param: number
              final_home_score_param: number
              fourth_place_id_param: string
              pred_id: string
              third_place_id_param: string
              vice_champion_id_param: string
            }
            Returns: undefined
          }
        | {
            Args: {
              champion_id_param: string
              fourth_place_id_param: string
              pred_id: string
              third_place_id_param: string
              vice_champion_id_param: string
            }
            Returns: undefined
          }
        | { Args: never; Returns: undefined }
      update_group_prediction: {
        Args: {
          first_id_param: string
          pred_id: string
          second_id_param: string
        }
        Returns: undefined
      }
      update_match_prediction: {
        Args: {
          away_score_param: number
          home_score_param: number
          pred_id: string
        }
        Returns: undefined
      }
      upsert_pool_message: {
        Args: { p_message: string; p_pool_id: string }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
