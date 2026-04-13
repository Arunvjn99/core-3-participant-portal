import { useCallback, useState } from 'react'
import { useAIStore } from '../../../core/store/aiStore'

export function useAIChat() {
  const addMessage = useAIStore((s) => s.addMessage)
  const [isLoading, setIsLoading] = useState(false)

  const sendMessage = useCallback(
    (content: string) => {
      const trimmed = content.trim()
      if (!trimmed) return
      addMessage({ role: 'user', content: trimmed })
      setIsLoading(true)
      window.setTimeout(() => {
        addMessage({ role: 'assistant', content: `I can help you with that. ${trimmed}` })
        setIsLoading(false)
      }, 800)
    },
    [addMessage]
  )

  return { sendMessage, isLoading }
}
