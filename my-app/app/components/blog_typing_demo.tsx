'use client'
import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

const fullText = 'reve just went public! the new best ai image generation model is here and we are speaking to researcher and engineer arden ma w/ exclusive access to the product!';

export default function BlogTypingDemo() {
  const [typedText, setTypedText] = useState('')
  const [typingDone, setTypingDone] = useState(false)
  const [posted, setPosted] = useState(false)
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
      }
    }, 50)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative w-full flex items-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="relative z-10 max-w-xl mx-auto bg-white/90 backdrop-blur-md rounded-xl shadow-2xl p-4"
      >
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">news alert 🔔</h2>
        <div className="border border-gray-300 rounded p-4 h-32 font-mono whitespace-pre-wrap text-gray-700 bg-gray-50">
          {typedText}
          <span className="animate-pulse">{!typingDone && '|'}</span>
        </div>

        {typingDone && !posted && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => setPosted(true)}
            className="mt-4 px-4 py-2 rounded bg-black text-white"
          >
            Post
          </motion.button>
        )}

        {posted && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 text-green-600 font-semibold"
          >
            ✅ article published
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
