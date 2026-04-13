import { cn } from '../../../lib/cn'

export interface ChatMessageProps {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export function ChatMessage({ role, content, timestamp }: ChatMessageProps) {
  const time = new Date(timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  const isUser = role === 'user'

  return (
    <div className={cn('mb-3 flex w-full', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-lg px-3 py-2 text-sm',
          isUser ? 'bg-primary text-text-inverse' : 'bg-surface-card text-text-primary shadow-sm'
        )}
      >
        <p className="whitespace-pre-wrap">{content}</p>
        <p className={cn('mt-1 text-[10px]', isUser ? 'text-white/75' : 'text-text-muted')}>{time}</p>
      </div>
    </div>
  )
}

export default ChatMessage
