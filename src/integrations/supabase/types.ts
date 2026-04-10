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
      admin_permissions: {
        Row: {
          created_at: string
          granted_by: string
          id: string
          permission: string
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by: string
          id?: string
          permission: string
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string
          id?: string
          permission?: string
          user_id?: string
        }
        Relationships: []
      }
      advert_slots: {
        Row: {
          badge_color: string | null
          badge_text: string | null
          created_at: string
          created_by: string | null
          description: string | null
          icon_emoji: string | null
          id: string
          is_active: boolean
          link_url: string | null
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          badge_color?: string | null
          badge_text?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon_emoji?: string | null
          id?: string
          is_active?: boolean
          link_url?: string | null
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          badge_color?: string | null
          badge_text?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon_emoji?: string | null
          id?: string
          is_active?: boolean
          link_url?: string | null
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
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
      ai_signals: {
        Row: {
          ai_summary: string
          asset_id: string
          confidence: number
          created_at: string
          entry_price: number | null
          id: string
          provider_snapshot_time: string | null
          reasoning_json: Json | null
          risk_reward: number | null
          signal: string
          stop_loss: number | null
          take_profit_1: number | null
          take_profit_2: number | null
          timeframe: string
        }
        Insert: {
          ai_summary: string
          asset_id: string
          confidence: number
          created_at?: string
          entry_price?: number | null
          id?: string
          provider_snapshot_time?: string | null
          reasoning_json?: Json | null
          risk_reward?: number | null
          signal: string
          stop_loss?: number | null
          take_profit_1?: number | null
          take_profit_2?: number | null
          timeframe: string
        }
        Update: {
          ai_summary?: string
          asset_id?: string
          confidence?: number
          created_at?: string
          entry_price?: number | null
          id?: string
          provider_snapshot_time?: string | null
          reasoning_json?: Json | null
          risk_reward?: number | null
          signal?: string
          stop_loss?: number | null
          take_profit_1?: number | null
          take_profit_2?: number | null
          timeframe?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_signals_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
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
      asset_daily_scores: {
        Row: {
          accuracy_score: number
          asset_id: string | null
          broker_slug: string
          created_at: string
          final_score: number
          id: string
          metadata_json: Json | null
          opportunity_score: number
          reliability_score: number
          sample_size: number
          score_date: string
          trend_score: number
          volatility_score: number
        }
        Insert: {
          accuracy_score?: number
          asset_id?: string | null
          broker_slug?: string
          created_at?: string
          final_score?: number
          id?: string
          metadata_json?: Json | null
          opportunity_score?: number
          reliability_score?: number
          sample_size?: number
          score_date?: string
          trend_score?: number
          volatility_score?: number
        }
        Update: {
          accuracy_score?: number
          asset_id?: string | null
          broker_slug?: string
          created_at?: string
          final_score?: number
          id?: string
          metadata_json?: Json | null
          opportunity_score?: number
          reliability_score?: number
          sample_size?: number
          score_date?: string
          trend_score?: number
          volatility_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "asset_daily_scores_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_expiry_performance: {
        Row: {
          asset_id: string | null
          avg_confidence: number | null
          broker_slug: string
          expiry_seconds: number
          id: string
          sample_size: number
          updated_at: string
          win_rate: number
        }
        Insert: {
          asset_id?: string | null
          avg_confidence?: number | null
          broker_slug?: string
          expiry_seconds: number
          id?: string
          sample_size?: number
          updated_at?: string
          win_rate?: number
        }
        Update: {
          asset_id?: string | null
          avg_confidence?: number | null
          broker_slug?: string
          expiry_seconds?: number
          id?: string
          sample_size?: number
          updated_at?: string
          win_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "asset_expiry_performance_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          asset_type: string
          base_currency: string | null
          created_at: string
          id: string
          is_active: boolean
          provider_symbol: string
          quote_currency: string | null
          symbol: string
        }
        Insert: {
          asset_type: string
          base_currency?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          provider_symbol: string
          quote_currency?: string | null
          symbol: string
        }
        Update: {
          asset_type?: string
          base_currency?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          provider_symbol?: string
          quote_currency?: string | null
          symbol?: string
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
      bet_slips: {
        Row: {
          created_at: string
          id: string
          league: string | null
          market_type: string
          match_date: string | null
          match_name: string
          odds: number | null
          prediction: string
          profit_loss: number | null
          result: string | null
          screenshot_url: string | null
          stake: number | null
          strategy_notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          league?: string | null
          market_type?: string
          match_date?: string | null
          match_name: string
          odds?: number | null
          prediction: string
          profit_loss?: number | null
          result?: string | null
          screenshot_url?: string | null
          stake?: number | null
          strategy_notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          league?: string | null
          market_type?: string
          match_date?: string | null
          match_name?: string
          odds?: number | null
          prediction?: string
          profit_loss?: number | null
          result?: string | null
          screenshot_url?: string | null
          stake?: number | null
          strategy_notes?: string | null
          updated_at?: string
          user_id?: string
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
      broker_click_events: {
        Row: {
          broker_id: string
          clicked_at: string
          country_code: string | null
          device_type: string | null
          id: string
          signal_id: string | null
          user_id: string | null
        }
        Insert: {
          broker_id: string
          clicked_at?: string
          country_code?: string | null
          device_type?: string | null
          id?: string
          signal_id?: string | null
          user_id?: string | null
        }
        Update: {
          broker_id?: string
          clicked_at?: string
          country_code?: string | null
          device_type?: string | null
          id?: string
          signal_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "broker_click_events_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "signal_brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broker_click_events_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "trading_signals"
            referencedColumns: ["id"]
          },
        ]
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
      copy_links: {
        Row: {
          copy_sl_tp: boolean
          created_at: string
          fixed_lot: number | null
          follower_account_id: string
          id: string
          lot_mode: string
          max_lot: number
          max_trades: number
          provider_account_id: string
          risk_mult: number
          slippage_points: number
          status: string
        }
        Insert: {
          copy_sl_tp?: boolean
          created_at?: string
          fixed_lot?: number | null
          follower_account_id: string
          id?: string
          lot_mode?: string
          max_lot?: number
          max_trades?: number
          provider_account_id: string
          risk_mult?: number
          slippage_points?: number
          status?: string
        }
        Update: {
          copy_sl_tp?: boolean
          created_at?: string
          fixed_lot?: number | null
          follower_account_id?: string
          id?: string
          lot_mode?: string
          max_lot?: number
          max_trades?: number
          provider_account_id?: string
          risk_mult?: number
          slippage_points?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "copy_links_follower_account_id_fkey"
            columns: ["follower_account_id"]
            isOneToOne: false
            referencedRelation: "mt5_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "copy_links_follower_account_id_fkey"
            columns: ["follower_account_id"]
            isOneToOne: false
            referencedRelation: "mt5_accounts_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "copy_links_provider_account_id_fkey"
            columns: ["provider_account_id"]
            isOneToOne: false
            referencedRelation: "mt5_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "copy_links_provider_account_id_fkey"
            columns: ["provider_account_id"]
            isOneToOne: false
            referencedRelation: "mt5_accounts_status"
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
      copy_trade_map: {
        Row: {
          copy_link_id: string
          created_at: string
          follower_trade_id: string | null
          id: string
          last_error: string | null
          provider_trade_id: string
          state: string
          updated_at: string
        }
        Insert: {
          copy_link_id: string
          created_at?: string
          follower_trade_id?: string | null
          id?: string
          last_error?: string | null
          provider_trade_id: string
          state?: string
          updated_at?: string
        }
        Update: {
          copy_link_id?: string
          created_at?: string
          follower_trade_id?: string | null
          id?: string
          last_error?: string | null
          provider_trade_id?: string
          state?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "copy_trade_map_copy_link_id_fkey"
            columns: ["copy_link_id"]
            isOneToOne: false
            referencedRelation: "copy_links"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_picks: {
        Row: {
          created_at: string
          created_by: string
          id: string
          is_published: boolean
          league_filter: string | null
          market_type: string
          picks_content: string
          slip_size: number
          slip_type: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          is_published?: boolean
          league_filter?: string | null
          market_type?: string
          picks_content: string
          slip_size?: number
          slip_type?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          is_published?: boolean
          league_filter?: string | null
          market_type?: string
          picks_content?: string
          slip_size?: number
          slip_type?: string
        }
        Relationships: []
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
      deriv_trades: {
        Row: {
          buy_price: number
          contract_id: number
          contract_type: string | null
          created_at: string
          currency: string
          ended_at: string | null
          id: string
          is_virtual: boolean
          loginid: string
          outcome: string | null
          payout: number | null
          profit: number | null
          sell_price: number | null
          started_at: string
          status: string
          symbol: string
          token_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          buy_price: number
          contract_id: number
          contract_type?: string | null
          created_at?: string
          currency?: string
          ended_at?: string | null
          id?: string
          is_virtual?: boolean
          loginid: string
          outcome?: string | null
          payout?: number | null
          profit?: number | null
          sell_price?: number | null
          started_at?: string
          status?: string
          symbol: string
          token_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          buy_price?: number
          contract_id?: number
          contract_type?: string | null
          created_at?: string
          currency?: string
          ended_at?: string | null
          id?: string
          is_virtual?: boolean
          loginid?: string
          outcome?: string | null
          payout?: number | null
          profit?: number | null
          sell_price?: number | null
          started_at?: string
          status?: string
          symbol?: string
          token_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deriv_trades_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "user_deriv_tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      ea_tokens: {
        Row: {
          account_id: string
          created_at: string
          id: string
          label: string | null
          last_seen_at: string | null
          revoked: boolean
          token_hash: string
        }
        Insert: {
          account_id: string
          created_at?: string
          id?: string
          label?: string | null
          last_seen_at?: string | null
          revoked?: boolean
          token_hash: string
        }
        Update: {
          account_id?: string
          created_at?: string
          id?: string
          label?: string | null
          last_seen_at?: string | null
          revoked?: boolean
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "ea_tokens_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "mt5_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ea_tokens_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "mt5_accounts_status"
            referencedColumns: ["id"]
          },
        ]
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
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
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
      expiry_model_predictions: {
        Row: {
          asset_id: string | null
          broker_slug: string
          calibrated_probability: number | null
          created_at: string
          expiry_seconds: number
          features_json: Json | null
          id: string
          is_backup: boolean
          is_recommended: boolean
          signal_candidate_id: string | null
          win_probability: number
        }
        Insert: {
          asset_id?: string | null
          broker_slug?: string
          calibrated_probability?: number | null
          created_at?: string
          expiry_seconds: number
          features_json?: Json | null
          id?: string
          is_backup?: boolean
          is_recommended?: boolean
          signal_candidate_id?: string | null
          win_probability?: number
        }
        Update: {
          asset_id?: string | null
          broker_slug?: string
          calibrated_probability?: number | null
          created_at?: string
          expiry_seconds?: number
          features_json?: Json | null
          id?: string
          is_backup?: boolean
          is_recommended?: boolean
          signal_candidate_id?: string | null
          win_probability?: number
        }
        Relationships: [
          {
            foreignKeyName: "expiry_model_predictions_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expiry_model_predictions_signal_candidate_id_fkey"
            columns: ["signal_candidate_id"]
            isOneToOne: false
            referencedRelation: "trading_signals"
            referencedColumns: ["id"]
          },
        ]
      }
      flipping_challenges: {
        Row: {
          challenge_type: string
          created_at: string
          current_balance: number
          day_number: number
          discipline_score: number
          duration_days: number
          ended_at: string | null
          id: string
          started_at: string
          starting_balance: number
          status: string
          target_balance: number
          title: string
          total_trades: number
          user_id: string
          winning_trades: number
        }
        Insert: {
          challenge_type: string
          created_at?: string
          current_balance?: number
          day_number?: number
          discipline_score?: number
          duration_days?: number
          ended_at?: string | null
          id?: string
          started_at?: string
          starting_balance?: number
          status?: string
          target_balance?: number
          title: string
          total_trades?: number
          user_id: string
          winning_trades?: number
        }
        Update: {
          challenge_type?: string
          created_at?: string
          current_balance?: number
          day_number?: number
          discipline_score?: number
          duration_days?: number
          ended_at?: string | null
          id?: string
          started_at?: string
          starting_balance?: number
          status?: string
          target_balance?: number
          title?: string
          total_trades?: number
          user_id?: string
          winning_trades?: number
        }
        Relationships: []
      }
      follower_commands: {
        Row: {
          command_type: string
          created_at: string
          done_at: string | null
          error: string | null
          follower_account_id: string
          id: string
          payload: Json
          provider_trade_id: string | null
          sent_at: string | null
          status: string
        }
        Insert: {
          command_type: string
          created_at?: string
          done_at?: string | null
          error?: string | null
          follower_account_id: string
          id?: string
          payload: Json
          provider_trade_id?: string | null
          sent_at?: string | null
          status?: string
        }
        Update: {
          command_type?: string
          created_at?: string
          done_at?: string | null
          error?: string | null
          follower_account_id?: string
          id?: string
          payload?: Json
          provider_trade_id?: string | null
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "follower_commands_follower_account_id_fkey"
            columns: ["follower_account_id"]
            isOneToOne: false
            referencedRelation: "mt5_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follower_commands_follower_account_id_fkey"
            columns: ["follower_account_id"]
            isOneToOne: false
            referencedRelation: "mt5_accounts_status"
            referencedColumns: ["id"]
          },
        ]
      }
      live_comments: {
        Row: {
          body: string
          created_at: string | null
          id: string
          is_deleted: boolean | null
          is_flagged: boolean | null
          is_pinned: boolean | null
          parent_comment_id: string | null
          stream_id: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_flagged?: boolean | null
          is_pinned?: boolean | null
          parent_comment_id?: string | null
          stream_id: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_flagged?: boolean | null
          is_pinned?: boolean | null
          parent_comment_id?: string | null
          stream_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "live_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_comments_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "live_streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      live_reactions: {
        Row: {
          created_at: string | null
          id: string
          reaction_type: string
          stream_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          reaction_type: string
          stream_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          reaction_type?: string
          stream_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_reactions_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "live_streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      live_stream_participants: {
        Row: {
          id: string
          is_active: boolean | null
          joined_at: string | null
          left_at: string | null
          role: string | null
          stream_id: string
          user_id: string | null
          watch_seconds: number | null
        }
        Insert: {
          id?: string
          is_active?: boolean | null
          joined_at?: string | null
          left_at?: string | null
          role?: string | null
          stream_id: string
          user_id?: string | null
          watch_seconds?: number | null
        }
        Update: {
          id?: string
          is_active?: boolean | null
          joined_at?: string | null
          left_at?: string | null
          role?: string | null
          stream_id?: string
          user_id?: string | null
          watch_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "live_stream_participants_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "live_streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_stream_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      live_streams: {
        Row: {
          broker_name: string | null
          comments_enabled: boolean | null
          created_at: string | null
          creator_id: string
          description: string | null
          ended_at: string | null
          id: string
          instrument: string | null
          is_public: boolean | null
          is_recording_enabled: boolean | null
          livekit_creator_token: string | null
          livekit_ingress_id: string | null
          livekit_room_sid: string | null
          market_type: string | null
          playback_url: string | null
          reactions_enabled: boolean | null
          replay_url: string | null
          risk_warning_accepted: boolean | null
          room_name: string
          started_at: string | null
          status: string
          strategy_tag: string | null
          stream_mode: string
          thumbnail_url: string | null
          timeframe: string | null
          title: string
          total_unique_viewers: number | null
          updated_at: string | null
          viewers_current: number | null
          viewers_peak: number | null
        }
        Insert: {
          broker_name?: string | null
          comments_enabled?: boolean | null
          created_at?: string | null
          creator_id: string
          description?: string | null
          ended_at?: string | null
          id?: string
          instrument?: string | null
          is_public?: boolean | null
          is_recording_enabled?: boolean | null
          livekit_creator_token?: string | null
          livekit_ingress_id?: string | null
          livekit_room_sid?: string | null
          market_type?: string | null
          playback_url?: string | null
          reactions_enabled?: boolean | null
          replay_url?: string | null
          risk_warning_accepted?: boolean | null
          room_name: string
          started_at?: string | null
          status?: string
          strategy_tag?: string | null
          stream_mode?: string
          thumbnail_url?: string | null
          timeframe?: string | null
          title: string
          total_unique_viewers?: number | null
          updated_at?: string | null
          viewers_current?: number | null
          viewers_peak?: number | null
        }
        Update: {
          broker_name?: string | null
          comments_enabled?: boolean | null
          created_at?: string | null
          creator_id?: string
          description?: string | null
          ended_at?: string | null
          id?: string
          instrument?: string | null
          is_public?: boolean | null
          is_recording_enabled?: boolean | null
          livekit_creator_token?: string | null
          livekit_ingress_id?: string | null
          livekit_room_sid?: string | null
          market_type?: string | null
          playback_url?: string | null
          reactions_enabled?: boolean | null
          replay_url?: string | null
          risk_warning_accepted?: boolean | null
          room_name?: string
          started_at?: string | null
          status?: string
          strategy_tag?: string | null
          stream_mode?: string
          thumbnail_url?: string | null
          timeframe?: string | null
          title?: string
          total_unique_viewers?: number | null
          updated_at?: string | null
          viewers_current?: number | null
          viewers_peak?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "live_streams_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      market_candles: {
        Row: {
          asset_id: string
          candle_time: string
          close: number
          created_at: string
          high: number
          id: string
          low: number
          open: number
          provider: string
          timeframe: string
          volume: number | null
        }
        Insert: {
          asset_id: string
          candle_time: string
          close: number
          created_at?: string
          high: number
          id?: string
          low: number
          open: number
          provider?: string
          timeframe: string
          volume?: number | null
        }
        Update: {
          asset_id?: string
          candle_time?: string
          close?: number
          created_at?: string
          high?: number
          id?: string
          low?: number
          open?: number
          provider?: string
          timeframe?: string
          volume?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "market_candles_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      market_card_metrics: {
        Row: {
          asset_id: string
          current_4h_block: string | null
          current_4h_high: number | null
          current_4h_low: number | null
          current_session: string | null
          day_high: number | null
          day_low: number | null
          id: string
          market_tip: string | null
          next_high_impact_currency: string | null
          next_high_impact_event: string | null
          next_high_impact_level: string | null
          next_high_impact_time: string | null
          next_session: string | null
          next_session_open_at: string | null
          resistance_1: number | null
          resistance_2: number | null
          snapshot_time: string
          support_1: number | null
          support_2: number | null
          timeframe: string
        }
        Insert: {
          asset_id: string
          current_4h_block?: string | null
          current_4h_high?: number | null
          current_4h_low?: number | null
          current_session?: string | null
          day_high?: number | null
          day_low?: number | null
          id?: string
          market_tip?: string | null
          next_high_impact_currency?: string | null
          next_high_impact_event?: string | null
          next_high_impact_level?: string | null
          next_high_impact_time?: string | null
          next_session?: string | null
          next_session_open_at?: string | null
          resistance_1?: number | null
          resistance_2?: number | null
          snapshot_time?: string
          support_1?: number | null
          support_2?: number | null
          timeframe?: string
        }
        Update: {
          asset_id?: string
          current_4h_block?: string | null
          current_4h_high?: number | null
          current_4h_low?: number | null
          current_session?: string | null
          day_high?: number | null
          day_low?: number | null
          id?: string
          market_tip?: string | null
          next_high_impact_currency?: string | null
          next_high_impact_event?: string | null
          next_high_impact_level?: string | null
          next_high_impact_time?: string | null
          next_session?: string | null
          next_session_open_at?: string | null
          resistance_1?: number | null
          resistance_2?: number | null
          snapshot_time?: string
          support_1?: number | null
          support_2?: number | null
          timeframe?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_card_metrics_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      market_indicators: {
        Row: {
          asset_id: string
          atr_14: number | null
          candle_time: string
          created_at: string
          ema_20: number | null
          ema_50: number | null
          id: string
          macd: number | null
          macd_signal: number | null
          resistance_1: number | null
          rsi_14: number | null
          support_1: number | null
          timeframe: string
          trend: string | null
        }
        Insert: {
          asset_id: string
          atr_14?: number | null
          candle_time: string
          created_at?: string
          ema_20?: number | null
          ema_50?: number | null
          id?: string
          macd?: number | null
          macd_signal?: number | null
          resistance_1?: number | null
          rsi_14?: number | null
          support_1?: number | null
          timeframe: string
          trend?: string | null
        }
        Update: {
          asset_id?: string
          atr_14?: number | null
          candle_time?: string
          created_at?: string
          ema_20?: number | null
          ema_50?: number | null
          id?: string
          macd?: number | null
          macd_signal?: number | null
          resistance_1?: number | null
          rsi_14?: number | null
          support_1?: number | null
          timeframe?: string
          trend?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "market_indicators_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      market_quotes: {
        Row: {
          ask: number | null
          asset_id: string
          bid: number | null
          change_percent_24h: number | null
          fetched_at: string
          id: string
          price: number
          provider_timestamp: string | null
          spread: number | null
        }
        Insert: {
          ask?: number | null
          asset_id: string
          bid?: number | null
          change_percent_24h?: number | null
          fetched_at?: string
          id?: string
          price: number
          provider_timestamp?: string | null
          spread?: number | null
        }
        Update: {
          ask?: number | null
          asset_id?: string
          bid?: number | null
          change_percent_24h?: number | null
          fetched_at?: string
          id?: string
          price?: number
          provider_timestamp?: string | null
          spread?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "market_quotes_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
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
      moderation_actions: {
        Row: {
          action_type: string
          admin_id: string
          created_at: string | null
          id: string
          notes: string | null
          stream_id: string | null
          target_user_id: string | null
        }
        Insert: {
          action_type: string
          admin_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          stream_id?: string | null
          target_user_id?: string | null
        }
        Update: {
          action_type?: string
          admin_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          stream_id?: string | null
          target_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "moderation_actions_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "moderation_actions_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "live_streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_actions_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      mt5_accounts: {
        Row: {
          broker: string
          created_at: string
          currency: string | null
          id: string
          is_verified: boolean
          login: number
          nickname: string | null
          role: string
          server: string
          user_id: string
        }
        Insert: {
          broker: string
          created_at?: string
          currency?: string | null
          id?: string
          is_verified?: boolean
          login: number
          nickname?: string | null
          role: string
          server: string
          user_id: string
        }
        Update: {
          broker?: string
          created_at?: string
          currency?: string | null
          id?: string
          is_verified?: boolean
          login?: number
          nickname?: string | null
          role?: string
          server?: string
          user_id?: string
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
      news_event_cards: {
        Row: {
          actual_value: string | null
          admin_notes: string | null
          created_at: string
          created_by: string | null
          currency: string
          event_code: string
          event_date: string
          event_name: string
          event_time_utc: string | null
          forecast: string | null
          fundamentals_summary: string | null
          hauza_confidence: number | null
          hauza_direction: string | null
          hauza_entry_price: number | null
          hauza_stop_loss: number | null
          hauza_take_profit_1: number | null
          hauza_take_profit_2: number | null
          id: string
          instrument: string
          is_active: boolean
          previous_direction: string | null
          previous_performance: string | null
          previous_result: string | null
          previous_value: string | null
          technical_summary: string | null
          updated_at: string
        }
        Insert: {
          actual_value?: string | null
          admin_notes?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          event_code: string
          event_date: string
          event_name: string
          event_time_utc?: string | null
          forecast?: string | null
          fundamentals_summary?: string | null
          hauza_confidence?: number | null
          hauza_direction?: string | null
          hauza_entry_price?: number | null
          hauza_stop_loss?: number | null
          hauza_take_profit_1?: number | null
          hauza_take_profit_2?: number | null
          id?: string
          instrument?: string
          is_active?: boolean
          previous_direction?: string | null
          previous_performance?: string | null
          previous_result?: string | null
          previous_value?: string | null
          technical_summary?: string | null
          updated_at?: string
        }
        Update: {
          actual_value?: string | null
          admin_notes?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          event_code?: string
          event_date?: string
          event_name?: string
          event_time_utc?: string | null
          forecast?: string | null
          fundamentals_summary?: string | null
          hauza_confidence?: number | null
          hauza_direction?: string | null
          hauza_entry_price?: number | null
          hauza_stop_loss?: number | null
          hauza_take_profit_1?: number | null
          hauza_take_profit_2?: number | null
          id?: string
          instrument?: string
          is_active?: boolean
          previous_direction?: string | null
          previous_performance?: string | null
          previous_result?: string | null
          previous_value?: string | null
          technical_summary?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          country: string | null
          created_at: string | null
          display_name: string | null
          email: string
          id: string
          is_active: boolean | null
          source: string | null
          subscribed_at: string | null
          unsubscribed_at: string | null
          user_id: string | null
          whatsapp_number: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string | null
          display_name?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          source?: string | null
          subscribed_at?: string | null
          unsubscribed_at?: string | null
          user_id?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          source?: string | null
          subscribed_at?: string | null
          unsubscribed_at?: string | null
          user_id?: string | null
          whatsapp_number?: string | null
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
      posts: {
        Row: {
          author: string | null
          category: string | null
          content_html: string
          cover_image: string | null
          created_at: string
          excerpt: string | null
          id: string
          is_published: boolean | null
          keywords: string[] | null
          meta_description: string | null
          meta_title: string | null
          published_at: string | null
          read_time: string | null
          slug: string
          title: string
          updated_at: string
          youtube_url: string | null
        }
        Insert: {
          author?: string | null
          category?: string | null
          content_html?: string
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean | null
          keywords?: string[] | null
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          read_time?: string | null
          slug: string
          title: string
          updated_at?: string
          youtube_url?: string | null
        }
        Update: {
          author?: string | null
          category?: string | null
          content_html?: string
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean | null
          keywords?: string[] | null
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          read_time?: string | null
          slug?: string
          title?: string
          updated_at?: string
          youtube_url?: string | null
        }
        Relationships: []
      }
      price_alerts: {
        Row: {
          asset_id: string
          condition_type: string
          created_at: string
          id: string
          is_active: boolean
          timeframe: string | null
          trigger_price: number
          triggered_at: string | null
          user_id: string
        }
        Insert: {
          asset_id: string
          condition_type: string
          created_at?: string
          id?: string
          is_active?: boolean
          timeframe?: string | null
          trigger_price: number
          triggered_at?: string | null
          user_id: string
        }
        Update: {
          asset_id?: string
          condition_type?: string
          created_at?: string
          id?: string
          is_active?: boolean
          timeframe?: string | null
          trigger_price?: number
          triggered_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_alerts_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_plans: {
        Row: {
          allow_all_courses: boolean | null
          allow_copy_trading: boolean | null
          allow_premium_bots: boolean | null
          allow_premium_signals: boolean | null
          allow_provider_listing: boolean | null
          allow_sports_betting: boolean | null
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
          allow_all_courses?: boolean | null
          allow_copy_trading?: boolean | null
          allow_premium_bots?: boolean | null
          allow_premium_signals?: boolean | null
          allow_provider_listing?: boolean | null
          allow_sports_betting?: boolean | null
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
          allow_all_courses?: boolean | null
          allow_copy_trading?: boolean | null
          allow_premium_bots?: boolean | null
          allow_premium_signals?: boolean | null
          allow_provider_listing?: boolean | null
          allow_sports_betting?: boolean | null
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
          whatsapp_number: string | null
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
          whatsapp_number?: string | null
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
          whatsapp_number?: string | null
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
      running_trades: {
        Row: {
          buy_price: number
          contract_id: number
          contract_type: string
          created_at: string
          current_profit: number
          ended_at: string | null
          final_profit: number | null
          final_status: string | null
          id: string
          is_virtual: boolean
          loginid: string
          payout: number | null
          sell_price: number | null
          started_at: string
          status: string
          symbol: string
          updated_at: string
          user_id: string
        }
        Insert: {
          buy_price: number
          contract_id: number
          contract_type: string
          created_at?: string
          current_profit?: number
          ended_at?: string | null
          final_profit?: number | null
          final_status?: string | null
          id?: string
          is_virtual?: boolean
          loginid: string
          payout?: number | null
          sell_price?: number | null
          started_at?: string
          status?: string
          symbol: string
          updated_at?: string
          user_id: string
        }
        Update: {
          buy_price?: number
          contract_id?: number
          contract_type?: string
          created_at?: string
          current_profit?: number
          ended_at?: string | null
          final_profit?: number | null
          final_status?: string | null
          id?: string
          is_virtual?: boolean
          loginid?: string
          payout?: number | null
          sell_price?: number | null
          started_at?: string
          status?: string
          symbol?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      seo_affiliate_links: {
        Row: {
          broker_key: string
          id: string
          is_active: boolean
          label: string
          updated_at: string
          url: string
        }
        Insert: {
          broker_key: string
          id?: string
          is_active?: boolean
          label?: string
          updated_at?: string
          url: string
        }
        Update: {
          broker_key?: string
          id?: string
          is_active?: boolean
          label?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      seo_pages: {
        Row: {
          broker_cta: string | null
          content_json: Json
          country: string | null
          country_flag: string | null
          created_at: string
          faqs_json: Json
          h1: string
          id: string
          is_active: boolean
          keywords: string[]
          market: string | null
          meta_description: string
          meta_title: string
          page_type: string
          slug: string
          strategy: string | null
          updated_at: string
        }
        Insert: {
          broker_cta?: string | null
          content_json?: Json
          country?: string | null
          country_flag?: string | null
          created_at?: string
          faqs_json?: Json
          h1?: string
          id?: string
          is_active?: boolean
          keywords?: string[]
          market?: string | null
          meta_description?: string
          meta_title?: string
          page_type?: string
          slug: string
          strategy?: string | null
          updated_at?: string
        }
        Update: {
          broker_cta?: string | null
          content_json?: Json
          country?: string | null
          country_flag?: string | null
          created_at?: string
          faqs_json?: Json
          h1?: string
          id?: string
          is_active?: boolean
          keywords?: string[]
          market?: string | null
          meta_description?: string
          meta_title?: string
          page_type?: string
          slug?: string
          strategy?: string | null
          updated_at?: string
        }
        Relationships: []
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
      signal_broker_assets: {
        Row: {
          asset_symbol: string
          broker_id: string
          expiry_options: Json | null
          id: string
          market_type: string
          supported: boolean
        }
        Insert: {
          asset_symbol: string
          broker_id: string
          expiry_options?: Json | null
          id?: string
          market_type?: string
          supported?: boolean
        }
        Update: {
          asset_symbol?: string
          broker_id?: string
          expiry_options?: Json | null
          id?: string
          market_type?: string
          supported?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "signal_broker_assets_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "signal_brokers"
            referencedColumns: ["id"]
          },
        ]
      }
      signal_broker_routes: {
        Row: {
          broker_id: string
          created_at: string
          id: string
          is_recommended: boolean
          reason_codes: string[] | null
          route_score: number
          signal_id: string
        }
        Insert: {
          broker_id: string
          created_at?: string
          id?: string
          is_recommended?: boolean
          reason_codes?: string[] | null
          route_score?: number
          signal_id: string
        }
        Update: {
          broker_id?: string
          created_at?: string
          id?: string
          is_recommended?: boolean
          reason_codes?: string[] | null
          route_score?: number
          signal_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "signal_broker_routes_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "signal_brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signal_broker_routes_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "trading_signals"
            referencedColumns: ["id"]
          },
        ]
      }
      signal_brokers: {
        Row: {
          affiliate_url: string
          best_for: string | null
          country_rules: Json | null
          created_at: string
          description: string | null
          execution_mode: string
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          routing_priority: number
          slug: string
          supported_expiries: Json | null
          supported_market_types: string[] | null
        }
        Insert: {
          affiliate_url?: string
          best_for?: string | null
          country_rules?: Json | null
          created_at?: string
          description?: string | null
          execution_mode?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          routing_priority?: number
          slug: string
          supported_expiries?: Json | null
          supported_market_types?: string[] | null
        }
        Update: {
          affiliate_url?: string
          best_for?: string | null
          country_rules?: Json | null
          created_at?: string
          description?: string | null
          execution_mode?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          routing_priority?: number
          slug?: string
          supported_expiries?: Json | null
          supported_market_types?: string[] | null
        }
        Relationships: []
      }
      signal_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          is_approved: boolean
          signal_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_approved?: boolean
          signal_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_approved?: boolean
          signal_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "signal_comments_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "trading_signals"
            referencedColumns: ["id"]
          },
        ]
      }
      signal_quality_logs: {
        Row: {
          approved: boolean
          asset_health: number | null
          created_at: string
          expiry_fit: number | null
          final_quality_score: number
          historical_reliability: number | null
          id: string
          model_score: number | null
          rejection_reason: string | null
          session_fit: number | null
          signal_id: string | null
          strategy_health: number | null
          volatility_fit: number | null
        }
        Insert: {
          approved?: boolean
          asset_health?: number | null
          created_at?: string
          expiry_fit?: number | null
          final_quality_score?: number
          historical_reliability?: number | null
          id?: string
          model_score?: number | null
          rejection_reason?: string | null
          session_fit?: number | null
          signal_id?: string | null
          strategy_health?: number | null
          volatility_fit?: number | null
        }
        Update: {
          approved?: boolean
          asset_health?: number | null
          created_at?: string
          expiry_fit?: number | null
          final_quality_score?: number
          historical_reliability?: number | null
          id?: string
          model_score?: number | null
          rejection_reason?: string | null
          session_fit?: number | null
          signal_id?: string | null
          strategy_health?: number | null
          volatility_fit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "signal_quality_logs_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "trading_signals"
            referencedColumns: ["id"]
          },
        ]
      }
      signals_history: {
        Row: {
          created_at: string
          date_closed: string | null
          date_posted: string
          entry_price: number
          id: string
          pair: string
          posted_by: string | null
          profit_pips: number | null
          result: string
          screenshot_url: string | null
          signal_id: string | null
          signal_type: string
          source: string
          stop_loss: number | null
          strategy_name: string | null
          take_profit: number | null
        }
        Insert: {
          created_at?: string
          date_closed?: string | null
          date_posted?: string
          entry_price: number
          id?: string
          pair: string
          posted_by?: string | null
          profit_pips?: number | null
          result?: string
          screenshot_url?: string | null
          signal_id?: string | null
          signal_type: string
          source?: string
          stop_loss?: number | null
          strategy_name?: string | null
          take_profit?: number | null
        }
        Update: {
          created_at?: string
          date_closed?: string | null
          date_posted?: string
          entry_price?: number
          id?: string
          pair?: string
          posted_by?: string | null
          profit_pips?: number | null
          result?: string
          screenshot_url?: string | null
          signal_id?: string | null
          signal_type?: string
          source?: string
          stop_loss?: number | null
          strategy_name?: string | null
          take_profit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "signals_history_signal_id_fkey"
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
      sports_betting_access: {
        Row: {
          created_at: string
          granted_by: string
          id: string
          is_active: boolean
          reason: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by: string
          id?: string
          is_active?: boolean
          reason?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string
          id?: string
          is_active?: boolean
          reason?: string | null
          user_id?: string
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
      strategy_daily_scores: {
        Row: {
          avg_confidence: number | null
          broker_slug: string
          created_at: string
          health_score: number
          id: string
          losses: number
          max_loss_streak: number
          metadata_json: Json | null
          score_date: string
          strategy_name: string
          wins: number
        }
        Insert: {
          avg_confidence?: number | null
          broker_slug?: string
          created_at?: string
          health_score?: number
          id?: string
          losses?: number
          max_loss_streak?: number
          metadata_json?: Json | null
          score_date?: string
          strategy_name: string
          wins?: number
        }
        Update: {
          avg_confidence?: number | null
          broker_slug?: string
          created_at?: string
          health_score?: number
          id?: string
          losses?: number
          max_loss_streak?: number
          metadata_json?: Json | null
          score_date?: string
          strategy_name?: string
          wins?: number
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
      stream_analytics_daily: {
        Row: {
          analytics_date: string
          avg_watch_seconds: number | null
          created_at: string | null
          id: string
          peak_viewers: number | null
          stream_id: string
          total_comments: number | null
          total_reactions: number | null
          unique_viewers: number | null
        }
        Insert: {
          analytics_date: string
          avg_watch_seconds?: number | null
          created_at?: string | null
          id?: string
          peak_viewers?: number | null
          stream_id: string
          total_comments?: number | null
          total_reactions?: number | null
          unique_viewers?: number | null
        }
        Update: {
          analytics_date?: string
          avg_watch_seconds?: number | null
          created_at?: string | null
          id?: string
          peak_viewers?: number | null
          stream_id?: string
          total_comments?: number | null
          total_reactions?: number | null
          unique_viewers?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stream_analytics_daily_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "live_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      stream_follows: {
        Row: {
          created_at: string | null
          creator_id: string
          follower_id: string
        }
        Insert: {
          created_at?: string | null
          creator_id: string
          follower_id: string
        }
        Update: {
          created_at?: string | null
          creator_id?: string
          follower_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stream_follows_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "stream_follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      stream_replays: {
        Row: {
          created_at: string | null
          duration_seconds: number | null
          file_size_bytes: number | null
          id: string
          replay_url: string | null
          storage_provider: string | null
          stream_id: string
          thumbnail_url: string | null
          views_count: number | null
          visibility: string | null
        }
        Insert: {
          created_at?: string | null
          duration_seconds?: number | null
          file_size_bytes?: number | null
          id?: string
          replay_url?: string | null
          storage_provider?: string | null
          stream_id: string
          thumbnail_url?: string | null
          views_count?: number | null
          visibility?: string | null
        }
        Update: {
          created_at?: string | null
          duration_seconds?: number | null
          file_size_bytes?: number | null
          id?: string
          replay_url?: string | null
          storage_provider?: string | null
          stream_id?: string
          thumbnail_url?: string | null
          views_count?: number | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stream_replays_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: true
            referencedRelation: "live_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      stream_reports: {
        Row: {
          comment_id: string | null
          created_at: string | null
          details: string | null
          id: string
          reason: string
          report_type: string
          reporter_id: string
          resolved_at: string | null
          status: string | null
          stream_id: string | null
          target_user_id: string | null
        }
        Insert: {
          comment_id?: string | null
          created_at?: string | null
          details?: string | null
          id?: string
          reason: string
          report_type: string
          reporter_id: string
          resolved_at?: string | null
          status?: string | null
          stream_id?: string | null
          target_user_id?: string | null
        }
        Update: {
          comment_id?: string | null
          created_at?: string | null
          details?: string | null
          id?: string
          reason?: string
          report_type?: string
          reporter_id?: string
          resolved_at?: string | null
          status?: string | null
          stream_id?: string | null
          target_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stream_reports_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "live_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stream_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "stream_reports_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "live_streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stream_reports_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
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
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      top_asset_snapshots: {
        Row: {
          accuracy_today: number | null
          asset_id: string | null
          best_broker: string | null
          best_expiry_seconds: number | null
          best_strategy: string | null
          created_at: string
          id: string
          metadata_json: Json | null
          opportunities_today: number | null
          rank_position: number
          ranking_type: string
          score: number
          snapshot_date: string
        }
        Insert: {
          accuracy_today?: number | null
          asset_id?: string | null
          best_broker?: string | null
          best_expiry_seconds?: number | null
          best_strategy?: string | null
          created_at?: string
          id?: string
          metadata_json?: Json | null
          opportunities_today?: number | null
          rank_position: number
          ranking_type?: string
          score?: number
          snapshot_date?: string
        }
        Update: {
          accuracy_today?: number | null
          asset_id?: string | null
          best_broker?: string | null
          best_expiry_seconds?: number | null
          best_strategy?: string | null
          created_at?: string
          id?: string
          metadata_json?: Json | null
          opportunities_today?: number | null
          rank_position?: number
          ranking_type?: string
          score?: number
          snapshot_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "top_asset_snapshots_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      trade_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          payload: Json
          provider_account_id: string
          provider_trade_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          payload: Json
          provider_account_id: string
          provider_trade_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json
          provider_account_id?: string
          provider_trade_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_events_provider_account_id_fkey"
            columns: ["provider_account_id"]
            isOneToOne: false
            referencedRelation: "mt5_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_events_provider_account_id_fkey"
            columns: ["provider_account_id"]
            isOneToOne: false
            referencedRelation: "mt5_accounts_status"
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
      trader_profiles: {
        Row: {
          badge_level: string | null
          created_at: string | null
          display_name: string | null
          favorite_broker: string | null
          favorite_market: string | null
          followers_count: number | null
          peak_viewers: number | null
          risk_level: string | null
          total_streams: number | null
          total_views: number | null
          total_watch_seconds: number | null
          trading_style: string | null
          updated_at: string | null
          user_id: string
          win_rate: number | null
        }
        Insert: {
          badge_level?: string | null
          created_at?: string | null
          display_name?: string | null
          favorite_broker?: string | null
          favorite_market?: string | null
          followers_count?: number | null
          peak_viewers?: number | null
          risk_level?: string | null
          total_streams?: number | null
          total_views?: number | null
          total_watch_seconds?: number | null
          trading_style?: string | null
          updated_at?: string | null
          user_id: string
          win_rate?: number | null
        }
        Update: {
          badge_level?: string | null
          created_at?: string | null
          display_name?: string | null
          favorite_broker?: string | null
          favorite_market?: string | null
          followers_count?: number | null
          peak_viewers?: number | null
          risk_level?: string | null
          total_streams?: number | null
          total_views?: number | null
          total_watch_seconds?: number | null
          trading_style?: string | null
          updated_at?: string | null
          user_id?: string
          win_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "trader_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
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
          ai_model_version: string | null
          ai_win_probability: number | null
          approved_at: string | null
          approved_by: string | null
          broker: string[] | null
          category: string | null
          confidence: number | null
          created_at: string
          direction: string
          entry_price: number
          expires_at: string | null
          expiry_seconds: number | null
          explanation_json: Json | null
          id: string
          is_manual: boolean | null
          market_context_score: number | null
          outcome: string | null
          outcome_updated_at: string | null
          outcome_updated_by: string | null
          posted_by: string | null
          reason: string | null
          rejection_reason: string | null
          session_fit_score: number | null
          settled_at: string | null
          settled_price: number | null
          signal_lifecycle: string | null
          status: string | null
          stop_loss: number | null
          strategy_name: string
          strategy_quality_score: number | null
          symbol: string
          take_profit: number | null
          timeframe: string
          volatility_fit_score: number | null
          zone_max: number | null
          zone_min: number | null
        }
        Insert: {
          ai_model_version?: string | null
          ai_win_probability?: number | null
          approved_at?: string | null
          approved_by?: string | null
          broker?: string[] | null
          category?: string | null
          confidence?: number | null
          created_at?: string
          direction: string
          entry_price: number
          expires_at?: string | null
          expiry_seconds?: number | null
          explanation_json?: Json | null
          id?: string
          is_manual?: boolean | null
          market_context_score?: number | null
          outcome?: string | null
          outcome_updated_at?: string | null
          outcome_updated_by?: string | null
          posted_by?: string | null
          reason?: string | null
          rejection_reason?: string | null
          session_fit_score?: number | null
          settled_at?: string | null
          settled_price?: number | null
          signal_lifecycle?: string | null
          status?: string | null
          stop_loss?: number | null
          strategy_name?: string
          strategy_quality_score?: number | null
          symbol?: string
          take_profit?: number | null
          timeframe?: string
          volatility_fit_score?: number | null
          zone_max?: number | null
          zone_min?: number | null
        }
        Update: {
          ai_model_version?: string | null
          ai_win_probability?: number | null
          approved_at?: string | null
          approved_by?: string | null
          broker?: string[] | null
          category?: string | null
          confidence?: number | null
          created_at?: string
          direction?: string
          entry_price?: number
          expires_at?: string | null
          expiry_seconds?: number | null
          explanation_json?: Json | null
          id?: string
          is_manual?: boolean | null
          market_context_score?: number | null
          outcome?: string | null
          outcome_updated_at?: string | null
          outcome_updated_by?: string | null
          posted_by?: string | null
          reason?: string | null
          rejection_reason?: string | null
          session_fit_score?: number | null
          settled_at?: string | null
          settled_price?: number | null
          signal_lifecycle?: string | null
          status?: string | null
          stop_loss?: number | null
          strategy_name?: string
          strategy_quality_score?: number | null
          symbol?: string
          take_profit?: number | null
          timeframe?: string
          volatility_fit_score?: number | null
          zone_max?: number | null
          zone_min?: number | null
        }
        Relationships: []
      }
      training_videos: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          sort_order: number | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          youtube_url: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          youtube_url: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          youtube_url?: string
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
      user_active_tokens: {
        Row: {
          created_at: string
          currency: string
          id: string
          is_active: boolean
          is_virtual: boolean
          loginid: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          is_virtual?: boolean
          loginid: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          is_virtual?: boolean
          loginid?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_deriv_tokens: {
        Row: {
          created_at: string
          currency: string
          id: string
          is_active: boolean
          is_virtual: boolean
          label: string | null
          loginid: string
          token_encrypted: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          is_virtual?: boolean
          label?: string | null
          loginid: string
          token_encrypted: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          is_virtual?: boolean
          label?: string | null
          loginid?: string
          token_encrypted?: string
          updated_at?: string
          user_id?: string
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
      mt5_accounts_status: {
        Row: {
          broker: string | null
          created_at: string | null
          currency: string | null
          id: string | null
          is_online: boolean | null
          is_verified: boolean | null
          last_seen_at_token: string | null
          login: number | null
          nickname: string | null
          role: string | null
          server: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      auto_expire_signals: { Args: never; Returns: undefined }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      finalize_stream: { Args: { p_stream_id: string }; Returns: undefined }
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
      has_sports_betting_access: {
        Args: { _user_id: string }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_affiliate: { Args: never; Returns: boolean }
      is_bot_instance_owner: { Args: { instance_id: string }; Returns: boolean }
      is_owner: { Args: { record_user_id: string }; Returns: boolean }
      is_provider_owner: { Args: { provider_id: string }; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      owns_mt5_account: { Args: { acct_id: string }; Returns: boolean }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      refresh_follower_count: {
        Args: { target_creator_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "moderator"
        | "user"
        | "super_admin"
        | "affiliate"
        | "signal_manager"
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
      app_role: [
        "admin",
        "moderator",
        "user",
        "super_admin",
        "affiliate",
        "signal_manager",
      ],
    },
  },
} as const
