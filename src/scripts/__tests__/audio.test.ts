import { describe, it, expect } from 'vitest';

process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgres://user:pass@localhost/db';

// use dynamic import to avoid DATABASE_URL check during module load if not set
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { default: AudioGenerator } = await import('../audio-generator');

describe('AudioGenerator', () => {
  it('generates a hash for instructions', () => {
    const gen: any = new AudioGenerator();
    const hash = gen.generateHash('Coupe les oignons');
    expect(typeof hash).toBe('string');
  });

  it('estimates duration without crash', () => {
    const gen: any = new AudioGenerator();
    const duration = gen.estimateAudioDuration('Mélange vigoureusement');
    expect(duration).toBeGreaterThan(0);
  });
});

