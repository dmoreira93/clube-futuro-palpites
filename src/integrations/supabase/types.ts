export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users_custom: {
        Row: {
          id: string
          name: string | null
          username: string | null
          avatar_url: string | null
          is_admin: boolean
          is_ai: boolean
          first_login: boolean
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id: string
          name?: string | null
          username?: string | null
          avatar_url?: string | null
          is_admin?: boolean
          is_ai?: boolean
          first_login?: boolean
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string | null
          username?: string | null
          avatar_url?: string | null
          is_admin?: boolean
          is_ai?: boolean
          first_login?: boolean
          created_at?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      championships: {
        Row: {
          id: string
          name: string
          slug: string | null
          logo_url: string | null
          start_date: string | null
          end_date: string | null
          is_finished: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug?: string | null
          logo_url?: string | null
          start_date?: string | null
          end_date?: string | null
          is_finished?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string | null
          logo_url?: string | null
          start_date?: string | null
          end_date?: string | null
          is_finished?: boolean
          created_at?: string
        }
        Relationships: []
      }
      pools: {
        Row: {
          id: string
          championship_id: string | null
          owner_id: string | null
          name: string
          invite_code: string | null
          description: string | null
          prize_percent_1st: number
          prize_percent_2nd: number
          prize_percent_3rd: number
          enable_punishment: boolean
          punishment_description: string | null
          entry_fee: number
          prediction_deadline: string | null
          max_participants: number | null
          admin_fee_percent: number
          is_public: boolean
          payment_required: boolean
          allow_multiple_bets: boolean
          created_at: string
        }
        Insert: {
          id?: string
          championship_id?: string | null
          owner_id?: string | null
          name: string
          invite_code?: string | null
          description?: string | null
          prize_percent_1st?: number
          prize_percent_2nd?: number
          prize_percent_3rd?: number
          enable_punishment?: boolean
          punishment_description?: string | null
          entry_fee?: number
          prediction_deadline?: string | null
          max_participants?: number | null
          admin_fee_percent?: number
          is_public?: boolean
          payment_required?: boolean
          allow_multiple_bets?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          championship_id?: string | null
          owner_id?: string | null
          name?: string
          invite_code?: string | null
          description?: string | null
          prize_percent_1st?: number
          prize_percent_2nd?: number
          prize_percent_3rd?: number
          enable_punishment?: boolean
          punishment_description?: string | null
          entry_fee?: number
          prediction_deadline?: string | null
          max_participants?: number | null
          admin_fee_percent?: number
          is_public?: boolean
          payment_required?: boolean
          allow_multiple_bets?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pools_championship_id_fkey"
            columns: ["championship_id"]
            referencedRelation: "championships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pools_owner_id_fkey"
            columns: ["owner_id"]
            referencedRelation: "users_custom"
            referencedColumns: ["id"]
          }
        ]
      }
      participations: {
        Row: {
          id: string
          user_id: string
          pool_id: string
          points: number
          exact_scores: number
          matches_played: number
          is_admin: boolean
          payment_status: string
          joined_at: string
        }
        Insert: {
          id?: string
          user_id: string
          pool_id: string
          points?: number
          exact_scores?: number
          matches_played?: number
          is_admin?: boolean
          payment_status?: string
          joined_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          pool_id?: string
          points?: number
          exact_scores?: number
          matches_played?: number
          is_admin?: boolean
          payment_status?: string
          joined_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "participations_pool_id_fkey"
            columns: ["pool_id"]
            referencedRelation: "pools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participations_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users_custom"
            referencedColumns: ["id"]
          }
        ]
      }
      matches: {
        Row: {
          id: string
          championship_id: string | null
          home_team_id: string | null
          away_team_id: string | null
          match_date: string
          round: string | null
          stadium: string | null
          home_score: number | null
          away_score: number | null
          status: string
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          championship_id?: string | null
          home_team_id?: string | null
          away_team_id?: string | null
          match_date: string
          round?: string | null
          stadium?: string | null
          home_score?: number | null
          away_score?: number | null
          status?: string
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          championship_id?: string | null
          home_team_id?: string | null
          away_team_id?: string | null
          match_date?: string
          round?: string | null
          stadium?: string | null
          home_score?: number | null
          away_score?: number | null
          status?: string
          created_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_championship_id_fkey"
            columns: ["championship_id"]
            referencedRelation: "championships"
            referencedColumns: ["id"]
          }
        ]
      }
      match_predictions: {
        Row: {
          id: string
          user_id: string
          pool_id: string
          match_id: string
          home_score: number | null
          away_score: number | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          pool_id: string
          match_id: string
          home_score?: number | null
          away_score?: number | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          pool_id?: string
          match_id?: string
          home_score?: number | null
          away_score?: number | null
          created_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_predictions_match_id_fkey"
            columns: ["match_id"]
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_predictions_pool_id_fkey"
            columns: ["pool_id"]
            referencedRelation: "pools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_predictions_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users_custom"
            referencedColumns: ["id"]
          }
        ]
      }
      scoring_criteria: {
        Row: {
          id: string
          pool_id: string | null
          name: string | null
          description: string | null
          points: number
          points_base: boolean
          type: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          pool_id?: string | null
          name?: string | null
          description?: string | null
          points: number
          points_base?: boolean
          type?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          pool_id?: string | null
          name?: string | null
          description?: string | null
          points?: number
          points_base?: boolean
          type?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scoring_criteria_pool_id_fkey"
            columns: ["pool_id"]
            referencedRelation: "pools"
            referencedColumns: ["id"]
          }
        ]
      }
      teams: {
        Row: {
          id: string
          name: string
          flag_url: string | null
          code: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          flag_url?: string | null
          code?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          flag_url?: string | null
          code?: string | null
          created_at?: string
        }
        Relationships: []
      }
      user_points_log: {
        Row: {
          id: string
          user_id: string
          pool_id: string
          points_earned: number
          points_type: string
          description: string | null
          match_prediction_id: string | null
          group_prediction_id: string | null
          final_prediction_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          pool_id: string
          points_earned: number
          points_type: string
          description?: string | null
          match_prediction_id?: string | null
          group_prediction_id?: string | null
          final_prediction_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          pool_id?: string
          points_earned?: number
          points_type?: string
          description?: string | null
          match_prediction_id?: string | null
          group_prediction_id?: string | null
          final_prediction_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_points_log_match_prediction_id_fkey"
            columns: ["match_prediction_id"]
            referencedRelation: "match_predictions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_points_log_pool_id_fkey"
            columns: ["pool_id"]
            referencedRelation: "pools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_points_log_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users_custom"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}