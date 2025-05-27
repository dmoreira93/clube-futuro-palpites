export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// --- Tipos para a lógica da aplicação ---

/**
 * Representa o palpite de um usuário para uma partida.
 */
export interface MatchPrediction {
  homeGoals: number;
  awayGoals: number;
}

/**
 * Representa o resultado real de uma partida.
 */
export interface MatchResult {
  homeGoals: number;
  awayGoals: number;
}

/**
 * Representa os palpites finais de um usuário para o torneio (campeão, vice, etc.).
 */
export interface TournamentFinalPredictions {
  champion: string;
  runnerUp: string; // No código do frontend/lógica, você pode usar runnerUp
  thirdPlace: string;
  fourthPlace: string;
  finalScore: {
    homeGoals: number;
    awayGoals: number;
  };
}

/**
 * Representa os resultados reais finais do torneio (campeão, vice, etc.).
 */
export interface TournamentFinalResults {
  champion: string;
  runnerUp: string; // No código do frontend/lógica, você pode usar runnerUp
  thirdPlace: string;
  fourthPlace: string;
  finalScore: {
    homeGoals: number;
    awayGoals: number;
  };
}

/**
 * Representa um participante no ranking, combinando dados do usuário com estatísticas calculadas.
 */
export type Participant = {
  id: string;
  name: string;
  username: string;
  avatar_url: string | null;
  points: number;
  matches: number;
  accuracy: string;
  premio?: string; // Campo opcional para prêmio
};

// --- Tipos gerados a partir do esquema do Supabase ---

