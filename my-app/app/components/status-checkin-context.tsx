'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'
import { RefreshCw } from 'lucide-react'

interface StatusCheckinContextType {
  triggerStatusCheckin: () => void
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

const StatusCheckinContext = createContext<StatusCheckinContextType | undefined>(undefined)

export function StatusCheckinProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const triggerStatusCheckin = () => {
    setIsOpen(true)
  }

  return (
    <StatusCheckinContext.Provider value={{ triggerStatusCheckin, isOpen, setIsOpen }}>
      {children}
    </StatusCheckinContext.Provider>
  )
}

export function useStatusCheckin() {
  const context = useContext(StatusCheckinContext)
  if (context === undefined) {
    throw new Error('useStatusCheckin must be used within a StatusCheckinProvider')
  }
  return context
}

export function StatusCheckinTriggerButton({ className = '' }: { className?: string }) {
  const { triggerStatusCheckin } = useStatusCheckin()
  
  return (
    <button 
      onClick={triggerStatusCheckin}
      className={`flex items-center gap-2 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg transition-colors ${className}`}
    >
      <RefreshCw className="w-4 h-4" />
      Update Status
    </button>
  )
}