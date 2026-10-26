import { mkdirSync, writeFileSync } from "node:fs";

const USER = process.env.MT_USER || "FrankensteinRjR";
const res = await fetch(`https://api.monkeytype.com/users/${USER}/profile`);
if (!res.ok) throw new Error(`Monkeytype API ${res.status}`);
const { data } = await res.json();

const best = (mode, key) => {
  const list = data.personalBests?.[mode]?.[key] ?? [];
  if (!list.length) return null;
  return list.reduce((a, b) => (b.wpm > a.wpm ? b : a));
};

const pbs = [
  ["15s", best("time", "15")],
  ["30s", best("time", "30")],
  ["60s", best("time", "60")],
  ["120s", best("time", "120")],
];

const t = data.typingStats ?? {};
const hours = ((t.timeTyping ?? 0) / 3600).toFixed(1);
const esc = (s) =>
  String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

const rows = pbs
  .map(([label, pb], i) => {
    const y = 108 + i * 34;
    return `
    <text x="24" y="${y}" class="label">${label}</text>
    <text x="110" y="${y}" class="wpm">${pb ? Math.round(pb.wpm) + " wpm" : "—"}</text>
    <text x="230" y="${y}" class="sub">${pb ? Math.round(pb.acc) + "% acc" : ""}</text>
    <text x="330" y="${y}" class="sub">${pb?.consistency ? Math.round(pb.consistency) + "% cons" : ""}</text>`;
  })
  .join("");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="300" viewBox="0 0 500 300">
  <style>
    .bg{fill:#323437}
    .title{font:700 20px monospace;fill:#e2b714}
    .label{font:14px monospace;fill:#646669}
    .wpm{font:700 18px monospace;fill:#d1d0c5}
    .sub{font:14px monospace;fill:#d1d0c5}
    .stat{font:14px monospace;fill:#646669}
    .val{fill:#e2b714;font-weight:700}
  </style>
  <rect class="bg" width="500" height="300" rx="10"/>
  <text x="24" y="40" class="title">monkeytype · ${esc(data.name ?? USER)}</text>
  <text x="24" y="76" class="stat">personal bests</text>
  ${rows}
  <line x1="24" y1="246" x2="476" y2="246" stroke="#646669" stroke-opacity=".4"/>
  <text x="24" y="272" class="stat">tests <tspan class="val">${t.completedTests ?? 0}</tspan>   time <tspan class="val">${hours}h</tspan>   streak <tspan class="val">${data.streak ?? 0}d</tspan></text>
</svg>`;

mkdirSync("public", { recursive: true });
writeFileSync("public/monkeytype-card.svg", svg);
console.log("card written");
