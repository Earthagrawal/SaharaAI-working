import React, { useEffect, useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb } from 'lucide-react';

interface WellnessTip {
  id: number;
  content: string;
  category: 'mindfulness' | 'physical' | 'social' | 'emotional';
}

const tips: WellnessTip[] = [                 
  { id: 1, content: "Take a deep breath and focus on the present moment", category: 'mindfulness' },
  { id: 2, content: "Remember to drink water and stay hydrated", category: 'physical' },
  { id: 3, content: "Step outside for some fresh air and sunlight", category: 'physical' },
  { id: 4, content: "Stretch your body to release tension", category: 'physical' },
  { id: 5, content: "Practice gratitude by noting three good things today", category: 'emotional' },
  { id: 6, content: "Connect with a friend or family member", category: 'social' },
  { id: 7, content: "Take a break from screens every hour", category: 'physical' },
  { id: 8, content: "Listen to your favorite calming music", category: 'mindfulness' },
  { id: 9, content: "Write down your thoughts and feelings", category: 'emotional' },
  { id: 10, content: "Get moving with a quick walk or exercise", category: 'physical' },
];

interface WellnessTipsProps {
  intervalMs?: number;
  initialTipIndex?: number;
  onTipChange?: (tip: WellnessTip) => void;
  className?: string;
}

/**
 * WellnessTips Component
 * 
 * Displays rotating wellness tips with smooth animations and loading states.
 * Supports dark mode, accessibility, and custom intervals.
 */
export const WellnessTips = memo<WellnessTipsProps>(({ 
  intervalMs = 10000, 
  initialTipIndex = 0,
  onTipChange
}) => {
  const [currentTip, setCurrentTip] = useState<number>(initialTipIndex);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (initialTipIndex < 0 || initialTipIndex >= tips.length) {
      console.warn('Invalid initialTipIndex provided to WellnessTips component');
      setCurrentTip(0);
    }

    // Simulate loading state
    setIsLoading(true);
    const loadTimer = setTimeout(() => setIsLoading(false), 500);

    // Set up tip rotation
    const interval = setInterval(() => {
      setCurrentTip((prev: number) => {
        const nextTip = (prev + 1) % tips.length;
        onTipChange?.(tips[nextTip]);
        return nextTip;
      });
    }, intervalMs);
    
    return () => {
      clearInterval(interval);
      clearTimeout(loadTimer);
    };
  }, [intervalMs, initialTipIndex, onTipChange]);

  return (
    <div 
      className="glass rounded-2xl p-4 soft-shadow" 
      role="complementary" 
      aria-label="Wellness Tips"
      aria-live="polite"
    >
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="w-5 h-5 text-amber-500" aria-hidden="true" />
        <h2 className="text-lg font-semibold">Wellness Tip</h2>
      </div>
      <div className="h-24 relative overflow-hidden">
        {isLoading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTip}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0"
            >
              <p className="text-slate-700 dark:text-slate-300">
                {tips[currentTip].content}
              </p>
              <span className="inline-block mt-2 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-xs rounded-full">
                {tips[currentTip].category}
              </span>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
});

WellnessTips.displayName = 'WellnessTips';
