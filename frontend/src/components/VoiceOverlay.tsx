import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Send } from "lucide-react";

interface VoiceOverlayProps {
  transcript: string;
  listening: boolean;
  onSend: () => void;
  onClose: () => void;
}

export const VoiceOverlay: React.FC<VoiceOverlayProps> = ({ transcript, listening, onSend, onClose }) => (
  <AnimatePresence>
    {listening && (
      <motion.div
        className="fixed inset-0 z-50 flex flex-col items-center justify-end md:justify-center bg-black/70 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        aria-modal="true"
        role="dialog"
        tabIndex={-1}
        onClick={onClose}
      >
        <div className="flex flex-col items-center w-full mb-24 md:mb-0" onClick={e => e.stopPropagation()}>
          <motion.div
            className="mb-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-lg md:text-2xl font-medium text-white/90 mb-4 min-h-[2.5em]" aria-live="polite">
              {transcript || <span className="text-slate-400">Listening…</span>}
            </div>
          </motion.div>
          <motion.div
            className="relative flex flex-col items-center"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 18 }}
          >
            <div className="mic-glow">
              <Mic className="w-16 h-16 text-white drop-shadow-lg" aria-label="Recording" />
            </div>
          </motion.div>
        </div>
        <motion.button
          className="fixed bottom-8 right-8 md:bottom-16 md:right-16 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full p-4 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          onClick={onSend}
          aria-label="Send transcript"
        >
          <Send className="w-6 h-6" />
        </motion.button>
      </motion.div>
    )}
  </AnimatePresence>
);
