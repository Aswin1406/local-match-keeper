import { createFileRoute, Link } from "@tanstack/react-router";
import { useMatches } from "@/hooks/useMatches";
import { MatchCard } from "@/components/MatchCard";
import { resultText } from "@/lib/matches";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Match history — LocalScore" },
      {
        name: "description",
        content: "Every local match you have scored, with final results and scorecards.",
      },
      { property: "og:title", content: "Match history — LocalScore" },
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

  return (
    <div className="min-h-screen w-full bg-night text-ink">
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

        <div className="mt-6 space-y-2.5 sm:grid sm:grid-cols-2 sm:gap-2.5 sm:space-y-0">
          {done.length === 0 ? (
            <div className="rounded-2xl border border-white/6 bg-panel p-6 text-center text-[13px] text-mist">
              No completed matches yet.
            </div>
          ) : (
            done.map((m) => (
              <div key={m.id} className="space-y-1">
                <MatchCard match={m} />
                <p className="px-2 text-[11px] text-mist">{resultText(m)}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
