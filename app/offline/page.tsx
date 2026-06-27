export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8 text-center">
      <span className="text-6xl" aria-hidden>📡</span>
      <h1 className="font-heading text-2xl font-bold text-foreground">Sin conexión</h1>
      <p className="text-muted-foreground max-w-xs">
        No hay conexión a internet. Las recetas que hayas visitado antes siguen disponibles.
      </p>
      <a
        href="/recetas"
        className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        Volver a recetas
      </a>
    </div>
  )
}
