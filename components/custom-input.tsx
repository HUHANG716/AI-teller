'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface CustomInputProps {
  onSubmit: (input: string) => void;
  disabled?: boolean;
}

export default function CustomInput({ onSubmit, disabled }: CustomInputProps) {
  const [input, setInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSubmit(input.trim());
      setInput('');
      setIsExpanded(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.4 }}
      className="mt-6"
    >
      {!isExpanded ? (
        <button
          onClick={() => setIsExpanded(true)}
          disabled={disabled}
          className="w-full py-3 text-gray-400 hover:text-white border-2 border-dashed 
                   border-gray-700 hover:border-gray-500 rounded-xl transition-all 
                   disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ✏️ 或者，输入你自己的行动...
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="描述你的行动或想法..."
            maxLength={200}
            rows={3}
            disabled={disabled}
            autoFocus
            className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-700 
                     focus:border-blue-500 rounded-xl text-white placeholder-gray-500 
                     resize-none focus:outline-none transition-colors disabled:opacity-50"
          />
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={!input.trim() || disabled}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium 
                       rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              提交
            </button>
            <button
              type="button"
              onClick={() => {
                setIsExpanded(false);
                setInput('');
              }}
              disabled={disabled}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg 
                       transition-colors disabled:opacity-50"
            >
              取消
            </button>
          </div>
        </form>
      )}
    </motion.div>
  );
}

