'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface LoadingOverlayProps {
  show: boolean;
}

export default function LoadingOverlay({ show }: LoadingOverlayProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center 
                   justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="bg-gray-800 rounded-2xl p-8 shadow-2xl border border-gray-700"
          >
            <div className="flex flex-col items-center gap-4">
              {/* Animated spinner */}
              <div className="relative w-16 h-16">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0 border-4 border-blue-500/30 border-t-blue-500 
                           rounded-full"
                />
              </div>
              
              <div className="text-center">
                <p className="text-white font-medium text-lg mb-1">AI说书人创作中...</p>
                <p className="text-gray-400 text-sm">故事的下一章正在铺展</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


