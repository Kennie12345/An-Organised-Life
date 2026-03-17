// Default configuration seed data
// 7 stats, habits with stat weights, logbook metrics, notification schedules
// See /docs/05-default-config.md
//
// Used during onboarding to seed the user's first config.
// All IDs are generated at seed time — these are templates, not stored values.

export const DEFAULT_STATS = [
  { name: 'Body', color: '#E74C3C', icon: 'heart', decay_grace_days: 1, decay_rate: 1.0, sequence_order: 1 },
  { name: 'Order', color: '#E67E22', icon: 'home', decay_grace_days: 2, decay_rate: 0.8, sequence_order: 2 },
  { name: 'Wealth', color: '#F1C40F', icon: 'coin', decay_grace_days: 3, decay_rate: 0.5, sequence_order: 3 },
  { name: 'Build', color: '#2ECC71', icon: 'rocket', decay_grace_days: 2, decay_rate: 0.8, sequence_order: 4 },
  { name: 'Bonds', color: '#3498DB', icon: 'people', decay_grace_days: 3, decay_rate: 0.6, sequence_order: 5 },
  { name: 'Faith', color: '#9B59B6', icon: 'star', decay_grace_days: 2, decay_rate: 0.8, sequence_order: 6 },
  { name: 'Mind', color: '#95A5A6', icon: 'book', decay_grace_days: 3, decay_rate: 0.5, sequence_order: 7 },
] as const

