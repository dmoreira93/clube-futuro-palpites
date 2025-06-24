// src/hooks/usePwaDisplayMode.ts

import { useState, useEffect } from 'react';

// Este hook retornará `true` se o app estiver rodando como um PWA instalado.
export function usePwaDisplayMode() {
  const [isPwa, setIsPwa] = useState(false);

  useEffect(() => {
    // A Media Query 'display-mode: standalone' é o padrão para verificar isso.
    const mediaQuery = window.matchMedia('(display-mode: standalone)');

    // Define o estado inicial
    setIsPwa(mediaQuery.matches);

    // Adiciona um listener para caso o estado mude (raro, mas é boa prática)
    const listener = (e: MediaQueryListEvent) => setIsPwa(e.matches);
    mediaQuery.addEventListener('change', listener);

    // Limpa o listener quando o componente for desmontado
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  return { isPwa };
}