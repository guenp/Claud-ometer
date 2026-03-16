'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export function QualityChart({ data }: { data: { name: string; pct: number }[] }) {
  return (
    <div className="rounded-xl border p-4">
      <h3 className="text-sm font-medium text-muted-foreground mb-3">Prompt quality signals</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ left: 140 }} layout="vertical">
          <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
          <Tooltip
            formatter={(v) => `${v}%`}
            contentStyle={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              fontSize: '12px',
              color: 'var(--card-foreground)',
            }}
            itemStyle={{ color: 'var(--card-foreground)' }}
          />
          <Bar dataKey="pct" radius={[0, 4, 4, 0]}>
            {data.map((d) => (
              <Cell
                key={d.name}
                fill={d.name.includes('Vague') ? 'hsl(0 70% 60%)' : 'hsl(160 50% 50%)'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
