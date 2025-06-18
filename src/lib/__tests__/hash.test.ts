import { describe, it, expect } from 'vitest';
import { dbUtils } from '../database';

describe('generateInstructionHash', () => {
  it('generates same hash for similar instructions', () => {
    const a = dbUtils.generateInstructionHash('Cuire les pâtes');
    const b = dbUtils.generateInstructionHash('  cuire les pâtes ');
    expect(a).toBe(b);
  });
});
