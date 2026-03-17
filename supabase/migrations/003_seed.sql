-- Migration: 003_seed
-- Seeds loot_drop_catalog (4 types) and default config data.
-- See /docs/05-default-config.md

-- ==================== LOOT DROP CATALOG ====================

insert into loot_drop_catalog (id, type, name, description, rarity, min_level, payload) values

-- XP Surge
(gen_random_uuid(), 'xp_surge', 'Small XP Burst', 'A small burst of bonus XP for your pet.', 'common', 1, '{"xp_bonus": 25}'::jsonb),
(gen_random_uuid(), 'xp_surge', 'XP Surge', 'A surge of bonus XP for your pet.', 'uncommon', 3, '{"xp_bonus": 75}'::jsonb),
(gen_random_uuid(), 'xp_surge', 'XP Cascade', 'A cascade of bonus XP floods your pet.', 'rare', 5, '{"xp_bonus": 200}'::jsonb),

-- Stat Boost
(gen_random_uuid(), 'stat_boost', 'Stat Spark', 'A small boost to a random active stat.', 'common', 1, '{"boost": 3, "stat_id": "random"}'::jsonb),
(gen_random_uuid(), 'stat_boost', 'Stat Surge', 'A meaningful boost to a random active stat.', 'uncommon', 3, '{"boost": 8, "stat_id": "random"}'::jsonb),
(gen_random_uuid(), 'stat_boost', 'Stat Flourish', 'A powerful boost to a random active stat.', 'rare', 6, '{"boost": 20, "stat_id": "random"}'::jsonb),

-- Rested Bonus
(gen_random_uuid(), 'rested_bonus', 'Well Rested', 'Double XP on the next habit completion.', 'common', 1, '{"multiplier": 2.0, "uses": 1}'::jsonb),
(gen_random_uuid(), 'rested_bonus', 'Fully Rested', 'Double XP on the next 3 habit completions.', 'uncommon', 4, '{"multiplier": 2.0, "uses": 3}'::jsonb),
(gen_random_uuid(), 'rested_bonus', 'Peak Condition', 'Triple XP on the next 3 habit completions.', 'rare', 8, '{"multiplier": 3.0, "uses": 3}'::jsonb),

-- Fortune
(gen_random_uuid(), 'fortune', 'Lucky Break', 'Reduced upkeep cost today.', 'common', 1, '{"upkeep_discount": 0.5}'::jsonb),
(gen_random_uuid(), 'fortune', 'Windfall', 'No upkeep cost today.', 'uncommon', 3, '{"upkeep_discount": 1.0}'::jsonb),
(gen_random_uuid(), 'fortune', 'Jackpot', 'No upkeep cost for 3 days.', 'rare', 7, '{"upkeep_discount": 1.0, "days": 3}'::jsonb);
