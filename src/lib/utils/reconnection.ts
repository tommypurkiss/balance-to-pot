export function getDaysUntilReconnection(reconnectBy: string | Date): number {
  const date = typeof reconnectBy === "string" ? new Date(reconnectBy) : reconnectBy;
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function getReconnectionStatus(
  days: number
): "safe" | "warning" | "urgent" {
  if (days > 30) return "safe";
  if (days > 10) return "warning";
  return "urgent";
}

export function getReconnectByDate(): Date {
  const date = new Date();
  date.setDate(date.getDate() + 90);
  return date;
}
