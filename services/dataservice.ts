import { UserData, WidgetUsage } from '../types';

export const processWidgetData = (usageData: WidgetUsage[]) => {
  const counts: Record<string, number> = {};
  usageData.forEach(item => {
    // Use title if available, otherwise widgetId
    const key = item.widgetTitle || item.widgetId;
    counts[key] = (counts[key] || 0) + 1;
  });

  return Object.keys(counts).map(key => ({
    name: key,
    value: counts[key]
  })).sort((a, b) => b.value - a.value).slice(0, 5); // Top 5
};

export const processActivityTimeline = (usageData: WidgetUsage[]) => {
  const timeline: Record<string, number> = {};
  
  usageData.forEach(item => {
    if (!item.startedAt) return;
    // Assuming Firestore timestamp or Date object
    const date = item.startedAt.toDate ? item.startedAt.toDate() : new Date(item.startedAt);
    const dateStr = date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
    timeline[dateStr] = (timeline[dateStr] || 0) + 1;
  });

  return Object.keys(timeline).map(key => ({
    date: key,
    activaciones: timeline[key]
  }));
};

export const exportToCSV = (data: any[], filename: string) => {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(fieldName => {
        const val = row[fieldName];
        // Handle dates and strings properly
        if (val instanceof Date) return `"${val.toLocaleString()}"`;
        if (typeof val === 'string') return `"${val.replace(/"/g, '""')}"`; // Escape quotes
        return val;
    }).join(','))
  ].join('\n');

  // Add BOM for Excel to read UTF-8 correctly
  const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};