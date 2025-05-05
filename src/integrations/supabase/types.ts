export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
      groups: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      matches: {
        Row: {
          away_score: number | null
          away_team_id: string | null
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
            foreignKeyName: "matches_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      predictions: {
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
        Relationships: []
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
          created_at: string
          flag_url: string | null
          group_id: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          flag_url?: string | null
          group_id?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          flag_url?: string | null
          group_id?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      user_points: {
        Row: {
          created_at: string
          id: string
          match_id: string
          points: number
          points_type: string | null
          prediction_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          match_id: string
          points?: number
          points_type?: string | null
          prediction_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          match_id?: string
          points?: number
          points_type?: string | null
          prediction_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_points_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_points_prediction_id_fkey"
            columns: ["prediction_id"]
            isOneToOne: false
            referencedRelation: "predictions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_points_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_stats: {
        Row: {
          accuracy_percentage: number
          created_at: string
          id: string
          matches_played: number
          total_points: number
          updated_at: string
          user_id: string
        }
        Insert: {
          accuracy_percentage?: number
          created_at?: string
          id?: string
          matches_played?: number
          total_points?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          accuracy_percentage?: number
          created_at?: string
          id?: string
          matches_played?: number
          total_points?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          auth_id: string | null
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          auth_id?: string | null
          avatar_url?: string | null
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          auth_id?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
