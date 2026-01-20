
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { WidgetUsage, UserData } from '../types';
import { processWidgetData, processActivityTimeline, exportToCSV } from '../services/dataservice';
import { Download, Activity, Clock } from 'lucide-react';

interface AnalyticsProps {
  users: UserData[];
  widgetUsage: WidgetUsage[];
}

const COLORS = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

export const AnalyticsDashboard: React.FC<AnalyticsProps> = ({ users, widgetUsage }) => {
  const widgetData = useMemo(() => processWidgetData(widgetUsage), [widgetUsage]);
  const activityData = useMemo(() => processActivityTimeline(widgetUsage), [widgetUsage]);

  const handleDownloadReport = () => {
    // Flatten data for report
    const reportData = widgetUsage.map(w => ({
      Usuario: w.email,
      Widget: w.widgetTitle || w.widgetId,
      Fecha: w.startedAt?.toDate ? w.startedAt.toDate().toLocaleString() : new Date(w.startedAt).toLocaleString(),
      DuracionSegundos: w.duration
    }));
    exportToCSV(reportData, `Reporte_Actividad_${new Date().toISOString().split('T')[0]}`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Reporte de Actividad</h2>
          <p className="text-slate-500">Métricas de uso y comportamiento de usuarios</p>
        </div>
        <button 
          onClick={handleDownloadReport}
          className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
        >
          <Download size={18} />
          <span>Exportar CSV</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Widget Popularity Chart */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <Activity size={20} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Widgets Más Usados</h3>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={widgetData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {widgetData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {widgetData.map((entry, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-slate-600">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                {entry.name} ({entry.value})
              </div>
            ))}
          </div>
        </div>

        {/* Activity Over Time */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
             <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
              <Clock size={20} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Actividad Reciente</h3>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }} 
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="activaciones" fill="#8b5cf6" radius={[6, 6, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
