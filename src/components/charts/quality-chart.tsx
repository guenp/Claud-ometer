'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Tooltip as UITooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

const SIGNAL_DESCRIPTIONS: Record<string, string> = {
  'Specificity': 'Concrete constraints: numbers, formats, named technologies, versions. Detected when 2+ specificity patterns match (e.g. "TypeScript function" + "50 lines").',
  'Examples / few-shot': 'Includes sample input/output, code blocks as demonstration, or phrases like "for example", "e.g.", "here\'s one". Ranked top-tier by Anthropic & OpenAI.',
  'Structured formatting': 'Uses markdown headers, bullet/numbered lists, XML tags, or labeled sections (e.g. "Requirements:"). Requires 20+ words. Anthropic recommends XML tags for multi-part prompts.',
  'Context / motivation': 'Background info: error messages, file paths, URLs, rationale ("because", "so that"), or 200+ characters of detail. Helps the model understand the full picture.',
};

export function QualityChart({ data }: { data: { name: string; pct: number }[] }) {
  return (
    <div className="rounded-xl border p-4">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-sm font-medium text-muted-foreground">Prompt quality signals</h3>
        <UITooltip>
          <TooltipTrigger asChild>
            <button className="p-0.5 rounded-md text-muted-foreground hover:text-foreground">
              <Info className="h-3 w-3" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-sm text-xs">
            <p className="font-semibold mb-1">What % of your prompts exhibit each signal:</p>
            <ul className="list-disc pl-3 space-y-1">
              {Object.entries(SIGNAL_DESCRIPTIONS).map(([name, desc]) => (
                <li key={name}><strong>{name}</strong> — {desc}</li>
              ))}
            </ul>
            <p className="mt-1.5 text-muted-foreground">Each signal contributes 25% to the overall quality score.</p>
          </TooltipContent>
        </UITooltip>
      </div>
      <ResponsiveContainer width="100%" height={Math.max(160, data.length * 36 + 40)}>
        <BarChart data={data} layout="vertical">
          <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
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
          <Bar dataKey="pct" radius={[0, 4, 4, 0]} fill="#6CC88A" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
