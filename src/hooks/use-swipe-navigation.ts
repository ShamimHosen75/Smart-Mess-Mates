import { useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

const PAGE_ORDER = [
  "/",
  "/meal-entry",
  "/expenses",
  "/members",
  "/monthly-report",
  "/advances",
  "/settings",
  "/my-account",
];

const SWIPE_THRESHOLD = 60;

export function useSwipeNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isMobile) return;
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, [isMobile]);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isMobile || !touchStart.current) return;

    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    touchStart.current = null;

    // Only trigger if horizontal swipe is dominant
    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dy) > Math.abs(dx)) return;

    const currentIndex = PAGE_ORDER.indexOf(location.pathname);
    if (currentIndex === -1) return;

    if (dx < 0 && currentIndex < PAGE_ORDER.length - 1) {
      navigate(PAGE_ORDER[currentIndex + 1]);
    } else if (dx > 0 && currentIndex > 0) {
      navigate(PAGE_ORDER[currentIndex - 1]);
    }
  }, [isMobile, location.pathname, navigate]);

  return { onTouchStart, onTouchEnd };
}
