import { balls, battingFirst, matchOvers, score, wickets } from "./matches.js";

export function cricketState(match) {
    const first = battingFirst(match);
    const second = first === "a" ? "b" : "a";
    const ended = (team) => balls(match, team) >= matchOvers(match) * 6 || wickets(match, team) >= 10;
    const firstEnded = ended(first);
    const secondStarted = match.events.some((event) => event.team === second &&
        (event.ball || event.points > 0 || event.wicket || event.inningsStart));
    const complete = secondStarted && (ended(second) || score(match, second) > score(match, first));
    return { first, second, firstEnded, secondStarted, complete,
        active: secondStarted ? second : first,
        break: firstEnded && !secondStarted };
}

export function recordCricketEvent(match, event) {
    const state = cricketState(match);
    if (match.status === "paused" || match.status === "completed" || state.complete || state.break || event.team !== state.active)
        return match;
    const next = { ...match, events: [...match.events, event], status: "live" };
    const after = cricketState(next);
    if (after.complete) next.status = "completed";
    else if (after.break) next.status = "paused";
    return next;
}

export function startCricketChase(match, event) {
    const state = cricketState(match);
    if (!state.break || match.status === "completed") return match;
    return { ...match, status: "live", events: [...match.events,
        { ...event, team: state.second, label: "2nd innings started", points: 0, inningsStart: true }] };
}

export function undoCricketEvent(match) {
    const next = { ...match, events: match.events.slice(0, -1) };
    const state = cricketState(next);
    next.status = state.complete ? "completed" : state.break ? "paused" :
        match.status === "completed" || cricketState(match).break ? "live" : match.status;
    return next;
}