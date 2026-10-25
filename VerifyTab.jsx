import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Copy, 
  Check, 
  Download, 
  Hash,
  Sparkles,
  Lock
} from 'lucide-react';
import { verifyIdentity, calculateClientSHA256 } from '../api';

export default function VerifyTab({ onVerified, prefillId }) {
  const [identityId, setIdentityId] = useState(prefillId || '');
  const [file, setFile] = useState(null);
  const [clientHash, setClientHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  // If prefillId changes from outside
  React.useEffect(() => {
    if (prefillId) {
      setIdentityId(prefillId);
    }
  }, [prefillId]);

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    setFile(selectedFile);
    setError(null);
    setResult(null);

    try {
      const hash = await calculateClientSHA256(selectedFile);
      setClientHash(hash);
    } catch (err) {
      console.error("Client hash calculation error:", err);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      setFile(droppedFile);
      setError(null);
      setResult(null);
      try {
        const hash = await calculateClientSHA256(droppedFile);
        setClientHash(hash);
      } catch (err) {
        console.error("Client hash error:", err);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identityId.trim()) {
      setError('Please provide an Identity ID (e.g., STU-2024-8841).');
      return;
    }
    if (!file) {
      setError('Please select or upload a document file to verify.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('identity_id', identityId.trim().toUpperCase());
    formData.append('document', file);

    try {
      const data = await verifyIdentity(formData);
      setResult(data);
      if (onVerified) onVerified();
    } catch (err) {
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSample = (filename, content) => {
    try {
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  const demoIdentities = [
    {
      id: 'STU-2024-8841',
      name: 'Aarav Sharma',
      docType: 'Student ID',
      validFile: 'aarav_student_id.txt',
      validContent: 'NAME: Aarav Sharma | ID: STU-2024-8841 | DEPT: Computer Science | YEAR: 2024 | ISSUER: National Tech University',
      tamperedFile: 'tampered_aarav_student_id.txt',
      tamperedContent: 'NAME: Aarav Sharma | ID: STU-2024-8841 | DEPT: Computer Science | YEAR: 2024 | ISSUER: National Tech University [UNAUTHORIZED TAMPERING / MODIFIED DATA]'
    },
    {
      id: 'PASSPORT-IN-90412',
      name: 'Priya Patel',
      docType: 'Passport',
      validFile: 'priya_passport_scan.txt',
      validContent: 'DOCUMENT: PASSPORT | COUNTRY: INDIA | NO: Z8192041 | HOLDER: Priya Patel | DOB: 2002-05-14 | EXPIRY: 2032-05-13',
      tamperedFile: 'tampered_priya_passport_scan.txt',
      tamperedContent: 'DOCUMENT: PASSPORT | COUNTRY: INDIA | NO: Z8192041 | HOLDER: Priya Patel | DOB: 2002-05-14 | EXPIRY: 2032-05-13 [UNAUTHORIZED TAMPERING / MODIFIED DATA]'
    },
    {
      id: 'EMP-DL-4410',
      name: 'Rohan Verma',
      docType: "Driver's License",
      validFile: 'rohan_drivers_license.txt',
      validContent: "LICENSE: DL-9012384 | HOLDER: Rohan Verma | CLASS: LMV | ISSUE_DATE: 2021-08-10 | VALID_TILL: 2041-08-09",
      tamperedFile: 'tampered_rohan_drivers_license.txt',
      tamperedContent: "LICENSE: DL-9012384 | HOLDER: Rohan Verma | CLASS: LMV | ISSUE_DATE: 2021-08-10 | VALID_TILL: 2041-08-09 [UNAUTHORIZED TAMPERING / MODIFIED DATA]"
    }
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      
      {/* Tab Header Banner */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Zero-Knowledge Proof & Cryptographic Verification</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-heading">
          Verify Digital Identity Against Blockchain
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl mx-auto">
          Upload any identity document to calculate its cryptographic SHA-256 digest in real-time 
          and audit it against the immutable blockchain ledger to detect unauthorized tampering or fraud.
        </p>
      </div>

      {/* Demo Quick-Selection Bar */}
      <div className="glass-panel p-4 rounded-2xl border-slate-800">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Interactive Demo: Quick-Test Sample Identities & Files</span>
          </div>
          <span className="text-[11px] text-slate-400">
            Click any identity to pre-fill, then download its files to test
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {demoIdentities.map((item) => (
            <div 
              key={item.id}
              onClick={() => setIdentityId(item.id)}
              className={`p-3 rounded-xl border transition cursor-pointer text-left ${
                identityId === item.id 
                  ? 'bg-blue-900/30 border-blue-500/60 shadow-md shadow-blue-500/10' 
                  : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-cyan-300">{item.id}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">{item.docType}</span>
              </div>
              <p className="text-xs font-medium text-slate-200 mt-1">{item.name}</p>
              
              <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIdentityId(item.id);
                    handleDownloadSample(item.validFile, item.validContent);
                  }}
                  className="text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 font-medium transition cursor-pointer bg-transparent border-0 p-0"
                  title="Download genuine file to test valid match"
                >
                  <Download className="w-3 h-3" />
                  <span>Valid Doc</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIdentityId(item.id);
                    handleDownloadSample(item.tamperedFile, item.tamperedContent);
                  }}
                  className="text-rose-400 hover:text-rose-300 flex items-center space-x-1 font-medium transition cursor-pointer bg-transparent border-0 p-0"
                  title="Download tampered file to test tamper detection"
                >
                  <Download className="w-3 h-3" />
                  <span>Tampered Doc</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Verification Form Card */}
      <form onSubmit={handleSubmit} className="glass-panel p-6 sm:p-8 rounded-2xl border-slate-800 space-y-6">
        
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-200">
            Identity Identifier (ID)
          </label>
          <div className="relative">
            <input
              type="text"
              value={identityId}
              onChange={(e) => setIdentityId(e.target.value.toUpperCase())}
              placeholder="e.g. STU-2024-8841 or PASSPORT-IN-90412"
              className="w-full px-4 py-3 bg-slate-900/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
            {identityId && (
              <button
                type="button"
                onClick={() => setIdentityId('')}
                className="absolute right-3 top-3 text-xs text-slate-400 hover:text-slate-200 px-1.5 py-0.5 rounded bg-slate-800"
              >
                Clear
              </button>
            )}
          </div>
          <p className="text-xs text-slate-400">
            Case-insensitive unique alphanumeric identity tag assigned upon on-chain registration.
          </p>
        </div>

        {/* Drag & Drop File Upload Area */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-200">
            Document File for Hash Audit
          </label>
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition cursor-pointer ${
              file 
                ? 'border-blue-500/60 bg-blue-500/5' 
                : 'border-slate-700 hover:border-slate-500 bg-slate-900/40 hover:bg-slate-900/60'
            }`}
            onClick={() => document.getElementById('verify-file-input').click()}
          >
            <input
              id="verify-file-input"
              type="file"
              onChange={handleFileChange}
              className="hidden"
            />
            
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                {file ? <FileText className="w-6 h-6 text-cyan-400" /> : <UploadCloud className="w-6 h-6" />}
              </div>
              
              {file ? (
                <div>
                  <p className="text-sm font-semibold text-white">{file.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {(file.size / 1024).toFixed(2)} KB • {file.type || 'Text/Document'}
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium text-slate-300">
                    <span className="text-blue-400 font-semibold">Click to upload</span> or drag and drop document
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Accepts any file format (.txt, .pdf, .png, .jpg, .json). Raw bytes are hashed locally.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Instant Client-side SHA-256 Preview */}
        {clientHash && (
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center space-x-2 text-xs text-slate-400 min-w-0">
              <Hash className="w-4 h-4 text-cyan-400 shrink-0" />
              <div className="min-w-0">
                <span className="font-semibold text-slate-300">Local SHA-256 Pre-digest:</span>
                <span className="block font-mono text-[11px] text-cyan-300 truncate">{clientHash}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(clientHash)}
              className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition shrink-0 flex items-center space-x-1"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center space-x-2">
            <XCircle className="w-5 h-5 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-lg shadow-blue-500/25 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Verifying Hash Against Blockchain...</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-5 h-5" />
              <span>Audit Document On Blockchain</span>
            </>
          )}
        </button>
      </form>

      {/* Verification Result Display */}
      {result && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {result.status === 'VALID' && (
            <div className="glass-panel p-6 sm:p-8 rounded-2xl border-emerald-500/40 bg-emerald-950/20 glow-emerald space-y-6">
              
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="flex items-center space-x-3.5">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                      <span>100% CRYPTOGRAPHIC MATCH</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white mt-1 font-heading">
                      Identity Verified Successfully
                    </h2>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Committed On Block</span>
                  <span className="text-lg font-bold font-mono text-emerald-400">#{result.block_number}</span>
                </div>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed border-t border-slate-800/80 pt-4">
                {result.message}
              </p>

              {/* Identity Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Identity ID</span>
                  <span className="font-mono font-bold text-white">{result.identity_id}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Full Name</span>
                  <span className="font-bold text-white">{result.full_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Document Type</span>
                  <span className="text-slate-200">{result.document_type}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Blockchain Mode</span>
                  <span className="font-mono text-emerald-400">{result.blockchain_mode}</span>
                </div>
              </div>

              {/* Hash Verification Evidence Card */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>On-Chain Cryptographic Proof</span>
                </h3>

                <div className="space-y-2 font-mono text-xs">
                  <div className="p-3 rounded-lg bg-slate-950/80 border border-emerald-500/30">
                    <span className="text-[11px] text-slate-400 block mb-1">
                      Computed SHA-256 Hash (Uploaded File):
                    </span>
                    <span className="text-emerald-300 break-all">{result.computed_hash}</span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950/80 border border-emerald-500/30">
                    <span className="text-[11px] text-slate-400 block mb-1">
                      Registered SHA-256 Hash (Stored On-Chain):
                    </span>
                    <span className="text-emerald-300 break-all">{result.stored_hash}</span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-400 flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <span className="text-[11px] block">Blockchain Transaction Reference:</span>
                      <span className="text-slate-300 break-all">{result.tx_reference}</span>
                    </div>
                    <span className="text-[11px] text-slate-500">{result.verified_at}</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {result.status === 'TAMPERED' && (
            <div className="glass-panel p-6 sm:p-8 rounded-2xl border-rose-500/50 bg-rose-950/20 glow-rose space-y-6">
              
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="flex items-center space-x-3.5">
                  <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
                    <ShieldAlert className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/30">
                      <span>TAMPER ALERT: CRYPTOGRAPHIC MISMATCH</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white mt-1 font-heading">
                      Fraud / Alteration Detected
                    </h2>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Registered Block</span>
                  <span className="text-lg font-bold font-mono text-slate-300">#{result.block_number}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-rose-900/30 border border-rose-500/30 text-rose-200 text-sm leading-relaxed">
                <p className="font-semibold">{result.message}</p>
                <p className="text-xs text-rose-300/80 mt-1.5">
                  Due to the cryptographic SHA-256 Avalanche Effect, altering even a single byte or space in the document produces an entirely distinct digest. The blockchain record remains uncorrupted.
                </p>
              </div>

              {/* Hash Discrepancy Comparison */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                  <Hash className="w-3.5 h-3.5 text-rose-400" />
                  <span>Hash Discrepancy Analysis</span>
                </h3>

                <div className="space-y-2 font-mono text-xs">
                  <div className="p-3 rounded-lg bg-slate-950/90 border border-rose-500/40">
                    <span className="text-[11px] text-rose-400 font-bold block mb-1">
                      Computed Hash (Uploaded Altered Document):
                    </span>
                    <span className="text-rose-300 break-all">{result.computed_hash}</span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950/90 border border-emerald-500/40">
                    <span className="text-[11px] text-emerald-400 font-bold block mb-1">
                      Immutable Registered Hash (Blockchain Record):
                    </span>
                    <span className="text-emerald-300 break-all">{result.stored_hash}</span>
                  </div>
                </div>
              </div>

              {/* Audit Meta */}
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                <span>Identity Holder: <strong className="text-white">{result.full_name}</strong></span>
                <span>Audit Log Recorded On-Chain</span>
              </div>

            </div>
          )}

          {result.status === 'NOT_FOUND' && (
            <div className="glass-panel p-6 sm:p-8 rounded-2xl border-amber-500/40 bg-amber-950/20 space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white font-heading">
                    Identity ID Not Registered
                  </h2>
                  <p className="text-xs text-amber-300">{result.message}</p>
                </div>
              </div>
              <p className="text-xs text-slate-400">
                The identifier <code className="text-amber-400">{result.identity_id}</code> could not be matched against any mined block on the blockchain. 
                Please ensure the identifier is spelled correctly or register this identity first.
              </p>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
