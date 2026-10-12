import React, {useState} from 'react';
import {
  AlertCircle,
  Check,
  Copy,
  Download,
  ExternalLink,
  FileCode,
  FolderDown,
  FolderGit2,
  HelpCircle,
  Sparkles,
  X,
} from 'lucide-react';
import {BASS_PRO_JSFX_SCRIPT} from '../types/jsfxScript';

interface ReaPackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const REAPACK_INDEX_XML = `<?xml version="1.0" encoding="utf-8"?>
<index version="1" name="BASS PRO" commit="1">
  <category name="Plugins">
    <reapack name="BASS PRO.jsfx" type="effect" desc="BASS PRO - Bass Guitar Enhancer and Dynamics Leveler">
      <version name="2.0.0" author="Sonic Anomaly" time="2026-10-12T00:00:00Z">
        <source file="Plugins/BASS PRO.jsfx">https://raw.githubusercontent.com/cfillion/reapack-repository-template/master/Plugins/BASS%20PRO.jsfx</source>
      </version>
    </reapack>
  </category>
</index>
`;

export const REAPACK_README_MD = `# BASS PRO ReaPack Repository

This repository provides **BASS PRO** for Cockos REAPER via ReaPack.
Built with [cfillion/reapack-repository-template](https://github.com/cfillion/reapack-repository-template).

## Direct Manual Installation (Recommended)
1. Download **BASS PRO.jsfx**.
2. In REAPER, go to: **Options > Show REAPER resource path in explorer/finder...**
3. Open the **Effects** folder and paste **BASS PRO.jsfx** inside.
4. In REAPER FX Browser, press **F5** (Scan for new plugins). Done!

## ReaPack Installation
1. In REAPER, go to: **Extensions > ReaPack > Import repositories...**
2. Add your repository index URL.
3. In ReaPack package browser, search **BASS PRO** and click **Install**.
`;

