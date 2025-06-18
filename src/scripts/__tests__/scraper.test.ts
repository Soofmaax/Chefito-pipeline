import { describe, it, expect } from 'vitest';
import SpoonacularScraper from '../spoonacular-scraper';

describe('SpoonacularScraper', () => {
  it('cleans HTML without crashing', () => {
    const scraper: any = new SpoonacularScraper();
    const clean = scraper.cleanHtml('<p>Hello</p>');
    expect(clean).toBe('Hello');
  });
});

