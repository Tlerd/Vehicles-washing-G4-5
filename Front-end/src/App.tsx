import React from 'react';
import { Car, ShieldCheck, Database, LayoutGrid } from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen bg-[#031427] text-slate-100 flex flex-col items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-[#020b16]/60 backdrop-blur-md border border-slate-800/80 p-8 rounded-3xl shadow-2xl flex flex-col items-center text-center">
        
        {/* Logo Icon */}
        <div className="w-16 h-16 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(249,115,22,0.1)]">
          <Car className="w-8 h-8 text-orange-500" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-extrabold text-white tracking-tight">
          AutoWash <span className="text-orange-500">Pro</span>
        </h1>
        <p className="text-slate-400 text-xs mt-1.5 font-medium tracking-wide uppercase">
          Smart Car Wash & Loyalty Program
        </p>

        {/* Divider */}
        <div className="w-12 h-[1px] bg-slate-800 my-6"></div>

        {/* Status Message */}
        <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-1.5 mb-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" /> Project Reset Successfully
        </h2>
        <p className="text-slate-400 text-xs leading-relaxed max-w-xs mb-8">
          The codebase has been reset to clean boilerplate. All mock data has been removed. We are ready to build the new architecture.
        </p>

        {/* Next Steps List */}
        <div className="w-full text-left bg-slate-950/40 border border-slate-850 p-4 rounded-2xl space-y-3.5 mb-6">
          <div className="flex gap-3">
            <Database className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-slate-200">1. Back-end APIs</p>
              <p className="text-[10px] text-slate-500">Implement Login & Role Authorization in Spring Boot.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <LayoutGrid className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-slate-200">2. Front-end Integration</p>
              <p className="text-[10px] text-slate-500">Build authentication forms and fetch real backend data.</p>
            </div>
          </div>
        </div>

        {/* Info Label */}
        <span className="text-[10px] font-mono text-slate-600 bg-slate-900/50 px-3 py-1 rounded-full border border-slate-850">
          SU26SWP08 • Group 4 & 5
        </span>
      </div>
    </div>
  );
}
