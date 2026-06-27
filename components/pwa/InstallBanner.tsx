'use client'

import { useEffect, useState } from 'react'

export default function InstallBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || ('standalone' in window.navigator && (window.navigator as Record<string, unknown>).standalone === true)
    const dismissed = sessionStorage.getItem('pwa-banner-dismissed')

    if (isIOS && !isStandalone && !dismissed) {
      // Pequeño retraso para no mostrar el banner mientras carga la página
      const t = setTimeout(() => setVisible(true), 2000)
      return () => clearTimeout(t)
    }
  }, [])

  function dismiss() {
    sessionStorage.setItem('pwa-banner-dismissed', '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-card border border-border rounded-2xl shadow-xl shadow-black/20 p-4 flex gap-3 items-start">
        <span className="text-2xl shrink-0 mt-0.5">📲</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">Instala la app</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            Toca{' '}
            <span className="inline-flex items-center gap-0.5 text-foreground font-medium">
              Compartir
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
              </svg>
            </span>
            {' '}y luego{' '}
            <span className="text-foreground font-medium">«Añadir a pantalla de inicio»</span>
          </p>
        </div>
        <button
          onClick={dismiss}
          aria-label="Cerrar"
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors p-1 -m-1"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
