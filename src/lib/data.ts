export interface Member {
  id: string;
  name: string;
  avatar: string;
  role: 'admin' | 'manager' | 'member';
  isGuest: boolean;
  isActive: boolean;
  totalMeals: number;
  dayMeals: number;
  nightMeals: number;
  personalPurchases: number;
  advanceContributed: number;
}

export interface Expense {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  addedBy: string;
  receiptImage?: string;
}

export interface MealEntry {
  memberId: string;
  date: number;
  day: boolean;
  night: boolean;
  custom: number;
}

export interface Advance {
  id: string;
  memberId: string;
  memberName: string;
  amount: number;
  date: string;
  note: string;
}

export const CATEGORIES = [
  { name: 'Cooking Buoy', color: 'hsl(187, 72%, 55%)' },
  { name: 'Fish', color: 'hsl(280, 65%, 60%)' },
  { name: 'Meat', color: 'hsl(142, 72%, 45%)' },
  { name: 'Vegetables', color: 'hsl(38, 92%, 55%)' },
  { name: 'Other', color: 'hsl(215, 20%, 55%)' },
];

export const MEMBERS: Member[] = [
  { id: '1', name: 'Abdullah', avatar: 'A', role: 'admin', isGuest: false, isActive: true, totalMeals: 16.5, dayMeals: 16, nightMeals: 1, personalPurchases: 0, advanceContributed: 0 },
  { id: '2', name: 'Khokon', avatar: 'K', role: 'member', isGuest: false, isActive: true, totalMeals: 27.0, dayMeals: 20, nightMeals: 14, personalPurchases: 1365, advanceContributed: 0 },
  { id: '3', name: 'Nijam', avatar: 'N', role: 'member', isGuest: false, isActive: true, totalMeals: 23.0, dayMeals: 17, nightMeals: 12, personalPurchases: 800, advanceContributed: 0 },
  { id: '4', name: 'Nur Jaman', avatar: 'N', role: 'manager', isGuest: false, isActive: true, totalMeals: 27.5, dayMeals: 20, nightMeals: 15, personalPurchases: 0, advanceContributed: 0 },
  { id: '5', name: 'Tonoy', avatar: 'T', role: 'member', isGuest: false, isActive: true, totalMeals: 9.0, dayMeals: 9, nightMeals: 0, personalPurchases: 0, advanceContributed: 0 },
  { id: '6', name: 'Mojammel', avatar: 'M', role: 'member', isGuest: false, isActive: true, totalMeals: 26.5, dayMeals: 19, nightMeals: 15, personalPurchases: 0, advanceContributed: 0 },
  { id: '7', name: 'Office Guest', avatar: 'O', role: 'member', isGuest: true, isActive: true, totalMeals: 2.0, dayMeals: 2, nightMeals: 0, personalPurchases: 0, advanceContributed: 0 },
];

export const EXPENSES: Expense[] = [
  { id: '1', date: '2026-02-01', description: 'Cooking supplies', amount: 2500, category: 'Cooking Buoy', addedBy: 'Abdullah' },
  { id: '2', date: '2026-02-03', description: 'Rui fish', amount: 850, category: 'Fish', addedBy: 'Khokon' },
  { id: '3', date: '2026-02-05', description: 'Hilsha fish', amount: 835, category: 'Fish', addedBy: 'Nijam' },
  { id: '4', date: '2026-02-07', description: 'Beef', amount: 630, category: 'Meat', addedBy: 'Abdullah' },
  { id: '5', date: '2026-02-09', description: 'Mixed vegetables', amount: 100, category: 'Vegetables', addedBy: 'Nur Jaman' },
  { id: '6', date: '2026-02-10', description: 'Potatoes & onions', amount: 88, category: 'Vegetables', addedBy: 'Tonoy' },
  { id: '7', date: '2026-02-12', description: 'Misc items', amount: 50, category: 'Other', addedBy: 'Mojammel' },
];

export const ADVANCES: Advance[] = [
  { id: '1', memberId: '2', memberName: 'Khokon', amount: 302, date: '2026-02-01', note: 'Monthly advance' },
];

export const TOTAL_EXPENSE = 4965;
export const TOTAL_MEALS = 131.5;
export const PER_MEAL_COST = +(TOTAL_EXPENSE / TOTAL_MEALS).toFixed(2);
export const TOTAL_ADVANCES = 302;

export const EXPENSE_BY_CATEGORY = [
  { category: 'Cooking Buoy', amount: 2500 },
  { category: 'Fish', amount: 1685 },
  { category: 'Meat', amount: 630 },
  { category: 'Vegetables', amount: 188 },
  { category: 'Other', amount: 50 },
];

export function getMemberBalance(member: Member): number {
  const mealCost = member.totalMeals * PER_MEAL_COST;
  const balance = mealCost + member.personalPurchases - member.advanceContributed;
  return +balance.toFixed(2);
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}
