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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      daily_plans: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          intentions: Json
          journal_entry: string | null
          mood_end: number | null
          mood_start: number | null
          plan_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          intentions?: Json
          journal_entry?: string | null
          mood_end?: number | null
          mood_start?: number | null
          plan_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          intentions?: Json
          journal_entry?: string | null
          mood_end?: number | null
          mood_start?: number | null
          plan_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_stake_effects: {
        Row: {
          created_at: string
          effect_value: number
          goal_id: string
          id: string
          stat_id: string
          trigger: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          effect_value: number
          goal_id: string
          id?: string
          stat_id: string
          trigger: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          effect_value?: number
          goal_id?: string
          id?: string
          stat_id?: string
          trigger?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_stake_effects_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_stake_effects_stat_id_fkey"
            columns: ["stat_id"]
            isOneToOne: false
            referencedRelation: "stats"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_habit_links: {
        Row: {
          goal_id: string
          habit_id: string
          id: string
          required_streak: number | null
        }
        Insert: {
          goal_id: string
          habit_id: string
          id?: string
          required_streak?: number | null
        }
        Update: {
          goal_id?: string
          habit_id?: string
          id?: string
          required_streak?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "goal_habit_links_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_habit_links_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_metric_targets: {
        Row: {
          goal_id: string
          id: string
          logbook_metric_id: string
          previous_target: number | null
          start_value: number
          target_revised_at: string | null
          target_value: number
          updated_at: string
        }
        Insert: {
          goal_id: string
          id?: string
          logbook_metric_id: string
          previous_target?: number | null
          start_value: number
          target_revised_at?: string | null
          target_value: number
          updated_at?: string
        }
        Update: {
          goal_id?: string
          id?: string
          logbook_metric_id?: string
          previous_target?: number | null
          start_value?: number
          target_revised_at?: string | null
          target_value?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_metric_targets_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_milestones: {
        Row: {
          completed_at: string | null
          description: string | null
          goal_id: string
          id: string
          name: string
          sequence_order: number
          target_date: string | null
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          description?: string | null
          goal_id: string
          id?: string
          name: string
          sequence_order?: number
          target_date?: string | null
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          description?: string | null
          goal_id?: string
          id?: string
          name?: string
          sequence_order?: number
          target_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_milestones_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_steps: {
        Row: {
          completed_at: string | null
          id: string
          milestone_id: string
          name: string
          sequence_order: number
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          milestone_id: string
          name: string
          sequence_order?: number
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          milestone_id?: string
          name?: string
          sequence_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_steps_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "goal_milestones"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          commitment_score: number | null
          committed_at: string | null
          created_at: string
          grace_period_unit: string
          grace_period_value: number
          id: string
          name: string
          primary_stat_id: string | null
          scratch_pad_expires_at: string
          status: string
          target_date: string | null
          updated_at: string
          user_id: string
          why: string
        }
        Insert: {
          commitment_score?: number | null
          committed_at?: string | null
          created_at?: string
          grace_period_unit?: string
          grace_period_value?: number
          id?: string
          name: string
          primary_stat_id?: string | null
          scratch_pad_expires_at: string
          status?: string
          target_date?: string | null
          updated_at?: string
          user_id: string
          why: string
        }
        Update: {
          commitment_score?: number | null
          committed_at?: string | null
          created_at?: string
          grace_period_unit?: string
          grace_period_value?: number
          id?: string
          name?: string
          primary_stat_id?: string | null
          scratch_pad_expires_at?: string
          status?: string
          target_date?: string | null
          updated_at?: string
          user_id?: string
          why?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_primary_stat_id_fkey"
            columns: ["primary_stat_id"]
            isOneToOne: false
            referencedRelation: "stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      habit_logs: {
        Row: {
          bonus_xp_awarded: number | null
          completed_at: string
          completion_value: string
          habit_id: string
          id: string
          llm_prompt_shown: boolean
          llm_response: string | null
          loot_drop_id: string | null
          metadata: Json | null
          notes: string | null
          sequence_multiplier: number
          user_id: string
          xp_base: number
          xp_final: number
        }
        Insert: {
          bonus_xp_awarded?: number | null
          completed_at?: string
          completion_value: string
          habit_id: string
          id?: string
          llm_prompt_shown?: boolean
          llm_response?: string | null
          loot_drop_id?: string | null
          metadata?: Json | null
          notes?: string | null
          sequence_multiplier?: number
          user_id: string
          xp_base: number
          xp_final: number
        }
        Update: {
          bonus_xp_awarded?: number | null
          completed_at?: string
          completion_value?: string
          habit_id?: string
          id?: string
          llm_prompt_shown?: boolean
          llm_response?: string | null
          loot_drop_id?: string | null
          metadata?: Json | null
          notes?: string | null
          sequence_multiplier?: number
          user_id?: string
          xp_base?: number
          xp_final?: number
        }
        Relationships: [
          {
            foreignKeyName: "habit_logs_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "habit_logs_loot_drop_id_fkey"
            columns: ["loot_drop_id"]
            isOneToOne: false
            referencedRelation: "loot_drops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "habit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      habit_maturity: {
        Row: {
          consistent_days: number
          habit_id: string
          id: string
          last_stage_changed_at: string
          stage: string
          updated_at: string
          user_id: string
        }
        Insert: {
          consistent_days?: number
          habit_id: string
          id?: string
          last_stage_changed_at?: string
          stage?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          consistent_days?: number
          habit_id?: string
          id?: string
          last_stage_changed_at?: string
          stage?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_maturity_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "habit_maturity_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      habit_stat_weights: {
        Row: {
          base_weight: number
          current_weight: number
          decay_rate: number
          growth_rate: number
          habit_id: string
          id: string
          max_weight: number
          min_weight: number
          stat_id: string
          updated_at: string
        }
        Insert: {
          base_weight: number
          current_weight: number
          decay_rate?: number
          growth_rate?: number
          habit_id: string
          id?: string
          max_weight: number
          min_weight: number
          stat_id: string
          updated_at?: string
        }
        Update: {
          base_weight?: number
          current_weight?: number
          decay_rate?: number
          growth_rate?: number
          habit_id?: string
          id?: string
          max_weight?: number
          min_weight?: number
          stat_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_stat_weights_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "habit_stat_weights_stat_id_fkey"
            columns: ["stat_id"]
            isOneToOne: false
            referencedRelation: "stats"
            referencedColumns: ["id"]
          },
        ]
      }
      habit_streaks: {
        Row: {
          best_streak: number
          current_streak: number
          habit_id: string
          id: string
          last_completed_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          best_streak?: number
          current_streak?: number
          habit_id: string
          id?: string
          last_completed_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          best_streak?: number
          current_streak?: number
          habit_id?: string
          id?: string
          last_completed_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_streaks_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "habit_streaks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          completion_config: Json | null
          completion_type: string
          created_at: string
          description: string | null
          frequency: string
          id: string
          is_active: boolean
          loot_drop_eligible: boolean
          name: string
          sequence_order: number
          time_block: string
          updated_at: string
          user_id: string
          xp_max: number
          xp_min: number
        }
        Insert: {
          completion_config?: Json | null
          completion_type: string
          created_at?: string
          description?: string | null
          frequency: string
          id?: string
          is_active?: boolean
          loot_drop_eligible?: boolean
          name: string
          sequence_order?: number
          time_block: string
          updated_at?: string
          user_id: string
          xp_max?: number
          xp_min?: number
        }
        Update: {
          completion_config?: Json | null
          completion_type?: string
          created_at?: string
          description?: string | null
          frequency?: string
          id?: string
          is_active?: boolean
          loot_drop_eligible?: boolean
          name?: string
          sequence_order?: number
          time_block?: string
          updated_at?: string
          user_id?: string
          xp_max?: number
          xp_min?: number
        }
        Relationships: [
          {
            foreignKeyName: "habits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      logbook_entries: {
        Row: {
          id: string
          logged_at: string
          metadata: Json | null
          metric_id: string
          notes: string | null
          user_id: string
          value: number
        }
        Insert: {
          id?: string
          logged_at?: string
          metadata?: Json | null
          metric_id: string
          notes?: string | null
          user_id: string
          value: number
        }
        Update: {
          id?: string
          logged_at?: string
          metadata?: Json | null
          metric_id?: string
          notes?: string | null
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "logbook_entries_metric_id_fkey"
            columns: ["metric_id"]
            isOneToOne: false
            referencedRelation: "logbook_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logbook_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      logbook_metrics: {
        Row: {
          created_at: string
          id: string
          name: string
          stat_id: string | null
          unit: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          stat_id?: string | null
          unit: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          stat_id?: string | null
          unit?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "logbook_metrics_stat_id_fkey"
            columns: ["stat_id"]
            isOneToOne: false
            referencedRelation: "stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logbook_metrics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      loot_drop_catalog: {
        Row: {
          description: string
          id: string
          min_level: number
          name: string
          payload: Json
          rarity: string
          type: string
        }
        Insert: {
          description: string
          id?: string
          min_level?: number
          name: string
          payload: Json
          rarity: string
          type: string
        }
        Update: {
          description?: string
          id?: string
          min_level?: number
          name?: string
          payload?: Json
          rarity?: string
          type?: string
        }
        Relationships: []
      }
      loot_drops: {
        Row: {
          acknowledged: boolean
          awarded_at: string
          catalog_id: string
          habit_log_id: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          acknowledged?: boolean
          awarded_at?: string
          catalog_id: string
          habit_log_id?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          acknowledged?: boolean
          awarded_at?: string
          catalog_id?: string
          habit_log_id?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loot_drops_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "loot_drop_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loot_drops_habit_log_id_fkey"
            columns: ["habit_log_id"]
            isOneToOne: false
            referencedRelation: "habit_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loot_drops_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_log: {
        Row: {
          acknowledged_at: string | null
          action_taken: boolean | null
          id: string
          message: string
          schedule_id: string
          sent_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          action_taken?: boolean | null
          id?: string
          message: string
          schedule_id: string
          sent_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          acknowledged_at?: string | null
          action_taken?: boolean | null
          id?: string
          message?: string
          schedule_id?: string
          sent_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_log_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "notification_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_schedules: {
        Row: {
          advance_notice_min: number
          created_at: string
          entity_id: string | null
          entity_type: string | null
          google_event_id: string | null
          id: string
          is_active: boolean
          last_triggered_at: string | null
          recurrence_days: Json | null
          recurrence_time: string | null
          schedule_type: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          advance_notice_min?: number
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          google_event_id?: string | null
          id?: string
          is_active?: boolean
          last_triggered_at?: string | null
          recurrence_days?: Json | null
          recurrence_time?: string | null
          schedule_type: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          advance_notice_min?: number
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          google_event_id?: string | null
          id?: string
          is_active?: boolean
          last_triggered_at?: string | null
          recurrence_days?: Json | null
          recurrence_time?: string | null
          schedule_type?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_schedules_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      scratch_pad_items: {
        Row: {
          auto_archive_at: string
          commitment_score: number | null
          created_at: string
          id: string
          interrogation_completed_at: string | null
          interrogation_started_at: string | null
          llm_conversation: Json | null
          promoted_goal_id: string | null
          raw_idea: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_archive_at: string
          commitment_score?: number | null
          created_at?: string
          id?: string
          interrogation_completed_at?: string | null
          interrogation_started_at?: string | null
          llm_conversation?: Json | null
          promoted_goal_id?: string | null
          raw_idea: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_archive_at?: string
          commitment_score?: number | null
          created_at?: string
          id?: string
          interrogation_completed_at?: string | null
          interrogation_started_at?: string | null
          llm_conversation?: Json | null
          promoted_goal_id?: string | null
          raw_idea?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scratch_pad_items_promoted_goal_id_fkey"
            columns: ["promoted_goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scratch_pad_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          duration_seconds: number | null
          ended_at: string | null
          id: string
          primary_screen: string | null
          started_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          primary_screen?: string | null
          started_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          primary_screen?: string | null
          started_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      stats: {
        Row: {
          color: string
          created_at: string
          current_value: number
          decay_grace_days: number
          decay_rate: number
          description: string | null
          icon: string
          id: string
          is_active: boolean
          name: string
          sequence_order: number
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          current_value?: number
          decay_grace_days?: number
          decay_rate?: number
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          name: string
          sequence_order?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          current_value?: number
          decay_grace_days?: number
          decay_rate?: number
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          sequence_order?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          completed_at: string | null
          created_at: string
          goal_id: string | null
          goal_linked_at: string | null
          id: string
          milestone_id: string | null
          name: string
          notes: string | null
          source: string
          updated_at: string
          user_id: string
          xp_awarded: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          goal_id?: string | null
          goal_linked_at?: string | null
          id?: string
          milestone_id?: string | null
          name: string
          notes?: string | null
          source: string
          updated_at?: string
          user_id: string
          xp_awarded?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          goal_id?: string | null
          goal_linked_at?: string | null
          id?: string
          milestone_id?: string | null
          name?: string
          notes?: string | null
          source?: string
          updated_at?: string
          user_id?: string
          xp_awarded?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "goal_milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          author_user_id: string
          config_snapshot: Json
          created_at: string
          description: string
          forked_from_id: string | null
          id: string
          is_public: boolean
          name: string
          updated_at: string
          version: number
        }
        Insert: {
          author_user_id: string
          config_snapshot: Json
          created_at?: string
          description?: string
          forked_from_id?: string | null
          id?: string
          is_public?: boolean
          name: string
          updated_at?: string
          version?: number
        }
        Update: {
          author_user_id?: string
          config_snapshot?: Json
          created_at?: string
          description?: string
          forked_from_id?: string | null
          id?: string
          is_public?: boolean
          name?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "templates_author_user_id_fkey"
            columns: ["author_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "templates_forked_from_id_fkey"
            columns: ["forked_from_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      user_integrations: {
        Row: {
          access_token: string
          calendar_id: string
          created_at: string
          id: string
          last_synced_at: string | null
          provider: string
          refresh_token: string
          token_expires_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          calendar_id?: string
          created_at?: string
          id?: string
          last_synced_at?: string | null
          provider: string
          refresh_token: string
          token_expires_at: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          calendar_id?: string
          created_at?: string
          id?: string
          last_synced_at?: string | null
          provider?: string
          refresh_token?: string
          token_expires_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_integrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          current_xp: number
          email: string
          id: string
          level: number
          lifetime_xp: number
          name: string
          peak_level: number
          pet_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_xp?: number
          email: string
          id: string
          level?: number
          lifetime_xp?: number
          name?: string
          peak_level?: number
          pet_name?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_xp?: number
          email?: string
          id?: string
          level?: number
          lifetime_xp?: number
          name?: string
          peak_level?: number
          pet_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      xp_events: {
        Row: {
          amount: number
          created_at: string
          id: string
          level_after: number
          level_before: number
          source_id: string | null
          source_type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          level_after: number
          level_before: number
          source_id?: string | null
          source_type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          level_after?: number
          level_before?: number
          source_id?: string | null
          source_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "xp_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
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
