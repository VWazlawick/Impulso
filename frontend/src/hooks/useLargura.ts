import { useEffect, useRef, useState } from 'react'

// Mede a largura de um elemento e acompanha quando a janela muda.
// O gráfico usa isso para desenhar em pixels de verdade (o texto não encolhe no celular).
export function useLargura<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [largura, setLargura] = useState(0)

  useEffect(() => {
    const elemento = ref.current
    if (!elemento) {
      return
    }
    const observador = new ResizeObserver(([entrada]) => setLargura(entrada.contentRect.width))
    observador.observe(elemento)
    return () => observador.disconnect()
  }, [])

  return { ref, largura }
}