// Habits reference stats by name — resolved to UUIDs at seed time
export const DEFAULT_HABITS = [
  // --- Morning ---
  {
    name: 'Weigh myself',
    frequency: 'daily' as const,
    time_block: 'morning' as const,
    sequence_order: 1,
    completion_type: 'numeric' as const,
    completion_config: { unit: 'kg', min: 0, max: 300 },
    xp_min: 10, xp_max: 20,
    stat_weights: [{ stat: 'Body', base_weight: 0.6, min_weight: 0.2, max_weight: 1.0 }],
  },
  {
    name: 'Morning medication',
    frequency: 'daily' as const,
    time_block: 'morning' as const,
    sequence_order: 2,
    completion_type: 'boolean' as const,
    completion_config: null,
    xp_min: 15, xp_max: 25,
    stat_weights: [{ stat: 'Body', base_weight: 0.8, min_weight: 0.3, max_weight: 1.0 }],
  },
  {
    name: 'Brush teeth (AM)',
    frequency: 'daily' as const,
    time_block: 'morning' as const,
    sequence_order: 3,
    completion_type: 'boolean' as const,
    completion_config: null,
    xp_min: 8, xp_max: 15,
    stat_weights: [
      { stat: 'Body', base_weight: 0.3, min_weight: 0.1, max_weight: 0.6 },
      { stat: 'Order', base_weight: 0.5, min_weight: 0.2, max_weight: 0.8 },
    ],
  },
  {
    name: 'Spiritual reading',
    frequency: 'daily' as const,
    time_block: 'morning' as const,
    sequence_order: 4,
    completion_type: 'text' as const,
    completion_config: null,
    xp_min: 20, xp_max: 40,
    stat_weights: [
      { stat: 'Faith', base_weight: 0.9, min_weight: 0.4, max_weight: 1.0 },
      { stat: 'Mind', base_weight: 0.3, min_weight: 0.1, max_weight: 0.6 },
    ],
  },
  {
    name: 'Gratitude sentence',
    frequency: 'daily' as const,
    time_block: 'morning' as const,
    sequence_order: 5,
    completion_type: 'text' as const,
    completion_config: null,
    xp_min: 15, xp_max: 30,
    stat_weights: [
      { stat: 'Faith', base_weight: 0.5, min_weight: 0.2, max_weight: 0.8 },
      { stat: 'Mind', base_weight: 0.4, min_weight: 0.1, max_weight: 0.7 },
      { stat: 'Bonds', base_weight: 0.2, min_weight: 0.1, max_weight: 0.5 },
    ],
  },
  {
    name: 'Prayer / meditation',
    frequency: 'daily' as const,
    time_block: 'morning' as const,
    sequence_order: 6,
    completion_type: 'boolean' as const,
    completion_config: null,
    xp_min: 20, xp_max: 40,
    stat_weights: [
      { stat: 'Faith', base_weight: 1.0, min_weight: 0.5, max_weight: 1.0 },
      { stat: 'Mind', base_weight: 0.3, min_weight: 0.1, max_weight: 0.6 },
    ],
  },
  {
    name: 'Water — first glass',
    frequency: 'daily' as const,
    time_block: 'morning' as const,
    sequence_order: 7,
    completion_type: 'boolean' as const,
    completion_config: null,
    xp_min: 8, xp_max: 12,
    stat_weights: [{ stat: 'Body', base_weight: 0.4, min_weight: 0.1, max_weight: 0.7 }],
  },
  {
    name: 'Exercise',
    frequency: 'daily' as const,
    time_block: 'morning' as const,
    sequence_order: 8,
    completion_type: 'composite' as const,
    completion_config: {
      step1: { label: 'Type', type: 'categorical', options: ['Cardio (walk/bike/jog)', 'Upper + Core', 'Lower + Core'] },
      step2: { label: 'Effort', type: 'scale', options: ['Easy', 'Medium', 'Hard'], xp_weights: [1.0, 1.3, 1.6] },
    },
    xp_min: 30, xp_max: 80,
    stat_weights: [
      { stat: 'Body', base_weight: 1.0, min_weight: 0.5, max_weight: 1.0 },
      { stat: 'Mind', base_weight: 0.4, min_weight: 0.1, max_weight: 0.7 },
    ],
  },
  {
    name: '12-hour fast check',
    frequency: 'daily' as const,
    time_block: 'morning' as const,
    sequence_order: 9,
    completion_type: 'time_range' as const,
    completion_config: { unit: 'hhmm' },
    xp_min: 15, xp_max: 25,
    stat_weights: [{ stat: 'Body', base_weight: 0.6, min_weight: 0.2, max_weight: 0.9 }],
  },

  // --- Afternoon ---
  {
    name: 'Water intake',
    frequency: 'daily' as const,
    time_block: 'afternoon' as const,
    sequence_order: 1,
    completion_type: 'numeric' as const,
    completion_config: { unit: 'glasses', min: 0, max: 20 },
    xp_min: 5, xp_max: 15,
    stat_weights: [{ stat: 'Body', base_weight: 0.5, min_weight: 0.2, max_weight: 0.8 }],
  },
  {
    name: 'Small exercise break',
    frequency: 'daily' as const,
    time_block: 'afternoon' as const,
    sequence_order: 2,
    completion_type: 'boolean' as const,
    completion_config: null,
    xp_min: 10, xp_max: 20,
    stat_weights: [
      { stat: 'Body', base_weight: 0.4, min_weight: 0.1, max_weight: 0.7 },
      { stat: 'Mind', base_weight: 0.3, min_weight: 0.1, max_weight: 0.6 },
    ],
  },
  {
    name: 'Work tasks',
    frequency: 'daily' as const,
    time_block: 'afternoon' as const,
    sequence_order: 3,
    completion_type: 'boolean' as const,
    completion_config: null,
    xp_min: 10, xp_max: 30,
    stat_weights: [
      { stat: 'Build', base_weight: 0.8, min_weight: 0.3, max_weight: 1.0 },
      { stat: 'Wealth', base_weight: 0.3, min_weight: 0.1, max_weight: 0.6 },
    ],
  },

  // --- Evening ---
  {
    name: 'Brush teeth (PM)',
    frequency: 'daily' as const,
    time_block: 'evening' as const,
    sequence_order: 1,
    completion_type: 'boolean' as const,
    completion_config: null,
    xp_min: 8, xp_max: 15,
    stat_weights: [
      { stat: 'Body', base_weight: 0.3, min_weight: 0.1, max_weight: 0.6 },
      { stat: 'Order', base_weight: 0.5, min_weight: 0.2, max_weight: 0.8 },
    ],
  },
  {
    name: 'Log sleep time',
    frequency: 'daily' as const,
    time_block: 'evening' as const,
    sequence_order: 2,
    completion_type: 'time_range' as const,
    completion_config: { unit: 'hhmm' },
    xp_min: 10, xp_max: 20,
    stat_weights: [{ stat: 'Body', base_weight: 0.7, min_weight: 0.3, max_weight: 1.0 }],
  },
  {
    name: 'Journal (3 sentences)',
    frequency: 'daily' as const,
    time_block: 'evening' as const,
    sequence_order: 3,
    completion_type: 'text' as const,
    completion_config: null,
    xp_min: 15, xp_max: 30,
    stat_weights: [
      { stat: 'Mind', base_weight: 0.5, min_weight: 0.2, max_weight: 0.8 },
      { stat: 'Faith', base_weight: 0.2, min_weight: 0.1, max_weight: 0.5 },
    ],
  },
  {
    name: 'Review tomorrow',
    frequency: 'daily' as const,
    time_block: 'evening' as const,
    sequence_order: 4,
    completion_type: 'boolean' as const,
    completion_config: null,
    xp_min: 10, xp_max: 20,
    stat_weights: [
      { stat: 'Mind', base_weight: 0.4, min_weight: 0.1, max_weight: 0.7 },
      { stat: 'Build', base_weight: 0.3, min_weight: 0.1, max_weight: 0.6 },
    ],
  },

  // --- Weekly ---
  {
    name: 'Contact a friend',
    frequency: 'weekly' as const,
    time_block: 'anytime' as const,
    sequence_order: 1,
    completion_type: 'boolean' as const,
    completion_config: null,
    xp_min: 30, xp_max: 60,
    stat_weights: [{ stat: 'Bonds', base_weight: 0.9, min_weight: 0.4, max_weight: 1.0 }],
  },
  {
    name: 'Review finances / spending',
    frequency: 'weekly' as const,
    time_block: 'anytime' as const,
    sequence_order: 2,
    completion_type: 'boolean' as const,
    completion_config: null,
    xp_min: 25, xp_max: 50,
    stat_weights: [{ stat: 'Wealth', base_weight: 0.9, min_weight: 0.4, max_weight: 1.0 }],
  },
  {
    name: 'LinkedIn post',
    frequency: 'weekly' as const,
    time_block: 'anytime' as const,
    sequence_order: 3,
    completion_type: 'boolean' as const,
    completion_config: null,
    xp_min: 25, xp_max: 50,
    stat_weights: [
      { stat: 'Build', base_weight: 0.8, min_weight: 0.3, max_weight: 1.0 },
      { stat: 'Bonds', base_weight: 0.3, min_weight: 0.1, max_weight: 0.6 },
    ],
  },
  {
    name: 'Community post / interaction',
    frequency: 'weekly' as const,
    time_block: 'anytime' as const,
    sequence_order: 4,
    completion_type: 'boolean' as const,
    completion_config: null,
    xp_min: 20, xp_max: 40,
    stat_weights: [
      { stat: 'Build', base_weight: 0.6, min_weight: 0.2, max_weight: 0.9 },
      { stat: 'Bonds', base_weight: 0.4, min_weight: 0.1, max_weight: 0.7 },
    ],
  },
  {
    name: 'Intentional family time',
    frequency: 'weekly' as const,
    time_block: 'anytime' as const,
    sequence_order: 5,
    completion_type: 'boolean' as const,
    completion_config: null,
    xp_min: 30, xp_max: 60,
    stat_weights: [{ stat: 'Bonds', base_weight: 0.9, min_weight: 0.4, max_weight: 1.0 }],
  },
  {
    name: 'Intentional time with partner',
    frequency: 'weekly' as const,
    time_block: 'anytime' as const,
    sequence_order: 6,
    completion_type: 'boolean' as const,
    completion_config: null,
    xp_min: 30, xp_max: 60,
    stat_weights: [{ stat: 'Bonds', base_weight: 1.0, min_weight: 0.5, max_weight: 1.0 }],
  },
] as const

