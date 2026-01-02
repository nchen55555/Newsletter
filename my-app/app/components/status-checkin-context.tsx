'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'
import { Edit} from 'lucide-react'

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

export function StatusCheckinTriggerButton() {
  const { triggerStatusCheckin } = useStatusCheckin()
  
  return (
    <Edit onClick={triggerStatusCheckin} className="w-4 h-4" />
   
  )
}