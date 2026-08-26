import Link from "next/link";
import { listMostViewedUploads, listPedalModels } from "@/lib/data/catalog";
import { HeroPedal } from "@/components/site/hero-pedal";
import { DEMO_MODELS } from "@/components/pedalboard/demo-models";
import { Button } from "@/components/ui/button";
import { SearchForm } from "@/components/catalog/search-form";
import { MostViewedList } from "@/components/catalog/most-viewed-list";
import { Guitar, Layers, ThumbsUp, Sparkles, Flame } from "lucide-react";

const HERO_MODEL_SLUG = "tank-g";

export default async function Home() {
  // O catálogo vem do banco; sem seed aplicado, a home ainda demonstra o produto.
  const [models, mostViewed] = await Promise.all([
    listPedalModels().catch(() => []),
    listMostViewedUploads(5).catch(() => []),
  ]);
  // A Tank-G é a pedaleira da vitrine: painel completo, com display e 4 pedais.
  const heroModel =
    models.find((m) => m.slug === HERO_MODEL_SLUG) ??
    DEMO_MODELS.find((m) => m.slug === HERO_MODEL_SLUG) ??
    DEMO_MODELS[0];

  return (
    <div className="flex flex-1 flex-col">
      <section className="relative overflow-hidden px-4 pb-16 pt-16 sm:px-6">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 left-1/2 h-[28rem] w-[52rem] -translate-x-1/2 rounded-full bg-primary/20 blur-[140px]"
        />

        <div className="relative mx-auto max-w-5xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="size-3 text-accent" />
            Presets de pedaleira M-Vave, feitos pela comunidade
          </span>

          <h1 className="mt-6 font-heading text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
            O timbre certo da música,{" "}
            <span className="text-gradient">ajuste por ajuste</span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Encontre como outros guitarristas configuraram a pedaleira para cada
            música — faixa por faixa, trecho por trecho — numa réplica da pedaleira
            que você pode girar com o mouse.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button
              size="lg"
              className="glow-violet"
              render={<Link href="/bandas">Explorar bandas</Link>}
            />
            <Button
              size="lg"
              variant="outline"
              render={<Link href="/enviar">Enviar meus presets</Link>}
            />
          </div>

          <div className="mt-8 flex justify-center">
            <SearchForm
              action="/busca"
              placeholder="Buscar por música ou artista…"
            />
          </div>

          {mostViewed.length > 0 && (
            <div className="mx-auto mt-8 max-w-lg">
              <h2 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                <Flame className="size-3.5 text-accent" />
                Presets mais vistos
              </h2>
              <MostViewedList uploads={mostViewed} />
            </div>
          )}
        </div>

        {/* a própria pedaleira como demonstração */}
        <div className="relative mx-auto mt-14 max-w-5xl">
          <p className="mb-3 text-center text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Experimente — arraste os knobs, pise nos footswitches
          </p>
          <HeroPedal model={heroModel} />
        </div>
      </section>

      <section className="border-t border-white/[0.06] px-4 py-16 sm:px-6">
        <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-3">
          <Feature
            icon={<Layers className="size-5" />}
            title="Instrumento por instrumento"
            text="Guitarra principal, ritmo, baixo — até 10 por envio, cada um com a sua pedaleira."
          />
          <Feature
            icon={<Guitar className="size-5" />}
            title="Até 8 presets por instrumento"
            text="Limpo no verso, drive no refrão, solo na ponte: o mesmo esquema que você pisa no palco."
          />
          <Feature
            icon={<ThumbsUp className="size-5" />}
            title="A comunidade decide"
            text="Vários envios para a mesma música, ordenados pela aprovação de quem já tocou."
          />
        </div>
      </section>
    </div>
  );
}

function Feature({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="glass rounded-xl p-5">
      <span className="flex size-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
        {icon}
      </span>
      <h3 className="mt-4 font-medium">{title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
