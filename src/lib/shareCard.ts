import {
  cards,
  overs,
  resultText,
  scoreLine,
  SPORT_META,
  wickets,
  type Match,
} from "@/lib/matches";

const W = 1080;
const H = 1080;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawLogo(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  cx: number,
  cy: number,
  size: number,
) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
  ctx.clip();
  const scale = Math.max(size / img.width, size / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h);
  ctx.restore();
}

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/** Renders a square (1080×1080) scorecard image for a match. */
export async function renderScorecardPng(match: Match): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const meta = SPORT_META[match.sport];

  // Background: deep night with a subtle gold glow.
  ctx.fillStyle = "#0a0f1e";
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, 240, 60, W / 2, 240, 900);
  glow.addColorStop(0, "rgba(212,175,55,0.16)");
  glow.addColorStop(1, "rgba(212,175,55,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Frame
  ctx.strokeStyle = "rgba(212,175,55,0.5)";
  ctx.lineWidth = 4;
  drawRoundRect(ctx, 24, 24, W - 48, H - 48, 40);
  ctx.stroke();

  // Header
  ctx.textAlign = "center";
  ctx.fillStyle = "#d4af37";
  ctx.font = "700 40px system-ui, sans-serif";
  ctx.fillText("LOCALSCORE", W / 2, 120);
  ctx.fillStyle = "rgba(232,236,244,0.65)";
  ctx.font = "600 30px system-ui, sans-serif";
  const statusLine =
    match.status === "completed"
      ? `${meta.label} · Full Time`
      : `${meta.label} · Live`;
  ctx.fillText(statusLine.toUpperCase(), W / 2, 172);

  // Teams
  const logoA = match.teamA.logo ? await loadImage(match.teamA.logo).catch(() => null) : null;
  const logoB = match.teamB.logo ? await loadImage(match.teamB.logo).catch(() => null) : null;

  const sides: Array<{
    x: number;
    name: string;
    logo: HTMLImageElement | null;
    line: string;
    sub: string;
  }> = [
    {
      x: W * 0.27,
      name: match.teamA.name,
      logo: logoA,
      line: scoreLine(match, "a"),
      sub:
        match.sport === "cricket"
          ? `${scoreLine(match, "a").split("/")[0]} runs · ${wickets(match, "a")} wkts · ${overs(match, "a")} ov`
          : match.sport === "football"
            ? `${cards(match, "a", "yellow")} yellow · ${cards(match, "a", "red")} red`
            : "",
    },
    {
      x: W * 0.73,
      name: match.teamB.name,
      logo: logoB,
      line: scoreLine(match, "b"),
      sub:
        match.sport === "cricket"
          ? `${scoreLine(match, "b").split("/")[0]} runs · ${wickets(match, "b")} wkts · ${overs(match, "b")} ov`
          : match.sport === "football"
            ? `${cards(match, "b", "yellow")} yellow · ${cards(match, "b", "red")} red`
            : "",
    },
  ];

  for (const s of sides) {
    if (s.logo) {
      drawLogo(ctx, s.logo, s.x, 330, 170);
      ctx.strokeStyle = "rgba(212,175,55,0.6)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(s.x, 330, 87, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.fillStyle = "rgba(212,175,55,0.12)";
      ctx.beginPath();
      ctx.arc(s.x, 330, 85, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(212,175,55,0.4)";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = "#e8ecf4";
      ctx.font = "800 56px system-ui, sans-serif";
      ctx.fillText(initialsOf(s.name), s.x, 350);
    }
    ctx.fillStyle = "#e8ecf4";
    ctx.font = "700 40px system-ui, sans-serif";
    const short = s.name.length > 16 ? `${s.name.slice(0, 15)}…` : s.name;
    ctx.fillText(short, s.x, 480);
    ctx.fillStyle = "#d4af37";
    ctx.font = "800 110px system-ui, sans-serif";
    ctx.fillText(s.line, s.x, 620);
    if (s.sub) {
      ctx.fillStyle = "rgba(232,236,244,0.6)";
      ctx.font = "500 28px system-ui, sans-serif";
      ctx.fillText(s.sub, s.x, 676);
    }
  }

  ctx.fillStyle = "rgba(232,236,244,0.5)";
  ctx.font = "800 64px system-ui, sans-serif";
  ctx.fillText("VS", W / 2, 350);

  // Result banner
  if (match.status === "completed") {
    ctx.fillStyle = "rgba(212,175,55,0.14)";
    drawRoundRect(ctx, 140, 740, W - 280, 110, 24);
    ctx.fill();
    ctx.strokeStyle = "rgba(212,175,55,0.45)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#d4af37";
    ctx.font = "700 38px system-ui, sans-serif";
    const result = resultText(match);
    ctx.fillText(result.length > 42 ? `${result.slice(0, 41)}…` : result, W / 2, 808);
  }

  // Footer
  ctx.fillStyle = "rgba(232,236,244,0.55)";
  ctx.font = "500 28px system-ui, sans-serif";
  const footer = [match.venue, match.date ? new Date(match.date).toLocaleDateString() : ""]
    .filter(Boolean)
    .join(" · ");
  if (footer) ctx.fillText(footer, W / 2, 950);
  ctx.fillStyle = "rgba(212,175,55,0.7)";
  ctx.font = "600 26px system-ui, sans-serif";
  ctx.fillText("Scored with LocalScore", W / 2, 1000);

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Could not render image"))),
      "image/png",
    ),
  );
}

/** Shares the card via the native share sheet when possible, else downloads it. */
export async function shareScorecard(match: Match): Promise<"shared" | "downloaded"> {
  const blob = await renderScorecardPng(match);
  const file = new File([blob], `localscore-${match.id}.png`, { type: "image/png" });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: "LocalScore scorecard",
        text: `${match.teamA.name} vs ${match.teamB.name} — ${resultText(match)}`,
      });
      return "shared";
    } catch (e) {
      if ((e as DOMException).name === "AbortError") return "shared";
      // fall through to download
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return "downloaded";
}
