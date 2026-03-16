'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export function CategoryChart({ data }: { data: { name: string; count: number }[] }) {
  // 28px per row + 40px for the x-axis, minimum 200px
  const chartHeight = Math.max(200, data.length * 28 + 40);

  return (
    <div className="rounded-xl border p-4">
      <h3 className="text-sm font-medium text-muted-foreground mb-3">Prompt categories</h3>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 10 }}>
          <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
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
          <Bar dataKey="count" fill="var(--primary)" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
