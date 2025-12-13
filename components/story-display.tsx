'use client';

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';

interface StoryDisplayProps {
  content: string;
  onComplete?: () => void;
}

export default function StoryDisplay({ content, onComplete }: StoryDisplayProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const onCompleteRef = useRef(onComplete);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true); // 追踪组件是否已挂载

  // Update ref when onComplete changes
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // 追踪组件挂载状态
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    setDisplayedText('');
    setIsComplete(false);

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    let currentIndex = 0;
    const textLength = content.length;

    // Typewriter effect
    intervalRef.current = setInterval(() => {
      if (currentIndex < textLength) {
        setDisplayedText(content.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        // 只有在组件仍然挂载时才更新状态和调用回调
        if (isMountedRef.current) {
          setIsComplete(true);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          onCompleteRef.current?.();
        }
      }
    }, 30); // Speed of typing effect

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [content]);

  const handleSkip = () => {
    // Clear the interval immediately
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    // Show all text immediately
    setDisplayedText(content);
    setIsComplete(true);
    onCompleteRef.current?.();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative"
    >
      <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm 
                    rounded-2xl p-8 md:p-10 shadow-2xl border border-gray-700/50 relative">
        {/* Skip button (only shown during typing, fixed at top-right) */}
        {!isComplete && (
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 text-sm text-gray-400 hover:text-gray-200 
                     transition-colors underline z-10"
          >
            跳过动画
          </button>
        )}
        
        <div className="prose prose-invert max-w-none">
          <p className="text-lg md:text-xl leading-relaxed text-gray-100 whitespace-pre-wrap">
            {displayedText}
            {!isComplete && (
              <span className="inline-block w-1 h-6 bg-blue-400 ml-1 animate-pulse" />
            )}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

