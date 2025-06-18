import { describe, it, expect } from 'vitest';
import AudioGenerator from '../audio-generator';

describe('quota logic', () => {
  it('fallback when quota exceeded', async () => {
    const gen: any = new AudioGenerator();
    (gen as any).elevenLabsQuotaUsed = 100000;
    expect((gen as any).canUseElevenLabs(10)).toBe(false);
  });
});