export const DEFAULT_LOGBOOK_METRICS = [
  { name: 'Weight', unit: 'kg', stat: 'Body' },
  { name: 'Pull-ups', unit: 'reps', stat: 'Body' },
  { name: 'Walk duration', unit: 'minutes', stat: 'Body' },
] as const

// Notification schedule defaults (times are in HH:MM 24h format)
export const DEFAULT_NOTIFICATION_SCHEDULES = [
  {
    type: 'time_block_reminder' as const,
    entity_type: 'habit',
    schedule_type: 'recurring' as const,
    recurrence_time: '07:00',
    recurrence_days: [0, 1, 2, 3, 4, 5, 6], // Sun–Sat
    advance_notice_min: 10,
    label: 'Morning sequence',
  },
  {
    type: 'time_block_reminder' as const,
    entity_type: 'habit',
    schedule_type: 'recurring' as const,
    recurrence_time: '12:30',
    recurrence_days: [1, 2, 3, 4, 5], // Mon–Fri
    advance_notice_min: 10,
    label: 'Afternoon block',
  },
  {
    type: 'time_block_reminder' as const,
    entity_type: 'habit',
    schedule_type: 'recurring' as const,
    recurrence_time: '21:00',
    recurrence_days: [0, 1, 2, 3, 4, 5, 6], // Sun–Sat
    advance_notice_min: 10,
    label: 'Evening block',
  },
  {
    type: 'weekly_review' as const,
    entity_type: null,
    schedule_type: 'recurring' as const,
    recurrence_time: '18:00',
    recurrence_days: [0], // Sunday
    advance_notice_min: 30,
    label: 'Weekly review',
  },
] as const