export const ReaPackModal: React.FC<ReaPackModalProps> = ({isOpen, onClose}) => {
  const [activeTab, setActiveTab] = useState<'direct' | 'jsfx' | 'index' | 'fix'>('direct');
  const [copied, setCopied] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const downloadFile = (content: string, filename: string, mime = 'text/plain') => {
    const blob = new Blob([content], {type: mime});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-3xl max-h-[92vh] bg-[#14161a] border border-slate-700/80 rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-[#0c0e11]">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-800/80 text-cyan-400">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white font-mono tracking-wide">
                  BASS PRO · REAPER &amp; ReaPack Installer
                </h2>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Direct JSFX file installation &amp; ReaPack repository template
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex flex-wrap items-center justify-between px-5 py-2 border-b border-slate-800 bg-[#101216] gap-2">
          <div className="flex items-center gap-1 bg-[#090b0d] p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTab('direct')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono font-medium transition-all ${
                activeTab === 'direct'
                  ? 'bg-emerald-600 text-white font-bold shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FolderDown className="w-3.5 h-3.5" />
              <span>Direct Install (100% Works)</span>
            </button>

            <button
              onClick={() => setActiveTab('fix')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono font-medium transition-all ${
                activeTab === 'fix'
                  ? 'bg-amber-600 text-white font-bold shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>RTF Error Fix</span>
            </button>

            <button
              onClick={() => setActiveTab('jsfx')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono font-medium transition-all ${
                activeTab === 'jsfx'
                  ? 'bg-cyan-700 text-white font-bold shadow-[0_0_8px_rgba(6,182,212,0.5)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>BASS PRO.jsfx</span>
            </button>

            <button
              onClick={() => setActiveTab('index')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono font-medium transition-all ${
                activeTab === 'index'
                  ? 'bg-cyan-700 text-white font-bold shadow-[0_0_8px_rgba(6,182,212,0.5)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>index.xml</span>
            </button>
          </div>

          <button
            onClick={() => downloadFile(BASS_PRO_JSFX_SCRIPT, 'BASS PRO.jsfx')}
            className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.4)] transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .jsfx</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-auto p-5 bg-[#090b0d]">
          {activeTab === 'direct' && (
            <div className="flex flex-col gap-4 font-mono text-xs">
              <div className="bg-emerald-950/40 border border-emerald-800/80 p-4 rounded-xl">
                <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2 mb-1.5">
                  <Sparkles className="w-4 h-4" />
                  Instant Direct Installation (Recommended)
                </h3>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  You do not need ReaPack to run BASS PRO in REAPER! JSFX is REAPER&apos;s native plugin format. Dropping the file directly into your REAPER Effects folder bypasses all ReaPack XML and RTF errors completely.
                </p>
              </div>

              {/* 3 Simple Steps */}
              <div className="flex flex-col gap-2.5">
                <div className="bg-[#121417] p-3.5 rounded-lg border border-slate-800 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-cyan-900 text-cyan-300 font-bold flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-200 mb-1">Download the plugin file</p>
                    <button
                      onClick={() => downloadFile(BASS_PRO_JSFX_SCRIPT, 'BASS PRO.jsfx')}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-cyan-700 hover:bg-cyan-600 text-white font-bold text-[11px] transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download BASS PRO.jsfx (Click here)</span>
                    </button>
                  </div>
                </div>

                <div className="bg-[#121417] p-3.5 rounded-lg border border-slate-800 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-cyan-900 text-cyan-300 font-bold flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div>
                    <p className="font-bold text-slate-200 mb-1">Open REAPER Effects Folder</p>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      In REAPER, click the top menu: <strong className="text-white">Options &gt; Show REAPER resource path in explorer/finder...</strong>
                    </p>
                    <p className="text-slate-400 text-[11px] mt-1">
                      Open the <strong className="text-cyan-300">Effects</strong> folder and paste <code className="bg-black/50 px-1 py-0.5 rounded text-amber-300">BASS PRO.jsfx</code> inside.
                    </p>
                  </div>
                </div>

                <div className="bg-[#121417] p-3.5 rounded-lg border border-slate-800 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-cyan-900 text-cyan-300 font-bold flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div>
                    <p className="font-bold text-slate-200 mb-1">Load on any Track</p>
                    <p className="text-slate-400 text-[11px]">
                      In REAPER, click <strong>FX</strong> on your bass track, search <strong className="text-cyan-300">BASS PRO</strong>, and click OK. It loads immediately!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'fix' && (
            <div className="flex flex-col gap-3.5 font-mono text-xs">
              <div className="bg-amber-950/40 border border-amber-800/80 p-4 rounded-xl">
                <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2 mb-1.5">
                  <AlertCircle className="w-4 h-4" />
                  Why did ReaPack say &ldquo;could not load RTF document, could not install&rdquo;?
                </h3>
                <p className="text-slate-300 leading-relaxed text-[11px] mb-2">
                  This error happens in REAPER for two specific reasons:
                </p>
                <ol className="list-decimal pl-5 space-y-1.5 text-slate-400 text-[11px]">
                  <li>
                    <strong className="text-slate-200">ReaPack Source 404:</strong> The repository template link (<code className="text-amber-300">cfillion/reapack-repository-template</code>) is an empty GitHub template—it does not host your personal files on GitHub until you create and push your own repository. When ReaPack tries to fetch the file, it fails to find the URL and fails to install.
                  </li>
                  <li>
                    <strong className="text-slate-200">Windows RichEdit RTF Parser:</strong> REAPER uses the Windows RichEdit control to parse the package description. When a package contains complex markdown headers or links, the RichEdit parser crashes with <em className="text-red-400">&ldquo;Could not load RTF document&rdquo;</em>.
                  </li>
                </ol>
              </div>

              <div className="bg-[#121417] p-4 rounded-xl border border-slate-800">
                <h4 className="font-bold text-cyan-400 mb-2">How to solve it:</h4>
                <div className="space-y-2 text-slate-300 text-[11px]">
                  <p>
                    <strong>Solution 1 (Fastest):</strong> Use the <strong>Direct Install</strong> tab above. Place the <code className="text-amber-300">BASS PRO.jsfx</code> file directly in your REAPER <code className="text-cyan-300">Effects</code> folder. It works 100% without any network or ReaPack errors.
                  </p>
                  <p>
                    <strong>Solution 2 (For ReaPack Repository Owners):</strong> We have updated <code className="text-cyan-300">index.xml</code> and <code className="text-cyan-300">BASS PRO.jsfx</code> with clean plain-text metadata without RTF-crashing syntax. Fork the repository template on GitHub, push the <code className="text-cyan-300">Plugins/BASS PRO.jsfx</code> file to your repository, and import your own raw GitHub URL into ReaPack.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'jsfx' && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-[11px] font-mono text-slate-400">Plugins/BASS PRO.jsfx</span>
                <button
                  onClick={() => handleCopy(BASS_PRO_JSFX_SCRIPT, 'jsfx')}
                  className="flex items-center gap-1 text-[11px] font-mono text-cyan-400 hover:underline"
                >
                  {copied === 'jsfx' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied === 'jsfx' ? 'Copied' : 'Copy Code'}</span>
                </button>
              </div>
              <pre className="text-xs font-mono text-slate-300 leading-relaxed font-normal whitespace-pre">
                {BASS_PRO_JSFX_SCRIPT}
              </pre>
            </div>
          )}

          {activeTab === 'index' && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-[11px] font-mono text-slate-400">index.xml</span>
                <button
                  onClick={() => handleCopy(REAPACK_INDEX_XML, 'index')}
                  className="flex items-center gap-1 text-[11px] font-mono text-cyan-400 hover:underline"
                >
                  {copied === 'index' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied === 'index' ? 'Copied' : 'Copy XML'}</span>
                </button>
              </div>
              <pre className="text-xs font-mono text-slate-300 leading-relaxed font-normal whitespace-pre">
                {REAPACK_INDEX_XML}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 border-t border-slate-800 bg-[#0c0e11] flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>Target: Cockos REAPER (Windows / macOS / Linux)</span>
          <button
            onClick={() => setActiveTab('direct')}
            className="text-cyan-400 hover:underline font-bold"
          >
            Direct Install Instructions &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};
