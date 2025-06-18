import { describe, it, expect } from 'vitest';

process.env.SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY || 'key';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgres://user:pass@localhost/db';
const { default: SpoonacularScraper } = await import('../spoonacular-scraper');

describe('SpoonacularScraper', () => {
  it('cleans HTML without crashing', () => {
    const scraper: any = new SpoonacularScraper();
    const clean = scraper.cleanHtml('<p>Hello</p>');
    expect(clean).toBe('Hello');
  });
});

