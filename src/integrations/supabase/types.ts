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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      advances: {
        Row: {
          added_by: string | null
          advance_date: string
          amount: number
          created_at: string
          id: string
          member_id: string
          mess_id: string
          note: string
          updated_at: string
        }
        Insert: {
          added_by?: string | null
          advance_date?: string
          amount?: number
          created_at?: string
          id?: string
          member_id: string
          mess_id: string
          note?: string
          updated_at?: string
        }
        Update: {
          added_by?: string | null
          advance_date?: string
          amount?: number
          created_at?: string
          id?: string
          member_id?: string
          mess_id?: string
          note?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "advances_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advances_mess_id_fkey"
            columns: ["mess_id"]
            isOneToOne: false
            referencedRelation: "messes"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          added_by: string | null
          added_by_name: string | null
          amount: number
          category: Database["public"]["Enums"]["expense_category"]
          created_at: string
          description: string
          expense_date: string
          id: string
          mess_id: string
          receipt_url: string | null
          updated_at: string
        }
        Insert: {
          added_by?: string | null
          added_by_name?: string | null
          amount?: number
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          description: string
          expense_date?: string
          id?: string
          mess_id: string
          receipt_url?: string | null
          updated_at?: string
        }
        Update: {
          added_by?: string | null
          added_by_name?: string | null
          amount?: number
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          description?: string
          expense_date?: string
          id?: string
          mess_id?: string
          receipt_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_mess_id_fkey"
            columns: ["mess_id"]
            isOneToOne: false
            referencedRelation: "messes"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_calculations: {
        Row: {
          breakfast_count: number
          breakfast_multiplier: number
          created_at: string
          custom_expenses: Json
          custom_meals: Json
          dinner_count: number
          dinner_multiplier: number
          id: string
          lunch_count: number
          lunch_multiplier: number
          mess_id: string
          month: string
          name: string
          notes: string | null
          per_meal_cost: number
          total_expense: number
          total_meals: number
          updated_at: string
          user_id: string
        }
        Insert: {
          breakfast_count?: number
          breakfast_multiplier?: number
          created_at?: string
          custom_expenses?: Json
          custom_meals?: Json
          dinner_count?: number
          dinner_multiplier?: number
          id?: string
          lunch_count?: number
          lunch_multiplier?: number
          mess_id: string
          month: string
          name: string
          notes?: string | null
          per_meal_cost?: number
          total_expense?: number
          total_meals?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          breakfast_count?: number
          breakfast_multiplier?: number
          created_at?: string
          custom_expenses?: Json
          custom_meals?: Json
          dinner_count?: number
          dinner_multiplier?: number
          id?: string
          lunch_count?: number
          lunch_multiplier?: number
          mess_id?: string
          month?: string
          name?: string
          notes?: string | null
          per_meal_cost?: number
          total_expense?: number
          total_meals?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      meal_entries: {
        Row: {
          breakfast: boolean
          breakfast_value: number
          created_at: string
          custom_count: number
          dinner: boolean
          dinner_value: number
          entry_date: string
          id: string
          lunch: boolean
          lunch_value: number
          member_id: string
          mess_id: string
          total_meals: number
          updated_at: string
        }
        Insert: {
          breakfast?: boolean
          breakfast_value?: number
          created_at?: string
          custom_count?: number
          dinner?: boolean
          dinner_value?: number
          entry_date: string
          id?: string
          lunch?: boolean
          lunch_value?: number
          member_id: string
          mess_id: string
          total_meals?: number
          updated_at?: string
        }
        Update: {
          breakfast?: boolean
          breakfast_value?: number
          created_at?: string
          custom_count?: number
          dinner?: boolean
          dinner_value?: number
          entry_date?: string
          id?: string
          lunch?: boolean
          lunch_value?: number
          member_id?: string
          mess_id?: string
          total_meals?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_entries_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_entries_mess_id_fkey"
            columns: ["mess_id"]
            isOneToOne: false
            referencedRelation: "messes"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          advance_contributed: number
          created_at: string
          day_meals: number
          id: string
          is_active: boolean
          is_guest: boolean
          mess_id: string | null
          name: string
          night_meals: number
          personal_purchases: number
          profile_id: string | null
          role: string
          total_meals: number
          updated_at: string
        }
        Insert: {
          advance_contributed?: number
          created_at?: string
          day_meals?: number
          id?: string
          is_active?: boolean
          is_guest?: boolean
          mess_id?: string | null
          name: string
          night_meals?: number
          personal_purchases?: number
          profile_id?: string | null
          role?: string
          total_meals?: number
          updated_at?: string
        }
        Update: {
          advance_contributed?: number
          created_at?: string
          day_meals?: number
          id?: string
          is_active?: boolean
          is_guest?: boolean
          mess_id?: string | null
          name?: string
          night_meals?: number
          personal_purchases?: number
          profile_id?: string | null
          role?: string
          total_meals?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "members_mess_id_fkey"
            columns: ["mess_id"]
            isOneToOne: false
            referencedRelation: "messes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messes: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          is_approved: boolean
          is_suspended: boolean
          mess_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_approved?: boolean
          is_suspended?: boolean
          mess_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_approved?: boolean
          is_suspended?: boolean
          mess_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_mess_id_fkey"
            columns: ["mess_id"]
            isOneToOne: false
            referencedRelation: "messes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_mess_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      recalculate_all_totals: { Args: never; Returns: Json }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "super_admin"
      expense_category:
        | "Fish"
        | "Meat"
        | "Vegetables"
        | "Rent"
        | "Gas"
        | "Others"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user", "super_admin"],
      expense_category: ["Fish", "Meat", "Vegetables", "Rent", "Gas", "Others"],
    },
  },
} as const
