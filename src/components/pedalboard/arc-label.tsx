"use client";

import { Led } from "./led";

/**
 * Serigrafia curva acima do footswitch, com o LED entre o arco e o botão —
 * o traço mais característico do painel da M-Vave Baby ("IR CAB ⌒ REVERB").
 */
export function ArcLabel({
  left,
  right,
  ledColor,
  ledOn,
}: {
  left: string;
  right?: string;
  ledColor: string;
  ledOn: boolean;
}) {
  const id = `arc-${left}-${right ?? ""}`.replace(/[^a-zA-Z0-9-]/g, "");

  return (
    <div className="relative flex h-11 w-40 items-start justify-center">
      <svg viewBox="0 0 160 44" className="absolute inset-0 h-full w-full" aria-hidden>
        <path id={id} d="M 10,40 Q 80,2 150,40" fill="none" />
        <path
          d="M 10,40 Q 80,2 150,40"
          fill="none"
          stroke="rgba(255,255,255,0.22)"
          strokeWidth="1"
        />
        <text
          fill="rgba(255,255,255,0.8)"
          fontSize="10"
          fontWeight="700"
          letterSpacing="1.4"
          style={{ textTransform: "uppercase" }}
        >
          <textPath href={`#${id}`} startOffset="50%" textAnchor="middle">
            {right ? `${left}   ·   ${right}` : left}
          </textPath>
        </text>
      </svg>
      {/* Abaixo do arco: no ápice o LED cobriria a serigrafia. */}
      <span className="absolute bottom-0">
        <Led color={ledColor} on={ledOn} />
      </span>
    </div>
  );
}
