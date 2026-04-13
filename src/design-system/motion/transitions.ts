import type { Transition } from 'framer-motion'

export const springGentle: Transition = {
  type: 'spring',
  stiffness: 260,
  damping: 20,
}

export const springSnappy: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 30,
}

export const springBouncy: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 15,
}

export const tweenFast: Transition = {
  type: 'tween',
  duration: 0.15,
  ease: 'easeOut',
}

export const tweenSmooth: Transition = {
  type: 'tween',
  duration: 0.3,
  ease: 'easeInOut',
}

export const tweenSlow: Transition = {
  type: 'tween',
  duration: 0.5,
  ease: 'easeOut',
}
