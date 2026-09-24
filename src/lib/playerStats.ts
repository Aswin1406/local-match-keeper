import type { Match, Sport } from "@/lib/matches";

export type PlayerStat = {
  name: string;
  team: string;
  sport: Sport;
  appearances: number;
  runs: number;
  balls: number;
  outs: number;
  wickets: number;
  goals: number;
  raidPoints: number;
  tackles: number;
  yellow: number;
  red: number;
};

function blank(name: string, team: string, sport: Sport): PlayerStat {
  return { name, team, sport, appearances: 0, runs: 0, balls: 0, outs: 0, wickets: 0, goals: 0, raidPoints: 0, tackles: 0, yellow: 0, red: 0 };
}

/** Per-player stats for one match, grouped by side. */
export function matchPlayerStats(match: Match): Record<"a" | "b", PlayerStat[]> {
  const maps = { a: new Map<string, PlayerStat>(), b: new Map<string, PlayerStat>() };
  const teamName = (t: "a" | "b") => (t === "a" ? match.teamA.name : match.teamB.name);
  const get = (t: "a" | "b", name: string) => {
    let s = maps[t].get(name);
    if (!s) {
      s = blank(name, teamName(t), match.sport);
      s.appearances = 1;
      maps[t].set(name, s);
    }
    return s;
  };
  (["a", "b"] as const).forEach((t) =>
    (t === "a" ? match.teamA : match.teamB).players.forEach((p) => get(t, p)),
  );

  for (const e of match.events) {
    const other = e.team === "a" ? "b" : "a";
    if (e.bowler && e.wicket) get(other, e.bowler).wickets += 1;
    if (!e.player) continue;
    const s = get(e.team, e.player);
    if (match.sport === "cricket") {
      if (e.ball) {
        s.balls += 1;
        s.runs += e.points;
      }
      if (e.wicket) s.outs += 1;
    } else if (match.sport === "football") {
      if (e.card === "yellow") s.yellow += 1;
      else if (e.card === "red") s.red += 1;
      else if (e.points > 0 && !/own goal/i.test(e.label)) s.goals += e.points;
    } else {
      if (/tackle/i.test(e.label)) s.tackles += 1;
      else if (/raid|bonus/i.test(e.label)) s.raidPoints += e.points;
    }
  }
  return { a: [...maps.a.values()], b: [...maps.b.values()] };
}

/** Career stats across completed matches, keyed by sport + team + player. */
export function careerStats(matches: Match[]): PlayerStat[] {
  const out = new Map<string, PlayerStat>();
  for (const m of matches) {
    if (m.status !== "completed") continue;
    const per = matchPlayerStats(m);
    for (const s of [...per.a, ...per.b]) {
      const key = `${s.sport}|${s.team.toLowerCase()}|${s.name.toLowerCase()}`;
      const acc = out.get(key) ?? blank(s.name, s.team, s.sport);
      (["appearances", "runs", "balls", "outs", "wickets", "goals", "raidPoints", "tackles", "yellow", "red"] as const).forEach(
        (k) => (acc[k] += s[k]),
      );
      out.set(key, acc);
    }
  }
  return [...out.values()];
}

export type StatCol = { key: keyof PlayerStat; label: string };

export const STAT_COLS: Record<Sport, StatCol[]> = {
  cricket: [
    { key: "runs", label: "R" },
    { key: "balls", label: "B" },
    { key: "outs", label: "Out" },
    { key: "wickets", label: "W" },
  ],
  kabaddi: [
    { key: "raidPoints", label: "Raid" },
    { key: "tackles", label: "Tkl" },
  ],
  football: [
    { key: "goals", label: "G" },
    { key: "yellow", label: "YC" },
    { key: "red", label: "RC" },
  ],
};

export function sortStats(list: PlayerStat[], sport: Sport) {
  const primary = STAT_COLS[sport][0]!.key;
  return [...list].sort((x, y) => (y[primary] as number) - (x[primary] as number) || x.name.localeCompare(y.name));
}
