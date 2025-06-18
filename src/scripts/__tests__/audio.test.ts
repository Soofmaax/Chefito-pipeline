import { describe, it, expect } from 'vitest';
import AudioGenerator from '../audio-generator';

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

