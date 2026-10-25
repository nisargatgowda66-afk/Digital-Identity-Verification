import React, { useState } from 'react';
import { 
  UserPlus, 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Hash, 
  Cpu, 
  ArrowRight,
  Lock
} from 'lucide-react';
import { registerIdentity, calculateClientSHA256 } from '../api';

export default function RegisterTab({ onRegistered, onNavigateToVerify }) {
  const [identityId, setIdentityId] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [documentType, setDocumentType] = useState('Student ID Card');
  const [file, setFile] = useState(null);
  const [clientHash, setClientHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [miningStep, setMiningStep] = useState(0); // 0: idle, 1: hashing, 2: mining, 3: done
  const [error, setError] = useState(null);
  const [successData, setSuccessData] = useState(null);

  const documentTypes = [
    'Student ID Card',
    'Passport',
    "Driver's License",
    'National Identity Card',
    'University Degree / Certificate',
    'Voter ID Card',
    'Employee Credential'
  ];

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);
    try {
      const hash = await calculateClientSHA256(selectedFile);
      setClientHash(hash);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      setFile(droppedFile);
      setError(null);
      try {
        const hash = await calculateClientSHA256(droppedFile);
        setClientHash(hash);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identityId.trim()) {
      setError('Please provide a unique Identity Identifier.');
      return;
    }
    if (!fullName.trim()) {
      setError('Please provide the holder full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }
    if (!file) {
      setError('Please select or upload an identity document to register.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessData(null);
    setMiningStep(1); // Step 1: Hashing

    try {
      // Simulate mining animation transition for visual excellence
      setTimeout(() => setMiningStep(2), 600); // Step 2: Proof of work mining

      const formData = new FormData();
      formData.append('identity_id', identityId.trim().toUpperCase());
      formData.append('full_name', fullName.trim());
      formData.append('email', email.trim());
      formData.append('document_type', documentType);
      formData.append('document', file);

      const result = await registerIdentity(formData);
      
      setMiningStep(3); // Step 3: Done
      setSuccessData(result);
      if (onRegistered) onRegistered();
    } catch (err) {
      setError(err.message || 'Registration failed. Identity ID might already exist.');
      setMiningStep(0);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setIdentityId('');
    setFullName('');
    setEmail('');
    setFile(null);
    setClientHash('');
    setSuccessData(null);
    setError(null);
    setMiningStep(0);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      
      {/* Tab Header Banner */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
          <UserPlus className="w-3.5 h-3.5" />
          <span>Decentralized Identity Registration & Hash Anchoring</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-heading">
          Register New Digital Identity
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl mx-auto">
          Personal information and document data remain private. Only the SHA-256 cryptographic fingerprint
          is irreversibly committed to a freshly mined blockchain block.
        </p>
      </div>

      {/* Mining / Progress Bar when submitting */}
      {loading && (
        <div className="glass-panel p-6 rounded-2xl border-indigo-500/40 bg-indigo-950/20 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span className="flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-cyan-400 animate-spin" />
              <span>
                {miningStep === 1 && 'Calculating Cryptographic SHA-256 Digest...'}
                {miningStep === 2 && 'Executing Proof-of-Work Mining & Block Consensus...'}
                {miningStep === 3 && 'Committing to Blockchain Ledger...'}
              </span>
            </span>
            <span className="font-mono text-cyan-400">Step {miningStep}/3</span>
          </div>

          <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(miningStep / 3) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Registration Success Confirmation */}
      {successData && (
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border-emerald-500/40 bg-emerald-950/20 glow-emerald space-y-6 animate-in fade-in">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                  MINED & COMMITTED ON BLOCK #{successData.block_number}
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-white mt-1 font-heading">
                  Identity Registered Successfully
                </h2>
              </div>
            </div>

            <button
              onClick={() => onNavigateToVerify(successData.identity_id)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-md shadow-blue-500/20 transition"
            >
              <span>Test Verify Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed">
            {successData.message}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">Identity ID</span>
              <span className="font-mono font-bold text-cyan-300">{successData.identity_id}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Holder Full Name</span>
              <span className="font-bold text-white">{successData.full_name}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Document Type</span>
              <span className="text-slate-200">{successData.document_type}</span>
            </div>
          </div>

          {/* Transaction & Hash Proof */}
          <div className="space-y-2 font-mono text-xs">
            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-1">Committed SHA-256 Digest:</span>
              <span className="text-emerald-300 break-all">{successData.document_hash}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-1">On-Chain Transaction Hash:</span>
              <span className="text-slate-300 break-all">{successData.tx_hash}</span>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition"
            >
              Register Another Identity
            </button>
          </div>
        </div>
      )}

      {/* Main Registration Form */}
      {!successData && (
        <form onSubmit={handleSubmit} className="glass-panel p-6 sm:p-8 rounded-2xl border-slate-800 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Identity ID */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-200">
                Identity Identifier (ID) <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={identityId}
                onChange={(e) => setIdentityId(e.target.value.toUpperCase())}
                placeholder="e.g. STU-2024-9901 or PASSPORT-US-8410"
                required
                className="w-full px-4 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
              <p className="text-[11px] text-slate-400">
                Unique identifier for the user. Cannot be modified once registered.
              </p>
            </div>

            {/* Holder Full Name */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-200">
                Holder Full Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Maya Chen"
                required
                className="w-full px-4 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>

            {/* Email Address */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-200">
                Official Email Address <span className="text-rose-400">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. maya.chen@university.edu"
                required
                className="w-full px-4 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>

            {/* Document Type */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-200">
                Document Type
              </label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              >
                {documentTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

          </div>

          {/* Document File Drag & Drop Upload */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-200">
              Upload Identity Document / Credential File <span className="text-rose-400">*</span>
            </label>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => document.getElementById('reg-file-input').click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center transition cursor-pointer ${
                file 
                  ? 'border-indigo-500/60 bg-indigo-500/5' 
                  : 'border-slate-700 hover:border-slate-500 bg-slate-900/40 hover:bg-slate-900/60'
              }`}
            >
              <input
                id="reg-file-input"
                type="file"
                onChange={handleFileChange}
                className="hidden"
              />
              
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                  {file ? <FileText className="w-6 h-6 text-cyan-400" /> : <UploadCloud className="w-6 h-6" />}
                </div>

                {file ? (
                  <div>
                    <p className="text-sm font-semibold text-white">{file.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {(file.size / 1024).toFixed(2)} KB • Ready for cryptographic hashing
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-medium text-slate-300">
                      <span className="text-indigo-400 font-semibold">Click to select document</span> or drag & drop here
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Supports Text files, PDF diplomas, ID scan images, JSON credentials
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Client-side Hash Preview */}
          {clientHash && (
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center space-x-2 text-xs text-slate-400">
              <Hash className="w-4 h-4 text-cyan-400 shrink-0" />
              <div className="min-w-0">
                <span className="font-semibold text-slate-300">Computed SHA-256 Digest:</span>
                <span className="block font-mono text-[11px] text-cyan-300 truncate">{clientHash}</span>
              </div>
            </div>
          )}

          {/* Error Alert */}
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
            className="w-full py-3.5 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-lg shadow-indigo-500/25 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <Lock className="w-4 h-4" />
            <span>Commit Identity Hash To Blockchain</span>
          </button>
        </form>
      )}

    </div>
  );
}
