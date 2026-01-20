import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  trend?: string;
  icon: React.ReactNode;
  color: 'blue' | 'purple' | 'green' | 'orange';
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, trend, icon, color }) => {
  const colorStyles = {
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    green: 'bg-emerald-50 text-emerald-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-slate-800 tracking-tight">{value}</h3>
          {trend && <p className="text-xs font-medium text-emerald-500 mt-2 flex items-center">
            ↗ {trend} <span className="text-slate-400 ml-1 font-normal">vs mes pasado</span>
          </p>}
        </div>
        <div className={`p-3 rounded-2xl ${colorStyles[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};