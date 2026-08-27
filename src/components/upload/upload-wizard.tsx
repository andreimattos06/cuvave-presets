"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  useUploadWizard,
  type WizardSeed,
  type WizardTrack,
} from "@/lib/store/upload-wizard";
import { submitUpload, updateUpload } from "@/actions/uploads";
import { StepSong } from "./step-song";
import { StepTracks } from "./step-tracks";
import { StepPresets } from "./step-presets";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PedalModel } from "@/types/pedal";
import { Check, ChevronLeft, ChevronRight, Loader2, Send } from "lucide-react";

type Band = { id: string; name: string; slug: string };

const STEPS = [
  { title: "Música", hint: "Escolha a banda e a música" },
  { title: "Instrumentos", hint: "Nome do envio e pedaleiras" },
  { title: "Presets", hint: "Ajuste ou importe o .tkg" },
  { title: "Revisão", hint: "Confira e envie" },
];

export function UploadWizard({
  bands,
  models,
  preselectedSong,
  seed,
}: {
  bands: Band[];
  models: PedalModel[];
  preselectedSong?: { id: string; title: string; band: { id: string; name: string } };
  /** Presente quando o wizard abre para editar um envio que já existe. */
  seed?: WizardSeed;
}) {
  const store = useUploadWizard();
  const {
    step,
    setStep,
    tracks,
    songId,
    songTitle,
    bandName,
    title,
    note,
    editingUploadId,
    reset,
  } = store;
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // Entrando por "Enviar meus presets" na página da música, já vem escolhida.
  // O store é global e não persiste, então a semente só pode vir depois da
  // montagem no cliente (mutá-lo durante o SSR vazaria entre requisições).
  useEffect(() => {
    if (seed) {
      store.hydrate(seed);
      return;
    }
    if (preselectedSong && !songId) {
      store.setBand(preselectedSong.band);
      store.setSong({ id: preselectedSong.id, title: preselectedSong.title });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canAdvance = [
    Boolean(songId),
    title.trim().length >= 3 &&
      tracks.length > 0 &&
      tracks.every((t) => t.name.trim()),
    tracks.every((t) => t.presets.length > 0 && t.presets.every((p) => p.name.trim())),
    true,
  ][step];

  const editing = Boolean(editingUploadId);

  function submit() {
    startTransition(async () => {
      const payload = {
        songId,
        title: title.trim(),
        note: note.trim() || undefined,
        tracks: tracks.map((t) => ({
          name: t.name.trim(),
          // A principal é a primeira da lista — é ela que vai para a faixa.
          pedalModelId: t.pedalModelIds[0],
          presets: t.presets.map((p) => ({
            name: p.name.trim(),
            boards: p.boards.map((b) => ({
              pedalModelId: b.pedalModelId,
              settings: b.settings,
            })),
          })),
        })),
      };

      const result = editing
        ? await updateUpload(editingUploadId, payload)
        : await submitUpload(payload);

      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(
        editing ? "Envio atualizado." : "Presets enviados! Obrigado por contribuir.",
      );
      reset();
      router.push(result.redirectTo);
    });
  }

  return (
    <div>
      {/* trilha de progresso */}
      <ol className="flex flex-wrap gap-2">
        {STEPS.map((s, i) => {
          const done = i < step;
          const current = i === step;
          return (
            <li key={s.title} className="flex-1 min-w-[8rem]">
              <button
                type="button"
                onClick={() => i <= step && setStep(i)}
                disabled={i > step}
                className={cn(
                  "w-full rounded-lg border px-3 py-2 text-left transition-colors",
                  current && "border-primary/50 bg-primary/10",
                  done && "border-white/10 bg-white/[0.03]",
                  !current && !done && "border-white/[0.06] opacity-50",
                )}
              >
                <span className="flex items-center gap-1.5 text-xs font-semibold">
                  {done ? (
                    <Check className="size-3.5 text-neon-green" />
                  ) : (
                    <span className="font-mono">{i + 1}</span>
                  )}
                  {s.title}
                </span>
                <span className="mt-0.5 block text-[11px] text-muted-foreground">
                  {s.hint}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="mt-8 min-h-[24rem]">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.18 }}
          >
            {step === 0 && <StepSong bands={bands} />}
            {step === 1 && <StepTracks models={models} />}
            {step === 2 && <StepPresets models={models} />}
            {step === 3 && (
              <ReviewStep
                bandName={bandName}
                songTitle={songTitle}
                title={title}
                note={note}
                tracks={tracks}
                models={models}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-8 flex items-center justify-between border-t border-white/[0.08] pt-5">
        <Button
          variant="ghost"
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0 || pending}
        >
          <ChevronLeft className="size-4" />
          Voltar
        </Button>

        {step < STEPS.length - 1 ? (
          <Button onClick={() => setStep(step + 1)} disabled={!canAdvance}>
            Continuar
            <ChevronRight className="size-4" />
          </Button>
        ) : (
          <Button className="glow-violet" onClick={submit} disabled={pending}>
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            {editing ? "Salvar alterações" : "Enviar presets"}
          </Button>
        )}
      </div>
    </div>
  );
}

function ReviewStep({
  bandName,
  songTitle,
  title,
  note,
  tracks,
  models,
}: {
  bandName: string;
  songTitle: string;
  title: string;
  note: string;
  tracks: WizardTrack[];
  models: PedalModel[];
}) {
  const totalPresets = tracks.reduce((sum, t) => sum + t.presets.length, 0);

  return (
    <div className="space-y-5">
      <div className="glass rounded-xl p-5">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          {bandName}
        </p>
        <h2 className="mt-1 font-heading text-2xl font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{songTitle}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {tracks.length} {tracks.length === 1 ? "instrumento" : "instrumentos"} ·{" "}
          {totalPresets} {totalPresets === 1 ? "preset" : "presets"}
        </p>
        {note && (
          <p className="mt-3 border-t border-white/[0.06] pt-3 text-sm text-muted-foreground">
            {note}
          </p>
        )}
      </div>

      <ul className="space-y-3">
        {tracks.map((track) => (
          <li
            key={track.localId}
            className="rounded-xl border border-white/[0.08] p-4"
          >
            <p className="font-medium">
              {track.name}
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                {track.pedalModelIds
                  .map((id) => models.find((m) => m.id === id)?.name)
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {track.presets.map((preset, i) => (
                <li
                  key={preset.localId}
                  className="rounded-lg border border-white/10 px-3 py-1.5 text-xs"
                >
                  <span className="mr-1.5 font-mono text-muted-foreground">
                    {i + 1}
                  </span>
                  {preset.name}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
