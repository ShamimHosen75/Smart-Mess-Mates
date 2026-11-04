import { describe, it, expect } from "vitest";
import { allocateCosts, computeSettlements, round2 } from "@/lib/meal-math";

const sum = (m: Map<string, number>) =>
  Math.round([...m.values()].reduce((s, v) => s + v, 0) * 100);

describe("allocateCosts — largest-remainder in paisa", () => {
  it("sums exactly to the total expense for an indivisible split", () => {
    // 100 taka across 3 equal members => 33.33 / 33.33 / 33.34
    const per = 100 / 3;
    const map = allocateCosts(
      [{ id: "a", raw: per }, { id: "b", raw: per }, { id: "c", raw: per }],
      100,
    );
    expect(sum(map)).toBe(10000);
    expect([...map.values()].sort()).toEqual([33.33, 33.33, 33.34]);
  });

  it("sums exactly for messy per-meal costs", () => {
    const totalExpense = 4965.37;
    const units = [16.5, 27, 23, 27.5, 9, 26.5, 2];
    const poolUnits = units.reduce((s, u) => s + u, 0);
    const perMeal = totalExpense / poolUnits;
    const map = allocateCosts(
      units.map((u, i) => ({ id: `m${i}`, raw: u * perMeal })),
      totalExpense,
    );
    expect(sum(map)).toBe(Math.round(totalExpense * 100));
  });

  it("stays exact across many randomized scenarios", () => {
    let seed = 1234;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);

    for (let t = 0; t < 300; t++) {
      const n = 1 + Math.floor(rnd() * 9);
      const totalExpense = round2(rnd() * 20000);
      const units = Array.from({ length: n }, () => round2(rnd() * 40));
      const poolUnits = units.reduce((s, u) => s + u, 0);
      if (poolUnits === 0) continue;
      const perMeal = totalExpense / poolUnits;
      const map = allocateCosts(
        units.map((u, i) => ({ id: `m${i}`, raw: u * perMeal })),
        totalExpense,
      );
      expect(sum(map)).toBe(Math.round(totalExpense * 100));
      // every value is a whole number of paisa
      for (const v of map.values()) expect(Math.abs(v * 100 - Math.round(v * 100))).toBeLessThan(1e-6);
    }
  });

  it("handles fixed-price breakfast plus pool charges exactly", () => {
    const totalExpense = 3000;
    const bfPrice = 50;
    const rows = [
      { id: "a", bf: 10, pool: 12 },
      { id: "b", bf: 7, pool: 9.5 },
      { id: "c", bf: 3, pool: 14.5 },
    ];
    const bfRevenue = rows.reduce((s, r) => s + r.bf * bfPrice, 0);
    const poolExpense = totalExpense - bfRevenue;
    const poolUnits = rows.reduce((s, r) => s + r.pool, 0);
    const perMeal = poolExpense / poolUnits;
    const map = allocateCosts(
      rows.map((r) => ({ id: r.id, raw: r.pool * perMeal + r.bf * bfPrice })),
      totalExpense,
    );
    expect(sum(map)).toBe(300000);
  });

  it("does not force a total when remainder distribution is disabled", () => {
    const map = allocateCosts([{ id: "a", raw: 12.345 }], 999, false);
    expect(map.get("a")).toBe(12.35);
  });

  it("returns an empty map for no members", () => {
    expect(allocateCosts([], 500).size).toBe(0);
  });
});

describe("computeSettlements", () => {
  it("produces transactions that zero out every balance", () => {
    const balances = [
      { name: "A", balance: 120.55 },
      { name: "B", balance: -40.2 },
      { name: "C", balance: -80.35 },
    ];
    const tx = computeSettlements(balances);
    const net = new Map(balances.map((b) => [b.name, Math.round(b.balance * 100)]));
    tx.forEach((t) => {
      net.set(t.from, (net.get(t.from) ?? 0) + Math.round(t.amount * 100));
      net.set(t.to, (net.get(t.to) ?? 0) - Math.round(t.amount * 100));
    });
    for (const v of net.values()) expect(v).toBe(0);
  });

  it("moves exactly the total debt, in whole paisa", () => {
    const balances = [
      { name: "A", balance: 33.33 },
      { name: "B", balance: 33.34 },
      { name: "C", balance: -66.67 },
    ];
    const tx = computeSettlements(balances);
    const moved = tx.reduce((s, t) => s + Math.round(t.amount * 100), 0);
    expect(moved).toBe(6667);
    tx.forEach((t) => expect(Math.abs(t.amount * 100 - Math.round(t.amount * 100))).toBeLessThan(1e-6));
  });

  it("settles end-to-end from allocated costs (no leftover paisa)", () => {
    const totalExpense = 7777.77;
    const rows = [
      { id: "a", name: "A", units: 21.5, paid: 5000 },
      { id: "b", name: "B", units: 18, paid: 0 },
      { id: "c", name: "C", units: 11.5, paid: 2777.77 },
      { id: "d", name: "D", units: 7, paid: 0 },
    ];
    const poolUnits = rows.reduce((s, r) => s + r.units, 0);
    const perMeal = totalExpense / poolUnits;
    const costs = allocateCosts(
      rows.map((r) => ({ id: r.id, raw: r.units * perMeal })),
      totalExpense,
    );
    expect(sum(costs)).toBe(Math.round(totalExpense * 100));

    const balances = rows.map((r) => ({
      name: r.name,
      balance: round2(r.paid - (costs.get(r.id) ?? 0)),
    }));
    // Paid total equals expense total, so balances must net to zero.
    expect(balances.reduce((s, b) => s + Math.round(b.balance * 100), 0)).toBe(0);

    const tx = computeSettlements(balances);
    const net = new Map(balances.map((b) => [b.name, Math.round(b.balance * 100)]));
    tx.forEach((t) => {
      net.set(t.from, (net.get(t.from) ?? 0) + Math.round(t.amount * 100));
      net.set(t.to, (net.get(t.to) ?? 0) - Math.round(t.amount * 100));
    });
    for (const v of net.values()) expect(v).toBe(0);
  });

  it("returns nothing when everyone is settled", () => {
    expect(computeSettlements([{ name: "A", balance: 0 }, { name: "B", balance: 0 }])).toEqual([]);
  });
});
