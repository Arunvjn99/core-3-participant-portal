export function AuthLeftPanel() {
  return (
    <div className="hidden lg:flex flex-col items-center justify-center bg-primary p-12 text-text-inverse min-h-screen">
      <div className="max-w-sm text-center">
        <div className="mx-auto h-16 w-16 rounded-xl bg-white/20 flex items-center justify-center text-3xl font-bold mb-6">
          P
        </div>
        <h2 className="text-3xl font-bold mb-3">Participant Portal</h2>
        <p className="text-white/70 text-lg leading-relaxed">
          Manage your retirement savings, investments, and benefits — all in one place.
        </p>
      </div>
    </div>
  )
}

export default AuthLeftPanel
