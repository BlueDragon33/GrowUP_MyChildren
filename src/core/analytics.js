import { todayKey } from './model.js';

function dateOnly(value) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function daysBetween(a, b) {
  const start = dateOnly(a), end = dateOnly(b);
  if (!start || !end) return null;
  return Math.round((end - start) / 86400000);
}

export function recentHealthRecords(child, limit = 12) {
  return [...(child?.healthRecords || [])]
    .filter((item) => dateOnly(item.date))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-limit);
}

export function weeklyPhysicalMinutes(child, days = 7, onDate = new Date()) {
  const end = new Date(onDate);
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setDate(end.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);
  return (child?.physicalActivities || []).reduce((sum, item) => {
    const date = dateOnly(item.date);
    if (!date || date < start || date > end) return sum;
    return sum + Math.max(0, Number(item.minutes) || 0);
  }, 0);
}

export function habitCompletionRate(child, days = 7, onDate = new Date()) {
  const habits = child?.habits || [];
  if (!habits.length) return 0;
  const keys = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(onDate);
    d.setDate(d.getDate() - i);
    keys.push(todayKey(d));
  }
  const possible = habits.length * keys.length;
  const completed = habits.reduce((sum, habit) => sum + keys.filter((key) => habit.logs?.includes(key)).length, 0);
  return possible ? Math.round((completed / possible) * 100) : 0;
}

export function childSnapshot(child, onDate = new Date()) {
  const health = recentHealthRecords(child);
  const lastHealth = health.at(-1) || null;
  const today = todayKey(onDate);
  return {
    weeklyPhysicalMinutes: weeklyPhysicalMinutes(child, 7, onDate),
    habit7dRate: habitCompletionRate(child, 7, onDate),
    lastHealth,
    daysSinceHealth: lastHealth ? daysBetween(lastHealth.date, today) : null,
    activeGoals: (child?.learningGoals || []).filter((item) => !item.completed).length,
    portfolioCount: (child?.portfolio || []).length,
    upcomingReminders: (child?.reminders || []).filter((item) => !item.completed && item.date >= today).length
  };
}
