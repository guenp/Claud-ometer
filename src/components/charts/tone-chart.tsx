'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = [
  '#E8956E', // warm orange
  '#7B9AE6', // blue
  '#6CC88A', // green
  '#F0D07B', // gold
  '#AB7BF6', // purple
  '#E6737B', // rose
  '#5BC4C4', // teal
  '#C4A06E', // tan
  '#8B8B8B', // grey (for Other)
];

export function ToneChart({ data }: { data: { name: string; count: number }[] }) {
  return (
    <div className="rounded-xl border p-4">
      <h3 className="text-sm font-medium text-muted-foreground mb-3">Prompt tone</h3>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="name"
            innerRadius={60}
            outerRadius={100}
            strokeWidth={2}
            stroke="var(--card)"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              fontSize: '12px',
              color: 'var(--card-foreground)',
            }}
            itemStyle={{ color: 'var(--card-foreground)' }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-3 mt-2 justify-center text-xs text-muted-foreground">
        {data.map((d, i) => (
          <span key={d.name} className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: COLORS[i % COLORS.length] }} />
            {d.name} ({d.count})
          </span>
        ))}
      </div>
    </div>
  );
}
