"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// A medição precisa acontecer antes da pintura, senão a fileira aparece por um
// quadro no tamanho natural (cortada, com barra de rolagem) e só então encolhe.
// No servidor não existe layout, então lá vale o useEffect — que nunca roda.
const useMeasureEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Mantém uma fileira do painel em uma linha só, como no aparelho de verdade:
 * mede a largura natural do conteúdo e encolhe tudo proporcionalmente até caber.
 * Sem isso, a última serigrafia do Tank-G (Noise Gate) cai para a linha de baixo
 * assim que o container aperta.
 *
 * Abaixo de MIN_SCALE os knobs ficariam pequenos demais para arrastar, então a
 * escala para de diminuir e a fileira passa a rolar na horizontal (telas
 * estreitas).
 */
const MIN_SCALE = 0.6;

export function FitRow({
  className,
  innerClassName,
  children,
}: {
  className?: string;
  innerClassName?: string;
  children: React.ReactNode;
}) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{
    scale: number;
    width: number;
    height: number;
    /** Nem com a escala mínima coube: a fileira precisa rolar na horizontal. */
    scrolls: boolean;
  } | null>(null);

  useMeasureEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    // offsetWidth/Height ignoram o transform, então continuam devolvendo o
    // tamanho natural do conteúdo mesmo depois de escalado — sem isso a medição
    // realimentaria a si mesma.
    function measure() {
      if (!outer || !inner) return;
      const available = outer.clientWidth;
      const natural = inner.offsetWidth;
      if (!available || !natural) return;

      const scale =
        natural > available ? Math.max(MIN_SCALE, available / natural) : 1;

      const next = {
        scale,
        width: natural,
        height: inner.offsetHeight,
        scrolls: natural * scale > available + 0.5,
      };

      setBox((prev) =>
        prev &&
        Math.abs(prev.scale - next.scale) < 0.001 &&
        prev.width === next.width &&
        prev.height === next.height &&
        prev.scrolls === next.scrolls
          ? prev
          : next,
      );
    }

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(outer);
    observer.observe(inner);
    return () => observer.disconnect();
  }, [children]);

  return (
    <div
      ref={outerRef}
      className={cn(
        // Só recorta quando de fato precisa rolar: com overflow ligado o
        // brilho dos LEDs e a sombra dos knobs seriam cortados na borda.
        // Antes da primeira medição (SSR) fica escondido em vez de rolável —
        // uma barra de rolagem que some logo em seguida seria pior.
        !box
          ? "overflow-hidden"
          : box.scrolls
            ? "overflow-x-auto overflow-y-hidden"
            : "overflow-visible",
        className,
      )}
    >
      <div
        className="mx-auto"
        style={
          box
            ? { width: box.width * box.scale, height: box.height * box.scale }
            : undefined
        }
      >
        <div
          ref={innerRef}
          className={cn("flex w-max origin-top-left", innerClassName)}
          style={box ? { transform: `scale(${box.scale})` } : undefined}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
