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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action_type: string
          created_at: string
          id: string
          payload_json: Json | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          id?: string
          payload_json?: Json | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          id?: string
          payload_json?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      bot_instances: {
        Row: {
          bot_id: string
          config_json: Json | null
          created_at: string
          id: string
          markets: string[] | null
          max_daily_loss_percent: number | null
          max_open_trades: number | null
          max_stake: number | null
          name: string
          risk_per_trade_percent: number | null
          status: string | null
          trading_account_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bot_id: string
          config_json?: Json | null
          created_at?: string
          id?: string
          markets?: string[] | null
          max_daily_loss_percent?: number | null
          max_open_trades?: number | null
          max_stake?: number | null
          name: string
          risk_per_trade_percent?: number | null
          status?: string | null
          trading_account_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bot_id?: string
          config_json?: Json | null
          created_at?: string
          id?: string
          markets?: string[] | null
          max_daily_loss_percent?: number | null
          max_open_trades?: number | null
          max_stake?: number | null
          name?: string
          risk_per_trade_percent?: number | null
          status?: string | null
          trading_account_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bot_instances_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "bots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bot_instances_trading_account_id_fkey"
            columns: ["trading_account_id"]
            isOneToOne: false
            referencedRelation: "trading_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      bot_trades: {
        Row: {
          bot_instance_id: string
          broker_trade_id: string | null
          closed_at: string | null
          entry_price: number | null
          exit_price: number | null
          id: string
          opened_at: string
          pnl: number | null
          quantity: number | null
          side: string
          stake: number | null
          status: string | null
          stop_loss: number | null
          symbol: string
          take_profit: number | null
        }
        Insert: {
          bot_instance_id: string
          broker_trade_id?: string | null
          closed_at?: string | null
          entry_price?: number | null
          exit_price?: number | null
          id?: string
          opened_at?: string
          pnl?: number | null
          quantity?: number | null
          side: string
          stake?: number | null
          status?: string | null
          stop_loss?: number | null
          symbol: string
          take_profit?: number | null
        }
        Update: {
          bot_instance_id?: string
          broker_trade_id?: string | null
          closed_at?: string | null
          entry_price?: number | null
          exit_price?: number | null
          id?: string
          opened_at?: string
          pnl?: number | null
          quantity?: number | null
          side?: string
          stake?: number | null
          status?: string | null
          stop_loss?: number | null
          symbol?: string
          take_profit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bot_trades_bot_instance_id_fkey"
            columns: ["bot_instance_id"]
            isOneToOne: false
            referencedRelation: "bot_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      bots: {
        Row: {
          code: string
          config_schema_json: Json | null
          created_at: string
          default_markets: string[] | null
          description: string | null
          id: string
          is_active: boolean | null
          is_premium: boolean | null
          name: string
          short_description: string | null
          supported_brokers: string[] | null
        }
        Insert: {
          code: string
          config_schema_json?: Json | null
          created_at?: string
          default_markets?: string[] | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_premium?: boolean | null
          name: string
          short_description?: string | null
          supported_brokers?: string[] | null
        }
        Update: {
          code?: string
          config_schema_json?: Json | null
          created_at?: string
          default_markets?: string[] | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_premium?: boolean | null
          name?: string
          short_description?: string | null
          supported_brokers?: string[] | null
        }
        Relationships: []
      }
      broker_tokens: {
        Row: {
          broker_name: string
          created_at: string
          id: string
          is_active: boolean | null
          token_hash: string
          updated_at: string
          user_id: string
        }
        Insert: {
          broker_name: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          token_hash: string
          updated_at?: string
          user_id: string
        }
        Update: {
          broker_name?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          token_hash?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      brokers: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      copied_trades: {
        Row: {
          broker_trade_id: string | null
          closed_at: string | null
          direction: string
          id: string
          opened_at: string
          profit_loss: number | null
          provider_trade_id: string
          stake: number
          status: string | null
          subscriber_trading_account_id: string
          subscriber_user_id: string
          symbol: string
        }
        Insert: {
          broker_trade_id?: string | null
          closed_at?: string | null
          direction: string
          id?: string
          opened_at?: string
          profit_loss?: number | null
          provider_trade_id: string
          stake: number
          status?: string | null
          subscriber_trading_account_id: string
          subscriber_user_id: string
          symbol: string
        }
        Update: {
          broker_trade_id?: string | null
          closed_at?: string | null
          direction?: string
          id?: string
          opened_at?: string
          profit_loss?: number | null
          provider_trade_id?: string
          stake?: number
          status?: string | null
          subscriber_trading_account_id?: string
          subscriber_user_id?: string
          symbol?: string
        }
        Relationships: [
          {
            foreignKeyName: "copied_trades_provider_trade_id_fkey"
            columns: ["provider_trade_id"]
            isOneToOne: false
            referencedRelation: "provider_trades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "copied_trades_subscriber_trading_account_id_fkey"
            columns: ["subscriber_trading_account_id"]
            isOneToOne: false
            referencedRelation: "trading_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      copy_subscriptions: {
        Row: {
          copy_mode: string | null
          created_at: string
          fixed_stake: number | null
          id: string
          multiplier: number | null
          proportional_mode: string | null
          provider_id: string
          status: string | null
          subscriber_trading_account_id: string
          subscriber_user_id: string
          updated_at: string
        }
        Insert: {
          copy_mode?: string | null
          created_at?: string
          fixed_stake?: number | null
          id?: string
          multiplier?: number | null
          proportional_mode?: string | null
          provider_id: string
          status?: string | null
          subscriber_trading_account_id: string
          subscriber_user_id: string
          updated_at?: string
        }
        Update: {
          copy_mode?: string | null
          created_at?: string
          fixed_stake?: number | null
          id?: string
          multiplier?: number | null
          proportional_mode?: string | null
          provider_id?: string
          status?: string | null
          subscriber_trading_account_id?: string
          subscriber_user_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "copy_subscriptions_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "copy_subscriptions_subscriber_trading_account_id_fkey"
            columns: ["subscriber_trading_account_id"]
            isOneToOne: false
            referencedRelation: "trading_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      education_lessons: {
        Row: {
          category: string | null
          content: string
          created_at: string
          id: string
          lesson_number: number
          slug: string
          title: string
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          id?: string
          lesson_number: number
          slug: string
          title: string
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          id?: string
          lesson_number?: number
          slug?: string
          title?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      pricing_plans: {
        Row: {
          allow_copy_trading: boolean | null
          allow_premium_bots: boolean | null
          allow_provider_listing: boolean | null
          code: string
          created_at: string
          id: string
          is_active: boolean | null
          max_accounts: number | null
          max_bot_instances: number | null
          name: string
          price_usd: number | null
          price_zmw: number | null
        }
        Insert: {
          allow_copy_trading?: boolean | null
          allow_premium_bots?: boolean | null
          allow_provider_listing?: boolean | null
          code: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          max_accounts?: number | null
          max_bot_instances?: number | null
          name: string
          price_usd?: number | null
          price_zmw?: number | null
        }
        Update: {
          allow_copy_trading?: boolean | null
          allow_premium_bots?: boolean | null
          allow_provider_listing?: boolean | null
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          max_accounts?: number | null
          max_bot_instances?: number | null
          name?: string
          price_usd?: number | null
          price_zmw?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      provider_accounts: {
        Row: {
          created_at: string
          id: string
          provider_id: string
          status: string | null
          trading_account_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          provider_id: string
          status?: string | null
          trading_account_id: string
        }
        Update: {
          created_at?: string
          id?: string
          provider_id?: string
          status?: string | null
          trading_account_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_accounts_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_accounts_trading_account_id_fkey"
            columns: ["trading_account_id"]
            isOneToOne: false
            referencedRelation: "trading_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_trades: {
        Row: {
          broker: string | null
          broker_trade_id: string | null
          closed_at: string | null
          created_at: string
          direction: string
          duration: number | null
          duration_unit: string | null
          id: string
          profit_loss: number | null
          provider_id: string
          provider_trading_account_id: string
          stake: number
          status: string | null
          symbol: string
        }
        Insert: {
          broker?: string | null
          broker_trade_id?: string | null
          closed_at?: string | null
          created_at?: string
          direction: string
          duration?: number | null
          duration_unit?: string | null
          id?: string
          profit_loss?: number | null
          provider_id: string
          provider_trading_account_id: string
          stake: number
          status?: string | null
          symbol: string
        }
        Update: {
          broker?: string | null
          broker_trade_id?: string | null
          closed_at?: string | null
          created_at?: string
          direction?: string
          duration?: number | null
          duration_unit?: string | null
          id?: string
          profit_loss?: number | null
          provider_id?: string
          provider_trading_account_id?: string
          stake?: number
          status?: string | null
          symbol?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_trades_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_trades_provider_trading_account_id_fkey"
            columns: ["provider_trading_account_id"]
            isOneToOne: false
            referencedRelation: "trading_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      providers: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string
          id: string
          status: string | null
          total_profit: number | null
          total_subscribers: number | null
          total_trades: number | null
          updated_at: string
          user_id: string
          verified: boolean | null
          win_rate: number | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name: string
          id?: string
          status?: string | null
          total_profit?: number | null
          total_subscribers?: number | null
          total_trades?: number | null
          updated_at?: string
          user_id: string
          verified?: boolean | null
          win_rate?: number | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string
          id?: string
          status?: string | null
          total_profit?: number | null
          total_subscribers?: number | null
          total_trades?: number | null
          updated_at?: string
          user_id?: string
          verified?: boolean | null
          win_rate?: number | null
        }
        Relationships: []
      }
      risk_sessions: {
        Row: {
          created_at: string
          current_balance: number | null
          daily_pnl: number | null
          date: string
          id: string
          reason: string | null
          start_balance: number | null
          stop_trading: boolean | null
          trading_account_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_balance?: number | null
          daily_pnl?: number | null
          date?: string
          id?: string
          reason?: string | null
          start_balance?: number | null
          stop_trading?: boolean | null
          trading_account_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_balance?: number | null
          daily_pnl?: number | null
          date?: string
          id?: string
          reason?: string | null
          start_balance?: number | null
          stop_trading?: boolean | null
          trading_account_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "risk_sessions_trading_account_id_fkey"
            columns: ["trading_account_id"]
            isOneToOne: false
            referencedRelation: "trading_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      trading_accounts: {
        Row: {
          api_key_encrypted: string
          api_secret_encrypted: string | null
          broker: string
          created_at: string
          id: string
          is_active: boolean | null
          label: string
          login_id: string | null
          permissions_json: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          api_key_encrypted: string
          api_secret_encrypted?: string | null
          broker: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          label: string
          login_id?: string | null
          permissions_json?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          api_key_encrypted?: string
          api_secret_encrypted?: string | null
          broker?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          label?: string
          login_id?: string | null
          permissions_json?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      trading_signals: {
        Row: {
          confidence: number | null
          created_at: string
          direction: string
          entry_price: number
          id: string
          reason: string | null
          status: string | null
          stop_loss: number | null
          strategy_name: string
          symbol: string
          take_profit: number | null
          timeframe: string
          zone_max: number | null
          zone_min: number | null
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          direction: string
          entry_price: number
          id?: string
          reason?: string | null
          status?: string | null
          stop_loss?: number | null
          strategy_name?: string
          symbol?: string
          take_profit?: number | null
          timeframe?: string
          zone_max?: number | null
          zone_min?: number | null
        }
        Update: {
          confidence?: number | null
          created_at?: string
          direction?: string
          entry_price?: number
          id?: string
          reason?: string | null
          status?: string | null
          stop_loss?: number | null
          strategy_name?: string
          symbol?: string
          take_profit?: number | null
          timeframe?: string
          zone_max?: number | null
          zone_min?: number | null
        }
        Relationships: []
      }
      user_plan_subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          pricing_plan_id: string
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          pricing_plan_id: string
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          pricing_plan_id?: string
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_plan_subscriptions_pricing_plan_id_fkey"
            columns: ["pricing_plan_id"]
            isOneToOne: false
            referencedRelation: "pricing_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string
          default_pair: string | null
          default_timeframe: string | null
          id: string
          notifications_enabled: boolean | null
          risk_per_trade: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          default_pair?: string | null
          default_timeframe?: string | null
          id?: string
          notifications_enabled?: boolean | null
          risk_per_trade?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          default_pair?: string | null
          default_timeframe?: string | null
          id?: string
          notifications_enabled?: boolean | null
          risk_per_trade?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_trades: {
        Row: {
          closed_at: string | null
          direction: string
          entry_price: number
          exit_price: number | null
          id: string
          lot_size: number | null
          opened_at: string
          profit_loss: number | null
          signal_id: string | null
          status: string | null
          stop_loss: number | null
          symbol: string
          take_profit: number | null
          user_id: string
        }
        Insert: {
          closed_at?: string | null
          direction: string
          entry_price: number
          exit_price?: number | null
          id?: string
          lot_size?: number | null
          opened_at?: string
          profit_loss?: number | null
          signal_id?: string | null
          status?: string | null
          stop_loss?: number | null
          symbol: string
          take_profit?: number | null
          user_id: string
        }
        Update: {
          closed_at?: string | null
          direction?: string
          entry_price?: number
          exit_price?: number | null
          id?: string
          lot_size?: number | null
          opened_at?: string
          profit_loss?: number | null
          signal_id?: string | null
          status?: string | null
          stop_loss?: number | null
          symbol?: string
          take_profit?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_trades_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "trading_signals"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_bot_instance_owner: { Args: { instance_id: string }; Returns: boolean }
      is_owner: { Args: { record_user_id: string }; Returns: boolean }
      is_provider_owner: { Args: { provider_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
