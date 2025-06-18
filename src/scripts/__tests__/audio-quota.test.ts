import { describe, it, expect } from 'vitest';

process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgres://user:pass@localhost/db';
const { default: AudioGenerator } = await import('../audio-generator');

describe('quota logic', () => {
  it('fallback when quota exceeded', async () => {
    const gen: any = new AudioGenerator();
    (gen as any).elevenLabsQuotaUsed = 100000;
    expect((gen as any).canUseElevenLabs(10)).toBe(false);
  });
});
