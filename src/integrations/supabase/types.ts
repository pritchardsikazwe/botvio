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
      affiliate_earnings: {
        Row: {
          amount_usd: number
          approved_at: string | null
          created_at: string
          earning_type: string
          id: string
          order_id: string | null
          referred_user_id: string | null
          referrer_user_id: string
          rule_id: string | null
          status: string
        }
        Insert: {
          amount_usd: number
          approved_at?: string | null
          created_at?: string
          earning_type: string
          id?: string
          order_id?: string | null
          referred_user_id?: string | null
          referrer_user_id: string
          rule_id?: string | null
          status?: string
        }
        Update: {
          amount_usd?: number
          approved_at?: string | null
          created_at?: string
          earning_type?: string
          id?: string
          order_id?: string | null
          referred_user_id?: string | null
          referrer_user_id?: string
          rule_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_earnings_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_earnings_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "commission_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_links: {
        Row: {
          clicks: number | null
          code: string
          conversions: number | null
          created_at: string
          id: string
          target_id: string | null
          type: string
          user_id: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          clicks?: number | null
          code: string
          conversions?: number | null
          created_at?: string
          id?: string
          target_id?: string | null
          type: string
          user_id: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          clicks?: number | null
          code?: string
          conversions?: number | null
          created_at?: string
          id?: string
          target_id?: string | null
          type?: string
          user_id?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      affiliate_profiles: {
        Row: {
          affiliate_code: string
          created_at: string
          default_payout_method: string | null
          status: string
          total_clicks: number | null
          total_earnings_usd: number | null
          total_signups: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          affiliate_code: string
          created_at?: string
          default_payout_method?: string | null
          status?: string
          total_clicks?: number | null
          total_earnings_usd?: number | null
          total_signups?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          affiliate_code?: string
          created_at?: string
          default_payout_method?: string | null
          status?: string
          total_clicks?: number | null
          total_earnings_usd?: number | null
          total_signups?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      analysis_jobs: {
        Row: {
          ai_response: string | null
          analysis_type: string | null
          completed_at: string | null
          created_at: string
          error_code: string | null
          error_message: string | null
          id: string
          image_url: string
          result_json: Json | null
          started_at: string | null
          status: string
          symbol: string | null
          timeframe: string | null
          user_id: string
        }
        Insert: {
          ai_response?: string | null
          analysis_type?: string | null
          completed_at?: string | null
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          id?: string
          image_url: string
          result_json?: Json | null
          started_at?: string | null
          status?: string
          symbol?: string | null
          timeframe?: string | null
          user_id: string
        }
        Update: {
          ai_response?: string | null
          analysis_type?: string | null
          completed_at?: string | null
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          id?: string
          image_url?: string
          result_json?: Json | null
          started_at?: string | null
          status?: string
          symbol?: string | null
          timeframe?: string | null
          user_id?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
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
      chart_analyses: {
        Row: {
          ai_response: string | null
          analysis_result: Json | null
          created_at: string
          id: string
          image_url: string
          is_premium_analysis: boolean | null
          symbol: string | null
          timeframe: string | null
          user_id: string
        }
        Insert: {
          ai_response?: string | null
          analysis_result?: Json | null
          created_at?: string
          id?: string
          image_url: string
          is_premium_analysis?: boolean | null
          symbol?: string | null
          timeframe?: string | null
          user_id: string
        }
        Update: {
          ai_response?: string | null
          analysis_result?: Json | null
          created_at?: string
          id?: string
          image_url?: string
          is_premium_analysis?: boolean | null
          symbol?: string | null
          timeframe?: string | null
          user_id?: string
        }
        Relationships: []
      }
      commission_rules: {
        Row: {
          buyer_bonus_type: string | null
          buyer_bonus_value: number | null
          created_at: string
          id: string
          is_active: boolean | null
          max_commission_usd: number | null
          min_purchase_usd: number | null
          name: string
          referrer_type: string
          referrer_value: number
          scope_id: string | null
          scope_type: string
        }
        Insert: {
          buyer_bonus_type?: string | null
          buyer_bonus_value?: number | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          max_commission_usd?: number | null
          min_purchase_usd?: number | null
          name: string
          referrer_type: string
          referrer_value?: number
          scope_id?: string | null
          scope_type: string
        }
        Update: {
          buyer_bonus_type?: string | null
          buyer_bonus_value?: number | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          max_commission_usd?: number | null
          min_purchase_usd?: number | null
          name?: string
          referrer_type?: string
          referrer_value?: number
          scope_id?: string | null
          scope_type?: string
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
      deriv_connection_logs: {
        Row: {
          created_at: string
          details: Json | null
          env: string
          event: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          details?: Json | null
          env: string
          event: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          details?: Json | null
          env?: string
          event?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      deriv_connections: {
        Row: {
          account_type: string | null
          balance: number | null
          connection_type: string
          created_at: string
          currency: string | null
          env: string
          expires_at: string | null
          id: string
          is_connected: boolean
          last_error: string | null
          last_verified_at: string | null
          login_id: string | null
          oauth_access_token: string | null
          oauth_refresh_token: string | null
          scope: string[] | null
          token_hash: string | null
          token_masked: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_type?: string | null
          balance?: number | null
          connection_type: string
          created_at?: string
          currency?: string | null
          env: string
          expires_at?: string | null
          id?: string
          is_connected?: boolean
          last_error?: string | null
          last_verified_at?: string | null
          login_id?: string | null
          oauth_access_token?: string | null
          oauth_refresh_token?: string | null
          scope?: string[] | null
          token_hash?: string | null
          token_masked?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_type?: string | null
          balance?: number | null
          connection_type?: string
          created_at?: string
          currency?: string | null
          env?: string
          expires_at?: string | null
          id?: string
          is_connected?: boolean
          last_error?: string | null
          last_verified_at?: string | null
          login_id?: string | null
          oauth_access_token?: string | null
          oauth_refresh_token?: string | null
          scope?: string[] | null
          token_hash?: string | null
          token_masked?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      deriv_symbols_cache: {
        Row: {
          cached_at: string
          display_name: string
          id: string
          is_active: boolean | null
          market: string | null
          pip_size: number | null
          submarket: string | null
          symbol: string
        }
        Insert: {
          cached_at?: string
          display_name: string
          id?: string
          is_active?: boolean | null
          market?: string | null
          pip_size?: number | null
          submarket?: string | null
          symbol: string
        }
        Update: {
          cached_at?: string
          display_name?: string
          id?: string
          is_active?: boolean | null
          market?: string | null
          pip_size?: number | null
          submarket?: string | null
          symbol?: string
        }
        Relationships: []
      }
      edge_logs: {
        Row: {
          created_at: string
          error_code: string | null
          error_message: string | null
          function_name: string
          id: string
          request_payload: Json | null
          response_status: number | null
          stack_trace: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          function_name: string
          id?: string
          request_payload?: Json | null
          response_status?: number | null
          stack_trace?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          function_name?: string
          id?: string
          request_payload?: Json | null
          response_status?: number | null
          stack_trace?: string | null
          user_id?: string | null
        }
        Relationships: []
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
      entitlements: {
        Row: {
          created_at: string
          ends_at: string | null
          id: string
          product_id: string
          source_order_id: string | null
          started_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ends_at?: string | null
          id?: string
          product_id: string
          source_order_id?: string | null
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          ends_at?: string | null
          id?: string
          product_id?: string
          source_order_id?: string | null
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entitlements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entitlements_source_order_id_fkey"
            columns: ["source_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      exchange_accounts: {
        Row: {
          api_key_enc: string
          api_secret_enc: string
          created_at: string
          exchange: string
          id: string
          label: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          api_key_enc: string
          api_secret_enc: string
          created_at?: string
          exchange: string
          id?: string
          label?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          api_key_enc?: string
          api_secret_enc?: string
          created_at?: string
          exchange?: string
          id?: string
          label?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      exchange_bot_instances: {
        Row: {
          config_json: Json
          created_at: string
          exchange_account_id: string
          id: string
          last_run_at: string | null
          market_type: string
          risk_profile: string
          status: string
          strategy_id: string
          symbol: string
          updated_at: string
          user_id: string
        }
        Insert: {
          config_json?: Json
          created_at?: string
          exchange_account_id: string
          id?: string
          last_run_at?: string | null
          market_type: string
          risk_profile?: string
          status?: string
          strategy_id: string
          symbol: string
          updated_at?: string
          user_id: string
        }
        Update: {
          config_json?: Json
          created_at?: string
          exchange_account_id?: string
          id?: string
          last_run_at?: string | null
          market_type?: string
          risk_profile?: string
          status?: string
          strategy_id?: string
          symbol?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exchange_bot_instances_exchange_account_id_fkey"
            columns: ["exchange_account_id"]
            isOneToOne: false
            referencedRelation: "exchange_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exchange_bot_instances_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "exchange_strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      exchange_bot_runs: {
        Row: {
          bot_instance_id: string
          created_at: string
          decision: string
          id: string
          ran_at: string
          reason: string | null
          snapshot: Json | null
        }
        Insert: {
          bot_instance_id: string
          created_at?: string
          decision: string
          id?: string
          ran_at?: string
          reason?: string | null
          snapshot?: Json | null
        }
        Update: {
          bot_instance_id?: string
          created_at?: string
          decision?: string
          id?: string
          ran_at?: string
          reason?: string | null
          snapshot?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "exchange_bot_runs_bot_instance_id_fkey"
            columns: ["bot_instance_id"]
            isOneToOne: false
            referencedRelation: "exchange_bot_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      exchange_orders: {
        Row: {
          bot_instance_id: string | null
          created_at: string
          exchange: string
          exchange_order_id: string | null
          id: string
          order_type: string
          price: number | null
          quantity: number | null
          raw: Json | null
          side: string
          status: string
          symbol: string
          user_id: string
        }
        Insert: {
          bot_instance_id?: string | null
          created_at?: string
          exchange: string
          exchange_order_id?: string | null
          id?: string
          order_type: string
          price?: number | null
          quantity?: number | null
          raw?: Json | null
          side: string
          status?: string
          symbol: string
          user_id: string
        }
        Update: {
          bot_instance_id?: string | null
          created_at?: string
          exchange?: string
          exchange_order_id?: string | null
          id?: string
          order_type?: string
          price?: number | null
          quantity?: number | null
          raw?: Json | null
          side?: string
          status?: string
          symbol?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exchange_orders_bot_instance_id_fkey"
            columns: ["bot_instance_id"]
            isOneToOne: false
            referencedRelation: "exchange_bot_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      exchange_positions: {
        Row: {
          created_at: string
          entry_price: number | null
          exchange: string
          id: string
          market_type: string
          position_side: string | null
          qty: number | null
          raw: Json | null
          symbol: string
          unrealized_pnl: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entry_price?: number | null
          exchange: string
          id?: string
          market_type: string
          position_side?: string | null
          qty?: number | null
          raw?: Json | null
          symbol: string
          unrealized_pnl?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          entry_price?: number | null
          exchange?: string
          id?: string
          market_type?: string
          position_side?: string | null
          qty?: number | null
          raw?: Json | null
          symbol?: string
          unrealized_pnl?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      exchange_strategies: {
        Row: {
          created_at: string
          description: string | null
          exchange: string
          id: string
          is_active: boolean
          key: string
          market_type: string
          name: string
          schema_json: Json
          template_json: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          exchange: string
          id?: string
          is_active?: boolean
          key: string
          market_type: string
          name: string
          schema_json?: Json
          template_json?: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          exchange?: string
          id?: string
          is_active?: boolean
          key?: string
          market_type?: string
          name?: string
          schema_json?: Json
          template_json?: Json
        }
        Relationships: []
      }
      executions: {
        Row: {
          broker_ref: string | null
          created_at: string
          fill_price: number | null
          id: string
          pnl: number | null
          raw: Json | null
          stake_or_lot: number
          status: string | null
          trade_intent_id: string | null
          user_id: string
        }
        Insert: {
          broker_ref?: string | null
          created_at?: string
          fill_price?: number | null
          id?: string
          pnl?: number | null
          raw?: Json | null
          stake_or_lot: number
          status?: string | null
          trade_intent_id?: string | null
          user_id: string
        }
        Update: {
          broker_ref?: string | null
          created_at?: string
          fill_price?: number | null
          id?: string
          pnl?: number | null
          raw?: Json | null
          stake_or_lot?: number
          status?: string | null
          trade_intent_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "executions_trade_intent_id_fkey"
            columns: ["trade_intent_id"]
            isOneToOne: false
            referencedRelation: "trade_intents"
            referencedColumns: ["id"]
          },
        ]
      }
      market_sessions: {
        Row: {
          close_time: string | null
          created_at: string
          id: string
          is_24_7: boolean
          is_active: boolean
          market_name: string
          market_type: string
          open_days: number[]
          open_time: string | null
          timezone: string
        }
        Insert: {
          close_time?: string | null
          created_at?: string
          id?: string
          is_24_7?: boolean
          is_active?: boolean
          market_name: string
          market_type: string
          open_days?: number[]
          open_time?: string | null
          timezone?: string
        }
        Update: {
          close_time?: string | null
          created_at?: string
          id?: string
          is_24_7?: boolean
          is_active?: boolean
          market_name?: string
          market_type?: string
          open_days?: number[]
          open_time?: string | null
          timezone?: string
        }
        Relationships: []
      }
      mt5_commands: {
        Row: {
          acked_at: string | null
          command: Json
          created_at: string
          id: string
          result: Json | null
          status: string
          terminal_uid: string
        }
        Insert: {
          acked_at?: string | null
          command?: Json
          created_at?: string
          id?: string
          result?: Json | null
          status?: string
          terminal_uid: string
        }
        Update: {
          acked_at?: string | null
          command?: Json
          created_at?: string
          id?: string
          result?: Json | null
          status?: string
          terminal_uid?: string
        }
        Relationships: []
      }
      mt5_states: {
        Row: {
          balance: number | null
          equity: number | null
          free_margin: number | null
          id: string
          margin: number | null
          positions: Json | null
          terminal_uid: string
          updated_at: string
        }
        Insert: {
          balance?: number | null
          equity?: number | null
          free_margin?: number | null
          id?: string
          margin?: number | null
          positions?: Json | null
          terminal_uid: string
          updated_at?: string
        }
        Update: {
          balance?: number | null
          equity?: number | null
          free_margin?: number | null
          id?: string
          margin?: number | null
          positions?: Json | null
          terminal_uid?: string
          updated_at?: string
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
      orders: {
        Row: {
          amount_usd: number
          created_at: string
          currency: string | null
          id: string
          paid_at: string | null
          product_id: string | null
          product_type: string
          referral_code: string | null
          status: string
          user_id: string
        }
        Insert: {
          amount_usd: number
          created_at?: string
          currency?: string | null
          id?: string
          paid_at?: string | null
          product_id?: string | null
          product_type: string
          referral_code?: string | null
          status?: string
          user_id: string
        }
        Update: {
          amount_usd?: number
          created_at?: string
          currency?: string | null
          id?: string
          paid_at?: string | null
          product_id?: string | null
          product_type?: string
          referral_code?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      p2p_offers: {
        Row: {
          auto_reply: string | null
          avg_release_time: number | null
          completion_rate: number | null
          created_at: string
          currency: string
          id: string
          is_active: boolean | null
          max_amount: number
          min_amount: number
          payment_methods: string[]
          price: number
          terms: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_reply?: string | null
          avg_release_time?: number | null
          completion_rate?: number | null
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean | null
          max_amount?: number
          min_amount?: number
          payment_methods?: string[]
          price: number
          terms?: string | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_reply?: string | null
          avg_release_time?: number | null
          completion_rate?: number | null
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean | null
          max_amount?: number
          min_amount?: number
          payment_methods?: string[]
          price?: number
          terms?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      p2p_reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rating: number
          reviewed_id: string
          reviewer_id: string
          trade_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          reviewed_id: string
          reviewer_id: string
          trade_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          reviewed_id?: string
          reviewer_id?: string
          trade_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "p2p_reviews_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "p2p_trades"
            referencedColumns: ["id"]
          },
        ]
      }
      p2p_trades: {
        Row: {
          admin_resolution: string | null
          amount_fiat: number
          amount_usd: number
          buyer_confirmed_at: string | null
          buyer_id: string
          created_at: string
          currency: string
          dispute_reason: string | null
          id: string
          offer_id: string | null
          payment_method: string
          price: number
          seller_id: string
          seller_released_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_resolution?: string | null
          amount_fiat: number
          amount_usd: number
          buyer_confirmed_at?: string | null
          buyer_id: string
          created_at?: string
          currency: string
          dispute_reason?: string | null
          id?: string
          offer_id?: string | null
          payment_method: string
          price: number
          seller_id: string
          seller_released_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_resolution?: string | null
          amount_fiat?: number
          amount_usd?: number
          buyer_confirmed_at?: string | null
          buyer_id?: string
          created_at?: string
          currency?: string
          dispute_reason?: string | null
          id?: string
          offer_id?: string | null
          payment_method?: string
          price?: number
          seller_id?: string
          seller_released_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "p2p_trades_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "p2p_offers"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_links: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          url: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          url: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          url?: string
        }
        Relationships: []
      }
      payment_options: {
        Row: {
          country_code: string
          country_name: string
          created_at: string
          currency: string | null
          display_name: string
          icon_url: string | null
          id: string
          is_active: boolean | null
          max_amount: number | null
          method_type: string
          min_amount: number | null
          priority: number | null
          provider_code: string
          provider_name: string
        }
        Insert: {
          country_code: string
          country_name: string
          created_at?: string
          currency?: string | null
          display_name: string
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          max_amount?: number | null
          method_type: string
          min_amount?: number | null
          priority?: number | null
          provider_code: string
          provider_name: string
        }
        Update: {
          country_code?: string
          country_name?: string
          created_at?: string
          currency?: string | null
          display_name?: string
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          max_amount?: number | null
          method_type?: string
          min_amount?: number | null
          priority?: number | null
          provider_code?: string
          provider_name?: string
        }
        Relationships: []
      }
      payment_requests: {
        Row: {
          admin_note: string | null
          amount_usd: number
          created_at: string
          currency: string | null
          id: string
          method: string
          plan_id: string | null
          proof_upload_url: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          amount_usd: number
          created_at?: string
          currency?: string | null
          id?: string
          method: string
          plan_id?: string | null
          proof_upload_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          amount_usd?: number
          created_at?: string
          currency?: string | null
          id?: string
          method?: string
          plan_id?: string | null
          proof_upload_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_requests_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "pricing_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_methods: {
        Row: {
          created_at: string
          crypto_address: string | null
          crypto_network: string | null
          id: string
          is_default: boolean | null
          mobile_network: string | null
          mobile_number: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          crypto_address?: string | null
          crypto_network?: string | null
          id?: string
          is_default?: boolean | null
          mobile_network?: string | null
          mobile_number?: string | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          crypto_address?: string | null
          crypto_network?: string | null
          id?: string
          is_default?: boolean | null
          mobile_network?: string | null
          mobile_number?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payout_requests: {
        Row: {
          admin_note: string | null
          amount_usd: number
          created_at: string
          id: string
          method_id: string
          processed_at: string | null
          processed_by: string | null
          status: string
          tx_reference: string | null
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          amount_usd: number
          created_at?: string
          id?: string
          method_id: string
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          tx_reference?: string | null
          user_id: string
        }
        Update: {
          admin_note?: string | null
          amount_usd?: number
          created_at?: string
          id?: string
          method_id?: string
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          tx_reference?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payout_requests_method_id_fkey"
            columns: ["method_id"]
            isOneToOne: false
            referencedRelation: "payout_methods"
            referencedColumns: ["id"]
          },
        ]
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
      product_purchases: {
        Row: {
          affiliate_code: string | null
          id: string
          order_id: string | null
          product_id: string
          purchased_at: string
          user_id: string
        }
        Insert: {
          affiliate_code?: string | null
          id?: string
          order_id?: string | null
          product_id: string
          purchased_at?: string
          user_id: string
        }
        Update: {
          affiliate_code?: string | null
          id?: string
          order_id?: string | null
          product_id?: string
          purchased_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_purchases_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_purchases_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          affiliate_percent: number
          billing_interval: string | null
          billing_type: string
          bot_id: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_featured: boolean
          metadata: Json | null
          name: string
          price_usd: number
          short_description: string | null
          slug: string
          strategy_id: string | null
          type: string
          updated_at: string
        }
        Insert: {
          affiliate_percent?: number
          billing_interval?: string | null
          billing_type?: string
          bot_id?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          metadata?: Json | null
          name: string
          price_usd?: number
          short_description?: string | null
          slug: string
          strategy_id?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          affiliate_percent?: number
          billing_interval?: string | null
          billing_type?: string
          bot_id?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          metadata?: Json | null
          name?: string
          price_usd?: number
          short_description?: string | null
          slug?: string
          strategy_id?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "bots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          country: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          language: string | null
          onboarding_complete: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          language?: string | null
          onboarding_complete?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          language?: string | null
          onboarding_complete?: boolean | null
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
          primary_market: string | null
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
          primary_market?: string | null
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
          primary_market?: string | null
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
      referral_clicks: {
        Row: {
          code: string
          country: string | null
          created_at: string
          device_fingerprint_hash: string | null
          id: string
          ip_hash: string | null
          landing_path: string | null
          referrer_user_id: string | null
          user_agent_hash: string | null
        }
        Insert: {
          code: string
          country?: string | null
          created_at?: string
          device_fingerprint_hash?: string | null
          id?: string
          ip_hash?: string | null
          landing_path?: string | null
          referrer_user_id?: string | null
          user_agent_hash?: string | null
        }
        Update: {
          code?: string
          country?: string | null
          created_at?: string
          device_fingerprint_hash?: string | null
          id?: string
          ip_hash?: string | null
          landing_path?: string | null
          referrer_user_id?: string | null
          user_agent_hash?: string | null
        }
        Relationships: []
      }
      referrals: {
        Row: {
          affiliate_code: string
          attributed_at: string
          device_hash: string | null
          first_click_id: string | null
          id: string
          ip_hash: string | null
          referred_user_id: string
          referrer_user_id: string
          status: string
        }
        Insert: {
          affiliate_code: string
          attributed_at?: string
          device_hash?: string | null
          first_click_id?: string | null
          id?: string
          ip_hash?: string | null
          referred_user_id: string
          referrer_user_id: string
          status?: string
        }
        Update: {
          affiliate_code?: string
          attributed_at?: string
          device_hash?: string | null
          first_click_id?: string | null
          id?: string
          ip_hash?: string | null
          referred_user_id?: string
          referrer_user_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_first_click_id_fkey"
            columns: ["first_click_id"]
            isOneToOne: false
            referencedRelation: "referral_clicks"
            referencedColumns: ["id"]
          },
        ]
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
      signal_audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          new_status: string | null
          notes: string | null
          old_status: string | null
          performed_by: string | null
          signal_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          new_status?: string | null
          notes?: string | null
          old_status?: string | null
          performed_by?: string | null
          signal_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          new_status?: string | null
          notes?: string | null
          old_status?: string | null
          performed_by?: string | null
          signal_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "signal_audit_logs_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "trading_signals"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          bing_verification_code: string | null
          canonical_base_url: string | null
          created_at: string
          google_verification_code: string | null
          id: string
          logo_url: string | null
          meta_description_default: string | null
          meta_keywords: string | null
          meta_title_default: string | null
          og_image_url: string | null
          robots_follow: boolean
          robots_index: boolean
          site_name: string
          site_url: string
          updated_at: string
        }
        Insert: {
          bing_verification_code?: string | null
          canonical_base_url?: string | null
          created_at?: string
          google_verification_code?: string | null
          id?: string
          logo_url?: string | null
          meta_description_default?: string | null
          meta_keywords?: string | null
          meta_title_default?: string | null
          og_image_url?: string | null
          robots_follow?: boolean
          robots_index?: boolean
          site_name?: string
          site_url?: string
          updated_at?: string
        }
        Update: {
          bing_verification_code?: string | null
          canonical_base_url?: string | null
          created_at?: string
          google_verification_code?: string | null
          id?: string
          logo_url?: string | null
          meta_description_default?: string | null
          meta_keywords?: string | null
          meta_title_default?: string | null
          og_image_url?: string | null
          robots_follow?: boolean
          robots_index?: boolean
          site_name?: string
          site_url?: string
          updated_at?: string
        }
        Relationships: []
      }
      strategies: {
        Row: {
          config_json: Json | null
          contract_family: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          downloads: number | null
          id: string
          is_public: boolean | null
          market: string
          market_type: string | null
          owner_user_id: string
          price_usd: number | null
          pricing_type: string
          rating: number | null
          slug: string
          symbols: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          config_json?: Json | null
          contract_family?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          downloads?: number | null
          id?: string
          is_public?: boolean | null
          market: string
          market_type?: string | null
          owner_user_id: string
          price_usd?: number | null
          pricing_type?: string
          rating?: number | null
          slug: string
          symbols?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          config_json?: Json | null
          contract_family?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          downloads?: number | null
          id?: string
          is_public?: boolean | null
          market?: string
          market_type?: string | null
          owner_user_id?: string
          price_usd?: number | null
          pricing_type?: string
          rating?: number | null
          slug?: string
          symbols?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      strategy_purchases: {
        Row: {
          created_at: string
          id: string
          order_id: string | null
          strategy_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_id?: string | null
          strategy_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string | null
          strategy_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "strategy_purchases_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strategy_purchases_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_requests: {
        Row: {
          admin_note: string | null
          amount_usd: number
          created_at: string
          current_plan_id: string | null
          expires_at: string | null
          id: string
          payment_method: string | null
          plan_id: string | null
          proof_upload_url: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          amount_usd: number
          created_at?: string
          current_plan_id?: string | null
          expires_at?: string | null
          id?: string
          payment_method?: string | null
          plan_id?: string | null
          proof_upload_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          amount_usd?: number
          created_at?: string
          current_plan_id?: string | null
          expires_at?: string | null
          id?: string
          payment_method?: string | null
          plan_id?: string | null
          proof_upload_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_requests_current_plan_id_fkey"
            columns: ["current_plan_id"]
            isOneToOne: false
            referencedRelation: "pricing_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_requests_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "pricing_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      trade_execution_logs: {
        Row: {
          contract_id: string | null
          created_at: string
          error_message: string | null
          execution_time_ms: number | null
          id: string
          request_payload: Json | null
          request_type: string
          response_payload: Json | null
          signal_id: string | null
          status: string
          trading_account_id: string | null
          user_id: string
        }
        Insert: {
          contract_id?: string | null
          created_at?: string
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          request_payload?: Json | null
          request_type: string
          response_payload?: Json | null
          signal_id?: string | null
          status: string
          trading_account_id?: string | null
          user_id: string
        }
        Update: {
          contract_id?: string | null
          created_at?: string
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          request_payload?: Json | null
          request_type?: string
          response_payload?: Json | null
          signal_id?: string | null
          status?: string
          trading_account_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_execution_logs_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "trading_signals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_execution_logs_trading_account_id_fkey"
            columns: ["trading_account_id"]
            isOneToOne: false
            referencedRelation: "trading_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      trade_intents: {
        Row: {
          broker_ref: string | null
          connection_id: string | null
          created_at: string
          error: string | null
          id: string
          idempotency_key: string
          intent: Json
          status: string
          strategy_id: string | null
          user_id: string
        }
        Insert: {
          broker_ref?: string | null
          connection_id?: string | null
          created_at?: string
          error?: string | null
          id?: string
          idempotency_key: string
          intent?: Json
          status?: string
          strategy_id?: string | null
          user_id: string
        }
        Update: {
          broker_ref?: string | null
          connection_id?: string | null
          created_at?: string
          error?: string | null
          id?: string
          idempotency_key?: string
          intent?: Json
          status?: string
          strategy_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_intents_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "deriv_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_intents_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      trading_accounts: {
        Row: {
          api_key_encrypted: string
          api_secret_encrypted: string | null
          broker: string
          connection_status: string | null
          connection_type: string | null
          created_at: string
          deriv_account_id: string | null
          id: string
          is_active: boolean | null
          is_virtual: boolean | null
          label: string
          login_id: string | null
          permissions_json: Json | null
          token_scopes: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          api_key_encrypted: string
          api_secret_encrypted?: string | null
          broker: string
          connection_status?: string | null
          connection_type?: string | null
          created_at?: string
          deriv_account_id?: string | null
          id?: string
          is_active?: boolean | null
          is_virtual?: boolean | null
          label: string
          login_id?: string | null
          permissions_json?: Json | null
          token_scopes?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          api_key_encrypted?: string
          api_secret_encrypted?: string | null
          broker?: string
          connection_status?: string | null
          connection_type?: string | null
          created_at?: string
          deriv_account_id?: string | null
          id?: string
          is_active?: boolean | null
          is_virtual?: boolean | null
          label?: string
          login_id?: string | null
          permissions_json?: Json | null
          token_scopes?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      trading_signals: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          broker: string[] | null
          category: string | null
          confidence: number | null
          created_at: string
          direction: string
          entry_price: number
          expires_at: string | null
          id: string
          is_manual: boolean | null
          posted_by: string | null
          reason: string | null
          rejection_reason: string | null
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
          approved_at?: string | null
          approved_by?: string | null
          broker?: string[] | null
          category?: string | null
          confidence?: number | null
          created_at?: string
          direction: string
          entry_price: number
          expires_at?: string | null
          id?: string
          is_manual?: boolean | null
          posted_by?: string | null
          reason?: string | null
          rejection_reason?: string | null
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
          approved_at?: string | null
          approved_by?: string | null
          broker?: string[] | null
          category?: string | null
          confidence?: number | null
          created_at?: string
          direction?: string
          entry_price?: number
          expires_at?: string | null
          id?: string
          is_manual?: boolean | null
          posted_by?: string | null
          reason?: string | null
          rejection_reason?: string | null
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
      trial_grants: {
        Row: {
          created_at: string
          duration_days: number | null
          ends_at: string
          id: string
          plan_id: string | null
          started_at: string
          used: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_days?: number | null
          ends_at: string
          id?: string
          plan_id?: string | null
          started_at?: string
          used?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          duration_days?: number | null
          ends_at?: string
          id?: string
          plan_id?: string | null
          started_at?: string
          used?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trial_grants_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "pricing_plans"
            referencedColumns: ["id"]
          },
        ]
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
          admin_kill_switch: boolean | null
          admin_kill_switch_reason: string | null
          auto_trading_consent_at: string | null
          auto_trading_enabled: boolean | null
          created_at: string
          default_pair: string | null
          default_timeframe: string | null
          id: string
          kill_switch: boolean | null
          max_daily_loss_usd: number | null
          max_daily_trades: number | null
          notifications_enabled: boolean | null
          risk_per_trade: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_kill_switch?: boolean | null
          admin_kill_switch_reason?: string | null
          auto_trading_consent_at?: string | null
          auto_trading_enabled?: boolean | null
          created_at?: string
          default_pair?: string | null
          default_timeframe?: string | null
          id?: string
          kill_switch?: boolean | null
          max_daily_loss_usd?: number | null
          max_daily_trades?: number | null
          notifications_enabled?: boolean | null
          risk_per_trade?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_kill_switch?: boolean | null
          admin_kill_switch_reason?: string | null
          auto_trading_consent_at?: string | null
          auto_trading_enabled?: boolean | null
          created_at?: string
          default_pair?: string | null
          default_timeframe?: string | null
          id?: string
          kill_switch?: boolean | null
          max_daily_loss_usd?: number | null
          max_daily_trades?: number | null
          notifications_enabled?: boolean | null
          risk_per_trade?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_strategy_selections: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          strategy_code: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          strategy_code: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          strategy_code?: string
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
      auto_expire_signals: { Args: never; Returns: undefined }
      get_p2p_trader_stats: {
        Args: { trader_id: string }
        Returns: {
          avg_rating: number
          completed_trades: number
          completion_rate: number
          total_trades: number
          total_volume: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_affiliate: { Args: never; Returns: boolean }
      is_bot_instance_owner: { Args: { instance_id: string }; Returns: boolean }
      is_owner: { Args: { record_user_id: string }; Returns: boolean }
      is_provider_owner: { Args: { provider_id: string }; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "super_admin" | "affiliate"
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
      app_role: ["admin", "moderator", "user", "super_admin", "affiliate"],
    },
  },
} as const
