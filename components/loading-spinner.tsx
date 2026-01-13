export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh]">
      <div className="relative">
        <div className="h-24 w-24 rounded-full border-t-2 border-b-2 border-sky-500 animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-16 w-16 rounded-full border-t-2 border-b-2 border-purple-500 animate-spin"></div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-8 w-8 rounded-full border-t-2 border-b-2 border-emerald-500 animate-spin"></div>
        </div>
      </div>
      <h2 className="mt-8 text-xl font-semibold text-sky-400 glow">Loading AquaPulse</h2>
      <p className="mt-2 text-slate-400">Initializing water quality monitoring system...</p>
    </div>
  )
}
