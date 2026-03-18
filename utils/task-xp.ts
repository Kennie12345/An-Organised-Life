// Task completion XP award
// Tasks give a flat 15-25 XP on completion (simpler than habits)

import { db } from "@/db";
import { applyXpGain } from "./leveling";
import { queueWrite } from "@/lib/sync";

const TASK_XP_MIN = 15;
const TASK_XP_MAX = 25;

export async function awardTaskXp(
  userId: string,
  taskId: string,
): Promise<{ xpAwarded: number; leveledUp: boolean }> {
  const now = new Date().toISOString();
  const xpAwarded =
    Math.floor(Math.random() * (TASK_XP_MAX - TASK_XP_MIN + 1)) + TASK_XP_MIN;

  // Update task
  await db.tasks.update(taskId, { xp_awarded: xpAwarded, updated_at: now });

  // Apply XP to user
  const user = (await db.users.toArray())[0];
  if (!user) return { xpAwarded, leveledUp: false };

  const { level, currentXp, leveledUp } = applyXpGain(
    user.level,
    user.current_xp,
    xpAwarded,
  );

  const newLifetimeXp = user.lifetime_xp + xpAwarded;
  const newPeakLevel = Math.max(user.peak_level, level);

  await db.users.update(user.id, {
    level,
    current_xp: currentXp,
    lifetime_xp: newLifetimeXp,
    peak_level: newPeakLevel,
    updated_at: now,
  });
  await queueWrite("users", user.id, "upsert", {
    ...user,
    level,
    current_xp: currentXp,
    lifetime_xp: newLifetimeXp,
    peak_level: newPeakLevel,
    updated_at: now,
  });

  // Log XP event
  const eventId = crypto.randomUUID();
  const xpEvent = {
    id: eventId,
    user_id: userId,
    source_type: "task",
    source_id: taskId,
    amount: xpAwarded,
    level_before: user.level,
    level_after: level,
    created_at: now,
  };
  await db.xp_events.add(xpEvent as never);
  await queueWrite("xp_events", eventId, "upsert", xpEvent);

  return { xpAwarded, leveledUp };
}
