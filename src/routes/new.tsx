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

  const [errors, setErrors] = useState<{ teamA?: string; teamB?: string; date?: string }>({});

  function create(start: boolean) {
    const next: { teamA?: string; teamB?: string; date?: string } = {};
    if (!teamAName.trim()) next.teamA = "Team A name is required";
    if (!teamBName.trim()) next.teamB = "Team B name is required";
    if (!date) next.date = "Match date & time is required";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const id = newId();
    upsertMatch({
      id,
      sport,
      teamA: { name: teamAName.trim(), players: splitPlayers(playersA), logo: logoA || undefined },
      teamB: { name: teamBName.trim(), players: splitPlayers(playersB), logo: logoB || undefined },
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
              <p className={labelCls}>
                Team A <span className="text-crim">*</span>
              </p>
              <input
                className={`${inputCls} ${errors.teamA ? "border-crim/60" : ""}`}
                placeholder="Team name"
                value={teamAName}
                onChange={(e) => {
                  setTeamAName(e.target.value);
                  if (errors.teamA) setErrors((p) => ({ ...p, teamA: undefined }));
                }}
              />
              {errors.teamA ? <p className="text-[12px] font-semibold text-crim">{errors.teamA}</p> : null}
              <LogoPicker value={logoA} onChange={setLogoA} />
              <textarea
                className={`${inputCls} min-h-24`}
                placeholder="Players, one per line"
                value={playersA}
                onChange={(e) => setPlayersA(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <p className={labelCls}>
                Team B <span className="text-crim">*</span>
              </p>
              <input
                className={`${inputCls} ${errors.teamB ? "border-crim/60" : ""}`}
                placeholder="Team name"
                value={teamBName}
                onChange={(e) => {
                  setTeamBName(e.target.value);
                  if (errors.teamB) setErrors((p) => ({ ...p, teamB: undefined }));
                }}
              />
              {errors.teamB ? <p className="text-[12px] font-semibold text-crim">{errors.teamB}</p> : null}
              <LogoPicker value={logoB} onChange={setLogoB} />
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
              <p className={labelCls}>
                Date &amp; time <span className="text-crim">*</span>
              </p>
              <input
                type="datetime-local"
                className={`${inputCls} ${errors.date ? "border-crim/60" : ""}`}
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  if (errors.date) setErrors((p) => ({ ...p, date: undefined }));
                }}
              />
              {errors.date ? <p className="text-[12px] font-semibold text-crim">{errors.date}</p> : null}
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

function LogoPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const size = 128;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const scale = Math.max(size / img.width, size / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
        onChange(canvas.toDataURL("image/png"));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="flex items-center gap-3">
      {value ? (
        <img
          src={value}
          alt="Team logo"
          className="size-12 rounded-xl border border-white/10 object-cover"
        />
      ) : (
        <div className="size-12 rounded-xl border border-dashed border-white/15 bg-panel2 grid place-items-center text-mist text-lg">
          +
        </div>
      )}
      <label className="rounded-xl bg-panel2 border border-white/10 px-3 py-2 text-[12px] font-semibold text-mist cursor-pointer">
        {value ? "Change logo" : "Upload logo"}
        <input type="file" accept="image/*" className="hidden" onChange={pick} />
      </label>
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          className="text-[12px] font-semibold text-crim"
        >
          Remove
        </button>
      ) : null}
    </div>
  );
}

function splitPlayers(raw: string) {
  return raw
    .split(/[\n,]/)
    .map((p) => p.trim())
    .filter(Boolean);
}
