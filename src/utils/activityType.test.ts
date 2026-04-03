import { describe, expect, it } from 'vitest';
import { normalizeActivityType } from './activityType';

describe('normalizeActivityType', () => {
  it('maps running-like values to run', () => {
    expect(normalizeActivityType('Running')).toBe('run');
    expect(normalizeActivityType('Trail')).toBe('run');
    expect(normalizeActivityType('Track')).toBe('run');
    expect(normalizeActivityType('WalkING')).toBe('run');
  });

  it('maps cycling-like values to ride', () => {
    expect(normalizeActivityType('Ride')).toBe('ride');
    expect(normalizeActivityType('Cycling')).toBe('ride');
    expect(normalizeActivityType('Bike')).toBe('ride');
  });

  it('maps swim-like values to swim', () => {
    expect(normalizeActivityType('Swim')).toBe('swim');
    expect(normalizeActivityType('Open Water Swim')).toBe('swim');
  });

  it('maps unknown values to other', () => {
    expect(normalizeActivityType('Hike')).toBe('other');
    expect(normalizeActivityType('')).toBe('other');
  });
});
