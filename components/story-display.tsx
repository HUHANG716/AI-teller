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

  // Update ref when onComplete changes
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    setDisplayedText('');
    setIsComplete(false);
    
    let currentIndex = 0;
    const textLength = content.length;
    
    // Typewriter effect
    const interval = setInterval(() => {
      if (currentIndex < textLength) {
        setDisplayedText(content.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        setIsComplete(true);
        clearInterval(interval);
        onCompleteRef.current?.();
      }
    }, 30); // Speed of typing effect

    return () => clearInterval(interval);
  }, [content]);

  const handleSkip = () => {
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
                    rounded-2xl p-8 md:p-10 shadow-2xl border border-gray-700/50">
        <div className="prose prose-invert max-w-none">
          <p className="text-lg md:text-xl leading-relaxed text-gray-100 whitespace-pre-wrap">
            {displayedText}
            {!isComplete && (
              <span className="inline-block w-1 h-6 bg-blue-400 ml-1 animate-pulse" />
            )}
          </p>
        </div>

        {/* Skip button (only shown during typing) */}
        {!isComplete && (
          <button
            onClick={handleSkip}
            className="absolute bottom-4 right-4 text-sm text-gray-400 hover:text-gray-200 
                     transition-colors underline"
          >
            跳过动画
          </button>
        )}
      </div>
    </motion.div>
  );
}

