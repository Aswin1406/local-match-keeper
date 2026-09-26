import { STAT_COLS, sortStats } from "@/lib/playerStats";
export function PlayerStatsTable({ stats, sport, showApps = false, showTeam = false, }) {
    if (stats.length === 0)
        return <p className="text-[11px] text-mist">No players added.</p>;
    const cols = STAT_COLS[sport];
    return (<div className="overflow-x-auto">
      <table className="w-full text-[12px]">
        <thead>
          <tr className="text-[10px] uppercase tracking-[0.12em] text-mist">
            <th className="py-1.5 text-left font-semibold">Player</th>
            {showApps ? <th className="py-1.5 px-1.5 text-right font-semibold">Apps</th> : null}
            {cols.map((c) => (<th key={c.key} className="py-1.5 px-1.5 text-right font-semibold">
                {c.label}
              </th>))}
          </tr>
        </thead>
        <tbody>
          {sortStats(stats, sport).map((s) => (<tr key={`${s.team}-${s.name}`} className="border-t border-white/6">
              <td className="py-2 pr-2">
                <span className="font-semibold text-ink">{s.name}</span>
                {showTeam ? <span className="block text-[10px] text-mist">{s.team}</span> : null}
              </td>
              {showApps ? <td className="py-2 px-1.5 text-right tabular-nums">{s.appearances}</td> : null}
              {cols.map((c) => {
                const v = s[c.key];
                const tone = c.key === "yellow" && v ? "text-yellow-card" : c.key === "red" && v ? "text-red-card" : v ? "text-ink" : "text-mist";
                return (<td key={c.key} className={`py-2 px-1.5 text-right tabular-nums font-bold ${tone}`}>
                    {v}
                  </td>);
            })}
            </tr>))}
        </tbody>
      </table>
    </div>);
}
