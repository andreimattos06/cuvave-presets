import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { UserMenu } from "@/components/site/user-menu";
import { GlobalSearch } from "@/components/site/global-search";
import { Button } from "@/components/ui/button";
import { Guitar, SlidersHorizontal, UploadCloud } from "lucide-react";

export async function Header() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-heading text-lg font-semibold tracking-tight"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Guitar className="size-4" />
          </span>
          <span className="text-gradient">M-Vave Presets</span>
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">
          <Button variant="ghost" render={<Link href="/bandas">Bandas</Link>} />
          <Button
            variant="ghost"
            render={
              <Link href="/pedaleira">
                <SlidersHorizontal className="size-4" />
                Pedaleira
              </Link>
            }
          />
          <Button
            variant="ghost"
            render={
              <Link href="/enviar">
                <UploadCloud className="size-4" />
                Enviar preset
              </Link>
            }
          />
        </nav>

        <div className="flex items-center gap-2">
          <GlobalSearch />
          {user ? (
            <UserMenu
              username={user.profile.username}
              avatarUrl={user.profile.avatar_url}
            />
          ) : (
            <>
              <Button
                variant="ghost"
                className="hidden sm:inline-flex"
                render={<Link href="/login">Entrar</Link>}
              />
              <Button
                className="glow-violet"
                render={<Link href="/signup">Criar conta</Link>}
              />
            </>
          )}
        </div>
      </div>
    </header>
  );
}
