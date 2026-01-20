
import React, { useState, useMemo } from 'react';
import { UserData, WidgetUsage } from '../types';
import { exportToCSV } from '../services/dataservice';
import { FileSpreadsheet, Filter, Download, User } from 'lucide-react';

interface ReportsViewProps {
  users: UserData[];
  widgetUsage: WidgetUsage[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({ users, widgetUsage }) => {
  const [selectedUser, setSelectedUser] = useState<string>('all');

  // Filter data based on selection
  const filteredData = useMemo(() => {
    let data = widgetUsage;
    if (selectedUser !== 'all') {
      const user = users.find(u => u.id === selectedUser);
      // Filter by email since widgetUsage stores email
      if (user) {
        data = widgetUsage.filter(w => w.email === user.email);
      }
    }
    // Sort by date desc
    return [...data].sort((a, b) => {
       const dateA = a.startedAt?.toDate ? a.startedAt.toDate() : new Date(a.startedAt || 0);
       const dateB = b.startedAt?.toDate ? b.startedAt.toDate() : new Date(b.startedAt || 0);
       return dateB.getTime() - dateA.getTime();
    });
  }, [widgetUsage, selectedUser, users]);

  const handleDownload = () => {
    // Format for Excel
    const reportData = filteredData.map(w => {
      const dateObj = w.startedAt?.toDate ? w.startedAt.toDate() : new Date(w.startedAt);
      return {
        'ID Evento': w.id,
        'Usuario': w.email,
        'Herramienta (Widget)': w.widgetTitle || w.widgetId,
        'Fecha': dateObj.toLocaleDateString('es-MX'),
        'Hora': dateObj.toLocaleTimeString('es-MX'),
        'Duración (segundos)': w.duration
      };
    });

    const fileName = selectedUser === 'all' 
      ? `Reporte_General_${new Date().toISOString().split('T')[0]}`
      : `Reporte_${users.find(u => u.id === selectedUser)?.nombre || 'Usuario'}_${new Date().toISOString().split('T')[0]}`;
      
    exportToCSV(reportData, fileName);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white p-6 lg:p-8 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                <FileSpreadsheet size={24} />
              </div>
              Generador de Reportes
            </h2>
            <p className="text-slate-500 mt-1 ml-14">Descarga el historial de uso en formato Excel</p>
          </div>
          
          <button 
            onClick={handleDownload}
            disabled={filteredData.length === 0}
            className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={20} />
            <span className="font-semibold">Descargar Excel</span>
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-6">
          <div className="flex items-center gap-2 text-slate-500 font-medium">
            <Filter size={18} />
            <span>Filtrar por:</span>
          </div>
          <div className="relative flex-1 w-full md:w-auto">
            <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select 
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 appearance-none text-slate-700"
            >
              <option value="all">Todos los usuarios</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.nombre} ({u.email})</option>
              ))}
            </select>
          </div>
          <div className="text-sm text-slate-400">
            {filteredData.length} registros encontrados
          </div>
        </div>

        {/* Preview Table */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Usuario</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Herramienta</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Duración</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredData.length > 0 ? (
                  filteredData.slice(0, 50).map((row, i) => {
                     const dateObj = row.startedAt?.toDate ? row.startedAt.toDate() : new Date(row.startedAt || 0);
                     return (
                      <tr key={row.id || i} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 text-sm text-slate-600 whitespace-nowrap">
                          {dateObj.toLocaleDateString('es-MX')} <span className="text-slate-400 text-xs">{dateObj.toLocaleTimeString('es-MX')}</span>
                        </td>
                        <td className="p-4 text-sm font-medium text-slate-800">{row.email}</td>
                        <td className="p-4 text-sm text-slate-600">
                          <span className="inline-block px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold">
                            {row.widgetTitle || row.widgetId}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-slate-600 text-right">{row.duration}s</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-400">
                      No hay datos para mostrar con los filtros actuales.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {filteredData.length > 50 && (
              <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 border-t border-slate-100">
                Mostrando los primeros 50 registros de {filteredData.length}. Descarga el Excel para ver todos.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
