/**
 * Compute the next run timestamp for an automation.
 * Weekly: next occurrence of day_of_week (0=Sunday, 6=Saturday).
 * Monthly: next occurrence of day_of_month (1-31).
 */
export function computeNextRunAt(
  frequency: "weekly" | "monthly",
  dayOfWeek: number | null,
  dayOfMonth: number | null
): Date {
  const now = new Date();
  const next = new Date(now);
  next.setHours(9, 0, 0, 0); // Run at 9am local

  if (frequency === "weekly" && dayOfWeek !== null) {
    const currentDay = now.getDay();
    let daysUntil = dayOfWeek - currentDay;
    if (daysUntil < 0 || (daysUntil === 0 && now.getHours() >= 9)) {
      daysUntil += 7;
    }
    next.setDate(now.getDate() + daysUntil);
  } else if (frequency === "monthly" && dayOfMonth !== null) {
    const maxDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const targetDay = Math.min(dayOfMonth, maxDay);
    next.setDate(targetDay);
    if (next <= now) {
      next.setMonth(next.getMonth() + 1);
      const nextMaxDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
      next.setDate(Math.min(dayOfMonth, nextMaxDay));
    }
  }

  return next;
}
