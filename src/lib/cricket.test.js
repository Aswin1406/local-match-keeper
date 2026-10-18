import test from "node:test";
import assert from "node:assert/strict";
import { cricketState, recordCricketEvent, startCricketChase, undoCricketEvent } from "./cricket.js";
import { balls } from "./matches.js";

const match = (extra = {}) => ({ sport: "cricket", overs: 1, status: "live", events: [],
    teamA: { name: "A", players: [] }, teamB: { name: "B", players: [] }, ...extra });
const delivery = (team, points = 1, extra = {}) => ({ team, points, ball: true, ...extra });
const firstInnings = (m) => { for (let i = 0; i < 6; i++) m = recordCricketEvent(m, delivery(cricketState(m).first)); return m; };
test("selected one-over innings stops at six legal balls and cannot resume scoring", () => {
    const m = firstInnings(match());
    assert.equal(m.status, "paused");
    assert.equal(balls(m, "a"), 6);
    const resumed = { ...m, status: "live" };
    assert.equal(recordCricketEvent(resumed, delivery("a")), resumed);
});
test("both innings finish at the selected overs and persist completed state", () => {
    let m = startCricketChase(firstInnings(match()), { id: "start" });
    for (let i = 0; i < 6; i++) m = recordCricketEvent(m, delivery("b", 0));
    assert.equal(m.status, "completed");
    assert.equal(balls(m, "b"), 6);
    assert.equal(recordCricketEvent(m, delivery("b")), m);
});
test("wide adds runs but does not use a legal ball", () => {
    const m = recordCricketEvent(match(), delivery("a", 1, { ball: false }));
    assert.equal(balls(m, "a"), 0);
    assert.equal(m.events[0].points, 1);
});
test("toss-selected team B bats first and team A completes a successful chase", () => {
    let m = startCricketChase(firstInnings(match({ toss: { winner: "b", choice: "bat" } })), {});
    assert.equal(cricketState(m).active, "a");
    m = recordCricketEvent(m, delivery("a", 6));
    assert.equal(m.status, "live");
    m = recordCricketEvent(m, delivery("a"));
    assert.equal(m.status, "completed");
});
test("undo reopens the innings after its last ball and the completed match", () => {
    const m = undoCricketEvent(firstInnings(match()));
    assert.equal(m.status, "live");
    assert.equal(balls(m, "a"), 5);
    let chase = startCricketChase(firstInnings(match()), {});
    for (let i = 0; i < 6; i++) chase = recordCricketEvent(chase, delivery("b", 0));
    const undone = undoCricketEvent(chase);
    assert.equal(undone.status, "live");
    assert.equal(balls(undone, "b"), 5);
});
test("ten wickets ends an innings even with overs remaining", () => {
    let m = match({ overs: 20 });
    for (let i = 0; i < 10; i++) m = recordCricketEvent(m, delivery("a", 0, { wicket: true }));
    assert.equal(cricketState(m).break, true);
    assert.equal(m.status, "paused");
});
test("opposing team cannot score before the innings transition", () => {
    const m = match();
    assert.equal(recordCricketEvent(m, delivery("b")), m);
});