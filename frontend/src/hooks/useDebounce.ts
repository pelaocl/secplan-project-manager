import { useState, useEffect } from 'react';

// Este custom hook toma un valor (como un término de búsqueda) y un retardo en milisegundos.
// Solo devuelve el valor más reciente después de que el usuario ha dejado de escribir por el tiempo del retardo.
export function useDebounce<T>(value: T, delay: number): T {
  // Estado para guardar el valor "debounced"
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(
    () => {
      // Configura un temporizador para actualizar el valor debounced después del retardo
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      // Limpia el temporizador si el valor cambia (ej. el usuario sigue escribiendo)
      // o si el componente se desmonta.
      return () => {
        clearTimeout(handler);
      };
    },
    [value, delay] // Solo se vuelve a ejecutar si el valor o el retardo cambian
  );

  return debouncedValue;
}