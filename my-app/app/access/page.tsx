
'use client'
import { Navigation } from "../components/header";
import { Subscribe } from "../components/subscribe";
import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

export default function Access() {

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-neutral-50 to-white flex flex-col">
      <Navigation />
        <div className="flex flex-1 flex-col md:flex-row w-full max-w-[1400px] px-8 mx-auto py-12 gap-12 md:items-start">
              <main className="flex-[2] flex items-center justify-center transition-all duration-700 md:mr-10">
                <div className="relative rounded-xl overflow-hidden w-full">
                  <AccessTypingDemo />
                </div>
              </main>
            </div>      
    </div>
  );
}

const fullText = 'The newsletter-turned-marketplace for you to shop for today\'s highest-growth startups ';

function AccessTypingDemo({ onTypingDone }: { onTypingDone?: () => void }) {
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
        <div className="mt-8">

          <Subscribe/>
        </div>
      </motion.div>
      
    </div>
  )
}
