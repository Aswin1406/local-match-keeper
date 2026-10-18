import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { useMatches } from "@/hooks/useMatches";
import { MatchCard } from "@/components/MatchCard";
import { loadMatches, resultText, saveMatches, SPORT_META } from "@/lib/matches";
import { careerStats } from "@/lib/playerStats";
import { PlayerStatsTable } from "@/components/PlayerStatsTable";

function exportMatches() {
    const data = JSON.stringify(loadMatches(), null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `game-pulse-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function isValidMatch(m) {
    return (m && typeof m.id === "string" && typeof m.sport === "string" &&
        m.teamA && m.teamB && Array.isArray(m.events));
}

/** Merge imported matches into stored ones; existing ids are kept (not overwritten). Returns counts. */
function importMatches(list) {
    if (!Array.isArray(list))
        return null;
    const valid = list.filter(isValidMatch);
    if (valid.length === 0)
        return null;
    const existing = loadMatches();
    const ids = new Set(existing.map((m) => m.id));
    const added = valid.filter((m) => !ids.has(m.id));
    saveMatches([...added, ...existing]);
    return { added: added.length, skipped: valid.length - added.length };
}
export const Route = createFileRoute("/history")({
    head: () => ({
        meta: [
            { title: "Match history — Game Pulse" },
            {
                name: "description",
                content: "Every local match you have scored, with final results and scorecards.",
            },
            { property: "og:title", content: "Match history — Game Pulse" },
            { property: "og:type", content: "website" },
            { name: "twitter:card", content: "summary_large_image" },
            {
                property: "og:description",
                content: "Every local match you have scored, with final results.",
            },
        ],
    }),
    component: History,
});
function History() {
    const { matches } = useMatches();
    const done = matches.filter((m) => m.status === "completed");
    const career = careerStats(done);
    const fileRef = useRef(null);
    const [notice, setNotice] = useState("");
    const onImportFile = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file)
            return;
        try {
            const parsed = JSON.parse(await file.text());
            const result = importMatches(parsed);
            if (!result)
                setNotice("That file doesn't look like a Game Pulse backup.");
            else
                setNotice(result.added > 0
                    ? `Restored ${result.added} match${result.added === 1 ? "" : "es"}${result.skipped ? ` (${result.skipped} already here)` : ""}.`
                    : "All matches in that file are already on this device.");
        }
        catch {
            setNotice("Couldn't read that file — please choose a Game Pulse backup (.json).");
        }
    };
    return (<div className="min-h-screen w-full bg-night text-ink">
      <div className="mx-auto w-full max-w-[880px] px-5 pt-6 pb-12">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-[12px] font-bold text-gold">
            ← Dashboard
          </Link>
          <span className="text-[11px] text-mist">{done.length} finished</span>
        </div>
        <h1 className="font-display mt-4 text-[38px] leading-[0.95] tracking-tight">
          Match history
        </h1>
        <p className="mt-2 text-[13px] text-mist">Saved on this device.</p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button onClick={exportMatches} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-gold px-4 text-[13px] font-bold text-night transition-opacity hover:opacity-90">
            <Download className="size-4" aria-hidden="true"/> Export backup
          </button>
          <button onClick={() => fileRef.current?.click()} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-panel px-4 text-[13px] font-bold text-ink transition-colors hover:bg-panel2">
            <Upload className="size-4" aria-hidden="true"/> Import backup
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={onImportFile}/>
          {notice && <p className="w-full text-[12px] text-mist">{notice}</p>}
        </div>

        <div className="mt-6 space-y-2.5 sm:grid sm:grid-cols-2 sm:gap-2.5 sm:space-y-0">
          {done.length === 0 ? (<div className="rounded-2xl border border-white/6 bg-panel p-6 text-center text-[13px] text-mist">
              No completed matches yet.
            </div>) : (done.map((m) => (<div key={m.id} className="space-y-1">
                <MatchCard match={m}/>
                <p className="px-2 text-[11px] text-mist">{resultText(m)}</p>
              </div>)))}
        </div>

        {["cricket", "kabaddi", "football"].map((sport) => {
            const stats = career.filter((s) => s.sport === sport);
            if (stats.length === 0)
                return null;
            return (<section key={sport} className="mt-8 rounded-2xl border border-white/6 bg-panel p-4">
              <h2 className="font-display text-[20px]">
                {SPORT_META[sport].icon} {SPORT_META[sport].label} player stats
              </h2>
              <p className="mb-2 text-[11px] text-mist">Totals across finished matches.</p>
              <PlayerStatsTable stats={stats} sport={sport} showApps showTeam/>
            </section>);
        })}
      </div>
    </div>);
}
