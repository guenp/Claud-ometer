'use client';

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export function ActivityTimeline({ data }: { data: { week: string; count: number }[] }) {
  return (
    <div className="rounded-xl border p-4">
      <h3 className="text-sm font-medium text-muted-foreground mb-3">Weekly prompt activity</h3>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="promptGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
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
          <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
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
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="var(--primary)"
            fill="url(#promptGradient)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
