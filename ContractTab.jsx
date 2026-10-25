import React, { useState } from 'react';
import { 
  Server, 
  CheckCircle2, 
  ShieldCheck, 
  FileCode, 
  Copy, 
  Check, 
  Lock,
  ArrowRight
} from 'lucide-react';
import { setBlockchainMode, deploySmartContract } from '../api';

export default function ContractTab({ stats, onRefresh }) {
  const [deploying, setDeploying] = useState(false);
  const [deployResult, setDeployResult] = useState(null);
  const [deployError, setDeployError] = useState(null);
  const [copiedAddr, setCopiedAddr] = useState(false);
  const [changingMode, setChangingMode] = useState(false);

  const ganache = stats?.ganache_node || {};
  const currentMode = stats?.blockchain_mode || 'AUTO';
  const isGanacheConnected = ganache.connected === true;

  const handleModeChange = async (mode) => {
    setChangingMode(true);
    try {
      await setBlockchainMode(mode);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setChangingMode(false);
    }
  };

  const handleDeploy = async () => {
    setDeploying(true);
    setDeployError(null);
    setDeployResult(null);

    try {
      const res = await deploySmartContract();
      setDeployResult(res);
      if (onRefresh) onRefresh();
    } catch (err) {
      setDeployError(err.message || 'Failed to deploy smart contract.');
    } finally {
      setDeploying(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedAddr(true);
    setTimeout(() => setCopiedAddr(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      
      {/* Tab Header Banner */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
          <Server className="w-3.5 h-3.5" />
          <span>Ethereum EVM Smart Contract & Node Configuration</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-heading">
          Smart Contract & Blockchain Architecture
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl mx-auto">
          Manage blockchain operational mode, inspect Ganache EVM local testnet connectivity, 
          and deploy or interact with the Solidity smart contract.
        </p>
      </div>

      {/* Mode Switcher */}
      <div className="glass-panel p-6 rounded-2xl border-slate-800 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-base font-bold text-white font-heading">
              Active Blockchain Ledger Engine
            </h2>
            <p className="text-xs text-slate-400">
              Select how on-chain transactions and block consensus are processed.
            </p>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-blue-500/10 text-cyan-300 border border-blue-500/20">
            Resolved: {stats?.blockchain_mode || 'SIMULATED'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          
          {/* AUTO */}
          <button
            type="button"
            onClick={() => handleModeChange('AUTO')}
            disabled={changingMode}
            className={`p-4 rounded-xl border text-left transition ${
              currentMode === 'AUTO'
                ? 'bg-blue-600/20 border-blue-500/60 shadow-md'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-sm text-white">AUTO (Recommended)</span>
              {currentMode === 'AUTO' && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Auto-detects Ganache EVM with deployed contract; seamlessly falls back to Cryptographic Ledger.
            </p>
          </button>

          {/* SIMULATED */}
          <button
            type="button"
            onClick={() => handleModeChange('SIMULATED')}
            disabled={changingMode}
            className={`p-4 rounded-xl border text-left transition ${
              currentMode === 'SIMULATED'
                ? 'bg-emerald-600/20 border-emerald-500/60 shadow-md'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-sm text-white">Simulated PoW Ledger</span>
              {currentMode === 'SIMULATED' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              In-memory Python blockchain with Proof-of-Work mining, Merkle roots, and full chain validation. Zero setup required.
            </p>
          </button>

          {/* GANACHE */}
          <button
            type="button"
            onClick={() => handleModeChange('GANACHE')}
            disabled={changingMode}
            className={`p-4 rounded-xl border text-left transition ${
              currentMode === 'GANACHE' || currentMode === 'ETHEREUM_GANACHE'
                ? 'bg-indigo-600/20 border-indigo-500/60 shadow-md'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-sm text-white">Ethereum Ganache</span>
              {(currentMode === 'GANACHE' || currentMode === 'ETHEREUM_GANACHE') && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Connect to local Ethereum EVM node running on port 8545 or 7545 with Solidity smart contract.
            </p>
          </button>

        </div>
      </div>

      {/* Ganache Node Status */}
      <div className="glass-panel p-6 rounded-2xl border-slate-800 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isGanacheConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
            }`}>
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-heading">
                Ganache EVM Node Status
              </h2>
              <p className="text-xs text-slate-400">
                {ganache.status_message || (isGanacheConnected ? 'Connected to EVM Node' : 'Node not detected')}
              </p>
            </div>
          </div>

          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
            isGanacheConnected 
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
              : 'bg-slate-800 text-slate-400 border border-slate-700'
          }`}>
            {isGanacheConnected ? 'EVM ONLINE' : 'STANDBY / OFFLINE'}
          </span>
        </div>

        {/* Node Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono pt-2">
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] text-slate-500 block mb-0.5">RPC URL:</span>
            <span className="text-white truncate block">{ganache.rpc_url || '127.0.0.1:8545'}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] text-slate-500 block mb-0.5">Chain ID:</span>
            <span className="text-white">{ganache.network_id || 'N/A'}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] text-slate-500 block mb-0.5">EVM Block Number:</span>
            <span className="text-cyan-400">{ganache.block_number ?? 'N/A'}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] text-slate-500 block mb-0.5">Contract Deployed:</span>
            <span className={ganache.contract_deployed ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
              {ganache.contract_deployed ? 'YES' : 'NO'}
            </span>
          </div>
        </div>

        {/* Contract Address if Deployed */}
        {ganache.contract_address && (
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-2 text-xs font-mono">
            <div className="min-w-0">
              <span className="text-[10px] text-slate-500 block">Deployed Contract Address:</span>
              <span className="text-indigo-400 truncate block text-[11px]">{ganache.contract_address}</span>
            </div>
            <button
              onClick={() => handleCopy(ganache.contract_address)}
              className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition shrink-0 flex items-center space-x-1"
            >
              {copiedAddr ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedAddr ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        )}

        {/* Deploy Action */}
        <div className="pt-2 flex items-center justify-between flex-wrap gap-3">
          <p className="text-xs text-slate-400">
            {isGanacheConnected 
              ? 'Click below to deploy IdentityVerification.sol to your Ganache node.' 
              : 'To use Ganache EVM, start Ganache (GUI or CLI ganache-cli) on port 8545 or 7545, then deploy.'}
          </p>

          <button
            onClick={handleDeploy}
            disabled={deploying || !isGanacheConnected}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-indigo-600/20 transition flex items-center space-x-2"
          >
            {deploying ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Deploying Contract...</span>
              </>
            ) : (
              <>
                <FileCode className="w-4 h-4" />
                <span>Deploy IdentityVerification.sol</span>
              </>
            )}
          </button>
        </div>

        {/* Deployment feedback */}
        {deployResult && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono space-y-1">
            <p className="font-bold">{deployResult.message}</p>
            <p>Contract Address: {deployResult.contract_address}</p>
            <p>Deploy Tx: {deployResult.tx_hash}</p>
          </div>
        )}

        {deployError && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            <p className="font-bold">Deployment Error:</p>
            <p className="mt-1">{deployError}</p>
          </div>
        )}
      </div>

      {/* Solidity Smart Contract Architecture Details */}
      <div className="glass-panel p-6 rounded-2xl border-slate-800 space-y-4">
        <h2 className="text-base font-bold text-white font-heading flex items-center space-x-2">
          <FileCode className="w-4 h-4 text-cyan-400" />
          <span>Solidity Smart Contract Architecture: IdentityVerification.sol</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <h3 className="font-bold text-white flex items-center space-x-1.5">
              <Lock className="w-3.5 h-3.5 text-blue-400" />
              <span>Zero-PII Storage (Privacy Preserving)</span>
            </h3>
            <p className="text-slate-400 leading-relaxed">
              Personal Identifiable Information (such as real names, emails, and full document images) is NEVER written onto the blockchain ledger. 
              Only irreversible 256-bit cryptographic SHA-256 hashes and timestamp commitments are anchored on-chain.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <h3 className="font-bold text-white flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cryptographic Tamper-Evidence</span>
            </h3>
            <p className="text-slate-400 leading-relaxed">
              Because SHA-256 exhibits the Avalanche Effect, modifying even a single pixel or character in a document completely alters its resulting hash. 
              Any forged certificate or credential is instantaneously rejected by the smart contract.
            </p>
          </div>
        </div>

        {/* Flow Diagram */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            End-to-End Verification Pipeline
          </span>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-center font-mono">
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-700 w-full sm:w-auto flex-1">
              <span className="text-slate-400 block text-[10px]">Step 1</span>
              <span className="text-white font-bold">Raw Document</span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 shrink-0 hidden sm:block" />
            <div className="p-2.5 rounded-lg bg-blue-950/80 border border-blue-500/40 w-full sm:w-auto flex-1">
              <span className="text-blue-400 block text-[10px]">Step 2</span>
              <span className="text-cyan-300 font-bold">SHA-256 Hash</span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 shrink-0 hidden sm:block" />
            <div className="p-2.5 rounded-lg bg-indigo-950/80 border border-indigo-500/40 w-full sm:w-auto flex-1">
              <span className="text-indigo-400 block text-[10px]">Step 3</span>
              <span className="text-indigo-300 font-bold">Mined Block</span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 shrink-0 hidden sm:block" />
            <div className="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-500/40 w-full sm:w-auto flex-1">
              <span className="text-emerald-400 block text-[10px]">Step 4</span>
              <span className="text-emerald-300 font-bold">Match / Tamper</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
