import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SPORT_META, newId, upsertMatch, type Sport } from "@/lib/matches";

export const Route = createFileRoute("/new")({
  head: () => ({
    meta: [
      { title: "Create a match — LocalScore" },
      {
        name: "description",
        content: "Set up a new local Cricket, Kabaddi or Football match with teams, players, date and venue.",
      },
      { property: "og:title", content: "Create a match — LocalScore" },
      {
        property: "og:description",
        content: "Set up teams, players, date and venue for your next local match.",
      },
    ],
  }),
  component: NewMatch,
});

const inputCls =
  "w-full rounded-xl bg-panel2 border border-white/10 px-4 py-3 text-[14px] text-ink placeholder:text-mist/60 outline-none focus:border-gold/50";
const labelCls = "text-[10px] uppercase tracking-[0.18em] text-mist font-semibold";

function NewMatch() {
  const navigate = useNavigate();
  const [sport, setSport] = useState<Sport>("cricket");
  const [teamAName, setTeamAName] = useState("");
  const [teamBName, setTeamBName] = useState("");
  const [playersA, setPlayersA] = useState("");
  const [playersB, setPlayersB] = useState("");
  const [date, setDate] = useState("");
  const [venue, setVenue] = useState("");
  const [logoA, setLogoA] = useState("");
  const [logoB, setLogoB] = useState("");

  function create(start: boolean) {
    const id = newId();
    upsertMatch({
      id,
      sport,
      teamA: { name: teamAName.trim() || "Team A", players: splitPlayers(playersA) },
      teamB: { name: teamBName.trim() || "Team B", players: splitPlayers(playersB) },
      date,
      venue: venue.trim(),
      status: start ? "live" : "upcoming",
      events: [],
      createdAt: Date.now(),
    });
    if (start) navigate({ to: "/match/$id", params: { id } });
    else navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen w-full bg-night text-ink">
      <div className="mx-auto w-full max-w-[720px] px-5 pt-6 pb-12">
        <Link to="/" className="text-[12px] font-bold text-gold">
          ← Dashboard
        </Link>
        <h1 className="font-display mt-4 text-[38px] leading-[0.95] tracking-tight">
          New match
        </h1>

        <div className="mt-6 space-y-5">
          <div>
            <p className={labelCls}>Sport</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {(Object.keys(SPORT_META) as Sport[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setSport(s)}
                  className={`rounded-2xl border py-4 text-[13px] font-bold ${
                    sport === s
                      ? "border-gold/50 bg-gold/15 text-gold"
                      : "border-white/8 bg-panel text-mist"
                  }`}
                >
                  <span className="block text-xl">{SPORT_META[s].icon}</span>
                  {SPORT_META[s].label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <p className={labelCls}>Team A</p>
              <input
                className={inputCls}
                placeholder="Team name"
                value={teamAName}
                onChange={(e) => setTeamAName(e.target.value)}
              />
              <textarea
                className={`${inputCls} min-h-24`}
                placeholder="Players, one per line"
                value={playersA}
                onChange={(e) => setPlayersA(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <p className={labelCls}>Team B</p>
              <input
                className={inputCls}
                placeholder="Team name"
                value={teamBName}
                onChange={(e) => setTeamBName(e.target.value)}
              />
              <textarea
                className={`${inputCls} min-h-24`}
                placeholder="Players, one per line"
                value={playersB}
                onChange={(e) => setPlayersB(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <p className={labelCls}>Date &amp; time</p>
              <input
                type="datetime-local"
                className={inputCls}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <p className={labelCls}>Venue</p>
              <input
                className={inputCls}
                placeholder="Ground name"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2.5 sm:flex-row">
            <button
              onClick={() => create(true)}
              className="flex-1 rounded-2xl bg-gradient-to-r from-gold to-lime text-night font-bold text-[15px] py-4"
            >
              Start scoring now
            </button>
            <button
              onClick={() => create(false)}
              className="flex-1 rounded-2xl bg-panel2 border border-white/10 text-ink font-bold text-[15px] py-4"
            >
              Save as upcoming
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function splitPlayers(raw: string) {
  return raw
    .split(/[\n,]/)
    .map((p) => p.trim())
    .filter(Boolean);
}
