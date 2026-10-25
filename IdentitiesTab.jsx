import React, { useState } from 'react';
import { 
  Database, 
  Search, 
  Copy, 
  Check, 
  ArrowRight, 
  ShieldCheck, 
  User
} from 'lucide-react';

export default function IdentitiesTab({ identities, onNavigateToVerify }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const documentTypes = ['ALL', ...new Set(identities.map(i => i.document_type))];

  const filtered = identities.filter(item => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      item.identity_id.toLowerCase().includes(term) ||
      item.full_name.toLowerCase().includes(term) ||
      item.email.toLowerCase().includes(term) ||
      item.document_hash.toLowerCase().includes(term);
    const matchesType = selectedType === 'ALL' || item.document_type === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      
      {/* Tab Header Banner */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
          <Database className="w-3.5 h-3.5" />
          <span>Decentralized On-Chain Identity Registry</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-heading">
          Registered Digital Identities
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl mx-auto">
          Catalog of all verified digital credentials anchored to the blockchain. 
          Auditors and verifiers can select any identity to run instant cryptographic verification.
        </p>
      </div>

      {/* Search and Filters Bar */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by ID, name, email, or hash..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2 text-xs text-slate-400 hover:text-slate-200"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full md:w-auto no-scrollbar py-1">
          {documentTypes.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                selectedType === type
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

      </div>

      {/* Identities Table / Cards */}
      <div className="space-y-3">
        {filtered.map((item) => (
          <div 
            key={item.id}
            className="glass-panel glass-panel-hover p-5 rounded-2xl border-slate-800 space-y-4"
          >
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600/20 to-indigo-600/20 border border-blue-500/20 flex items-center justify-center text-cyan-400 font-mono font-bold text-sm">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-cyan-300 text-sm">{item.identity_id}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {item.document_type}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-mono">
                      Block #{item.block_number}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-0.5 font-heading">
                    {item.full_name}
                  </h3>
                  <p className="text-xs text-slate-400">{item.email}</p>
                </div>
              </div>

              <button
                onClick={() => onNavigateToVerify(item.identity_id)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white flex items-center space-x-1.5 shadow-md shadow-blue-500/20 transition"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verify This ID</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Document Hash and Meta */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-800/80 text-xs font-mono">
              
              <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-500 block">Immutable SHA-256 Hash:</span>
                  <span className="text-emerald-400 truncate block text-[11px]">{item.document_hash}</span>
                </div>
                <button
                  onClick={() => handleCopy(item.document_hash, item.id)}
                  className="p-1 hover:text-white text-slate-400 transition shrink-0"
                  title="Copy SHA-256 hash"
                >
                  {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center justify-between text-slate-400">
                <div className="truncate">
                  <span className="text-[10px] text-slate-500 block">File:</span>
                  <span className="text-slate-300 truncate text-[11px]">{item.document_filename}</span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-500 block">Mode:</span>
                  <span className="text-cyan-400 text-[11px]">{item.blockchain_mode}</span>
                </div>
              </div>

            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400 glass-panel rounded-2xl">
            <p>No identities found matching the filter criteria.</p>
          </div>
        )}
      </div>

    </div>
  );
}
