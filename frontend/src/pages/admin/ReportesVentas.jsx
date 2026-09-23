import { useEffect, useState } from 'react';
import api from '../../services/api';

const formatCurrency = (value) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

function ReportesVentas() {
  const [reporte, setReporte] = useState(null);
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);

  const loadReport = async (selectedDate = fecha) => {
    try {
      setLoading(true);
      const response = await api.get(`/reportes/ventas/diario?fecha=${selectedDate}`);
      setReporte(response.data || null);
    } catch (error) {
      console.error('Error cargando reporte', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport(fecha);
  }, []);

  const openExport = (type) => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
    const token = localStorage.getItem('mitienda_token') || sessionStorage.getItem('mitienda_token') || '';
    const tokenParam = token ? `&token=${encodeURIComponent(token)}` : '';
    window.open(`${baseUrl}/reportes/ventas/${type}?fecha=${fecha}${tokenParam}`, '_blank');
  };

  if (loading) {
    return <div className="py-10 text-center text-slate-500">Generando reporte...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Reportes de Ventas</h1>
          <p className="text-sm text-slate-500">Reporte diario con exportación a PDF y Excel.</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2"
          />
          <button type="button" onClick={() => loadReport(fecha)} className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white">
            Consultar
          </button>
        </div>
      </div>

      {reporte ? (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
              <p className="text-xs uppercase text-slate-400">Operaciones</p>
              <p className="mt-2 text-2xl font-bold text-slate-800">{reporte.resumen?.total_operaciones || 0}</p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
              <p className="text-xs uppercase text-slate-400">Subtotal</p>
              <p className="mt-2 text-lg font-bold text-slate-800">{formatCurrency(reporte.resumen?.subtotal || 0)}</p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
              <p className="text-xs uppercase text-slate-400">Impuestos</p>
              <p className="mt-2 text-lg font-bold text-slate-800">{formatCurrency(reporte.resumen?.impuestos || 0)}</p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
              <p className="text-xs uppercase text-slate-400">Total</p>
              <p className="mt-2 text-lg font-bold text-slate-800">{formatCurrency(reporte.resumen?.total_recaudado || 0)}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={() => openExport('pdf')} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
              Exportar PDF
            </button>
            <button type="button" onClick={() => openExport('excel')} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
              Exportar Excel
            </button>
          </div>
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          No hay ventas para este día.
        </div>
      )}
    </div>
  );
}

export default ReportesVentas;
