import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { fadeInUp } from '../../../design-system/motion/variants'

interface AuthCardProps {
  title: string
  subtitle?: string
  children: ReactNode
}

export function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="rounded-xl bg-surface-card p-8 shadow-card"
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>}
      </div>
      {children}
    </motion.div>
  )
}

export default AuthCard
