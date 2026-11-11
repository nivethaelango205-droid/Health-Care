import React from 'react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { ShieldCheck, Server, Lock, Wifi, RefreshCw } from 'lucide-react';
import { useDemo } from '../../contexts/DemoContext';
import { API_BASE_URL } from '../../services/api';

export const AdminSettings: React.FC = () => {
  const { isDemoMode, toggleDemoMode, backendConnected, checkBackendHealth } = useDemo();

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-navy-900 tracking-tight">System & Telemedicine Settings</h2>
        <p className="text-xs text-brandMuted">
          Operational infrastructure parameters, WebRTC signaling nodes, and cryptographic integrity controls.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Backend & API Status */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5 text-teal-600" />
              <h3 className="text-sm font-bold text-navy-900">Backend API Connectivity</h3>
            </div>
            <Badge variant={backendConnected ? 'confirmed' : 'pending'} dot size="sm">
              {backendConnected ? 'Live Connection' : 'Mock Sandbox'}
            </Badge>
          </div>

          <div className="space-y-2 text-xs text-slate-600">
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-400">Target Base URL:</span>
              <span className="font-mono font-medium text-slate-800">{API_BASE_URL}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-400">Codex Backend Port:</span>
              <span className="font-mono font-medium text-slate-800">4000 (Express / SQLite)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-400">Session Security:</span>
              <span className="font-medium text-emerald-700">SHA-256 Bearer Token</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Active Operational Mode:</span>
              <span className="font-semibold text-teal-800">{isDemoMode ? 'Demo Sandbox' : 'Live Backend Mode'}</span>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => checkBackendHealth()} className="text-xs">
              Check Health (GET /api/health)
            </Button>
            <Button variant="ghost" size="sm" onClick={toggleDemoMode} className="text-xs text-teal-700">
              Toggle Mode
            </Button>
          </div>
        </Card>

        {/* WebRTC & Media Signaling */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Wifi className="h-5 w-5 text-teal-600" />
              <h3 className="text-sm font-bold text-navy-900">WebRTC Signaling Infrastructure</h3>
            </div>
            <Badge variant="verified" dot size="sm">
              Standardized
            </Badge>
          </div>

          <div className="space-y-2 text-xs text-slate-600">
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-400">Signaling Protocol:</span>
              <span className="font-mono font-medium text-slate-800">Socket.IO (consultation:join)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-400">Configured STUN Servers:</span>
              <span className="font-mono font-medium text-slate-800">stun:stun.l.google.com:19302</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-400">Audio/Video Codec:</span>
              <span className="font-medium text-slate-800">VP8 / Opus (Low-Bandwidth Adaptive)</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Encryption:</span>
              <span className="font-semibold text-emerald-700">DTLS-SRTP Hardware Encrypted</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

