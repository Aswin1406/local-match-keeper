import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { initials } from "@/lib/matches";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu";

const base = "grid size-11 place-items-center rounded-full border border-border bg-panel text-ink shadow-lg transition-colors hover:bg-panel2";

export function AccountButton() {
    const { user, displayName, ready } = useAuth();
    const navigate = useNavigate();
    if (!ready || !user) {
        return (<Link to="/auth" className={base} aria-label="Sign in" title="Sign in">
        <User aria-hidden="true" className="size-5"/>
      </Link>);
    }
    async function signOut() {
        await supabase.auth.signOut();
        navigate({ to: "/auth", replace: true });
    }
    return (<DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className={`${base} bg-gradient-to-br from-gold to-crim font-bold text-night`} aria-label="Account menu">
          {initials(displayName || "U") || "U"}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="font-semibold">{displayName}</div>
          <div className="truncate text-xs font-normal text-muted-foreground">{user.email}</div>
          <div className="mt-1 text-[11px] font-normal text-muted-foreground">Matches sync to your account</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={signOut}>
          <LogOut className="mr-2 size-4"/> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>);
}
