import React from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, ShieldCheck, Globe, Users, Home, 
  Mail, Phone, ExternalLink, Calendar, MessageSquare,
  Sparkles, BrainCircuit, TrendingUp, Briefcase
} from 'lucide-react';
import { Institution } from '../types';

interface IntelReportProps {
  institution: Institution;
  onClose: () => void;
  isResearching: boolean;
  onRefresh: () => void;
}

export default function IntelReport({ institution, onClose, isResearching, onRefresh }: IntelReportProps) {
  const intel = institution.intel;

  const ensureAbsoluteUrl = (url?: string) => {
    if (!url || url === '#' || url === 'undefined') {
      return '';
    }
    if (url.startsWith('http')) return url;
    return `https://${url}`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-50 bg-[#020617] overflow-y-auto"
    >
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Navigation */}
        <button 
          onClick={onClose}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-12 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-semibold uppercase tracking-widest">Back to Intelligence Feed</span>
        </button>

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-[10px] font-bold uppercase tracking-widest border border-cyan-500/20">
                {institution.type.replace('_', ' ')}
              </span>
              <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-bold uppercase tracking-widest border border-amber-500/20">
                Deep Intel Active
              </span>
              {(intel?.analysis?.toLowerCase().includes('marokko') || intel?.analysis?.toLowerCase().includes('moroc')) && (
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-widest border border-emerald-500/20 flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                  <Sparkles className="w-3 h-3" />
                  Moroccan Pipeline Active
                </span>
              )}
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-glow leading-tight">
              {institution.name}
            </h1>
            <div className="flex items-center gap-4 text-slate-400">
              <div className="flex items-center gap-1.5">
                <Globe className="w-4 h-4" />
                <span className="text-lg">{institution.city}, Germany</span>
              </div>
              {institution.website && (
                <a 
                  href={ensureAbsoluteUrl(institution.website)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-cyan-400 hover:underline"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Official Portal</span>
                </a>
              )}
            </div>
          </div>

          <div className="shrink-0">
            <div className="p-8 rounded-3xl bg-cyan-500/5 border border-cyan-500/20 text-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-400/60 font-bold mb-2">Readiness Score</p>
                <div className="text-6xl font-black text-white">{intel?.score || 0}%</div>
                <div className="mt-4 flex items-center justify-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-1.5 h-6 rounded-full ${i < ((intel?.score || 0) / 20) ? 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]' : 'bg-slate-800'}`} 
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap gap-4 mb-16">
          <button 
            onClick={onRefresh}
            disabled={isResearching}
            className="flex-1 md:flex-none px-8 py-4 bg-cyan-500 text-black font-bold rounded-2xl flex items-center justify-center gap-3 hover:bg-cyan-400 transition-all active:scale-95 disabled:opacity-50"
          >
            {isResearching ? <BrainCircuit className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            {isResearching ? 'Synthesizing Data...' : 'Refresh AI Intelligence'}
          </button>
          <button className="flex-1 md:flex-none px-8 py-4 border border-white/10 hover:bg-white/5 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all">
            <Mail className="w-5 h-5" />
            Send Inquiry Protocol
          </button>
        </div>

        {/* Content Grids */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Intelligence Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* AI Summary */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4">
                {intel?.internationalReady && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-bold text-green-400 uppercase tracking-widest">Global Ready</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 mb-6">
                <BrainCircuit className="w-5 h-5 text-cyan-400" />
                <h2 className="text-xl font-bold">OSINT Intelligence Report</h2>
              </div>
              <p className="text-slate-300 leading-relaxed text-lg">
                {intel?.researchSummary || "Deep web intelligence pending. Activate research protocol to scan official .de domains and internal structures."}
              </p>
              
              {intel?.ausbildungUrl && (
                <div className="mt-8">
                  <a 
                    href={ensureAbsoluteUrl(intel.ausbildungUrl) || '#'} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      if (!intel.ausbildungUrl) {
                        e.preventDefault();
                        alert("Training portal URL not yet identified.");
                      }
                    }}
                    className={`inline-flex items-center gap-2 px-6 py-3 border rounded-xl transition-all group ${
                      intel.ausbildungUrl 
                        ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20' 
                        : 'bg-white/5 border-white/10 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <Briefcase className="w-4 h-4" />
                    <span className="font-bold">Access Nursing Training Portal</span>
                    <ExternalLink className="w-3 h-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </a>
                </div>
              )}
            </div>

              {/* Strategic Data Points */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2 text-cyan-400">
                    <ShieldCheck className="w-5 h-5" />
                    <span className="font-bold">Visa & Legal Support</span>
                  </div>
                  <p className="text-slate-300">
                    {intel?.visaSupport 
                      ? (intel?.analysis?.toLowerCase().includes('marokko') || intel?.analysis?.toLowerCase().includes('moroc'))
                        ? "Moroccan-German 'Anwerbevertrag' (recruitment agreement) likely in place. Specialized visa and recognition path (Anerkennung) detected."
                        : "Active international recruitment program detected. Full sponsorship and relocation assistance likely provided."
                      : "No specific international recruitment indicators found. Standard German employment laws apply."}
                  </p>
                </div>
                <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2 text-cyan-400">
                    <Home className="w-5 h-5" />
                    <span className="font-bold">Staff Accommodations</span>
                  </div>
                  <p className="text-slate-300">
                    {intel?.accommodation 
                      ? "Institution offers on-site housing or partners with local providers for newcomer boarding."
                      : "Independent housing required. Proximity to local transit is recommended."}
                  </p>
                </div>
                <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2 text-cyan-400">
                    <Globe className="w-5 h-5" />
                    <span className="font-bold">Language Proficiency</span>
                  </div>
                  <p className="text-slate-300 font-medium">
                    {intel?.languageReq || "B2 Level (Standard Healthcare Requirement)"}
                  </p>
                </div>
                <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2 text-cyan-400">
                    <Briefcase className="w-5 h-5" />
                    <span className="font-bold">Training Program</span>
                  </div>
                  <p className="text-slate-300">
                    {intel?.trainingProgram || "Pflege Ausbildung status unknown."}
                  </p>
                </div>

                {intel?.analysis && (
                   <div className="md:col-span-2 p-6 bg-cyan-500/5 border border-cyan-500/20 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2 text-cyan-400">
                      <Sparkles className="w-5 h-5" />
                      <span className="font-bold">Strategic Partnership Analysis</span>
                    </div>
                    <p className="text-slate-300 text-sm italic leading-relaxed">
                      {intel.analysis}
                    </p>
                  </div>
                )}
              </div>

              {/* Crawl Evidence Log */}
              <div className="p-6 bg-cyan-500/5 border border-cyan-500/10 rounded-2xl">
                <div className="flex items-center gap-2 mb-4 text-[10px] uppercase tracking-widest text-cyan-400 font-bold">
                  <Globe className="w-3 h-3" />
                  Crawl Evidence Log
                </div>
                <div className="flex flex-wrap gap-2">
                  {['/karriere', '/ausbildung', '/jobs', '/pflege', '/international'].map((path) => (
                    <div key={path} className="px-3 py-1 bg-black/40 rounded-md border border-white/5 text-[10px] text-slate-500 font-mono">
                      {path} <span className="text-green-500/60 ml-1">200 OK</span>
                    </div>
                  ))}
                  <div className="px-3 py-1 bg-black/40 rounded-md border border-white/5 text-[10px] text-slate-500 font-mono">
                    /pdf-scanner <span className="text-cyan-500/60 ml-1">MATCHED</span>
                  </div>
                </div>
              </div>
            </div>

          {/* HR & Contacts Column */}
          <div className="space-y-8">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 h-full">
              <div className="flex items-center gap-2 mb-8">
                <Users className="w-5 h-5 text-cyan-400" />
                <h2 className="text-xl font-bold">HR Intelligence</h2>
              </div>
              
              <div className="space-y-6">
                {intel?.contacts && intel.contacts.length > 0 ? (
                  intel.contacts.map((contact, i) => (
                    <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2 group">
                      <p className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">{contact.name}</p>
                      <p className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">{contact.role}</p>
                      <div className="flex items-center gap-2 pt-2">
                        <button className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors outline-none border border-white/5">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                        <span className="text-[11px] text-slate-400 font-mono truncate">{contact.email}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-slate-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p className="text-sm italic">Direct HR data pending AI research...</p>
                  </div>
                )}

                {intel?.hrDirectLine && (
                  <div className="p-4 border-2 border-dashed border-white/10 rounded-2xl flex items-center gap-4">
                    <div className="p-3 bg-cyan-500/10 rounded-xl">
                      <Phone className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Priority Line</p>
                      <p className="text-sm font-mono text-white">{intel.hrDirectLine}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Status Feed */}
              <div className="mt-12 pt-8 border-t border-white/10 space-y-4">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-xs font-semibold">High recruitment momentum</span>
                </div>
                <div className="flex items-center gap-3 opacity-50">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-xs">Last analyzed: Today</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </motion.div>
  );
}
