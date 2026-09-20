import { Link } from "@tanstack/react-router";
import { SPORT_META, scoreLine, type Match } from "@/lib/matches";

const toneBySport = {
  cricket: "from-teal/20 to-teal/5 border-teal/20 text-teal",
  kabaddi: "from-crim/20 to-crim/5 border-crim/20 text-crim",
  football: "from-gold/20 to-gold/5 border-gold/20 text-gold",
} as const;

export function MatchCard({ match }: { match: Match }) {
  const meta = SPORT_META[match.sport];
  const live = match.status === "live" || match.status === "paused";
  const sub =
    match.status === "completed"
      ? `${meta.label} · ${scoreLine(match, "a")} – ${scoreLine(match, "b")}`
      : live
        ? `${meta.label} · ${scoreLine(match, "a")} – ${scoreLine(match, "b")} · ${match.venue || "No venue"}`
        : `${meta.label} · ${match.date || "Date TBD"} · ${match.venue || "No venue"}`;

  return (
    <Link
      to="/match/$id"
      params={{ id: match.id }}
      className="rounded-2xl bg-panel border border-white/6 p-4 flex items-center gap-3 transition-colors hover:border-gold/30"
    >
      <div
        className={`size-11 shrink-0 rounded-xl bg-gradient-to-br border grid place-items-center text-lg ${toneBySport[match.sport]}`}
      >
        {meta.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-bold truncate">
          {match.teamA.name} vs {match.teamB.name}
        </div>
        <div className="text-[11px] text-mist truncate">{sub}</div>
      </div>
      <span className="text-[12px] font-bold text-gold shrink-0">
        {match.status === "completed" ? "Card" : live ? "Score" : "Set up"}
      </span>
    </Link>
  );
}
