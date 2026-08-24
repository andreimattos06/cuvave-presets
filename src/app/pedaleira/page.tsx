import type { Metadata } from "next";
import { PedalBoardDemo } from "@/components/pedalboard/pedal-board-demo";
import { DEMO_MODELS } from "@/components/pedalboard/demo-models";

export const metadata: Metadata = {
  title: "Pedaleira virtual · Cuvave Presets",
};

export default function PedaleiraPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="font-heading text-3xl font-semibold tracking-tight">
        Pedaleira virtual
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Arraste na vertical (ou role o scroll) sobre um knob para ajustar —
        segure <kbd className="rounded border border-white/15 px-1 text-xs">Shift</kbd>{" "}
        para ajuste fino e dê duplo clique para voltar ao padrão de fábrica. As
        setas do teclado também funcionam. Pise nos footswitches ou toque no nome
        do bloco serigrafado para ligar e desligar cada efeito.
      </p>
      <div className="mt-8">
        <PedalBoardDemo models={DEMO_MODELS} />
      </div>
    </div>
  );
}
