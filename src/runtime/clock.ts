/**
 * Master World Clock & Calendar Simulator
 * Pure deterministic time advancement.
 */

import type { MasterWorldClock } from '../types/world.ts';

export const MONTH_NAMES = [
  'Deepfrost',
  'Sunreach',
  'Thawwind',
  'Rainbloom',
  'Verdant',
  'Midsummer',
  'Highsun',
  'Emberfall',
  'Harvesttide',
  'Twilight',
  'Shadowchill',
  'Winterveil',
];

export const DAYS_OF_WEEK = ['Moonsday', 'Towerday', 'Wanderday', 'Shieldday', 'Feastday', 'Starsday', 'Sundawn'];

export const MOON_PHASES = [
  'New Moon',
  'Waxing Crescent',
  'First Quarter',
  'Waxing Gibbous',
  'Full Moon',
  'Waning Gibbous',
  'Last Quarter',
  'Waning Crescent',
] as const;

export function calculateTimeOfDay(hour: number): MasterWorldClock['calendar']['timeOfDay'] {
  if (hour >= 5 && hour < 8) return 'Dawn';
  if (hour >= 8 && hour < 12) return 'Morning';
  if (hour >= 12 && hour < 14) return 'Midday';
  if (hour >= 14 && hour < 18) return 'Afternoon';
  if (hour >= 18 && hour < 21) return 'Dusk';
  if (hour >= 21 && hour <= 23) return 'Night';
  return 'Midnight';
}

export function formatTwoDigits(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export function advanceWorldClock(clock: MasterWorldClock, minutesToAdd: number): MasterWorldClock {
  if (clock.isPaused && minutesToAdd > 0) {
    // If paused, time does not advance unless explicitly unpaused or manually stepped by DM
    return clock;
  }

  const updatedTotalMinutes = clock.totalWorldMinutes + minutesToAdd;
  
  // Total days elapsed since epoch
  const totalDays = Math.floor(updatedTotalMinutes / 1440);
  const minutesIntoDay = updatedTotalMinutes % 1440;
  
  const hour = Math.floor(minutesIntoDay / 60);
  const minute = minutesIntoDay % 60;
  const timeString = `${formatTwoDigits(hour)}:${formatTwoDigits(minute)}`;
  const timeOfDay = calculateTimeOfDay(hour);

  const daysPerYear = 360;
  const daysPerMonth = 30;
  
  const currentYear = 1492 + Math.floor(totalDays / daysPerYear);
  const dayOfYear = totalDays % daysPerYear;
  const monthIndex = Math.floor(dayOfYear / daysPerMonth);
  const monthName = MONTH_NAMES[monthIndex % MONTH_NAMES.length];
  const dayOfMonth = (dayOfYear % daysPerMonth) + 1;
  const dayOfWeek = DAYS_OF_WEEK[totalDays % DAYS_OF_WEEK.length];

  // Moon phase: 28 day cycle
  const moonPhaseIndex = Math.floor((totalDays % 28) / (28 / MOON_PHASES.length));
  const moonPhase = MOON_PHASES[moonPhaseIndex % MOON_PHASES.length];

  return {
    ...clock,
    totalWorldMinutes: updatedTotalMinutes,
    calendar: {
      year: currentYear,
      monthName,
      monthIndex,
      dayOfMonth,
      dayOfWeek,
      timeString,
      timeOfDay,
    },
    moonPhase,
  };
}
