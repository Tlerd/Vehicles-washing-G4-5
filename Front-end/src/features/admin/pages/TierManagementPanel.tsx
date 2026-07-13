import { Check } from 'lucide-react';

export function TierManagementPanel() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-slate-900/40 border border-slate-800 p-4 rounded-xl">
        <div>
          <h2 className="text-lg font-bold text-white">Loyalty Tier Configuration</h2>
          <p className="text-xs text-slate-400 mt-1">Configure multiplier rates and thresholds for member upgrades.</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-md transition-all flex items-center gap-2">
          <Check className="w-4 h-4" /> Save Configuration
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Member Tier */}
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex flex-col gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-slate-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex justify-between items-start">
            <span className="px-2.5 py-1 bg-slate-800 text-slate-300 border border-slate-700 rounded text-[10px] font-extrabold uppercase tracking-wider">Member</span>
            <span className="text-slate-400 text-[10px] font-semibold">Default</span>
          </div>
          
          <div className="space-y-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Point Multiplier (Kh)</label>
              <input type="number" step="0.1" defaultValue={1.0} className="bg-slate-950 border border-slate-800 px-3 py-2 text-xs rounded-lg text-slate-200 focus:outline-none focus:border-blue-500 font-mono" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Washes Required</label>
              <input type="number" defaultValue={0} disabled className="bg-slate-950/50 border border-slate-800/50 px-3 py-2 text-xs rounded-lg text-slate-500 cursor-not-allowed font-mono" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Spend Required (VND)</label>
              <input type="text" defaultValue="0" disabled className="bg-slate-950/50 border border-slate-800/50 px-3 py-2 text-xs rounded-lg text-slate-500 cursor-not-allowed font-mono" />
            </div>
          </div>
        </div>

        {/* Silver Tier */}
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex flex-col gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-slate-400/20 rounded-full blur-xl pointer-events-none" />
          <div className="flex justify-between items-start">
            <span className="px-2.5 py-1 bg-slate-400/10 text-slate-300 border border-slate-400/20 rounded text-[10px] font-extrabold uppercase tracking-wider">Silver</span>
          </div>
          
          <div className="space-y-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Point Multiplier (Kh)</label>
              <input type="number" step="0.1" defaultValue={1.1} className="bg-slate-950 border border-slate-800 px-3 py-2 text-xs rounded-lg text-slate-200 focus:outline-none focus:border-blue-500 font-mono" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Washes Required</label>
              <input type="number" defaultValue={5} className="bg-slate-950 border border-slate-800 px-3 py-2 text-xs rounded-lg text-slate-200 focus:outline-none focus:border-blue-500 font-mono" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Spend Required (VND)</label>
              <input type="text" defaultValue="2,000,000" className="bg-slate-950 border border-slate-800 px-3 py-2 text-xs rounded-lg text-slate-200 focus:outline-none focus:border-blue-500 font-mono" />
            </div>
          </div>
        </div>

        {/* Gold Tier */}
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex flex-col gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex justify-between items-start">
            <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded text-[10px] font-extrabold uppercase tracking-wider">Gold</span>
          </div>
          
          <div className="space-y-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Point Multiplier (Kh)</label>
              <input type="number" step="0.1" defaultValue={1.2} className="bg-slate-950 border border-slate-800 px-3 py-2 text-xs rounded-lg text-slate-200 focus:outline-none focus:border-blue-500 font-mono" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Washes Required</label>
              <input type="number" defaultValue={15} className="bg-slate-950 border border-slate-800 px-3 py-2 text-xs rounded-lg text-slate-200 focus:outline-none focus:border-blue-500 font-mono" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Spend Required (VND)</label>
              <input type="text" defaultValue="6,000,000" className="bg-slate-950 border border-slate-800 px-3 py-2 text-xs rounded-lg text-slate-200 focus:outline-none focus:border-blue-500 font-mono" />
            </div>
          </div>
        </div>

        {/* Platinum Tier */}
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex flex-col gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex justify-between items-start">
            <span className="px-2.5 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded text-[10px] font-extrabold uppercase tracking-wider">Platinum</span>
          </div>
          
          <div className="space-y-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Point Multiplier (Kh)</label>
              <input type="number" step="0.1" defaultValue={1.3} className="bg-slate-950 border border-slate-800 px-3 py-2 text-xs rounded-lg text-slate-200 focus:outline-none focus:border-blue-500 font-mono" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Washes Required</label>
              <input type="number" defaultValue={30} className="bg-slate-950 border border-slate-800 px-3 py-2 text-xs rounded-lg text-slate-200 focus:outline-none focus:border-blue-500 font-mono" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Spend Required (VND)</label>
              <input type="text" defaultValue="15,000,000" className="bg-slate-950 border border-slate-800 px-3 py-2 text-xs rounded-lg text-slate-200 focus:outline-none focus:border-blue-500 font-mono" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
