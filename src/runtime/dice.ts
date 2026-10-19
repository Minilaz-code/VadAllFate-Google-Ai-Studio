/**
 * Pure Deterministic Dice Evaluator
 */

export interface DiceRollResult {
  formula: string;
  count: number;
  sides: number;
  modifier: number;
  rolls: number[];
  baseTotal: number;
  total: number;
  isCritical: boolean;
  isFumble: boolean;
  mode: 'normal' | 'advantage' | 'disadvantage';
  details: string;
}

export function parseDiceFormula(formula: string): { count: number; sides: number; modifier: number } {
  const clean = formula.replace(/\s+/g, '').toLowerCase();
  const match = clean.match(/^(\d*)d(\d+)([+-]\d+)?$/);
  if (!match) {
    throw new Error(`Invalid dice formula: "${formula}". Expected format like "1d20", "2d6+3", "1d8-1".`);
  }
  const count = match[1] ? parseInt(match[1], 10) : 1;
  const sides = parseInt(match[2], 10);
  const modifier = match[3] ? parseInt(match[3], 10) : 0;
  return { count, sides, modifier };
}

export function rollDice(
  formula: string,
  mode: 'normal' | 'advantage' | 'disadvantage' = 'normal',
  customRng?: () => number
): DiceRollResult {
  const { count, sides, modifier } = parseDiceFormula(formula);
  const rng = customRng || Math.random;

  const rollOne = () => Math.floor(rng() * sides) + 1;

  if (sides === 20 && count === 1 && (mode === 'advantage' || mode === 'disadvantage')) {
    const rollA = rollOne();
    const rollB = rollOne();
    const chosen = mode === 'advantage' ? Math.max(rollA, rollB) : Math.min(rollA, rollB);
    const discarded = mode === 'advantage' ? Math.min(rollA, rollB) : Math.max(rollA, rollB);
    const isCritical = chosen === 20;
    const isFumble = chosen === 1;
    const total = chosen + modifier;

    return {
      formula,
      count: 1,
      sides: 20,
      modifier,
      rolls: [chosen, discarded],
      baseTotal: chosen,
      total,
      isCritical,
      isFumble,
      mode,
      details: `${mode === 'advantage' ? 'Advantage' : 'Disadvantage'} [${rollA}, ${rollB}] -> Picked ${chosen} ${modifier >= 0 ? '+' : ''}${modifier} = ${total}`,
    };
  }

  const rolls: number[] = [];
  let baseTotal = 0;
  for (let i = 0; i < count; i++) {
    const r = rollOne();
    rolls.push(r);
    baseTotal += r;
  }

  const isCritical = sides === 20 && count === 1 && rolls[0] === 20;
  const isFumble = sides === 20 && count === 1 && rolls[0] === 1;
  const total = baseTotal + modifier;

  return {
    formula,
    count,
    sides,
    modifier,
    rolls,
    baseTotal,
    total,
    isCritical,
    isFumble,
    mode: 'normal',
    details: `Rolled [${rolls.join(', ')}] ${modifier !== 0 ? (modifier > 0 ? `+ ${modifier}` : `- ${Math.abs(modifier)}`) : ''} = ${total}`,
  };
}
