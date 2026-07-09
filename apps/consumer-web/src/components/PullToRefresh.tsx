import React, { useState, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const isAtTop = useRef(true);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      // We check if the closest scrollable container is at the top.
      // Usually it's the main tag or the element itself.
      const parent = containerRef.current.closest("main") || containerRef.current.parentElement;
      isAtTop.current = (parent?.scrollTop ?? 0) === 0;
    };

    const parent = containerRef.current?.closest("main") || containerRef.current?.parentElement;
    parent?.addEventListener("scroll", handleScroll);
    return () => parent?.removeEventListener("scroll", handleScroll);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (refreshing) return;
    const parent = containerRef.current?.closest("main") || containerRef.current?.parentElement;
    isAtTop.current = (parent?.scrollTop ?? 0) === 0;
    startY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (refreshing || !isAtTop.current) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;

    if (diff > 0) {
      // Pulling down
      setPullDistance(Math.min(diff * 0.4, 80));
      // Prevent pull-to-refresh default browser behavior on Android chrome if pulling
      if (diff > 10 && e.cancelable) {
        e.preventDefault();
      }
    }
  };

  const handleTouchEnd = async () => {
    if (refreshing) return;
    if (pullDistance > 50) {
      setRefreshing(true);
      setPullDistance(50);
      try {
        await onRefresh();
      } catch (e) {
        console.error("PTR Refresh failed", e);
      } finally {
        setRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  };

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative w-full min-h-full"
    >
      {/* PTR Indicator */}
      <div
        className="absolute left-0 right-0 flex justify-center pointer-events-none z-[100]"
        style={{
          top: refreshing ? "20px" : `${pullDistance - 40}px`,
          opacity: refreshing || pullDistance > 10 ? 1 : 0,
          transform: `scale(${Math.min((pullDistance + 10) / 50, 1)})`,
          transition: pullDistance === 0 || refreshing ? "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)" : "none",
        }}
      >
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 shadow-lg rounded-full w-10 h-10 flex items-center justify-center">
          {refreshing ? (
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg
              className="w-5 h-5 text-primary"
              style={{ transform: `rotate(${pullDistance * 5}deg)`, opacity: pullDistance / 50 }}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
        </div>
      </div>

      {/* Content wrapper */}
      <div className="w-full h-full">
        {children}
      </div>
    </div>
  );
}
