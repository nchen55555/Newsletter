'use client'
import { Subscribe } from '@/app/components/subscribe'
import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

const fullText = 'The marketplace-turned-newsletter for you to shop for today\'s highest-growth startups ';

export default function BlogTypingDemo({ onTypingDone }: { onTypingDone?: () => void }) {
  const [typedText, setTypedText] = useState('')
  const [typingDone, setTypingDone] = useState(false)
  const indexRef = useRef(0)

  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = indexRef.current + 1
      const nextText = fullText.slice(0, nextIndex)
      setTypedText(nextText)
      indexRef.current = nextIndex

      if (nextIndex >= fullText.length) {
        clearInterval(interval)
        setTypingDone(true)
        if (onTypingDone) onTypingDone();
      }
    }, 50)
    return () => clearInterval(interval)
  }, [onTypingDone])

  return (
    <div className="relative w-full flex items-center justify-center min-h-[60vh] py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="relative z-10 w-full max-w-2xl mx-auto bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl p-10 border border-neutral-200"
      >
        <div className="rounded-xl px-4 py-2 whitespace-pre-wrap text-gray-800 text-2xl leading-relaxed bg-white/95 border border-neutral-100 shadow-sm">
          {(() => {
            // The phrase to highlight
            const highlight = "highest-growth startups";
            const idx = typedText.indexOf(highlight);
            if (idx === -1) {
              // Not yet typed
              return <>{typedText}</>;
            } else {
              // Split before, highlight, after (may be partial highlight)
              const before = typedText.slice(0, idx);
              const highlightTyped = typedText.slice(idx, Math.min(idx + highlight.length, typedText.length));
              const after = typedText.slice(idx + highlightTyped.length);
              return <>
                {before}
                <span className="text-transparent bg-gradient-to-r from-yellow-400 via-pink-400 to-blue-400 bg-clip-text">{highlightTyped}</span>
                {after}
              </>;
            }
          })()}
          <span className="animate-pulse text-neutral-400">{!typingDone && '|'}</span>
        </div>

        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: typingDone ? 0.3 : 0 }}
          className={`mt-8${typingDone ? '' : ' pointer-events-none opacity-0 select-none'}`}
        >
          <Subscribe />
        </motion.div>

      </motion.div>
    </div>
  )
}
