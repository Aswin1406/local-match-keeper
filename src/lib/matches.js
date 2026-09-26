const KEY = "localscore.matches.v1";
export const SPORT_META = {
    cricket: { label: "Cricket", icon: "🏏", unit: "runs" },
    kabaddi: { label: "Kabaddi", icon: "🤼", unit: "points" },
    football: { label: "Football", icon: "⚽", unit: "goals" },
};
export const ACTIONS = {
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
        { label: "Yellow card", points: 0, card: "yellow", tone: "gold" },
        { label: "Red card", points: 0, card: "red", tone: "crim" },
    ],
};
export function loadMatches() {
    if (typeof window === "undefined")
        return [];
    try {
        const raw = window.localStorage.getItem(KEY);
        return raw ? JSON.parse(raw) : [];
    }
    catch {
        return [];
    }
}
export function saveMatches(matches) {
    if (typeof window === "undefined")
        return;
    window.localStorage.setItem(KEY, JSON.stringify(matches));
    window.dispatchEvent(new Event("localscore:update"));
}
export function upsertMatch(match) {
    const all = loadMatches();
    const idx = all.findIndex((m) => m.id === match.id);
    if (idx >= 0)
        all[idx] = match;
    else
        all.unshift(match);
    saveMatches(all);
}
export function deleteMatch(id) {
    saveMatches(loadMatches().filter((m) => m.id !== id));
}
export function newId() {
    return Math.random().toString(36).slice(2, 10);
}
export function score(match, team) {
    return match.events.filter((e) => e.team === team).reduce((s, e) => s + e.points, 0);
}
export function wickets(match, team) {
    return match.events.filter((e) => e.team === team && e.wicket).length;
}
export function balls(match, team) {
    return match.events.filter((e) => e.team === team && e.ball).length;
}
export function overs(match, team) {
    const b = balls(match, team);
    return `${Math.floor(b / 6)}.${b % 6}`;
}
export function scoreLine(match, team) {
    const s = score(match, team);
    return match.sport === "cricket" ? `${s}/${wickets(match, team)}` : `${s}`;
}
export function initials(name) {
    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join("");
}
export function hasHalves(sport) {
    return sport === "kabaddi" || sport === "football";
}
export function currentHalf(match) {
    return match.half ?? 1;
}
/** Length of one half in seconds (kabaddi 20 min, football 45 min). */
export const HALF_SECONDS = {
    cricket: 0,
    kabaddi: 20 * 60,
    football: 45 * 60,
};
export function halfElapsedSeconds(match) {
    const base = match.halfElapsed ?? 0;
    const running = match.halfStartedAt ? (Date.now() - match.halfStartedAt) / 1000 : 0;
    return base + running;
}
export function halfRemainingSeconds(match) {
    return Math.max(0, Math.ceil(HALF_SECONDS[match.sport] - halfElapsedSeconds(match)));
}
export function formatClock(totalSeconds) {
    const t = Math.max(0, Math.floor(totalSeconds));
    const m = Math.floor(t / 60);
    const s = t % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
}
export function cards(match, team, kind) {
    return match.events.filter((e) => e.team === team && e.card === kind).length;
}
/** Total match time played, counting up across both halves (0–90 min for football). */
export function matchElapsedSeconds(match) {
    if (!hasHalves(match.sport))
        return 0;
    const perHalf = HALF_SECONDS[match.sport];
    const inHalf = Math.min(halfElapsedSeconds(match), perHalf);
    return (currentHalf(match) - 1) * perHalf + inHalf;
}
/** True when the 1st half timer has run out and the match is waiting for half 2. */
export function firstHalfEnded(match) {
    return (hasHalves(match.sport) &&
        currentHalf(match) === 1 &&
        match.status === "paused" &&
        halfElapsedSeconds(match) >= HALF_SECONDS[match.sport]);
}
export function resultText(match) {
    const a = score(match, "a");
    const b = score(match, "b");
    if (a === b)
        return "Match tied";
    const winner = a > b ? match.teamA.name : match.teamB.name;
    return `${winner} won by ${Math.abs(a - b)} ${SPORT_META[match.sport].unit}`;
}
