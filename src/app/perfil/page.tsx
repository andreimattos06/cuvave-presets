import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { listUploadsByUser } from "@/lib/data/catalog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays,
  Layers,
  SlidersHorizontal,
  ThumbsUp,
  Trophy,
  UploadCloud,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Meu perfil — Cuvave Presets",
};

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/perfil");

  const uploads = await listUploadsByUser(user.id);

  const totals = uploads.reduce(
    (acc, upload) => ({
      presets: acc.presets + upload.presetCount,
      approvals: acc.approvals + upload.approvals,
    }),
    { presets: 0, approvals: 0 },
  );

  const memberSince = new Date(user.profile.created_at).toLocaleDateString(
    "pt-BR",
    { month: "long", year: "numeric" },
  );

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
      <header className="glass flex flex-wrap items-center gap-5 rounded-2xl p-6">
        <Avatar className="size-16 border border-white/10">
          {user.profile.avatar_url && (
            <AvatarImage
              src={user.profile.avatar_url}
              alt={user.profile.username}
            />
          )}
          <AvatarFallback className="bg-primary/20 text-lg text-primary">
            {user.profile.username.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            @{user.profile.username}
          </h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <CalendarDays className="size-3.5" />
            No Cuvave Presets desde {memberSince}
          </p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>

        <Button
          className="glow-violet"
          render={
            <Link href="/enviar">
              <UploadCloud className="size-4" />
              Enviar presets
            </Link>
          }
        />
      </header>

      <section className="mt-6 grid gap-3 sm:grid-cols-3">
        <Stat
          icon={<UploadCloud className="size-4" />}
          value={uploads.length}
          label={uploads.length === 1 ? "envio" : "envios"}
        />
        <Stat
          icon={<SlidersHorizontal className="size-4" />}
          value={totals.presets}
          label={totals.presets === 1 ? "preset criado" : "presets criados"}
        />
        <Stat
          icon={<ThumbsUp className="size-4" />}
          value={totals.approvals}
          label={
            totals.approvals === 1 ? "aprovação recebida" : "aprovações recebidas"
          }
        />
      </section>

      <section className="mt-10">
        <h2 className="font-heading text-xl font-semibold">Meus envios</h2>

        {uploads.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-white/10 p-10 text-center">
            <p className="text-sm text-muted-foreground">
              Você ainda não enviou presets. Escolha uma música e mostre como
              você configura a pedaleira.
            </p>
            <Button
              className="mt-4"
              variant="secondary"
              render={<Link href="/bandas">Encontrar uma música</Link>}
            />
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {uploads.map((upload, index) => (
              <li key={upload.id}>
                <Link
                  href={
                    upload.song?.band
                      ? `/bandas/${upload.song.band.slug}/${upload.song.slug}/${upload.id}`
                      : "/bandas"
                  }
                  className="glass flex flex-wrap items-center gap-3 rounded-xl p-4 transition-colors hover:border-primary/40"
                >
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 truncate font-medium">
                      {upload.title}
                      {index === 0 && upload.score > 0 && (
                        <Badge className="gap-1 bg-primary/15 text-primary">
                          <Trophy className="size-3" />
                          Seu mais aprovado
                        </Badge>
                      )}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {upload.song?.title ?? "Música removida"} ·{" "}
                      {upload.song?.band?.name} · {upload.views}{" "}
                      {upload.views === 1 ? "visualização" : "visualizações"} ·{" "}
                      {new Date(upload.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>

                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Layers className="size-3.5" />
                    {upload.trackCount}{" "}
                    {upload.trackCount === 1 ? "instrumento" : "instrumentos"} ·{" "}
                    {upload.presetCount}{" "}
                    {upload.presetCount === 1 ? "preset" : "presets"}
                  </span>

                  <span className="flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1 font-mono text-xs">
                    <ThumbsUp className="size-3 text-neon-green" />
                    {upload.score > 0 ? `+${upload.score}` : upload.score}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div className="glass rounded-xl p-4">
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </span>
      <p className="mt-1 font-heading text-3xl font-semibold">{value}</p>
    </div>
  );
}
