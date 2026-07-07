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
        className="absolute left-0 right-0 flex justify-center pointer-events-none transition-all duration-150 z-50"
        style={{
          top: refreshing ? "12px" : `${pullDistance - 30}px`,
          opacity: refreshing || pullDistance > 10 ? 1 : 0,
          transform: `scale(${Math.min(pullDistance / 50, 1)})`,
        }}
      >
        <div className="bg-card border border-border shadow-lg rounded-full p-2.5 flex items-center justify-center bg-white dark:bg-zinc-900">
          <Loader2
            className={`w-5 h-5 text-primary ${
              refreshing ? "animate-spin" : ""
            }`}
            style={{
              transform: refreshing ? "none" : `rotate(${pullDistance * 4}deg)`,
            }}
          />
        </div>
      </div>

      {/* Content wrapper */}
      <div
        style={{
          transform: refreshing ? "translateY(50px)" : `translateY(${pullDistance * 0.5}px)`,
          transition: pullDistance === 0 ? "transform 0.2s ease-out" : "none",
        }}
      >
        {children}
      </div>
    </div>
  );
}
