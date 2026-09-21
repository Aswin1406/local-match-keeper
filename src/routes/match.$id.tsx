import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMatches } from "@/hooks/useMatches";
import {
  ACTIONS,
  SPORT_META,
  currentHalf,
  deleteMatch,
  hasHalves,
  initials,
  newId,
  overs,
  resultText,
  score,
  scoreLine,
  upsertMatch,
  wickets,
  type Match,
} from "@/lib/matches";

export const Route = createFileRoute("/match/$id")({
  head: () => ({
    meta: [
      { title: "Scorekeeper — LocalScore" },
      {
        name: "description",
        content: "Keep score live with big touch buttons, pause, resume and undo.",
      },
      { property: "og:title", content: "Scorekeeper — LocalScore" },
      {
        property: "og:description",
        content: "Keep score live with big touch buttons, pause, resume and undo.",
      },
    ],
  }),
  component: MatchPage,
});

const toneCls = {
  teal: "bg-teal text-night",
  gold: "bg-gold text-night",
  crim: "bg-crim text-ink",
  panel: "bg-panel2 border border-white/10 text-ink",
} as const;

function MatchPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { matches, ready } = useMatches();
  const match = matches.find((m) => m.id === id);
  const [team, setTeam] = useState<"a" | "b">("a");

  if (!ready) return <div className="min-h-screen bg-night" />;

  if (!match) {
    return (
      <div className="min-h-screen bg-night text-ink grid place-items-center px-5">
        <div className="text-center">
          <p className="text-[14px] text-mist">This match isn't on this device.</p>
          <Link to="/" className="mt-3 inline-block text-[13px] font-bold text-gold">
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const meta = SPORT_META[match.sport];
  const done = match.status === "completed";
  const activeTeam = team === "a" ? match.teamA : match.teamB;

  function update(patch: Partial<Match>) {
    upsertMatch({ ...match!, ...patch });
  }

  function addEvent(label: string, points: number, wicket?: boolean, ball?: boolean) {
    update({
      status: match!.status === "upcoming" ? "live" : match!.status,
      events: [
        ...match!.events,
        { id: newId(), team, label, points, wicket, ball, ts: Date.now() },
      ],
    });
  }

  function undo() {
    update({ events: match!.events.slice(0, -1) });
  }

  return (
    <div className="min-h-screen w-full bg-night text-ink">
      <div className="mx-auto w-full max-w-[880px] px-5 pt-6 pb-12">
        <div className="flex items-center justify-between gap-3">
          <Link to="/" className="text-[12px] font-bold text-gold shrink-0">
            ← Dashboard
          </Link>
          <span className="truncate text-[10px] uppercase tracking-[0.18em] text-mist font-semibold">
            {meta.label} · {match.venue || "Venue TBD"}
          </span>
        </div>

        {/* Score slab */}
        <div className="mt-4 rounded-3xl bg-gradient-to-br from-panel2 to-panel border border-white/8 p-5 shadow-[0_20px_60px_-30px_#000]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-[0.18em] text-mist font-semibold">
              {done
                ? "Full time"
                : match.status === "paused"
                  ? "Paused"
                  : hasHalves(match.sport)
                    ? `Half ${currentHalf(match)} · Live`
                    : "Live"}
            </span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-gold font-semibold">
              {match.date ? new Date(match.date).toLocaleString() : "No date"}
            </span>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <Side name={match.teamA.name} tone="crim" line={scoreLine(match, "a")} />
            <div className="font-display text-[22px] text-mist px-2">v</div>
            <Side name={match.teamB.name} tone="teal" line={scoreLine(match, "b")} />
          </div>
          {match.sport === "cricket" ? (
            <div className="mt-3 text-center text-[11px] text-mist">
              {overs(match, "a")} overs · {overs(match, "b")} overs
            </div>
          ) : null}
        </div>

        {done ? (
          <Scorecard match={match} />
        ) : (
          <>
            {/* Team selector */}
            <div className="mt-5">
              <p className="text-[10px] uppercase tracking-[0.18em] text-mist font-semibold">
                Scoring for
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(["a", "b"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTeam(t)}
                    className={`rounded-2xl py-4 text-[14px] font-bold truncate px-2 ${
                      team === t
                        ? "bg-gold/15 border border-gold/50 text-gold"
                        : "bg-panel border border-white/8 text-mist"
                    }`}
                  >
                    {t === "a" ? match.teamA.name : match.teamB.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Action pad */}
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              {ACTIONS[match.sport].map((a) => (
                <button
                  key={a.label}
                  disabled={match.status === "paused"}
                  onClick={() => addEvent(a.label, a.points, a.wicket, a.ball)}
                  className={`rounded-2xl py-6 font-bold text-[16px] disabled:opacity-40 ${toneCls[a.tone]}`}
                >
                  {a.label}
                </button>
              ))}
            </div>

            <div className="mt-3 flex items-center gap-2.5">
              {hasHalves(match.sport) ? (
                <button
                  onClick={() =>
                    update({
                      half: currentHalf(match) === 1 ? 2 : 1,
                      events: [
                        ...match.events,
                        {
                          id: newId(),
                          team,
                          label: currentHalf(match) === 1 ? "2nd half started" : "Back to 1st half",
                          points: 0,
                          ts: Date.now(),
                        },
                      ],
                    })
                  }
                  className="flex-1 rounded-xl bg-panel2 border border-teal/30 text-teal font-semibold text-[13px] py-3"
                >
                  {currentHalf(match) === 1 ? "▶ Half 2" : "◀ Half 1"}
                </button>
              ) : null}
              <button
                onClick={() =>
                  update({ status: match.status === "paused" ? "live" : "paused" })
                }
                className="flex-1 rounded-xl bg-panel2 border border-white/10 text-mist font-semibold text-[13px] py-3"
              >
                {match.status === "paused" ? "↺ Resume" : "⏸ Pause"}
              </button>
              <button
                onClick={undo}
                disabled={match.events.length === 0}
                className="flex-1 rounded-xl bg-panel2 border border-white/10 text-mist font-semibold text-[13px] py-3 disabled:opacity-40"
              >
                ↩ Undo
              </button>
              <button
                onClick={() => update({ status: "completed" })}
                className="flex-1 rounded-xl bg-panel2 border border-white/10 text-mist font-semibold text-[13px] py-3"
              >
                ✓ Finish
              </button>
            </div>

            {/* Players */}
            {activeTeam.players.length > 0 ? (
              <div className="mt-5 rounded-2xl bg-panel border border-white/6 p-4">
                <p className="text-[10px] uppercase tracking-[0.16em] text-mist font-semibold">
                  {activeTeam.name} squad
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {activeTeam.players.map((p) => (
                    <span
                      key={p}
                      className="rounded-full bg-panel2 border border-white/8 px-3 py-1 text-[11px] text-ink"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Timeline */}
            <div className="mt-5">
              <p className="text-[10px] uppercase tracking-[0.16em] text-mist font-semibold mb-2">
                Timeline
              </p>
              <Timeline match={match} />
            </div>
          </>
        )}

        <div className="mt-6 flex gap-2.5">
          {done ? (
            <button
              onClick={() => update({ status: "live" })}
              className="flex-1 rounded-xl bg-panel2 border border-white/10 text-mist font-semibold text-[13px] py-3"
            >
              Reopen match
            </button>
          ) : null}
          <button
            onClick={() => {
              deleteMatch(match.id);
              navigate({ to: "/" });
            }}
            className="flex-1 rounded-xl bg-panel2 border border-crim/30 text-crim font-semibold text-[13px] py-3"
          >
            Delete match
          </button>
        </div>
      </div>
    </div>
  );
}

function Side({ name, line, tone }: { name: string; line: string; tone: "crim" | "teal" }) {
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
      <div className="font-display text-[40px] leading-none mt-1">{line}</div>
    </div>
  );
}

function Timeline({ match }: { match: Match }) {
  const events = [...match.events].reverse().slice(0, 12);
  if (events.length === 0)
    return (
      <div className="rounded-2xl bg-panel border border-white/6 p-4 text-[12px] text-mist">
        No actions recorded yet.
      </div>
    );
  return (
    <div className="rounded-2xl bg-panel border border-white/6 divide-y divide-white/5">
      {events.map((e) => (
        <div key={e.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
          <span className="text-[12px] font-bold truncate">{e.label}</span>
          <span className="text-[11px] text-mist truncate">
            {e.team === "a" ? match.teamA.name : match.teamB.name}
          </span>
        </div>
      ))}
    </div>
  );
}

function Scorecard({ match }: { match: Match }) {
  return (
    <div className="mt-5 space-y-3">
      <div className="rounded-2xl bg-gold/10 border border-gold/25 p-4 text-center">
        <p className="text-[10px] uppercase tracking-[0.18em] text-gold font-semibold">
          Result
        </p>
        <p className="font-display text-[24px] mt-1">{resultText(match)}</p>
      </div>
      {(["a", "b"] as const).map((t) => {
        const team = t === "a" ? match.teamA : match.teamB;
        return (
          <div key={t} className="rounded-2xl bg-panel border border-white/6 p-4">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-bold truncate">{team.name}</span>
              <span className="font-display text-[22px]">{scoreLine(match, t)}</span>
            </div>
            <p className="mt-1 text-[11px] text-mist">
              {match.sport === "cricket"
                ? `${score(match, t)} runs · ${wickets(match, t)} wickets · ${overs(match, t)} overs`
                : `${score(match, t)} ${SPORT_META[match.sport].unit}`}
            </p>
            {team.players.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {team.players.map((p) => (
                  <span
                    key={p}
                    className="rounded-full bg-panel2 border border-white/8 px-3 py-1 text-[11px]"
                  >
                    {p}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
      <Timeline match={match} />
    </div>
  );
}
