/**
 * API Service for Digital Identity Verification System
 * Connects React frontend with the FastAPI backend and Blockchain endpoints
 */

const API_BASE = '/api';

export async function fetchStats() {
  const res = await fetch(`${API_BASE}/stats`);
  if (!res.ok) throw new Error(`Failed to fetch stats: ${res.statusText}`);
  return res.json();
}

export async function fetchBlockchain() {
  const res = await fetch(`${API_BASE}/blockchain`);
  if (!res.ok) throw new Error(`Failed to fetch blockchain data: ${res.statusText}`);
  return res.json();
}

export async function fetchIdentities() {
  const res = await fetch(`${API_BASE}/identities`);
  if (!res.ok) throw new Error(`Failed to fetch identities: ${res.statusText}`);
  return res.json();
}

export async function fetchIdentityDetails(identityId) {
  const res = await fetch(`${API_BASE}/identity/${encodeURIComponent(identityId)}`);
  if (!res.ok) throw new Error(`Failed to fetch identity details: ${res.statusText}`);
  return res.json();
}

export async function fetchHistory(limit = 50) {
  const res = await fetch(`${API_BASE}/history?limit=${limit}`);
  if (!res.ok) throw new Error(`Failed to fetch verification history: ${res.statusText}`);
  return res.json();
}

export async function registerIdentity(formData) {
  const res = await fetch(`${API_BASE}/register`, {
    method: 'POST',
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Registration failed');
  }
  return data;
}

export async function verifyIdentity(formData) {
  const res = await fetch(`${API_BASE}/verify`, {
    method: 'POST',
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Verification request failed');
  }
  return data;
}

export async function seedSampleData() {
  const res = await fetch(`${API_BASE}/sample-data`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to seed sample data');
  return res.json();
}

export async function deploySmartContract() {
  const res = await fetch(`${API_BASE}/deploy-contract`, {
    method: 'POST',
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Contract deployment failed');
  }
  return data;
}

export async function setBlockchainMode(mode) {
  const res = await fetch(`${API_BASE}/blockchain/mode?mode=${mode}`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to change blockchain mode');
  return res.json();
}

export function getSampleDownloadUrl(filename) {
  return `${API_BASE}/download-sample/${encodeURIComponent(filename)}`;
}

/**
 * Compute SHA-256 hash directly in the browser using Web Crypto API.
 * Provides immediate feedback before sending to server.
 */
export async function calculateClientSHA256(file) {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}
