import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isWeekendROI(): boolean {
  const now = new Date();
  // GMT+1 is exactly UTC + 1 hour (3600000 ms)
  const gmt1 = new Date(now.getTime() + 3600000);
  const day = gmt1.getUTCDay(); // 0: Sunday, 1: Monday, ..., 5: Friday, 6: Saturday
  const hour = gmt1.getUTCHours(); // 0-23
  
  // WEEKDAY ROI WINDOW: Monday 8:00 AM GMT+1 → Friday 10:59 PM GMT+1 (gmt1.getUTCHours() < 23)
  // Weekend ROI Window: Friday 11:00 PM GMT+1 → Monday 7:59 AM GMT+1
  if (day === 5) { // Friday
    return hour >= 23;
  }
  if (day === 6 || day === 0) { // Saturday, Sunday
    return true;
  }
  if (day === 1) { // Monday
    return hour < 8;
  }
  return false; // Tuesday, Wednesday, Thursday
}

export function isWithdrawalAllowed(): boolean {
  const now = new Date();
  const gmt1 = new Date(now.getTime() + 3600000);
  const day = gmt1.getUTCDay(); // 0-6
  const hour = gmt1.getUTCHours(); // 0-23

  // Monday 9:00 AM GMT+1 to Friday 4:00 PM GMT+1 (16:00)
  if (day === 1) { // Monday
    return hour >= 9;
  }
  if (day === 2 || day === 3 || day === 4) { // Tuesday, Wednesday, Thursday
    return true;
  }
  if (day === 5) { // Friday
    return hour < 16;
  }
  return false; // Saturday, Sunday
}

export function getRoiByAmount(amount: number): number {
  const isWeekend = isWeekendROI();
  if (amount >= 10 && amount < 50000) return isWeekend ? 0.015 : 0.025;
  if (amount >= 50000 && amount < 1000000) return isWeekend ? 0.017 : 0.027;
  if (amount >= 1000000 && amount <= 10000000) return isWeekend ? 0.019 : 0.029;
  return isWeekend ? 0.015 : 0.025; // fallback
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function getFlagEmoji(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return countryCode;
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}
