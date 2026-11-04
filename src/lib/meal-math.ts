/**
 * Pure money math for the Meal Calculator.
 *
 * All allocation happens in integer paisa (1/100 of a taka) so that
 * floating-point drift can never appear, and leftover paisa from rounding are
 * distributed with the largest-remainder method. This guarantees:
 *   Σ(member cost) === total expense, exactly.
 */

export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export interface AllocationInput {
  /** Stable member id. */
  id: string;
  /** Raw (unrounded) charge for this member, in taka. */
  raw: number;
}

/**
 * Allocate raw charges into exact paisa amounts summing to `totalExpense`.
 *
 * When `distributeRemainder` is false (e.g. no billable meals exist so the raw
 * charges are not meant to add up to the expenses) each value is simply
 * rounded to the nearest paisa.
 */
export function allocateCosts(
  entries: AllocationInput[],
  totalExpense: number,
  distributeRemainder = true,
): Map<string, number> {
  const map = new Map<string, number>();
  if (entries.length === 0) return map;

  const cents = entries.map((e) => Math.floor(e.raw * 100));

  if (distributeRemainder) {
    const targetCents = Math.round(totalExpense * 100);
    let diff = targetCents - cents.reduce((a, b) => a + b, 0);
    const order = entries
      .map((e, i) => ({ i, frac: e.raw * 100 - Math.floor(e.raw * 100) }))
      .sort((a, b) => b.frac - a.frac);
    let k = 0;
    while (diff !== 0) {
      const idx = order[k % order.length].i;
      cents[idx] += diff > 0 ? 1 : -1;
      diff += diff > 0 ? -1 : 1;
      k++;
    }
  } else {
    entries.forEach((e, i) => { cents[i] = Math.round(e.raw * 100); });
  }

  entries.forEach((e, i) => map.set(e.id, cents[i] / 100));
  return map;
}

export interface SettlementBalance {
  name: string;
  /** Positive = is owed money, negative = owes money (taka). */
  balance: number;
}

export interface SettlementTx {
  from: string;
  to: string;
  amount: number;
}

/** Greedy minimal-transaction settlement computed in whole paisa. */
export function computeSettlements(balances: SettlementBalance[]): SettlementTx[] {
  type Bal = { name: string; cents: number };
  const debtors: Bal[] = [];
  const creditors: Bal[] = [];

  balances.forEach((b) => {
    const cents = Math.round(b.balance * 100);
    if (cents > 0) creditors.push({ name: b.name, cents });
    else if (cents < 0) debtors.push({ name: b.name, cents: -cents });
  });

  debtors.sort((a, b) => b.cents - a.cents);
  creditors.sort((a, b) => b.cents - a.cents);

  const tx: SettlementTx[] = [];
  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i].cents, creditors[j].cents);
    if (pay > 0) tx.push({ from: debtors[i].name, to: creditors[j].name, amount: pay / 100 });
    debtors[i].cents -= pay;
    creditors[j].cents -= pay;
    if (debtors[i].cents === 0) i++;
    if (creditors[j].cents === 0) j++;
  }
  return tx;
}
