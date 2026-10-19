import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
    head: () => ({
        meta: [
            { title: "Sign in — Game Pulse" },
            { name: "description", content: "Sign in to Game Pulse to save your matches to your account and open them on any device." },
            { property: "og:title", content: "Sign in — Game Pulse" },
            { property: "og:description", content: "Save your local match scores to your Game Pulse account." },
            { property: "og:type", content: "website" },
            { name: "twitter:card", content: "summary" },
        ],
    }),
    component: AuthPage,
});

const input = "w-full min-h-12 rounded-xl border border-border bg-panel2 px-4 text-ink placeholder:text-mist focus:outline-none focus:ring-2 focus:ring-gold";

function AuthPage() {
    const navigate = useNavigate();
    const [mode, setMode] = useState("signin");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState(null);

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            if (data.user)
                navigate({ to: "/", replace: true });
        });
        const { data } = supabase.auth.onAuthStateChange((event) => {
            if (event === "SIGNED_IN")
                navigate({ to: "/", replace: true });
        });
        return () => data.subscription.unsubscribe();
    }, [navigate]);

    async function submit(e) {
        e.preventDefault();
        setMsg(null);
        setBusy(true);
        try {
            if (mode === "signup") {
                if (!name.trim())
                    throw new Error("Please enter your name.");
                const { data, error } = await supabase.auth.signUp({
                    email, password,
                    options: { emailRedirectTo: window.location.origin, data: { display_name: name.trim() } },
                });
                if (error)
                    throw error;
                if (!data.session)
                    setMsg({ ok: true, text: "Check your email and tap the link to confirm your account." });
            }
            else if (mode === "forgot") {
                const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
                if (error)
                    throw error;
                setMsg({ ok: true, text: "If that email has an account, a reset link is on its way." });
            }
            else {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error)
                    throw error;
            }
        }
        catch (err) {
            setMsg({ ok: false, text: err.message || "Something went wrong." });
        }
        finally {
            setBusy(false);
        }
    }

    async function google() {
        setMsg(null);
        const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
        if (result.error)
            setMsg({ ok: false, text: result.error.message || "Google sign-in failed." });
    }

    const title = mode === "signup" ? "Create your account" : mode === "forgot" ? "Reset password" : "Welcome back";
    return (<div className="min-h-screen w-full bg-night text-ink grid place-items-center px-5 py-10">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-6 flex items-center gap-2.5">
          <div className="size-9 rounded-xl bg-gradient-to-br from-gold to-crim grid place-items-center">
            <span className="font-display text-night text-lg">GP</span>
          </div>
          <span className="font-bold tracking-tight">Game Pulse</span>
        </Link>
        <div className="rounded-2xl border border-border bg-panel p-6 shadow-xl">
          <h1 className="font-display text-3xl tracking-wide">{title}</h1>
          <p className="mt-1 text-sm text-mist">Save your matches to your account and open them on any device.</p>

          {mode !== "forgot" && (<>
              <button type="button" onClick={google} className="mt-5 flex w-full min-h-12 items-center justify-center gap-2 rounded-xl border border-border bg-panel2 font-semibold hover:bg-accent">
                <span className="font-bold text-gold">G</span> Continue with Google
              </button>
              <div className="my-4 flex items-center gap-3 text-xs text-mist"><span className="h-px flex-1 bg-border"/>or<span className="h-px flex-1 bg-border"/></div>
            </>)}

          <form onSubmit={submit} className="space-y-3">
            {mode === "signup" && (<input className={input} placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name"/>)}
            <input className={input} type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email"/>
            {mode !== "forgot" && (<input className={input} type="password" required minLength={6} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "signup" ? "new-password" : "current-password"}/>)}
            <button type="submit" disabled={busy} className="w-full min-h-12 rounded-xl bg-gold font-bold text-night disabled:opacity-60">
              {busy ? "Please wait…" : mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Sign in"}
            </button>
          </form>

          {msg && <p className={`mt-3 text-sm ${msg.ok ? "text-teal" : "text-crim"}`}>{msg.text}</p>}

          <div className="mt-5 flex flex-col gap-2 text-sm text-mist">
            {mode === "signin" && (<>
                <button type="button" onClick={() => setMode("forgot")} className="text-left hover:text-ink">Forgot password?</button>
                <button type="button" onClick={() => setMode("signup")} className="text-left hover:text-ink">New here? <span className="text-gold">Create an account</span></button>
              </>)}
            {mode !== "signin" && (<button type="button" onClick={() => setMode("signin")} className="text-left hover:text-ink">Have an account? <span className="text-gold">Sign in</span></button>)}
          </div>
        </div>
        <Link to="/" className="mt-4 block text-center text-sm text-mist hover:text-ink">Continue as guest — matches stay on this device</Link>
      </div>
    </div>);
}
