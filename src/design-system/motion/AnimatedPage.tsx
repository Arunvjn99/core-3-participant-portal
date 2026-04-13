export function AnimatedPage({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  if (className) {
    return <div className={className}>{children}</div>
  }
  return <>{children}</>
}

export default AnimatedPage
