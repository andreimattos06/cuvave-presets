"use client";

/** Display de LED vermelho de 7 segmentos, como o do Tank-G. */

const T = 2.2;
const X1 = 5;
const X2 = 19;
const Y_TOP = 4;
const Y_MID = 21;
const Y_BOT = 38;

function horiz(x1: number, x2: number, y: number) {
  return `${x1 + T},${y - T} ${x2 - T},${y - T} ${x2},${y} ${x2 - T},${y + T} ${x1 + T},${y + T} ${x1},${y}`;
}

function vert(x: number, y1: number, y2: number) {
  return `${x - T},${y1 + T} ${x},${y1} ${x + T},${y1 + T} ${x + T},${y2 - T} ${x},${y2} ${x - T},${y2 - T}`;
}

const SEGMENTS = {
  a: horiz(X1, X2, Y_TOP),
  b: vert(X2, Y_TOP, Y_MID),
  c: vert(X2, Y_MID, Y_BOT),
  d: horiz(X1, X2, Y_BOT),
  e: vert(X1, Y_MID, Y_BOT),
  f: vert(X1, Y_TOP, Y_MID),
  g: horiz(X1, X2, Y_MID),
} as const;

const GLYPHS: Record<string, string> = {
  "0": "abcdef",
  "1": "bc",
  "2": "abdeg",
  "3": "abcdg",
  "4": "bcfg",
  "5": "acdfg",
  "6": "acdefg",
  "7": "abc",
  "8": "abcdefg",
  "9": "abcdfg",
  "-": "g",
  " ": "",
  A: "abcefg",
  b: "cdefg",
  C: "adef",
  d: "bcdeg",
  E: "adefg",
  F: "aefg",
  L: "def",
  P: "abefg",
  U: "bcdef",
};

function Digit({ char, dot }: { char: string; dot?: boolean }) {
  const lit = GLYPHS[char] ?? GLYPHS[char.toUpperCase()] ?? "";

  return (
    <svg viewBox="0 0 26 44" className="h-9 w-auto" aria-hidden>
      {(Object.keys(SEGMENTS) as (keyof typeof SEGMENTS)[]).map((seg) => {
        const on = lit.includes(seg);
        return (
          <polygon
            key={seg}
            points={SEGMENTS[seg]}
            fill={on ? "#ff2d1a" : "#2a0b08"}
            style={on ? { filter: "drop-shadow(0 0 3px #ff2d1a)" } : undefined}
          />
        );
      })}
      <circle
        cx="23.5"
        cy="38"
        r="1.8"
        fill={dot ? "#ff2d1a" : "#2a0b08"}
        style={dot ? { filter: "drop-shadow(0 0 3px #ff2d1a)" } : undefined}
      />
    </svg>
  );
}

/** Aceita algo como "7.5" ou "--"; o ponto acende o dot do dígito anterior. */
export function SevenSegment({ text, label }: { text: string; label?: string }) {
  const chars: { char: string; dot?: boolean }[] = [];
  for (const c of text) {
    if (c === "." && chars.length > 0) chars[chars.length - 1].dot = true;
    else chars.push({ char: c });
  }
  while (chars.length < 3) chars.unshift({ char: " " });

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="flex items-center gap-0.5 rounded-[3px] border border-black/60 bg-[#160404] px-2 py-1 shadow-[inset_0_2px_6px_rgba(0,0,0,0.9)]"
        role="status"
        aria-label={label ? `${label}: ${text}` : text}
      >
        {chars.slice(-3).map((c, i) => (
          <Digit key={i} char={c.char} dot={c.dot} />
        ))}
      </div>
      {label && (
        <span className="max-w-[9rem] truncate text-[9px] font-semibold uppercase tracking-widest text-white/55">
          {label}
        </span>
      )}
    </div>
  );
}
