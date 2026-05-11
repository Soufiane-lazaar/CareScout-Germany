import React from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, ShieldCheck, Globe, Users, Home, 
  Mail, Phone, ExternalLink, Calendar, MessageSquare,
  Sparkles, BrainCircuit, TrendingUp, Briefcase, X,
  Activity, Target, Cpu, Database
} from 'lucide-react';
import { Institution } from '../types';

interface IntelReportProps {
  institution: Institution;
  onClose: () => void;
  isResearching: boolean;
  onRefresh: () => void;
}

export function IntelReport({ institution, onClose, isResearching, onRefresh }: IntelReportProps) {
  const intel = institution.intel;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-[110] bg-[#000000] overflow-y-auto scrollbar-hide font-sans"
    >
      {/* Background Decor */}
      <div className="fixed inset-0 cyber-grid opacity-10 pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-tr from-neon-purple/5 via-transparent to-neon-cyan/5 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-16 py-12 md:py-24 relative z-10">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-16 md:mb-24">
          <button 
            onClick={onClose}
            className="flex items-center gap-6 text-slate-500 hover:text-white transition-all group"
          >
            <div className="w-14 h-14 apple-glass rounded-[24px] border border-white/5 flex items-center justify-center group-hover:neon-border transition-all">
              <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
            </div>
            <div className="text-left">
              <span className="block text-[12px] font-black uppercase tracking-[0.5em] mb-1 opacity-40">TERMINATE_SESSION</span>
              <span className="block text-[10px] font-mono text-neon-cyan neon-text-cyan">OSINT_FEED_042</span>
            </div>
          </button>
          
          <button 
            onClick={onClose}
            className="w-14 h-14 apple-glass rounded-[24px] border border-white/5 text-slate-500 hover:text-white transition-all flex items-center justify-center group active:scale-90"
          >
            <X className="w-7 h-7 group-hover:rotate-90 transition-transform" />
          </button>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
          <div className="lg:col-span-8 space-y-20">
            {/* Header Section */}
            <div className="space-y-10">
              <div className="flex flex-wrap items-center gap-5">
                <div className="px-6 py-2.5 rounded-2xl bg-neon-cyan/10 text-neon-cyan text-[11px] font-black uppercase tracking-[0.3em] border border-neon-cyan/30 flex items-center gap-3 shadow-[0_0_20px_rgba(0,242,255,0.2)]">
                  <Database className="w-4 h-4" />
                  {institution.type.replace('_', ' ')}
                </div>
                <div className="px-6 py-2.5 rounded-2xl bg-neon-purple/10 text-neon-purple text-[11px] font-black uppercase tracking-[0.3em] border border-neon-purple/30 flex items-center gap-3 shadow-[0_0_20px_rgba(188,19,254,0.2)]">
                  <Activity className="w-4 h-4" />
                  LIFELINE_SYNCED
                </div>
              </div>

              <h1 className="text-6xl md:text-9xl font-black tracking-tighter text-white leading-[0.85] uppercase italic">
                {institution.name}
              </h1>

              <div className="flex flex-wrap items-center gap-10 text-slate-400">
                <div className="flex items-center gap-4">
                  <Globe className="w-8 h-8 text-neon-cyan shadow-[0_0_15px_rgba(0,242,255,0.4)]" />
                  <span className="text-2xl md:text-3xl font-black tracking-tighter text-white/80 uppercase">{institution.city}_DE</span>
                </div>
                <div className="h-6 w-px bg-white/10 hidden md:block" />
                <div className="flex items-center gap-4">
                  <Target className="w-8 h-8 text-slate-600" />
                  <span className="text-xl md:text-2xl font-black tracking-tighter text-slate-500 uppercase">{institution.address}</span>
                </div>
              </div>
            </div>

            {/* Analysis Section */}
            <div className="space-y-12">
              <div className="flex items-center gap-5">
                <div className="w-10 h-10 rounded-xl bg-neon-cyan/10 flex items-center justify-center border border-neon-cyan/30">
                  <BrainCircuit className="w-5 h-5 text-neon-cyan" />
                </div>
                <h3 className="text-[12px] font-black uppercase tracking-[0.5em] text-white/50">DEEP_INTELLIGENCE_METRICS</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="p-12 rounded-[48px] apple-glass neon-border relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-10 text-neon-cyan/20">
                    <TrendingUp className="w-16 h-16" />
                  </div>
                  <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 mb-6">VISA_EXPEDIENCY</h4>
                  <div className="text-6xl font-black text-white mb-8 italic">PLATINUM</div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden relative">
                    <motion.div initial={{ width: 0 }} animate={{ width: '92%' }} transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }} className="h-full bg-neon-cyan shadow-[0_0_15px_rgba(0,242,255,1)]" />
                  </div>
                  <p className="mt-8 text-[10px] text-neon-cyan leading-relaxed uppercase tracking-[0.4em] font-black neon-text-cyan">Priority Sequence Enabled</p>
                </div>

                <div className="p-12 rounded-[48px] apple-glass neon-border-purple relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-10 text-neon-purple/20">
                    <Home className="w-16 h-16" />
                  </div>
                  <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 mb-6">RELOCATION_BUFFER</h4>
                  <div className="text-6xl font-black text-white mb-8 italic">{intel?.accommodation ? 'ACTIVE' : 'TIER_1'}</div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden relative">
                    <motion.div initial={{ width: 0 }} animate={{ width: '78%' }} transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }} className="h-full bg-neon-purple shadow-[0_0_15px_rgba(188,19,254,1)]" />
                  </div>
                  <p className="mt-8 text-[10px] text-neon-purple leading-relaxed uppercase tracking-[0.4em] font-black neon-text-purple">Housing Protocols Synced</p>
                </div>
              </div>

              <div className="p-12 rounded-[48px] apple-glass border-white/5 relative group">
                <Sparkles className="absolute top-10 right-10 w-10 h-10 text-neon-cyan/20" />
                <h4 className="text-[11px] font-black uppercase tracking-[0.5em] text-neon-cyan mb-10">EXECUTIVE_ANALYSIS</h4>
                <div className="text-2xl md:text-3xl text-slate-300 leading-snug font-black tracking-tight italic uppercase">
                  "{intel?.analysis || "Autonomous intelligence gathering continues. High-priority recruitment patterns identified in the DACH region. Structural infrastructure supports international integration protocols."}"
                </div>
                <div className="mt-12 flex items-center gap-5 text-[11px] font-mono text-neon-cyan/40 uppercase tracking-[0.4em]">
                  <span className="w-3 h-3 rounded-full bg-neon-cyan animate-pulse shadow-[0_0_10px_rgba(0,242,255,1)]" />
                  VERIFIED_SOURCE // X_PROTOCOL_DACH
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-16">
            {/* Score Card */}
            <div className="p-16 rounded-[4rem] apple-glass border-neon-cyan/20 relative overflow-hidden text-center group">
              <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/5 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-1000" />
              <div className="relative z-10">
                <p className="text-[12px] font-black uppercase tracking-[0.6em] text-white/30 mb-10 text-center">SYSTEM_READY</p>
                <div className="text-[10rem] font-black text-white tracking-tighter mb-6 italic leading-none">{intel?.score || 0}</div>
                <div className="text-neon-cyan text-sm font-black uppercase tracking-[0.4em] neon-text-cyan">PROTOCOL_DELTA</div>
                
                <div className="mt-16 flex items-end justify-center gap-3 h-32">
                  {[...Array(12)].map((_, i) => (
                    <motion.div 
                      key={i} 
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.random() * 80 + 20}%` }}
                      transition={{ repeat: Infinity, duration: 1.5, repeatType: 'reverse', delay: i * 0.1 }}
                      className={`w-2.5 rounded-full transition-all duration-500 ${i < ((intel?.score || 0) / 8.3) ? 'bg-neon-cyan shadow-[0_0_20px_rgba(0,242,255,0.8)]' : 'bg-white/5'}`} 
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Strategic Contacts */}
            <div className="space-y-10">
              <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-white/30 px-8">PERSONNEL_NODES</h3>
              <div className="space-y-6">
                {intel?.contacts.map((contact, i) => (
                   <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * i }}
                    key={i} 
                    className="p-10 rounded-[40px] apple-glass border-white/5 hover:neon-border transition-all group cursor-pointer"
                   >
                     <div className="flex items-center justify-between mb-4">
                       <span className="text-xl font-black text-white uppercase italic tracking-tighter">{contact.name}</span>
                       <Briefcase className="w-5 h-5 text-slate-600 group-hover:text-neon-cyan transition-colors" />
                     </div>
                     <span className="text-[11px] font-black text-neon-cyan uppercase tracking-[0.3em] block">{contact.role}</span>
                     <div className="mt-8 flex items-center justify-between">
                        <span className="text-[11px] font-mono text-slate-500">{contact.email}</span>
                        <div className="w-10 h-10 rounded-full apple-glass flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all border-neon-cyan/30">
                          <ExternalLink className="w-4 h-4 text-neon-cyan" />
                        </div>
                     </div>
                   </motion.div>
                ))}
              </div>
            </div>

            {/* Action Matrix */}
            <div className="pt-10">
              <button 
                onClick={() => window.open(institution.website || '#', '_blank')}
                className="w-full bg-white text-black py-8 rounded-[40px] font-black text-[12px] uppercase tracking-[0.4em] flex items-center justify-center gap-5 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_50px_rgba(255,255,255,0.1)] relative overflow-hidden group/btn"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
                <Cpu className="w-6 h-6" />
                SYNC_PORTFOLIO
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
