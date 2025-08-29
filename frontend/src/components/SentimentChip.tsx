import React from 'react';


const sentimentMap: Record<string, { label: string; color: string; icon: string; aria: string }> = {
  positive: { label: 'Positive', color: 'bg-green-100 text-green-800', icon: '😊', aria: 'Sentiment positive' },
  neutral: { label: 'Neutral', color: 'bg-gray-100 text-gray-800', icon: '😐', aria: 'Sentiment neutral' },
  negative: { label: 'Negative', color: 'bg-red-100 text-red-800', icon: '😢', aria: 'Sentiment negative' },
};

export const SentimentChip: React.FC<{ sentiment: 'positive' | 'neutral' | 'negative' }> = ({ sentiment }) => {
  const s = sentimentMap[sentiment];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${s.color}`} aria-label={s.aria} role="status">
      <span className="mr-1" aria-hidden>{s.icon}</span>
      {s.label}
    </span>
  );
};
