'use client';

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface QualityWeek {
  week: string;
  qualityScore: number;
  contextPct: number;
  specificAskPct: number;
  examplesPct: number;
  vaguePct: number;
}

export function QualityTimeline({ data }: { data: QualityWeek[] }) {
  return (
    <div className="rounded-xl border p-4">
      <h3 className="text-sm font-medium text-muted-foreground mb-3">Prompt quality over time</h3>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="qualScoreGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6CC88A" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6CC88A" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="vagueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#E6737B" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#E6737B" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="week"
            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => {
              const d = new Date(v);
              return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}%`}
          />
          <ReferenceLine y={50} stroke="var(--border)" strokeDasharray="4 4" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              fontSize: '12px',
              color: 'var(--card-foreground)',
            }}
            itemStyle={{ color: 'var(--card-foreground)' }}
            labelFormatter={(v) => {
              const d = new Date(v as string);
              return `Week of ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
            }}
            formatter={(value, name) => {
              const labels: Record<string, string> = {
                qualityScore: 'Quality score',
                contextPct: 'Has context',
                specificAskPct: 'Specific ask',
                vaguePct: 'Vague',
              };
              return [`${value}%`, labels[name as string] || name];
            }}
          />
          <Area type="monotone" dataKey="qualityScore" stroke="#6CC88A" fill="url(#qualScoreGrad)" strokeWidth={2} />
          <Area type="monotone" dataKey="contextPct" stroke="#7B9AE6" fill="transparent" strokeWidth={1.5} strokeDasharray="4 2" />
          <Area type="monotone" dataKey="specificAskPct" stroke="#F0D07B" fill="transparent" strokeWidth={1.5} strokeDasharray="4 2" />
          <Area type="monotone" dataKey="vaguePct" stroke="#E6737B" fill="url(#vagueGrad)" strokeWidth={1.5} />
        </AreaChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-4 mt-2 justify-center text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: '#6CC88A' }} />
          Quality score
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-0.5" style={{ background: '#7B9AE6', borderBottom: '2px dashed #7B9AE6' }} />
          Has context
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-0.5" style={{ background: '#F0D07B', borderBottom: '2px dashed #F0D07B' }} />
          Specific ask
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: '#E6737B' }} />
          Vague
        </span>
      </div>
    </div>
  );
}
