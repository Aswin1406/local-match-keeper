import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
    head: () => ({
        meta: [
            { title: "Set a new password — Game Pulse" },
            { name: "description", content: "Choose a new password for your Game Pulse account." },
            { property: "og:title", content: "Set a new password — Game Pulse" },
            { property: "og:description", content: "Choose a new password for your Game Pulse account." },
            { property: "og:type", content: "website" },
            { name: "twitter:card", content: "summary" },
        ],
    }),
    component: ResetPassword,
});

function ResetPassword() {
    const navigate = useNavigate();
    const [password, setPassword] = useState("");
    const [msg, setMsg] = useState(null);
    const [busy, setBusy] = useState(false);
    async function submit(e) {
        e.preventDefault();
        setBusy(true);
        const { error } = await supabase.auth.updateUser({ password });
        setBusy(false);
        if (error)
            setMsg(error.message);
        else
            navigate({ to: "/", replace: true });
    }
    return (<div className="min-h-screen w-full bg-night text-ink grid place-items-center px-5">
      <form onSubmit={submit} className="w-full max-w-sm space-y-3 rounded-2xl border border-border bg-panel p-6 shadow-xl">
        <h1 className="font-display text-3xl tracking-wide">New password</h1>
        <input type="password" required minLength={6} placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full min-h-12 rounded-xl border border-border bg-panel2 px-4 text-ink focus:outline-none focus:ring-2 focus:ring-gold"/>
        <button type="submit" disabled={busy} className="w-full min-h-12 rounded-xl bg-gold font-bold text-night disabled:opacity-60">
          {busy ? "Saving…" : "Save password"}
        </button>
        {msg && <p className="text-sm text-crim">{msg}</p>}
      </form>
    </div>);
}
