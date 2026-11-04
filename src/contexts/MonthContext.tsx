import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth } from "date-fns";

interface MonthContextType {
  currentMonth: Date;
  monthLabel: string;
  /** Short format like "Mar 2026" */
  monthLabelShort: string;
  monthKey: string;
  /** Start of the month as ISO date string (YYYY-MM-DD) */
  monthStart: string;
  /** End of the month as ISO date string (YYYY-MM-DD) */
  monthEnd: string;
  goToPreviousMonth: () => void;
  goToNextMonth: () => void;
}

const MonthContext = createContext<MonthContextType | undefined>(undefined);

export function MonthProvider({ children }: { children: ReactNode }) {
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));

  const goToPreviousMonth = useCallback(() => {
    setCurrentMonth((prev) => startOfMonth(subMonths(prev, 1)));
  }, []);

  const goToNextMonth = useCallback(() => {
    setCurrentMonth((prev) => startOfMonth(addMonths(prev, 1)));
  }, []);

  const monthLabel = format(currentMonth, "MMMM yyyy");
  const monthLabelShort = format(currentMonth, "MMM yyyy");
  const monthKey = format(currentMonth, "yyyy-MM");
  const monthStart = format(startOfMonth(currentMonth), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(currentMonth), "yyyy-MM-dd");

  return (
    <MonthContext.Provider
      value={{ currentMonth, monthLabel, monthLabelShort, monthKey, monthStart, monthEnd, goToPreviousMonth, goToNextMonth }}
    >
      {children}
    </MonthContext.Provider>
  );
}

export function useMonth() {
  const ctx = useContext(MonthContext);
  if (!ctx) throw new Error("useMonth must be used within MonthProvider");
  return ctx;
}
