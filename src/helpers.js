import { format, formatDistanceToNow, isToday, isThisWeek, isPast, differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns';

export function formatDate(date) {
  if (!date) return '';
  return format(new Date(date), 'MMM d, yyyy');
}

export function formatDateTime(date) {
  if (!date) return '';
  return format(new Date(date), 'MMM d, yyyy h:mm a');
}

export function timeAgo(date) {
  if (!date) return '';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function isDueToday(date) {
  if (!date) return false;
  return isToday(new Date(date));
}

export function isDueThisWeek(date) {
  if (!date) return false;
  return isThisWeek(new Date(date), { weekStartsOn: 1 });
}

export function isOverdue(date) {
  if (!date) return false;
  return isPast(new Date(date)) && !isToday(new Date(date));
}

export function getCountdown(targetDate) {
  const now = new Date();
  const target = new Date(targetDate);
  const days = differenceInDays(target, now);
  const hours = differenceInHours(target, now) % 24;
  const minutes = differenceInMinutes(target, now) % 60;
  return { days: Math.max(0, days), hours: Math.max(0, hours), minutes: Math.max(0, minutes) };
}

export function formatTimer(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function getRandomQuote(quotes) {
  return quotes[Math.floor(Math.random() * quotes.length)];
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
