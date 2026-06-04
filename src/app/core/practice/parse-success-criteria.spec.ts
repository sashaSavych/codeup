import { parseSuccessCriteria, stripSuccessCriteriaFromDescription } from './parse-success-criteria';

describe('parseSuccessCriteria', () => {
  it('extracts bullets after heading', () => {
    const desc = `Опис вправи.

## Критерії успіху
- Є константа hello
- Значення "CodeUp"

## Інше`;
    expect(parseSuccessCriteria(desc)).toEqual(['Є константа hello', 'Значення "CodeUp"']);
    expect(stripSuccessCriteriaFromDescription(desc)).not.toContain('Критерії успіху');
  });

  it('returns empty when no section', () => {
    expect(parseSuccessCriteria('Лише опис')).toEqual([]);
  });
});
