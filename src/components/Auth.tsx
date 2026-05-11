import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, LogIn, UserPlus, Globe, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AuthProps {
  onAuthSuccess: () => void;
}

export default function Auth({ onAuthSuccess }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setError("Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment secrets.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (loginError) throw loginError;
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
          },
        });
        if (signUpError) throw signUpError;
        alert('Check your email for the confirmation link!');
      }
      onAuthSuccess();
    } catch (err: any) {
      if (err.message?.includes('Forbidden use of secret API key') || err.message?.includes('service_role')) {
        setError(
          "Critical Key Error: You are using the 'service_role' key. Supabase forbids using this in a browser. " +
          "Please go to Supabase -> Project Settings -> API and copy the 'anon' public key instead."
        );
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative bg-[#000000] overflow-hidden px-4">
      {/* Decorative background elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-neon-cyan/10 rounded-full blur-[150px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-neon-purple/10 rounded-full blur-[150px] animate-pulse"></div>
      </div>
      
      <div className="scanline opacity-20" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, filter: 'blur(20px)' }}
        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-lg z-10"
      >
        <div className="apple-glass p-8 sm:p-16 rounded-[32px] sm:rounded-[48px] neon-border relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-neon-cyan to-transparent opacity-50 shadow-[0_0_20px_rgba(0,242,255,1)]"></div>
          
          <div className="flex flex-col items-center mb-10 sm:mb-14 text-center">
            <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-br from-neon-cyan to-neon-purple rounded-[22px] sm:rounded-[28px] flex items-center justify-center mb-6 sm:mb-8 shadow-[0_0_60px_rgba(0,242,255,0.4)] group-hover:scale-105 sm:group-hover:scale-110 transition-all duration-700 neon-border">
              <Globe className="text-white w-7 h-7 sm:w-10 sm:h-10 neon-text-cyan shadow-[0_0_10px_rgba(0,242,255,1)]" />
            </div>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tighter text-white uppercase italic leading-none">CareScout</h1>
            <p className="text-neon-cyan text-[9px] sm:text-[11px] uppercase tracking-[0.4em] sm:tracking-[0.6em] font-black mt-4 sm:mt-6 opacity-60 neon-text-cyan">
              {isLogin ? 'SYSTEM_INITIALIZATION_ALPHA' : 'NETWORK_PROVISIONING_SEQ'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-6 sm:space-y-8">
            <div className="space-y-3 sm:space-y-4">
              <label className="text-[10px] sm:text-[11px] uppercase tracking-[0.4em] text-slate-500 font-black ml-2">CREDENTIAL_EMAIL</label>
              <div className="relative group/input">
                <Mail className="absolute left-5 sm:left-6 top-1/2 -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 text-slate-600 group-focus-within/input:text-neon-cyan transition-colors" />
                <input 
                  type="email" 
                  required
                  placeholder="AUTHOR_ID@PROTOCOL.X"
                  className="w-full bg-black/40 border border-white/5 rounded-[20px] sm:rounded-[24px] py-4 sm:py-6 pl-12 sm:pl-16 pr-6 sm:pr-8 text-[11px] sm:text-[13px] focus:outline-none focus:ring-2 focus:ring-neon-cyan/20 focus:border-neon-cyan/40 transition-all font-black uppercase tracking-widest placeholder:text-slate-800"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <label className="text-[10px] sm:text-[11px] uppercase tracking-[0.4em] text-slate-500 font-black ml-2">ACCESS_PASSPHRASE</label>
              <div className="relative group/input">
                <Lock className="absolute left-5 sm:left-6 top-1/2 -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 text-slate-600 group-focus-within/input:text-neon-cyan transition-colors" />
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  className="w-full bg-black/40 border border-white/5 rounded-[20px] sm:rounded-[24px] py-4 sm:py-6 pl-12 sm:pl-16 pr-6 sm:pr-8 text-[11px] sm:text-[13px] focus:outline-none focus:ring-2 focus:ring-neon-cyan/20 focus:border-neon-cyan/40 transition-all font-black tracking-[0.5em] placeholder:text-slate-800"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-center font-black uppercase tracking-widest leading-relaxed shadow-[0_0_20px_rgba(239,68,68,0.15)]"
              >
                SECURITY_ERROR: {error}
              </motion.div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-white text-black hover:bg-slate-200 py-6 rounded-[28px] font-black text-[12px] uppercase tracking-[0.4em] transition-all shadow-[0_0_50px_rgba(255,255,255,0.15)] active:scale-[0.98] flex items-center justify-center gap-4 relative overflow-hidden group/btn"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <span>{isLogin ? 'BOOT_SYSTEM' : 'PROVISION_LINK'}</span>
                  <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-2 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-12 pt-10 border-t border-white/5 text-center">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-[11px] text-slate-500 hover:text-neon-cyan transition-all font-black uppercase tracking-[0.4em] hover:neon-text-cyan"
            >
              {isLogin ? "PROTOCOL_BYPASS // NEW_LINK" : "RESTORE_LINK // SECURE_AUTH"}
            </button>
          </div>
          
          <div className="mt-6 flex items-center justify-center gap-3 text-[11px] text-slate-700 uppercase tracking-[0.4em] font-black py-2 rounded-full border border-white/5 bg-white/2">
            <ShieldCheck className="w-4 h-4" />
            ENCRYPTED_OSINT_CHANNEL_ACTIVE
          </div>
        </div>
      </motion.div>
    </div>
  );
}
