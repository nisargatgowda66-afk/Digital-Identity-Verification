import React, { useState } from 'react';
import { 
  Activity, 
  CheckCircle2, 
  ShieldAlert, 
  AlertTriangle, 
  Clock, 
  Hash, 
  Filter,
  Search,
  ExternalLink
} from 'lucide-react';

export default function HistoryTab({ history }) {
  const [filter, setFilter] = useState('ALL'); // ALL, VALID, TAMPERED, NOT_FOUND
  const [search, setSearch] = useState('');

  const filteredLogs = history.filter(item => {
    // Status filter
    if (filter === 'VALID' && !item.is_valid) return false;
    if (filter === 'TAMPERED' && (item.is_valid || !item.expected_hash)) return false;
    if (filter === 'NOT_FOUND' && item.expected_hash) return false;

    // Search query
    if (search) {
      const term = search.toLowerCase();
      const matchesId = item.identity_id.toLowerCase().includes(term);
      const matchesName = item.full_name?.toLowerCase().includes(term);
      const matchesMsg = item.status_message?.toLowerCase().includes(term);
      return matchesId || matchesName || matchesMsg;
    }
    return true;
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      
      {/* Tab Header Banner */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
          <Activity className="w-3.5 h-3.5" />
          <span>Tamper-Evident Verification Audit Trail</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-heading">
          Verification Audit History
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl mx-auto">
          Every document verification is cryptographically audited and recorded into an immutable audit trail.
          Detect tamper attempts and track authentic verification logs.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search audit logs by ID or name..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              filter === 'ALL'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-900/80 text-slate-400 hover:text-white'
            }`}
          >
            All Logs ({history.length})
          </button>
          
          <button
            onClick={() => setFilter('VALID')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1 ${
              filter === 'VALID'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-900/80 text-emerald-400 hover:text-emerald-300'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Valid Matches</span>
          </button>

          <button
            onClick={() => setFilter('TAMPERED')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1 ${
              filter === 'TAMPERED'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-900/80 text-rose-400 hover:text-rose-300'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Tamper Alerts</span>
          </button>
        </div>

      </div>

      {/* Log Feed */}
      <div className="space-y-3">
        {filteredLogs.map((log) => {
          const isValid = log.is_valid;
          const isTampered = !isValid && log.expected_hash;
          const isNotFound = !isValid && !log.expected_hash;

          return (
            <div 
              key={log.id}
              className={`glass-panel p-5 rounded-2xl border transition space-y-3 ${
                isValid 
                  ? 'border-emerald-500/30 hover:border-emerald-500/50' 
                  : isTampered 
                  ? 'border-rose-500/40 hover:border-rose-500/60 bg-rose-950/10' 
                  : 'border-amber-500/30'
              }`}
            >
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div className="flex items-center space-x-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    isValid 
                      ? 'bg-emerald-500/20 text-emerald-400' 
                      : isTampered 
                      ? 'bg-rose-500/20 text-rose-400' 
                      : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {isValid && <CheckCircle2 className="w-5 h-5" />}
                    {isTampered && <ShieldAlert className="w-5 h-5" />}
                    {isNotFound && <AlertTriangle className="w-5 h-5" />}
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-white text-sm">
                        {log.identity_id}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isValid 
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                          : isTampered 
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {isValid ? 'VALID' : isTampered ? 'TAMPER ALERT' : 'NOT FOUND'}
                      </span>
                    </div>
                    <span className="text-xs text-slate-300">Holder: {log.full_name}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-xs text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>{log.verified_at}</span>
                </div>
              </div>

              {/* Status Message */}
              <p className={`text-xs leading-relaxed ${
                isValid ? 'text-slate-300' : isTampered ? 'text-rose-300 font-medium' : 'text-amber-300'
              }`}>
                {log.status_message}
              </p>

              {/* Hashes Comparison Box */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono pt-1">
                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block mb-0.5">Provided Document Hash:</span>
                  <span className={`break-all text-[11px] ${isValid ? 'text-emerald-300' : 'text-rose-300'}`}>
                    {log.provided_hash}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block mb-0.5">Expected On-Chain Hash:</span>
                  <span className="text-slate-300 break-all text-[11px]">
                    {log.expected_hash || 'None (Identity not in registry)'}
                  </span>
                </div>
              </div>

            </div>
          );
        })}

        {filteredLogs.length === 0 && (
          <div className="text-center py-12 text-slate-400 glass-panel rounded-2xl">
            <p>No audit logs matching this filter.</p>
          </div>
        )}
      </div>

    </div>
  );
}
