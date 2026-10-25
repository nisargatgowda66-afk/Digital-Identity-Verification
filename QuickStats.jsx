import React from 'react';
import { 
  Users, 
  ShieldCheck, 
  ShieldAlert, 
  Layers, 
  CheckCircle2
} from 'lucide-react';

export default function QuickStats({ stats, onSelectTab }) {
  if (!stats) return null;

  const totalIdentities = stats.total_identities || 0;
  const totalVerifications = stats.total_verifications || 0;
  const validVerifications = stats.valid_verifications || 0;
  const tamperedAttempts = stats.tampered_attempts || 0;
  const chainLength = stats.simulated_chain?.chain_length || 1;
  const isValid = stats.simulated_chain?.is_valid !== false;

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 mb-8">
      
      {/* Total Identities */}
      <div 
        onClick={() => onSelectTab('identities')}
        className="glass-panel glass-panel-hover p-4 rounded-xl cursor-pointer group"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-400">Total Identities</span>
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-white tracking-tight font-heading">
          {totalIdentities}
        </div>
        <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400"></span>
          Registered On-Chain
        </p>
      </div>

      {/* Total Verifications */}
      <div 
        onClick={() => onSelectTab('history')}
        className="glass-panel glass-panel-hover p-4 rounded-xl cursor-pointer group"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-400">Verifications Run</span>
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:scale-110 transition-transform">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-white tracking-tight font-heading">
          {totalVerifications}
        </div>
        <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
          Audit Trails Logged
        </p>
      </div>

      {/* Valid Verifications */}
      <div 
        onClick={() => onSelectTab('history')}
        className="glass-panel glass-panel-hover p-4 rounded-xl cursor-pointer group"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-400">Valid Matches</span>
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-emerald-400 tracking-tight font-heading">
          {validVerifications}
        </div>
        <p className="text-[11px] text-emerald-400/80 mt-1 flex items-center gap-1">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          Hash Match 100%
        </p>
      </div>

      {/* Tampered Alerts */}
      <div 
        onClick={() => onSelectTab('history')}
        className="glass-panel glass-panel-hover p-4 rounded-xl cursor-pointer group"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-400">Tamper Alerts</span>
          <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 group-hover:scale-110 transition-transform">
            <ShieldAlert className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-rose-400 tracking-tight font-heading">
          {tamperedAttempts}
        </div>
        <p className="text-[11px] text-rose-400/80 mt-1 flex items-center gap-1">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-400"></span>
          Fraud / Alteration Blocked
        </p>
      </div>

      {/* Block Height & Integrity */}
      <div 
        onClick={() => onSelectTab('explorer')}
        className="col-span-2 md:col-span-1 glass-panel glass-panel-hover p-4 rounded-xl cursor-pointer group"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-400">Block Height</span>
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition-transform">
            <Layers className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-white tracking-tight font-heading">
          #{chainLength - 1}
        </div>
        <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          {isValid ? 'Chain 100% Valid' : 'Integrity Error'}
        </p>
      </div>

    </div>
  );
}
