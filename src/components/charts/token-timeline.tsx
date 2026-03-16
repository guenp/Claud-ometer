'use client';

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

function formatTokens(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
}

export function TokenTimeline({ data }: { data: { week: string; input: number; output: number; total: number }[] }) {
  return (
    <div className="rounded-xl border p-4">
      <h3 className="text-sm font-medium text-muted-foreground mb-3">Weekly token usage</h3>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="inputGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#7B9AE6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#7B9AE6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="outputGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6CC88A" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6CC88A" stopOpacity={0} />
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
            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={formatTokens}
          />
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
            formatter={(value, name) => [formatTokens(Number(value)), name === 'input' ? 'Input tokens' : 'Output tokens']}
          />
          <Area
            type="monotone"
            dataKey="input"
            stackId="1"
            stroke="#7B9AE6"
            fill="url(#inputGradient)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="output"
            stackId="1"
            stroke="#6CC88A"
            fill="url(#outputGradient)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
      <div className="flex gap-4 mt-2 justify-center text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: '#7B9AE6' }} />
          Input tokens
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: '#6CC88A' }} />
          Output tokens
        </span>
      </div>
    </div>
  );
}
