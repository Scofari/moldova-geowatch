import { describe, expect, it } from 'vitest';
import { DemoRiverObservationProvider, demoObservations } from './rivers.js';
describe('river provenance', () => {
  it('labels all invented levels DEMO with synthetic stations', () => {
    for (const reading of demoObservations()) {
      expect(reading.source.mode).toBe('DEMO');
      expect(reading.stationId).toMatch(/^DEMO-/);
      expect(reading.unit).toBe('m');
    }
  });
  it('keeps fixture timestamps fixed across requests', () => {
    expect(demoObservations()).toEqual(demoObservations());
    expect(demoObservations()[0]?.observedAt).toBe('2026-01-01T12:00:00.000Z');
  });
  it('does not invent data for unsupported countries', async () => {
    expect(await new DemoRiverObservationProvider().observations('RO')).toEqual(
      [],
    );
  });
});
