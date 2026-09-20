import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMatches } from "@/hooks/useMatches";
import { MatchCard } from "@/components/MatchCard";
import {
  SPORT_META,
  initials,
  overs,
  scoreLine,
  type Match,
} from "@/lib/matches";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LocalScore — Live local match dashboard" },
      {
        name: "description",
        content:
          "Live, upcoming and completed local Cricket, Kabaddi and Football matches, scored by hand on your device.",
      },
      { property: "og:title", content: "LocalScore — Live local match dashboard" },
      {
        property: "og:description",
        content: "Score local Cricket, Kabaddi and Football matches by hand.",
      },
    ],
  }),
  component: Dashboard,
});

type Tab = "live" | "upcoming" | "completed";

function Dashboard() {
  const { matches, ready } = useMatches();
  const [tab, setTab] = useState<Tab>("live");

  const groups = useMemo(() => {
    return {
      live: matches.filter((m) => m.status === "live" || m.status === "paused"),
      upcoming: matches.filter((m) => m.status === "upcoming"),
      completed: matches.filter((m) => m.status === "completed"),
    };
  }, [matches]);

  const featured = groups.live[0];
  const list = groups[tab];

  return (
    <div className="min-h-screen w-full bg-night text-ink">
      <div className="mx-auto w-full max-w-[880px] pb-10">
        <header className="flex items-center justify-between px-5 pt-6 pb-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="size-9 shrink-0 rounded-xl bg-gradient-to-br from-gold to-crim grid place-items-center">
              <span className="font-display text-night text-lg">LS</span>
            </div>
            <div className="leading-none">
              <div className="font-bold text-[15px] tracking-tight">LocalScore</div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-mist mt-1">
                Match tracker
              </div>
            </div>
          </div>
          <Link
            to="/history"
            className="h-10 shrink-0 rounded-full border border-white/10 bg-panel grid place-items-center px-4 text-mist text-[12px] font-semibold"
          >
            History
          </Link>
        </header>

        <section className="px-5 pt-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-crim/10 border border-crim/25 px-3 py-1.5">
            <span className="size-1.5 rounded-full bg-crim" />
            <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-crim">
              {groups.live.length > 0
                ? `Live now · ${groups.live.length} match${groups.live.length > 1 ? "es" : ""}`
                : "No match running"}
            </span>
          </div>
          <h1 className="font-display mt-4 text-[46px] leading-[0.94] tracking-tight bg-gradient-to-r from-gold via-lime to-teal bg-clip-text text-transparent">
            Tonight's
            <br />
            match is
            <br />
            on
          </h1>
          <p className="mt-3 text-[13px] text-mist leading-relaxed max-w-[280px]">
            Track Cricket, Kabaddi and Football by hand — no internet, no feeds, just
            the score.
          </p>
          <Link
            to="/new"
            className="mt-5 w-full rounded-2xl bg-gradient-to-r from-gold to-lime text-night font-bold text-[15px] py-4 flex items-center justify-center gap-2"
          >
            <span className="text-lg leading-none">＋</span> Create new match
          </Link>
        </section>

        <nav className="flex gap-2 px-5 mt-6 overflow-x-auto no-scrollbar">
          {(["live", "upcoming", "completed"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`shrink-0 rounded-full px-4 py-2.5 text-[13px] capitalize ${
                tab === t
                  ? "bg-gold text-night font-bold"
                  : "bg-panel text-mist font-semibold"
              }`}
            >
              {t} · {groups[t].length}
            </button>
          ))}
        </nav>

        {featured ? (
          <section className="px-5 mt-4">
            <FeaturedMatch match={featured} />
          </section>
        ) : null}

        <section className="px-5 mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[13px] uppercase tracking-[0.16em] font-bold text-ink capitalize">
              {tab}
            </h2>
            <span className="text-[11px] text-mist">{list.length} matches</span>
          </div>
          {!ready ? null : list.length === 0 ? (
            <div className="rounded-2xl border border-white/6 bg-panel p-6 text-center">
              <p className="text-[13px] text-mist">Nothing here yet.</p>
              <Link to="/new" className="mt-2 inline-block text-[12px] font-bold text-gold">
                Create a match
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5 sm:grid sm:grid-cols-2 sm:gap-2.5 sm:space-y-0">
              {list.map((m) => (
                <MatchCard key={m.id} match={m} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function FeaturedMatch({ match }: { match: Match }) {
  const meta = SPORT_META[match.sport];
  const last = match.events[match.events.length - 1];

  return (
    <div className="rounded-3xl bg-gradient-to-br from-panel2 to-panel border border-white/8 p-5 shadow-[0_20px_60px_-30px_#000]">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[10px] uppercase tracking-[0.18em] text-mist font-semibold">
          {meta.label} {match.status === "paused" ? "· Paused" : "· Live"}
        </span>
        <span className="truncate text-[10px] uppercase tracking-[0.18em] text-gold font-semibold">
          {match.venue ? `Venue: ${match.venue}` : "Venue TBD"}
        </span>
      </div>
      <div className="flex items-center justify-between mt-4">
        <TeamBadge name={match.teamA.name} tone="crim" />
        <div className="px-3 text-center">
          <div className="font-display text-[34px] leading-none tracking-tight">
            {scoreLine(match, "a")}
            <span className="text-mist text-[20px]"> – </span>
            <span className="text-gold">{scoreLine(match, "b")}</span>
          </div>
          <div className="text-[11px] text-mist mt-1">
            {match.sport === "cricket"
              ? `${overs(match, "a")} / ${overs(match, "b")} overs`
              : `${match.events.length} entries`}
          </div>
        </div>
        <TeamBadge name={match.teamB.name} tone="teal" />
      </div>

      <div className="mt-5 rounded-2xl bg-night/60 border border-white/5 p-3">
        <div className="text-[10px] uppercase tracking-[0.16em] text-mist font-semibold mb-2">
          Last action
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-crim">
            {last ? last.label : "No actions yet"}
          </span>
          {last ? (
            <span className="text-[11px] text-mist">
              · {last.team === "a" ? match.teamA.name : match.teamB.name}
            </span>
          ) : null}
        </div>
      </div>

      <Link
        to="/match/$id"
        params={{ id: match.id }}
        className="mt-4 block w-full rounded-2xl bg-teal text-night font-bold text-[15px] py-4 text-center"
      >
        Open scorekeeper
      </Link>
    </div>
  );
}

function TeamBadge({ name, tone }: { name: string; tone: "crim" | "teal" }) {
  const cls =
    tone === "crim"
      ? "from-crim/30 to-crim/5 border-crim/30"
      : "from-teal/30 to-teal/5 border-teal/30";
  return (
    <div className="flex-1 min-w-0 text-center">
      <div
        className={`size-12 rounded-full bg-gradient-to-br border grid place-items-center mx-auto ${cls}`}
      >
        <span className="font-display text-[15px]">{initials(name)}</span>
      </div>
      <div className="text-[12px] font-bold mt-2 truncate px-1">{name}</div>
    </div>
  );
}
