import React, { useState } from 'react';
import { analyzeProjectHealth, exportProjectReport, AiInsights } from '../../services/aiService';
import { BrainCircuit, AlertTriangle, CheckCircle, FileText, Download, Activity, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AiInsightsTabProps {
  projectId: string;
}

export default function AiInsightsTab({ projectId }: AiInsightsTabProps) {
  const [insights, setInsights] = useState<AiInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const { token } = useAuth();

  const handleAnalyze = async () => {
    try {
      if (!token) throw new Error('Not authorized, no token found');
      setLoading(true);
      setError('');
      const data = await analyzeProjectHealth(projectId, token);
      setInsights(data);
    } catch (err: any) {
      setError(err.message || 'Failed to generate AI insights.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      if (!token) throw new Error('Not authorized, no token found');
      setExporting(true);
      const reportContent = await exportProjectReport(projectId, token);
      
      const blob = new Blob([reportContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `BhoomiSetu_Report_${projectId}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || 'Failed to export report.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BrainCircuit className="w-6 h-6 text-indigo-600" />
            AI Decision Support
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Generate automated insights, identify critical blockers, and export official administrative reports.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-70"
          >
            {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Activity className="w-5 h-5" />}
            {insights ? 'Refresh Insights' : 'Analyze Project Health'}
          </button>
          
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-70 shadow-sm"
          >
            {exporting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            Export Official Report
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Insights Display */}
      {insights && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Dynamic Clearance Audit Cards */}
          {insights.metrics && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Parcels</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{insights.metrics.totalParcels}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Required corridor parcels</p>
              </div>

              <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 shadow-xs">
                <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Cleared & Possessed</p>
                <p className="text-2xl font-bold text-emerald-700 mt-1 flex items-baseline gap-1.5 flex-wrap">
                  <span>{insights.metrics.acquiredParcels}</span>
                  <span className="text-xs font-medium text-emerald-600">
                    ({insights.metrics.clearedParcelIds.join(', ') || 'None'})
                  </span>
                </p>
                <p className="text-[11px] text-emerald-700 font-medium mt-0.5">Disbursed & Handed Over</p>
              </div>

              <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 shadow-xs">
                <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Unacquired / Pending</p>
                <p className="text-2xl font-bold text-amber-700 mt-1 flex items-baseline gap-1.5 flex-wrap">
                  <span>{insights.metrics.unacquiredParcels}</span>
                  <span className="text-xs font-medium text-amber-600">
                    ({insights.metrics.unacquiredParcelIds.join(', ') || 'None'})
                  </span>
                </p>
                <p className="text-[11px] text-amber-700 font-medium mt-0.5">Strictly Notice / Stayed</p>
              </div>

              <div className="bg-rose-50/70 p-4 rounded-xl border border-rose-200 shadow-xs">
                <p className="text-xs font-semibold text-rose-800 uppercase tracking-wider">RoW Injunctions</p>
                <p className="text-2xl font-bold text-rose-700 mt-1 flex items-baseline gap-1.5 flex-wrap">
                  <span>{insights.metrics.activeDisputes}</span>
                  <span className="text-xs font-medium text-rose-600">
                    ({insights.metrics.disputedParcelIds.join(', ') || 'None'})
                  </span>
                </p>
                <p className="text-[11px] text-rose-700 font-medium mt-0.5">Sole corridor bottleneck</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Executive Summary (Full Width) */}
            <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-indigo-50 border-b border-indigo-100 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-indigo-900">Executive Summary</h3>
                </div>
                {insights.metrics && (
                  <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-100 text-indigo-800 rounded-full">
                    {insights.metrics.acquiredParcels}/{insights.metrics.totalParcels} Cleared
                  </span>
                )}
              </div>
              <div className="p-6">
                <p className="text-slate-700 leading-relaxed text-base md:text-lg">
                  {insights.executiveSummary}
                </p>
              </div>
            </div>

            {/* Critical Risk Factors */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-rose-50 border-b border-rose-100 px-6 py-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-rose-900">Critical Risk Factors</h3>
              </div>
              <div className="p-6">
                {insights.criticalRiskFactors && insights.criticalRiskFactors.length > 0 ? (
                  <ul className="space-y-3">
                    {insights.criticalRiskFactors.map((risk, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-slate-700 text-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-2"></span>
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500 italic">No critical risks identified.</p>
                )}
              </div>
            </div>

            {/* Recommended Actions */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-emerald-50 border-b border-emerald-100 px-6 py-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-emerald-900">Recommended Administrative Actions</h3>
              </div>
              <div className="p-6">
                {insights.recommendedActions && insights.recommendedActions.length > 0 ? (
                  <ul className="space-y-3">
                    {insights.recommendedActions.map((action, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-slate-700 text-sm">
                        <span className="w-5 h-5 shrink-0 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-xs font-bold mt-0.5">
                          {idx + 1}
                        </span>
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500 italic">No pending actions recommended.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {!insights && !loading && !error && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-12 flex flex-col items-center justify-center text-center">
          <BrainCircuit className="w-12 h-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-700 mb-2">No Insights Generated Yet</h3>
          <p className="text-sm text-slate-500 max-w-md">
            Click the "Analyze Project Health" button above to run the AI engine across the project's current dataset and generate an administrative brief.
          </p>
        </div>
      )}
    </div>
  );
}
