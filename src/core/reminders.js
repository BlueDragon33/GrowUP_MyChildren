import { todayKey } from './model.js';

function validDateKey(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return null;
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : value;
}

export function reminderState(reminder, onDate = new Date()) {
  if (reminder?.completed) return 'completed';
  const date = validDateKey(reminder?.date);
  if (!date) return 'unscheduled';
  const today = todayKey(onDate);
  if (date < today) return 'overdue';
  if (date === today) return 'today';
  return 'upcoming';
}

export function summarizeReminders(reminders = [], onDate = new Date()) {
  const summary = { total: reminders.length, completed: 0, overdue: 0, today: 0, upcoming: 0, unscheduled: 0 };
  for (const reminder of reminders) summary[reminderState(reminder, onDate)] += 1;
  return summary;
}

export function dueReminders(reminders = [], onDate = new Date(), forwardDays = 7) {
  const start = todayKey(onDate);
  const endDate = new Date(onDate);
  endDate.setDate(endDate.getDate() + Math.max(0, Number(forwardDays) || 0));
  const end = todayKey(endDate);
  return reminders
    .filter((item) => !item.completed && validDateKey(item.date) && item.date >= start && item.date <= end)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function notificationCapability(environment = globalThis) {
  const api = environment?.Notification;
  return {
    supported: Boolean(api && typeof api.requestPermission === 'function'),
    permission: api?.permission || 'unsupported',
    serviceWorker: Boolean(environment?.navigator?.serviceWorker)
  };
}
