import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { LIMITS } from "@/lib/validations/limits";

/** Busca via navegação (funciona sem JS e mantém o termo na URL). */
export function SearchForm({
  action,
  defaultValue,
  placeholder,
}: {
  action: string;
  defaultValue?: string;
  placeholder: string;
}) {
  return (
    <form action={action} className="flex w-full max-w-md gap-2">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          name="q"
          type="search"
          defaultValue={defaultValue}
          placeholder={placeholder}
          aria-label={placeholder}
          maxLength={LIMITS.searchQueryMax}
          className="pl-9"
        />
      </div>
      <Button type="submit" variant="secondary">
        Buscar
      </Button>
    </form>
  );
}
