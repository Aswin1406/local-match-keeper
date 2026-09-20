export type Sport = "cricket" | "kabaddi" | "football";
export type Status = "upcoming" | "live" | "paused" | "completed";

export type MatchEvent = {
  id: string;
  team: "a" | "b";
  label: string;
  points: number;
  wicket?: boolean;
  ball?: boolean;
  player?: string;
  ts: number;
};

export type Team = { name: string; players: string[] };

export type Match = {
  id: string;
  sport: Sport;
  teamA: Team;
  teamB: Team;
  date: string;
  venue: string;
  status: Status;
  events: MatchEvent[];
  createdAt: number;
};

const KEY = "localscore.matches.v1";

export const SPORT_META: Record<Sport, { label: string; icon: string; unit: string }> = {
  cricket: { label: "Cricket", icon: "🏏", unit: "runs" },
  kabaddi: { label: "Kabaddi", icon: "🤼", unit: "points" },
  football: { label: "Football", icon: "⚽", unit: "goals" },
};

export const ACTIONS: Record<Sport, { label: string; points: number; wicket?: boolean; ball?: boolean; tone: "teal" | "gold" | "panel" | "crim" }[]> = {
  cricket: [
    { label: "+1 run", points: 1, ball: true, tone: "teal" },
    { label: "+4 runs", points: 4, ball: true, tone: "gold" },
    { label: "+6 runs", points: 6, ball: true, tone: "panel" },
    { label: "Wicket", points: 0, ball: true, wicket: true, tone: "crim" },
    { label: "+2 runs", points: 2, ball: true, tone: "panel" },
    { label: "Wide / No ball", points: 1, tone: "panel" },
  ],
  kabaddi: [
    { label: "Raid +1", points: 1, tone: "teal" },
    { label: "Bonus +2", points: 2, tone: "gold" },
    { label: "Tackle +1", points: 1, tone: "panel" },
    { label: "All out +2", points: 2, tone: "crim" },
  ],
  football: [
    { label: "Goal", points: 1, tone: "teal" },
    { label: "Penalty goal", points: 1, tone: "gold" },
    { label: "Own goal", points: 1, tone: "panel" },
    { label: "Card (no score)", points: 0, tone: "crim" },
  ],
};

export function loadMatches(): Match[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Match[]) : [];
  } catch {
    return [];
  }
}

export function saveMatches(matches: Match[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(matches));
  window.dispatchEvent(new Event("localscore:update"));
}

export function upsertMatch(match: Match) {
  const all = loadMatches();
  const idx = all.findIndex((m) => m.id === match.id);
  if (idx >= 0) all[idx] = match;
  else all.unshift(match);
  saveMatches(all);
}

export function deleteMatch(id: string) {
  saveMatches(loadMatches().filter((m) => m.id !== id));
}

export function newId() {
  return Math.random().toString(36).slice(2, 10);
}

export function score(match: Match, team: "a" | "b") {
  return match.events.filter((e) => e.team === team).reduce((s, e) => s + e.points, 0);
}

export function wickets(match: Match, team: "a" | "b") {
  return match.events.filter((e) => e.team === team && e.wicket).length;
}

export function balls(match: Match, team: "a" | "b") {
  return match.events.filter((e) => e.team === team && e.ball).length;
}

export function overs(match: Match, team: "a" | "b") {
  const b = balls(match, team);
  return `${Math.floor(b / 6)}.${b % 6}`;
}

export function scoreLine(match: Match, team: "a" | "b") {
  const s = score(match, team);
  return match.sport === "cricket" ? `${s}/${wickets(match, team)}` : `${s}`;
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

export function resultText(match: Match) {
  const a = score(match, "a");
  const b = score(match, "b");
  if (a === b) return "Match tied";
  const winner = a > b ? match.teamA.name : match.teamB.name;
  return `${winner} won by ${Math.abs(a - b)} ${SPORT_META[match.sport].unit}`;
}
