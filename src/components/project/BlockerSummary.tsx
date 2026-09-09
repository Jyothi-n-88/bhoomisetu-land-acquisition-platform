import React from 'react';
import { AlertCircle, AlertTriangle, Users, FileX } from 'lucide-react';

export default function BlockerSummary({ blockers }: { blockers: any }) {
  if (!blockers) return null;

  return (
    <div className="bg-rose-50 rounded-xl border border-rose-200 p-6 shadow-sm">
      <h3 className="text-sm font-bold uppercase tracking-widest text-rose-800 mb-4 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-rose-600" /> What is Blocking This Project?
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-rose-100 flex flex-col items-center text-center">
          <p className="text-3xl font-light text-rose-600 mb-1">{blockers.pendingCompensation}</p>
          <p className="text-xs text-slate-600 font-medium leading-tight">Parcels Pending<br/>Compensation</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-rose-100 flex flex-col items-center text-center">
          <p className="text-3xl font-light text-rose-600 mb-1">{blockers.activeDisputes}</p>
          <p className="text-xs text-slate-600 font-medium leading-tight">Active<br/>Legal Disputes</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-rose-100 flex flex-col items-center text-center">
          <p className="text-3xl font-light text-rose-600 mb-1">{blockers.pendingRnr}</p>
          <p className="text-xs text-slate-600 font-medium leading-tight">Families Pending<br/>R&R</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-rose-100 flex flex-col items-center text-center">
          <p className="text-3xl font-light text-rose-600 mb-1">{blockers.pendingPossession}</p>
          <p className="text-xs text-slate-600 font-medium leading-tight">Pending<br/>Possession</p>
        </div>
      </div>
    </div>
  );
}
