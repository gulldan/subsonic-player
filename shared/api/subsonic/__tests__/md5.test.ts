import { describe, expect, test } from 'bun:test';
import { md5 } from '../md5';

describe('md5', () => {
  test('known input/output pairs', () => {
    expect(md5('hello')).toBe('5d41402abc4b2a76b9719d911017c592');
    expect(md5('world')).toBe('7d793037a0760186574b0282f2f435e7');
    expect(md5('The quick brown fox jumps over the lazy dog')).toBe('9e107d9d372bb6826bd81d3542a419d6');
    expect(md5('abc')).toBe('900150983cd24fb0d6963f7d28e17f72');
  });

  test('empty string', () => {
    expect(md5('')).toBe('d41d8cd98f00b204e9800998ecf8427e');
  });

  test('unicode characters (latin-1 range)', () => {
    // md5 implementation processes charCode & 0xff, so it handles latin-1 subset
    const result = md5('café');
    expect(result).toHaveLength(32);
    expect(result).toMatch(/^[0-9a-f]{32}$/);
  });

  test('consistent results for same input', () => {
    const a = md5('consistency');
    const b = md5('consistency');
    expect(a).toBe(b);
  });

  test('different inputs produce different hashes', () => {
    expect(md5('input1')).not.toBe(md5('input2'));
  });
});
