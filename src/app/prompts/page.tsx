'use client';

import { usePromptAnalytics } from '@/lib/hooks';
import { StatCard } from '@/components/cards/stat-card';
import { CategoryChart } from '@/components/charts/category-chart';
import { ToneChart } from '@/components/charts/tone-chart';
import { QualityChart } from '@/components/charts/quality-chart';
import { QualityTimeline } from '@/components/charts/quality-timeline';
import { ActivityTimeline } from '@/components/charts/activity-timeline';
import { TokenTimeline } from '@/components/charts/token-timeline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { MessageSquareText, AlignLeft, Tag, Award, Info } from 'lucide-react';
import type { PromptTip } from '@/lib/claude-data/types';

const IMPACT_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  high:   { bg: 'bg-red-500/10',    text: 'text-red-400',    label: 'High' },
  medium: { bg: 'bg-amber-500/10',  text: 'text-amber-400',  label: 'Medium' },
  low:    { bg: 'bg-green-500/10',  text: 'text-green-400',  label: 'Low' },
};

function TipsTable({ tips }: { tips: PromptTip[] }) {
  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Tips to improve your prompts</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="text-left py-2 pr-3 font-medium">Impact</th>
                <th className="text-left py-2 pr-3 font-medium">Area</th>
                <th className="text-left py-2 pr-3 font-medium">Observation</th>
                <th className="text-left py-2 font-medium">Suggestion</th>
              </tr>
            </thead>
            <tbody>
              {tips.map((tip) => {
                const style = IMPACT_STYLES[tip.impact] || IMPACT_STYLES.low;
                return (
                  <tr key={tip.area} className="border-b border-border/50 last:border-0">
                    <td className="py-3 pr-3 align-top">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${style.bg} ${style.text}`}>
                        {style.label}
                      </span>
                    </td>
                    <td className="py-3 pr-3 align-top font-medium whitespace-nowrap">{tip.area}</td>
                    <td className="py-3 pr-3 align-top text-muted-foreground">{tip.observation}</td>
                    <td className="py-3 align-top">{tip.suggestion}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PromptsPage() {
  const { data, isLoading } = usePromptAnalytics();

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold tracking-tight">Prompt analytics</h1>

      <div className="grid grid-cols-4 gap-3">
        <StatCard title="Total prompts" value={String(data.totalPrompts)} icon={MessageSquareText} />
        <StatCard title="Avg length" value={`${data.avgLength} chars`} icon={AlignLeft} />
        <StatCard title="Top category" value={data.topCategory} icon={Tag} />
        <div className="relative">
          <StatCard title="All-time quality score" value={data.qualityScore} icon={Award} />
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="absolute top-3 right-12 p-1 rounded-md text-muted-foreground hover:text-foreground">
                <Info className="h-3 w-3" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs text-xs">
              <p>Weighted composite of 4 signals across all prompts:</p>
              <ul className="mt-1 list-disc pl-3 space-y-0.5">
                <li><strong>Specificity</strong> (30%) — concrete constraints, numbers, formats</li>
                <li><strong>Context</strong> (30%) — code blocks, errors, file references</li>
                <li><strong>Task clarity</strong> (30%) — clear action verbs or questions</li>
                <li><strong>Vague</strong> (−10%) — penalizes very short, unfocused prompts</li>
              </ul>
              <p className="mt-1 text-muted-foreground">Covers all sessions in ~/.claude/</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <CategoryChart data={data.categories || []} />
        <ToneChart data={data.tones || []} />
      </div>

      <QualityChart data={data.qualityBreakdown || []} />
      <QualityTimeline data={data.weeklyQuality || []} />
      <ActivityTimeline data={data.weeklyActivity || []} />
      <TokenTimeline data={data.weeklyTokens || []} />

      {data.tips && data.tips.length > 0 && <TipsTable tips={data.tips} />}
    </div>
  );
}
