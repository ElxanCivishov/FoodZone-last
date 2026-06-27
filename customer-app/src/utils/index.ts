export function generateOrderId(): string {
  return `#${Math.floor(1000 + Math.random() * 9000)}`;
}

export function getCurrentTime(): string {
  const now = new Date();
  const h = now.getHours().toString().padStart(2, '0');
  const m = now.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

export function formatPrice(amount: number): string {
  return `${amount.toFixed(2)} AZN`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
