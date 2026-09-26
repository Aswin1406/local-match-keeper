import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMatches } from "@/hooks/useMatches";
import { shareScorecard } from "@/lib/shareCard";
import { matchInsight } from "@/lib/winProbability";
import { matchPlayerStats } from "@/lib/playerStats";
import { PlayerStatsTable } from "@/components/PlayerStatsTable";
import { ACTIONS, HALF_SECONDS, SPORT_META, cards, currentHalf, deleteMatch, firstHalfEnded, formatClock, halfRemainingSeconds, hasHalves, initials, matchElapsedSeconds, newId, overs, resultText, score, scoreLine, upsertMatch, wickets, } from "@/lib/matches";
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
};
function MatchPage() {
    const { id } = Route.useParams();
    const navigate = useNavigate();
    const { matches, ready } = useMatches();
    const match = matches.find((m) => m.id === id);
    const [team, setTeam] = useState("a");
    const [player, setPlayer] = useState("");
    const [bowler, setBowler] = useState("");
    const [, setTick] = useState(0);
    // Half clock for kabaddi/football: ticks every second while live and
    // auto-ends the half (pause after half 1, complete after half 2).
    useEffect(() => {
        if (!match || !hasHalves(match.sport) || match.status !== "live")
            return;
        const t = setInterval(() => {
            setTick((n) => n + 1);
            if (halfRemainingSeconds(match) <= 0) {
                const doneMatch = {
                    ...match,
                    halfElapsed: HALF_SECONDS[match.sport],
                    halfStartedAt: undefined,
                    events: [
                        ...match.events,
                        {
                            id: newId(),
                            team: "a",
                            label: currentHalf(match) === 1 ? "1st half completed" : "2nd half completed",
                            points: 0,
                            ts: Date.now(),
                        },
                    ],
                    status: currentHalf(match) === 1 ? "paused" : "completed",
                    half: currentHalf(match),
                };
                upsertMatch(doneMatch);
            }
        }, 1000);
        return () => clearInterval(t);
    }, [match]);
    if (!ready)
        return <div className="min-h-screen bg-night"/>;
    if (!match) {
        return (<div className="min-h-screen bg-night text-ink grid place-items-center px-5">
        <div className="text-center">
          <p className="text-[14px] text-mist">This match isn't on this device.</p>
          <Link to="/" className="mt-3 inline-block text-[13px] font-bold text-gold">
            Back to dashboard
          </Link>
        </div>
      </div>);
    }
    const meta = SPORT_META[match.sport];
    const done = match.status === "completed";
    const activeTeam = team === "a" ? match.teamA : match.teamB;
    const otherTeam = team === "a" ? match.teamB : match.teamA;
    function update(patch) {
        upsertMatch({ ...match, ...patch });
    }
    function addEvent(label, points, wicket, ball, card) {
        const starting = match.status === "upcoming";
        update({
            status: starting ? "live" : match.status,
            halfStartedAt: starting && hasHalves(match.sport) ? Date.now() : match.halfStartedAt,
            events: [
                ...match.events,
                {
                    id: newId(),
                    team,
                    label,
                    points,
                    wicket,
                    ball,
                    card,
                    player: player || undefined,
                    bowler: match.sport === "cricket" && bowler ? bowler : undefined,
                    ts: Date.now(),
                },
            ],
        });
    }
    function togglePause() {
        if (match.status === "live") {
            // Freeze the half clock where it is.
            const elapsed = hasHalves(match.sport)
                ? (match.halfElapsed ?? 0) +
                    (match.halfStartedAt ? (Date.now() - match.halfStartedAt) / 1000 : 0)
                : match.halfElapsed;
            update({ status: "paused", halfElapsed: elapsed, halfStartedAt: undefined });
        }
        else if (match.status === "paused") {
            update({
                status: "live",
                halfStartedAt: hasHalves(match.sport) ? Date.now() : match.halfStartedAt,
            });
        }
    }
    function switchHalf(next) {
        update({
            half: next,
            halfElapsed: 0,
            halfStartedAt: match.status === "live" ? Date.now() : undefined,
            events: [
                ...match.events,
                {
                    id: newId(),
                    team,
                    label: next === 2 ? "2nd half started" : "Back to 1st half",
                    points: 0,
                    ts: Date.now(),
                },
            ],
        });
    }
    function startSecondHalf() {
        update({
            half: 2,
            halfElapsed: 0,
            halfStartedAt: Date.now(),
            status: "live",
            events: [
                ...match.events,
                { id: newId(), team, label: "2nd half started", points: 0, ts: Date.now() },
            ],
        });
    }
    function undo() {
        update({ events: match.events.slice(0, -1) });
    }
    return (<div className="min-h-screen w-full bg-night text-ink">
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
            : firstHalfEnded(match)
                ? "1st Half Completed"
                : match.status === "paused"
                    ? `Paused${hasHalves(match.sport) ? ` · Half ${currentHalf(match)} · ${formatClock(halfRemainingSeconds(match))}` : ""}`
                    : match.sport === "football"
                        ? `Half ${currentHalf(match)} · ⏱ ${formatClock(matchElapsedSeconds(match))} / 90:00`
                        : hasHalves(match.sport)
                            ? `Half ${currentHalf(match)} · Live · ${formatClock(halfRemainingSeconds(match))}`
                            : "Live"}
            </span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-gold font-semibold">
              {match.date ? new Date(match.date).toLocaleString() : "No date"}
            </span>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <Side name={match.teamA.name} logo={match.teamA.logo} tone="crim" line={scoreLine(match, "a")}/>
            <div className="font-display text-[22px] text-mist px-2">v</div>
            <Side name={match.teamB.name} logo={match.teamB.logo} tone="teal" line={scoreLine(match, "b")}/>
          </div>
          {match.sport === "cricket" ? (<div className="mt-3 text-center text-[11px] text-mist">
              {overs(match, "a")} overs · {overs(match, "b")} overs
            </div>) : null}
          {match.sport === "football" ? (<div className="mt-3 flex items-center justify-between">
              <TeamCards match={match} team="a"/>
              <span className="text-[10px] uppercase tracking-[0.16em] font-semibold text-mist">
                Cards
              </span>
              <TeamCards match={match} team="b"/>
            </div>) : null}
        </div>

        <SmartTarget match={match}/>

        {done ? (<Scorecard match={match}/>) : (<>
            {/* Half-time break card */}
            {firstHalfEnded(match) ? (<div className="mt-5 rounded-3xl bg-gold/10 border border-gold/30 p-5 text-center">
                <p className="text-[10px] uppercase tracking-[0.18em] text-gold font-semibold">
                  1st Half Completed
                </p>
                <p className="font-display text-[28px] mt-2">
                  {match.teamA.name} {score(match, "a")} – {score(match, "b")}{" "}
                  {match.teamB.name}
                </p>
                <button onClick={startSecondHalf} className="mt-4 w-full rounded-2xl bg-gold text-night font-bold text-[16px] py-4">
                  ▶ Start 2nd Half
                </button>
              </div>) : null}

            {/* Team selector */}
            <div className="mt-5">
              <p className="text-[10px] uppercase tracking-[0.18em] text-mist font-semibold">
                Scoring for
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {["a", "b"].map((t) => (<button key={t} onClick={() => {
                    if (t !== team) {
                        setTeam(t);
                        setPlayer("");
                        setBowler("");
                    }
                }} className={`rounded-2xl py-4 text-[14px] font-bold truncate px-2 ${team === t
                    ? "bg-gold/15 border border-gold/50 text-gold"
                    : "bg-panel border border-white/8 text-mist"}`}>
                    {t === "a" ? match.teamA.name : match.teamB.name}
                  </button>))}
              </div>
            </div>

            {/* Action pad */}
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              {ACTIONS[match.sport].map((a) => {
                const cls = a.card
                    ? a.card === "yellow"
                        ? "bg-yellow-card text-yellow-card-foreground border border-yellow-card-foreground/20 shadow-[0_8px_24px_-10px_var(--yellow-card)]"
                        : "bg-red-card text-red-card-foreground border border-red-card-foreground/20 shadow-[0_8px_24px_-10px_var(--red-card)]"
                    : toneCls[a.tone];
                return (<button key={a.label} disabled={match.status === "paused"} onClick={() => addEvent(a.label, a.points, a.wicket, a.ball, a.card)} className={`inline-flex items-center justify-center gap-2 rounded-2xl py-6 font-bold text-[16px] disabled:opacity-40 ${cls}`}>
                    {a.card ? (<span className="h-5 w-3.5 rounded-[2px] bg-current opacity-90" aria-hidden/>) : null}
                    {a.label}
                  </button>);
            })}
            </div>

            <div className="mt-3 flex items-center gap-2.5">
              {hasHalves(match.sport) ? (<button onClick={() => switchHalf(currentHalf(match) === 1 ? 2 : 1)} className="flex-1 rounded-xl bg-panel2 border border-teal/30 text-teal font-semibold text-[13px] py-3">
                  {currentHalf(match) === 1 ? "▶ Half 2" : "◀ Half 1"}
                </button>) : null}
              <button onClick={togglePause} className="flex-1 rounded-xl bg-panel2 border border-white/10 text-mist font-semibold text-[13px] py-3">
                {match.status === "paused" ? "↺ Resume" : "⏸ Pause"}
              </button>
              <button onClick={undo} disabled={match.events.length === 0} className="flex-1 rounded-xl bg-panel2 border border-white/10 text-mist font-semibold text-[13px] py-3 disabled:opacity-40">
                ↩ Undo
              </button>
              <button onClick={() => update({ status: "completed" })} className="flex-1 rounded-xl bg-panel2 border border-white/10 text-mist font-semibold text-[13px] py-3">
                ✓ Finish
              </button>
            </div>

            {/* Players */}
            {activeTeam.players.length > 0 ? (<PlayerPicker title={`${activeTeam.name} · ${match.sport === "cricket" ? "batter" : "player"} (tap to credit)`} players={activeTeam.players} value={player} onChange={setPlayer}/>) : null}
            {match.sport === "cricket" && otherTeam.players.length > 0 ? (<PlayerPicker title={`${otherTeam.name} · bowler (gets wickets)`} players={otherTeam.players} value={bowler} onChange={setBowler}/>) : null}

            {/* Timeline */}
            <div className="mt-5">
              <p className="text-[10px] uppercase tracking-[0.16em] text-mist font-semibold mb-2">
                Timeline
              </p>
              <Timeline match={match}/>
            </div>
          </>)}

        <div className="mt-6 flex gap-2.5">
          {done ? (<button onClick={() => update({ status: "live" })} className="flex-1 rounded-xl bg-panel2 border border-white/10 text-mist font-semibold text-[13px] py-3">
              Reopen match
            </button>) : null}
          <button onClick={() => {
            deleteMatch(match.id);
            navigate({ to: "/" });
        }} className="flex-1 rounded-xl bg-panel2 border border-crim/30 text-crim font-semibold text-[13px] py-3">
            Delete match
          </button>
        </div>
      </div>
    </div>);
}
function Side({ name, logo, line, tone }) {
    const cls = tone === "crim"
        ? "from-crim/30 to-crim/5 border-crim/30"
        : "from-teal/30 to-teal/5 border-teal/30";
    return (<div className="flex-1 min-w-0 text-center">
      {logo ? (<img src={logo} alt={name} className={`size-12 rounded-full border object-cover mx-auto ${tone === "crim" ? "border-crim/30" : "border-teal/30"}`}/>) : (<div className={`size-12 rounded-full bg-gradient-to-br border grid place-items-center mx-auto ${cls}`}>
          <span className="font-display text-[15px]">{initials(name)}</span>
        </div>)}
      <div className="text-[12px] font-bold mt-2 truncate px-1">{name}</div>
      <div className="font-display text-[40px] leading-none mt-1">{line}</div>
    </div>);
}
function SmartTarget({ match }) {
    if (match.status === "upcoming")
        return null;
    const { probA, headline, chips } = matchInsight(match);
    const probB = 100 - probA;
    return (<div className="mt-4 rounded-3xl bg-panel border border-white/8 p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[10px] uppercase tracking-[0.18em] text-mist font-semibold">
          Smart target · Win probability
        </span>
      </div>

      <p className="mt-2 font-display text-[20px] leading-tight">{headline}</p>

      <div className="mt-4">
        <div className="flex items-center justify-between text-[11px] font-bold">
          <span className="truncate text-crim">
            {match.teamA.name} {probA}%
          </span>
          <span className="truncate text-teal">
            {probB}% {match.teamB.name}
          </span>
        </div>
        <div className="mt-1.5 h-3 w-full overflow-hidden rounded-full bg-panel2 border border-white/8 flex">
          <div className="h-full bg-crim" style={{ width: `${probA}%` }}/>
          <div className="h-full bg-teal" style={{ width: `${probB}%` }}/>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {chips.map((c) => (<div key={c.label} className="rounded-2xl bg-panel2 border border-white/8 px-3 py-2.5 text-center">
            <div className="text-[9px] uppercase tracking-[0.14em] text-mist font-semibold">
              {c.label}
            </div>
            <div className="text-[14px] font-bold mt-0.5 truncate">{c.value}</div>
          </div>))}
      </div>

      <p className="mt-3 text-[10px] text-mist">
        Estimated from the score, time or balls left — a guide, not a guarantee.
      </p>
    </div>);
}
function CardIcon({ className }) {
    return (<span className={`inline-block rounded-[2px] ${className ?? ""}`} aria-hidden/>);
}
function CardBadge({ type, count, }) {
    return (<span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-bold ${type === "yellow"
            ? "bg-yellow-card text-yellow-card-foreground"
            : "bg-red-card text-red-card-foreground"}`}>
      <CardIcon className={type === "yellow"
            ? "bg-yellow-card-foreground h-4 w-3"
            : "bg-red-card-foreground h-4 w-3"}/>
      {count}
    </span>);
}
function TeamCards({ match, team, }) {
    return (<span className="inline-flex items-center gap-1.5">
      <CardBadge type="yellow" count={cards(match, team, "yellow")}/>
      <CardBadge type="red" count={cards(match, team, "red")}/>
    </span>);
}
function Timeline({ match }) {
    const events = [...match.events].reverse().slice(0, 12);
    if (events.length === 0)
        return (<div className="rounded-2xl bg-panel border border-white/6 p-4 text-[12px] text-mist">
        No actions recorded yet.
      </div>);
    return (<div className="rounded-2xl bg-panel border border-white/6 divide-y divide-white/5">
      {events.map((e) => (<div key={e.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
          <span className="flex items-center gap-1.5 text-[12px] font-bold truncate">
            {e.card ? (<CardIcon className={e.card === "yellow"
                    ? "bg-yellow-card h-4 w-3"
                    : "bg-red-card h-4 w-3"}/>) : null}
            {e.label}
          </span>
          <span className="text-[11px] text-mist truncate">
            {e.team === "a" ? match.teamA.name : match.teamB.name}
          </span>
        </div>))}
    </div>);
}
function Scorecard({ match }) {
    const [sharing, setSharing] = useState(false);
    const [shared, setShared] = useState(null);
    async function onShare() {
        if (sharing)
            return;
        setSharing(true);
        try {
            const how = await shareScorecard(match);
            setShared(how);
            setTimeout(() => setShared(null), 2500);
        }
        catch {
            setShared(null);
        }
        finally {
            setSharing(false);
        }
    }
    const playerStats = matchPlayerStats(match);
    return (<div className="mt-5 space-y-3">
      <div className="rounded-2xl bg-gold/10 border border-gold/25 p-4 text-center">
        <p className="text-[10px] uppercase tracking-[0.18em] text-gold font-semibold">
          {hasHalves(match.sport) ? "Match Completed · Final Score" : "Result"}
        </p>
        <p className="font-display text-[24px] mt-1">{resultText(match)}</p>
        <button onClick={onShare} disabled={sharing} className="mt-4 w-full rounded-2xl bg-gold text-night font-bold text-[15px] py-3.5 disabled:opacity-50">
          {sharing
            ? "Preparing card…"
            : shared === "shared"
                ? "Shared ✓"
                : shared === "downloaded"
                    ? "Image saved ✓"
                    : "📤 Share scorecard"}
        </button>
      </div>
      {["a", "b"].map((t) => {
            const team = t === "a" ? match.teamA : match.teamB;
            return (<div key={t} className="rounded-2xl bg-panel border border-white/6 p-4">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-bold truncate">{team.name}</span>
              <span className="font-display text-[22px]">{scoreLine(match, t)}</span>
            </div>
            <p className="mt-1 flex items-center gap-2 text-[11px] text-mist">
              {match.sport === "cricket"
                    ? `${score(match, t)} runs · ${wickets(match, t)} wickets · ${overs(match, t)} overs`
                    : match.sport === "football"
                        ? (<>
                      <span>{score(match, t)} goals</span>
                      <CardBadge type="yellow" count={cards(match, t, "yellow")}/>
                      <CardBadge type="red" count={cards(match, t, "red")}/>
                    </>)
                        : `${score(match, t)} ${SPORT_META[match.sport].unit}`}
            </p>
            <div className="mt-3">
              <p className="text-[10px] uppercase tracking-[0.16em] text-mist font-semibold mb-1">
                Player stats
              </p>
              <PlayerStatsTable stats={playerStats[t]} sport={match.sport}/>
            </div>
          </div>);
        })}
      <Timeline match={match}/>
    </div>);
}
function PlayerPicker({ title, players, value, onChange, }) {
    return (<div className="mt-5 rounded-2xl bg-panel border border-white/6 p-4">
      <p className="text-[10px] uppercase tracking-[0.16em] text-mist font-semibold">{title}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {players.map((p) => (<button key={p} type="button" onClick={() => onChange(value === p ? "" : p)} className={`rounded-full px-3.5 py-2 text-[12px] font-semibold border ${value === p ? "bg-gold/15 border-gold/50 text-gold" : "bg-panel2 border-white/8 text-ink"}`}>
            {p}
          </button>))}
      </div>
    </div>);
}
