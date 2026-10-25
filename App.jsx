import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import QuickStats from './components/QuickStats';
import VerifyTab from './components/VerifyTab';
import RegisterTab from './components/RegisterTab';
import IdentitiesTab from './components/IdentitiesTab';
import ExplorerTab from './components/ExplorerTab';
import HistoryTab from './components/HistoryTab';
import ContractTab from './components/ContractTab';

import { 
  fetchStats, 
  fetchBlockchain, 
  fetchIdentities, 
  fetchHistory, 
  seedSampleData 
} from './api';
import { ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('verify');
  const [stats, setStats] = useState(null);
  const [blockchainData, setBlockchainData] = useState(null);
  const [identities, setIdentities] = useState([]);
  const [history, setHistory] = useState([]);
  const [prefillVerifyId, setPrefillVerifyId] = useState('');
  const [seeding, setSeeding] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadAllData = async () => {
    try {
      const [sData, bData, iData, hData] = await Promise.all([
        fetchStats().catch(err => { console.warn(err); return null; }),
        fetchBlockchain().catch(err => { console.warn(err); return null; }),
        fetchIdentities().catch(err => { console.warn(err); return []; }),
        fetchHistory().catch(err => { console.warn(err); return []; }),
      ]);

      if (sData) setStats(sData);
      if (bData) setBlockchainData(bData);
      if (iData) setIdentities(iData);
      if (hData) setHistory(hData);
    } catch (err) {
      console.error('Error loading data:', err);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleSeedData = async () => {
    setSeeding(true);
    try {
      const res = await seedSampleData();
      showToast(res.message || 'Seeded fictional sample identities successfully!');
      await loadAllData();
    } catch (err) {
      showToast(err.message || 'Failed to seed sample data', 'error');
    } finally {
      setSeeding(false);
    }
  };

  const handleNavigateToVerify = (id) => {
    setPrefillVerifyId(id);
    setActiveTab('verify');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      
      {/* Toast Notification Banner */}
      {toast && (
        <div className="fixed top-24 right-4 z-50 animate-in slide-in-from-top-5 duration-200 max-w-md">
          <div className={`p-4 rounded-xl shadow-2xl border flex items-center space-x-3 ${
            toast.type === 'error'
              ? 'bg-rose-950/90 border-rose-500/40 text-rose-200'
              : 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
          }`}>
            {toast.type === 'error' ? (
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
            ) : (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
            )}
            <span className="text-xs font-semibold">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Main Navigation Header */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        stats={stats} 
        onSeedData={handleSeedData}
        seeding={seeding}
        onRefresh={() => {
          loadAllData();
          showToast('Refreshed live on-chain data');
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Quick KPI Stats Bar */}
        <QuickStats stats={stats} onSelectTab={setActiveTab} />

        {/* Dynamic Tab Views */}
        <div className="mt-4">
          {activeTab === 'verify' && (
            <VerifyTab 
              onVerified={loadAllData} 
              prefillId={prefillVerifyId} 
            />
          )}

          {activeTab === 'register' && (
            <RegisterTab 
              onRegistered={loadAllData}
              onNavigateToVerify={handleNavigateToVerify}
            />
          )}

          {activeTab === 'identities' && (
            <IdentitiesTab 
              identities={identities}
              onNavigateToVerify={handleNavigateToVerify}
            />
          )}

          {activeTab === 'explorer' && (
            <ExplorerTab 
              blockchainData={blockchainData} 
              onRefresh={loadAllData}
            />
          )}

          {activeTab === 'history' && (
            <HistoryTab 
              history={history}
            />
          )}

          {activeTab === 'node' && (
            <ContractTab 
              stats={stats} 
              onRefresh={loadAllData}
            />
          )}
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 text-xs text-slate-500 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-400 font-semibold">
              Digital Identity Verification Using Blockchain
            </span>
            <span>•</span>
            <span>SHA-256 Cryptographic Hashing & Smart Contracts</span>
          </div>

          <div className="flex items-center space-x-4">
            <span>Proof of Work Consensus</span>
            <span>•</span>
            <span>Zero-PII On-Chain</span>
            <span>•</span>
            <span className="text-slate-400 font-mono">SQLite + FastAPI + React Vite</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default App;
