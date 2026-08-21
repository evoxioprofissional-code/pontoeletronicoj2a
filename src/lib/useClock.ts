"use client";

import { useEffect, useState } from "react";

/**
 * Relógio em tempo real. Retorna `null` até montar no cliente para evitar
 * divergência de hidratação (o servidor não conhece o horário do usuário).
 */
export function useClock(): Date | null {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return now;
}
