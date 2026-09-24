import {
  HALF_SECONDS,
  balls,
  hasHalves,
  matchElapsedSeconds,
  score,
  wickets,
  type Match,
} from "./matches";

/** Overs per side assumed for a local cricket game. */
export const CRICKET_OVERS = 20;
const CRICKET_BALLS = CRICKET_OVERS * 6;

export type Insight = {
  /** Win probability for team A, 0-100. */
  probA: number;
  /** Headline target / situation line. */
  headline: string;
  /** Supporting stats shown as small chips. */
  chips: { label: string; value: string }[];
};

function sigmoid(z: number) {
  return 1 / (1 + Math.exp(-z));
}

function clampPct(p: number) {
  return Math.round(Math.min(0.99, Math.max(0.01, p)) * 100);
}

function cricketInsight(match: Match): Insight {
  const a = score(match, "a");
  const b = score(match, "b");
  const ballsA = balls(match, "a");
  const ballsB = balls(match, "b");
  const chasing = ballsB > 0;

  if (!chasing) {
    const ballsLeft = Math.max(0, CRICKET_BALLS - ballsA);
    const rr = ballsA > 0 ? a / (ballsA / 6) : 0;
    const projected = Math.round(a + (rr * ballsLeft) / 6);
    return {
      probA: 50,
      headline: `${match.teamA.name} projected ${projected} in ${CRICKET_OVERS} overs`,
      chips: [
        { label: "Run rate", value: rr.toFixed(2) },
        { label: "Balls left", value: String(ballsLeft) },
        { label: "Wickets", value: `${10 - wickets(match, "a")} in hand` },
      ],
    };
  }

  const target = a + 1;
  const need = target - b;
  const ballsLeft = Math.max(0, CRICKET_BALLS - ballsB);
  const wktLeft = Math.max(0, 10 - wickets(match, "b"));
  const reqRR = ballsLeft > 0 ? need / (ballsLeft / 6) : Infinity;
  const currRR = ballsB > 0 ? b / (ballsB / 6) : 0;

  let probB: number;
  if (need <= 0) probB = 1;
  else if (ballsLeft === 0 || wktLeft === 0) probB = 0;
  else probB = sigmoid(0.9 * (currRR - reqRR) + 0.22 * (wktLeft - 5));

  return {
    probA: clampPct(1 - probB),
    headline:
      need <= 0
        ? `${match.teamB.name} have chased it down`
        : ballsLeft === 0 || wktLeft === 0
          ? `${match.teamA.name} defended ${target - 1}`
          : `${match.teamB.name} need ${need} from ${ballsLeft} balls`,
    chips: [
      { label: "Target", value: String(target) },
      { label: "Req. rate", value: Number.isFinite(reqRR) ? reqRR.toFixed(2) : "—" },
      { label: "Run rate", value: currRR.toFixed(2) },
      { label: "Wickets", value: `${wktLeft} in hand` },
    ],
  };
}

function timedInsight(match: Match): Insight {
  const a = score(match, "a");
  const b = score(match, "b");
  const total = HALF_SECONDS[match.sport] * 2;
  const elapsed = Math.min(total, matchElapsedSeconds(match));
  const left = Math.max(0, total - elapsed);
  const frac = total > 0 ? left / total : 0;

  // Expected remaining scoring for both teams combined.
  const fullGame = match.sport === "football" ? 2.6 : 60;
  const expected = Math.max(0.35, fullGame * frac);
  const lead = a - b;

  const probA =
    left === 0
      ? lead > 0
        ? 1
        : lead < 0
          ? 0
          : 0.5
      : sigmoid((1.25 * lead) / Math.sqrt(expected));

  const leader = lead === 0 ? null : lead > 0 ? match.teamA : match.teamB;
  const minsLeft = Math.ceil(left / 60);
  const unit = match.sport === "football" ? "goal" : "point";
  const gap = Math.abs(lead);

  return {
    probA: clampPct(probA),
    headline: leader
      ? left === 0
        ? `${leader.name} won by ${gap} ${unit}${gap > 1 ? "s" : ""}`
        : `${leader.name} lead by ${gap} ${unit}${gap > 1 ? "s" : ""}`
      : left === 0
        ? "Match tied"
        : "Level game — anyone's match",
    chips: [
      { label: "Time left", value: left === 0 ? "Full time" : `${minsLeft} min` },
      {
        label: "To level",
        value: gap === 0 ? "—" : `${gap} ${unit}${gap > 1 ? "s" : ""}`,
      },
      {
        label: "Target",
        value: leader ? `${Math.max(a, b) + 1} to lead` : `${a + 1} to lead`,
      },
    ],
  };
}

export function matchInsight(match: Match): Insight {
  return hasHalves(match.sport) ? timedInsight(match) : cricketInsight(match);
}