export type Database = {
  public: {
    Tables: {
      administrators: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          password_hash: string // Assumindo que armazena hash e não a senha em texto
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          password_hash: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          password_hash?: string
        }
        Relationships: []
      }
      final_predictions: {
        Row: {
          champion_id: string | null // Permitindo null se ainda não palpitado
          created_at: string | null
          fourth_place_id: string | null // Permitindo null
          id: string
          third_place_id: string | null // Permitindo null
          updated_at: string | null
          user_id: string
          vice_champion_id: string | null // Permitindo null (use este nome se for o da coluna no DB)
          final_home_score: number | null // Placar da final
          final_away_score: number | null // Placar da final
        }
        Insert: {
          champion_id?: string | null
          created_at?: string | null
          fourth_place_id?: string | null
          id?: string
          third_place_id?: string | null
          updated_at?: string | null
          user_id: string
          vice_champion_id?: string | null
          final_home_score?: number | null
          final_away_score?: number | null
        }
        Update: {
          champion_id?: string | null
          created_at?: string | null
          fourth_place_id?: string | null
          id?: string
          third_place_id?: string | null
          updated_at?: string | null
          user_id?: string
          vice_champion_id?: string | null
          final_home_score?: number | null
          final_away_score?: number | null
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
            isOneToOne: false // Geralmente um usuário tem uma predição final
            referencedRelation: "users_custom" // ou auth.users se user_id for o auth.uid()
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "final_predictions_vice_champion_id_fkey"
            columns: ["vice_champion_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          }
        ]
      }
      group_predictions: {
        Row: {
          created_at: string | null
          predicted_first_team_id: string | null // ATUALIZADO (era first_team_id) e permitindo null
          group_id: string
          id: string
          predicted_second_team_id: string | null // ATUALIZADO (era second_team_id) e permitindo null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          predicted_first_team_id?: string | null
          group_id: string
          id?: string
          predicted_second_team_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          predicted_first_team_id?: string | null
          group_id?: string
          id?: string
          predicted_second_team_id?: string | null
          updated_at?: string | null
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
            referencedRelation: "users_custom" // ou auth.users
            referencedColumns: ["id"]
          }
        ]
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
          updated_at: string | null // Permitindo null
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
          updated_at?: string | null
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
          updated_at?: string | null
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
          }
        ]
      }
      match_predictions: { // Nome da tabela de palpites de partida (era 'predictions' no seu tipo antigo)
        Row: {
          away_score: number
          created_at: string
          home_score: number
          id: string
          match_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          away_score: number
          created_at?: string
          home_score: number
          id?: string
          match_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          away_score?: number
          created_at?: string
          home_score?: number
          id?: string
          match_id?: string
          updated_at?: string | null
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
            referencedRelation: "users_custom" // ou auth.users
            referencedColumns: ["id"]
          }
        ]
      }
      scoring_criteria: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          points: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          points: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          points?: number
          updated_at?: string | null
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
        Relationships: [
           {
            foreignKeyName: "teams_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          }
        ]
      }
      tournament_results: { // Nova tabela
        Row: {
          id: string;
          champion_id: string | null;
          runner_up_id: string | null; // Use este se for o nome da coluna no DB
          third_place_id: string | null;
          fourth_place_id: string | null;
          final_home_score: number | null;
          final_away_score: number | null;
          is_completed: boolean;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          champion_id?: string | null;
          runner_up_id?: string | null;
          third_place_id?: string | null;
          fourth_place_id?: string | null;
          final_home_score?: number | null;
          final_away_score?: number | null;
          is_completed?: boolean;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          champion_id?: string | null;
          runner_up_id?: string | null;
          third_place_id?: string | null;
          fourth_place_id?: string | null;
          final_home_score?: number | null;
          final_away_score?: number | null;
          is_completed?: boolean;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
            {
            foreignKeyName: "tournament_results_champion_id_fkey"
            columns: ["champion_id"]
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
          {
            foreignKeyName: "tournament_results_fourth_place_id_fkey"
            columns: ["fourth_place_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          }
        ]
      }
      groups_results: { // Nova tabela
        Row: {
          id: string;
          group_id: string;
          first_place_team_id: string | null;
          second_place_team_id: string | null;
          is_completed: boolean;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          group_id: string;
          first_place_team_id?: string | null;
          second_place_team_id?: string | null;
          is_completed?: boolean;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          group_id?: string;
          first_place_team_id?: string | null;
          second_place_team_id?: string | null;
          is_completed?: boolean;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
            {
            foreignKeyName: "groups_results_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false // Um grupo tem um resultado
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
           {
            foreignKeyName: "groups_results_first_place_team_id_fkey"
            columns: ["first_place_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "groups_results_second_place_team_id_fkey"
            columns: ["second_place_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          }
        ]
      }
      user_points: {
        Row: {
          created_at: string
          id: string
          match_id: string | null // Permitindo null
          points: number
          points_type: string | null
          prediction_id: string | null
          updated_at: string | null
          user_id: string
          related_id: string | null // Para IDs de grupo, resultado do torneio, etc.
        }
        Insert: {
          created_at?: string
          id?: string
          match_id?: string | null
          points?: number
          points_type?: string | null
          prediction_id?: string | null
          updated_at?: string | null
          user_id: string
          related_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          match_id?: string | null
          points?: number
          points_type?: string | null
          prediction_id?: string | null
          updated_at?: string | null
          user_id?: string
          related_id?: string | null
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
            foreignKeyName: "user_points_prediction_id_fkey" // Esta FK pode ser para diferentes tabelas de palpites
            columns: ["prediction_id"]
            isOneToOne: false
            referencedRelation: "match_predictions" // Ou group_predictions, final_predictions dependendo do points_type
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_points_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_custom" // ou auth.users
            referencedColumns: ["id"]
          }
          // Adicionar FK para related_id se necessário, ex:
          // {
          //   foreignKeyName: "user_points_related_id_group_fkey"
          //   columns: ["related_id"]
          //   isOneToOne: false
          //   referencedRelation: "groups"
          //   referencedColumns: ["id"]
          // },
          // {
          //   foreignKeyName: "user_points_related_id_tournament_results_fkey"
          //   columns: ["related_id"]
          //   isOneToOne: false
          //   referencedRelation: "tournament_results"
          //   referencedColumns: ["id"]
          // }
        ]
      }
      user_stats: { // Mantida conforme seu arquivo original
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
            referencedRelation: "users_custom" // ou auth.users
            referencedColumns: ["id"]
          }
        ]
      }
      users_custom: { // Estrutura simplificada, adicione outros campos conforme necessário
        Row: {
          id: string // Geralmente o auth.uid()
          created_at: string
          updated_at: string | null // Adicionada
          name: string
          username: string // Seu 'nickname'
          avatar_url: string | null
          is_admin: boolean
          first_login: boolean // Para o fluxo de mudança de senha
          total_points: number | null // Para o ranking
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string | null
          name: string
          username: string
          avatar_url?: string | null
          is_admin?: boolean
          first_login?: boolean
          total_points?: number | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string | null
          name?: string
          username?: string
          avatar_url?: string | null
          is_admin?: boolean
          first_login?: boolean
          total_points?: number | null
        }
        Relationships: [
          { // Se 'id' em users_custom é uma FK para auth.users.id
            foreignKeyName: "users_custom_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users" // Tabela auth.users
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: { // Verifique os nomes dos parâmetros de suas funções SQL
      check_table_exists: {
        Args: { table_name: string }
        Returns: boolean
      }
      create_check_table_exists_function: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_necessary_functions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_user_final_prediction: {
        Args: { user_id_param: string }
        Returns: Json[]
      }
      get_user_group_predictions: {
        Args: { user_id_param: string }
        Returns: Json[]
      }
      insert_final_prediction: { // Verifique os nomes dos parâmetros na sua função SQL
        Args: {
          user_id_param: string
          champion_id_param: string
          vice_champion_id_param: string // Ou runner_up_id_param
          third_place_id_param: string
          fourth_place_id_param: string
          // Adicionar parâmetros para final_home_score e final_away_score se a função os aceitar
          final_home_score_param?: number
          final_away_score_param?: number
        }
        Returns: undefined
      }
      insert_group_prediction: { // Verifique os nomes dos parâmetros na sua função SQL
        Args: {
          group_id_param: string
          user_id_param: string
          // Use os nomes que sua função SQL espera:
          predicted_first_team_id_param: string // Exemplo, se a função SQL usa este nome
          predicted_second_team_id_param: string // Exemplo
        }
        Returns: undefined
      }
      update_final_prediction: { // Verifique os nomes dos parâmetros na sua função SQL
        Args: {
          pred_id: string
          champion_id_param: string
          vice_champion_id_param: string // Ou runner_up_id_param
          third_place_id_param: string
          fourth_place_id_param: string
          // Adicionar parâmetros para final_home_score e final_away_score se a função os aceitar
          final_home_score_param?: number
          final_away_score_param?: number
        }
        Returns: undefined
      }
      update_group_prediction: { // Verifique os nomes dos parâmetros na sua função SQL
        Args: {
            pred_id: string;
            // Use os nomes que sua função SQL espera:
            predicted_first_id_param: string; // Exemplo
            predicted_second_id_param: string; // Exemplo
        }
        Returns: undefined
      }
      update_user_points_for_match: { // Função do seu SQL
        Args: { match_id_param: string } // string UUID
        Returns: undefined
      }
      update_user_stats_function: { // Função do seu SQL
        Args: { user_id_param: string } // string UUID
        Returns: undefined
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
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Enums"]
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