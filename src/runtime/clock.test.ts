import test from 'node:test';
import assert from 'node:assert/strict';
import { advanceWorldClock, calculateTimeOfDay } from './clock.ts';
import type { MasterWorldClock } from '../types/world.ts';

function createInitialClock(): MasterWorldClock {
  return {
    totalWorldMinutes: 600, // 10:00 AM (Day 1)
    calendar: {
      year: 1492,
      monthName: 'Deepfrost',
      monthIndex: 0,
      dayOfMonth: 1,
      dayOfWeek: 'Moonsday',
      timeString: '10:00',
      timeOfDay: 'Morning',
    },
    moonPhase: 'New Moon',
    weather: {
      temperatureC: 14,
      condition: 'Overcast',
      windSpeedMph: 8,
      visibility: 'Full',
    },
    offlinePolicy: 'PAUSE_WHEN_OFFLINE',
    isPaused: false,
  };
}

test('calculateTimeOfDay partitions 24 hour day accurately', () => {
  assert.equal(calculateTimeOfDay(6), 'Dawn');
  assert.equal(calculateTimeOfDay(10), 'Morning');
  assert.equal(calculateTimeOfDay(12), 'Midday');
  assert.equal(calculateTimeOfDay(15), 'Afternoon');
  assert.equal(calculateTimeOfDay(19), 'Dusk');
  assert.equal(calculateTimeOfDay(22), 'Night');
  assert.equal(calculateTimeOfDay(2), 'Midnight');
});

test('advanceWorldClock advances time and rolls into next day', () => {
  const clock = createInitialClock();
  
  // Advance 120 minutes (2 hours) -> 12:00 Midday
  const advanced2h = advanceWorldClock(clock, 120);
  assert.equal(advanced2h.totalWorldMinutes, 720);
  assert.equal(advanced2h.calendar.timeString, '12:00');
  assert.equal(advanced2h.calendar.timeOfDay, 'Midday');
  assert.equal(advanced2h.calendar.dayOfMonth, 1);

  // Advance 24 hours (1440 mins) from initial
  const nextDay = advanceWorldClock(clock, 1440);
  assert.equal(nextDay.calendar.dayOfMonth, 2);
  assert.equal(nextDay.calendar.dayOfWeek, 'Towerday');
  assert.equal(nextDay.calendar.timeString, '10:00');
});

test('advanceWorldClock respects isPaused flag', () => {
  const clock = { ...createInitialClock(), isPaused: true };
  const attemptedAdvance = advanceWorldClock(clock, 60);
  assert.equal(attemptedAdvance.totalWorldMinutes, 600);
  assert.equal(attemptedAdvance.calendar.timeString, '10:00');
});
