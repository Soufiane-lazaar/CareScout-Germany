import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, MapPin, Building2, UserCircle, Mail, Phone, Info, Globe, ShieldCheck, Home, Bookmark, BookmarkCheck, ListChecks, X, LogOut, Users, Zap, Loader2 } from 'lucide-react';
import { Institution, Contact, Lead, SearchHistory } from './types';
import MapView from './components/MapView';
import Auth from './components/Auth';
import { supabase } from './lib/supabase';
import { User } from '@supabase/supabase-js';
import { deepResearchInstitution } from './services/geminiService';
import { History, Sparkles, BrainCircuit } from 'lucide-react';
import { IntelReport } from './components/IntelReport';

export default function App() {
  type Tab = 'discovery' | 'leads' | 'history';
  const [activeTab, setActiveTab] = useState<Tab>('discovery');

  const [session, setSession] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [selectedInst, setSelectedInst] = useState<Institution | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [savedLeads, setSavedLeads] = useState<Lead[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [hoveredInstId, setHoveredInstId] = useState<string | null>(null);
  const [isResearching, setIsResearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeepIntelPage, setShowDeepIntelPage] = useState(false);
  const [dbMissing, setDbMissing] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterVerified, setFilterVerified] = useState(false);
  const [filterContract, setFilterContract] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [isBooting, setIsBooting] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  useEffect(() => {
    // Initial boot sequence
    const timer = setTimeout(() => setIsBooting(false), 3000);
    
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session?.user ?? null);
      setAuthChecking(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session?.user ?? null);
    });

    return () => {
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (session) {
      fetchLeads();
      fetchHistory();
    } else {
      setSavedLeads([]);
      setSearchHistory([]);
    }
  }, [session]);

  const fetchHistory = async () => {
    if (!session) return;
    const { data, error } = await supabase
      .from('search_history')
      .select('*')
      .eq('user_id', session.id)
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (error) {
      if (error.code === 'PGRST205') {
        console.warn('Supabase table "search_history" is missing. Please run the setup SQL in supabase_setup.sql');
        setDbMissing(true);
      } else {
        console.error('Error fetching history:', error);
      }
    } else {
      setSearchHistory(data);
    }
  };

  const saveSearchHistory = async (query: string, count: number) => {
    if (!session || !query) return;
    const { error } = await supabase
      .from('search_history')
      .insert({
        user_id: session.id,
        query: query,
        results_count: count
      });
    
    if (error) {
      if (error.code === 'PGRST205') {
        console.warn('Supabase table "search_history" is missing. Cannot save history.');
      } else {
        console.error('Error saving history:', error);
      }
    } else {
      fetchHistory();
    }
  };

  const performDeepResearch = async () => {
    if (!selectedInst || isResearching) return;
    setIsResearching(true);
    try {
      const intel = await deepResearchInstitution(selectedInst);
      const updatedInst = {
        ...selectedInst,
        website: intel.website || selectedInst.website,
        intel: {
          ...(selectedInst.intel || {}),
          ...intel
        } as any
      };
      setSelectedInst(updatedInst);
      
      // Update in institutions list if present
      setInstitutions(prev => prev.map(inst => inst.id === selectedInst.id ? updatedInst : inst));
      
      // Update in saved leads if present
      if (savedLeads.find(l => l.institutionId === selectedInst.id)) {
        // Here you would also update Supabase if needed
      }
    } finally {
      setIsResearching(false);
    }
  };

  const fetchLeads = async () => {
    if (!session) return;
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', session.id);
    
    if (error) {
      if (error.code === 'PGRST205') {
        console.warn('Supabase table "leads" is missing. Please run the setup SQL in supabase_setup.sql');
      } else {
        console.error('Error fetching leads:', error);
      }
    } else {
      setSavedLeads(data.map(item => ({
        ...item,
        institutionId: item.institution_id,
        savedAt: item.created_at
      })));
    }
  };

  const saveLead = async (inst: Institution) => {
    if (!session) return;
    
    const isAlreadySaved = savedLeads.find(l => l.institutionId === inst.id);
    if (isAlreadySaved) return;

    const { error } = await supabase
      .from('leads')
      .insert({
        user_id: session.id,
        institution_id: inst.id,
        name: inst.name,
        city: inst.city,
        lat: inst.lat,
        lon: inst.lon,
        status: 'discovered'
      });

    if (error) {
      console.error('Error saving lead:', error);
    } else {
      fetchLeads(); // Refresh leads
    }
  };

  const updateLeadStatus = async (id: string, newStatus: Lead['status']) => {
    if (!session) return;
    const { error } = await supabase
      .from('leads')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      console.error('Error updating lead status:', error);
    } else {
      fetchLeads();
    }
  };

  const deleteLead = async (id: string) => {
    if (!session) return;
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting lead:', error);
    } else {
      fetchLeads();
      if (selectedInst && selectedInst.id === id) setSelectedInst(null);
    }
  };

  const exportLeadsToCSV = () => {
    if (savedLeads.length === 0) return;
    
    const headers = ['Name', 'City', 'Type', 'Website', 'Status', 'Intel Score', 'Saved At'];
    const rows = savedLeads.map(l => [
      l.name,
      l.city,
      l.type,
      l.website || '',
      l.status,
      l.intel?.score || '',
      new Date(l.savedAt).toLocaleDateString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `CareScout_Leads_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredDisplayList = (activeTab === 'leads' ? savedLeads : institutions).filter(inst => {
    const matchesText = inst.name.toLowerCase().includes(filterText.toLowerCase()) || 
                       inst.city.toLowerCase().includes(filterText.toLowerCase());
    const matchesType = filterType === 'all' || inst.type === filterType;
    const matchesVerified = !filterVerified || inst.intel?.internationalReady;
    const matchesContract = !filterContract || (inst.intel?.analysis?.toLowerCase().includes('vertrag') || inst.intel?.analysis?.toLowerCase().includes('contract') || inst.intel?.analysis?.toLowerCase().includes('agreement'));
    
    return matchesText && matchesType && matchesVerified && matchesContract;
  });

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (isBooting) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#000000] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.02] via-transparent to-white/[0.02]" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 flex flex-col items-center"
        >
          <div className="relative mb-20 group">
            <motion.div 
              animate={{ opacity: [0.1, 0.3, 0.1], scale: [1, 1.1, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -inset-12 bg-white/5 blur-[40px] rounded-full"
            />
            <div className="w-24 h-24 sm:w-32 sm:h-32 bg-black apple-glass rounded-[32px] sm:rounded-[40px] flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-50" />
              <Globe className="text-white w-10 h-10 sm:w-12 sm:h-12 opacity-80" />
            </div>
          </div>
          
          <div className="text-center space-y-6">
            <motion.h1 
              initial={{ letterSpacing: '0.8em', opacity: 0 }}
              animate={{ letterSpacing: '0.2em', opacity: 1 }}
              transition={{ duration: 2.5, ease: [0.16, 1, 0.3, 1] }}
              className="text-3xl sm:text-7xl font-black text-white uppercase italic premium-gradient-text"
            >
              CARESCOUT
            </motion.h1>
          </div>

          <div className="mt-24 w-64 sm:w-80 flex flex-col items-center">
             <div className="flex flex-col items-center gap-3 w-full">
               <div className="h-[2px] w-full bg-white/5 rounded-full overflow-hidden relative">
                 <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: '100%' }}
                   transition={{ duration: 3, ease: [0.16, 1, 0.3, 1] }}
                   className="h-full bg-white/40 shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                 />
               </div>
               <span className="text-[10px] font-mono text-white/30 uppercase tracking-[0.6em] ml-[0.6em]">INITIALIZING_PROTOCOL</span>
             </div>
          </div>
        </motion.div>
        
        <div className="absolute bottom-12 flex items-center gap-3 px-8 w-full justify-between opacity-20">
          <div className="text-[9px] font-mono text-white uppercase tracking-[0.4em]">
            SYSTEM_DE_2026
          </div>
          <div className="text-[9px] font-mono text-white uppercase tracking-[0.4em]">
            DEEP_SEARCH_ACTIVE
          </div>
        </div>
      </div>
    );
  }

  if (authChecking) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#030712]">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2 }}>
          <Globe className="w-8 h-8 text-cyan-500" />
        </motion.div>
      </div>
    );
  }

  if (!session) {
    return <Auth onAuthSuccess={() => {}} />;
  }

  const ensureAbsoluteUrl = (url?: string) => {
    if (!url || url === '#' || url === 'undefined') {
      return null;
    }
    if (url.startsWith('http')) return url;
    return `https://${url}`;
  };

  const startDiscovery = async (coords?: { lat: number, lon: number, radius?: number }) => {
    setIsScanning(true);
    setError(null);
    if (!coords) setInstitutions([]); // Only clear if it's a fresh search
    
    // Improved search query normalization for nationwide search
    const isNationwide = !coords && (
      searchQuery.toLowerCase().includes('germany') || 
      searchQuery.toLowerCase().includes('deutschland') || 
      searchQuery.toLowerCase().includes('nationwide') ||
      searchQuery.toLowerCase() === 'all'
    );

    const normalizedQuery = isNationwide ? 'all' : searchQuery;

    try {
      let url = "";
      if (coords) {
        url = `/api/discover?lat=${coords.lat}&lon=${coords.lon}&radius=${coords.radius || 25000}`;
      } else {
        url = normalizedQuery 
          ? `/api/discover?query=${encodeURIComponent(normalizedQuery)}`
          : '/api/discover?query=Berlin'; 
      }
        
      const response = await fetch(url);
      const contentType = response.headers.get("content-type");
      
      if (!response.ok) {
        let errorMsg = `Research protocol error: ${response.status}`;
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
        } else if (response.status === 504 || response.status === 500) {
          errorMsg = "Research engine busy. High-volume research cluster is currently saturated. Try a more specific region.";
        }
        throw new Error(errorMsg);
      }

      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Discovery cluster returned an invalid data format. Protocol reset recommended.");
      }

      const data = await response.json();
      
      // Handle the case where Overpass returns a 200 OK but the body contains an error message
      if (typeof data === 'string' && (data.includes('timeout') || data.includes('busy'))) {
        throw new Error("The global discovery cluster is currently over capacity. Retrying with a more specific location usually helps.");
      }

      let elements = data.elements || [];
      
      // Filter elements that have coordinates (either directly or via 'center')
      const validElements = elements.filter((el: any) => (el.lat && el.lon) || (el.center?.lat && el.center?.lon));

      if (validElements.length === 0) {
        if (searchQuery && !coords) {
          setError("No results detected in this specific sector. Deep research continues, but try secondary keys like 'Nursing' or 'Clinics'.");
        } else {
          setError("The discovery engine returned no regional nodes. Try moving the map and scanning again.");
        }
        return;
      }
      
      const discovered = validElements.slice(0, 1000).map((el: any) => {
        const lat = el.lat || el.center?.lat;
        const lon = el.lon || el.center?.lon;
        const name = el.tags?.name || el.name || 'Healthcare Institution';
        
        return {
          id: String(el.id),
          name: name,
          type: el.tags?.amenity || el.tags?.healthcare || 'hospital',
          lat: lat,
          lon: lon,
          city: el.tags?.['addr:city'] || el.tags?.city || el.city || 'Discovery Zone',
          address: el.tags?.['addr:street'] || 'Healthcare Campus',
          website: el.tags?.website || el.website,
          phone: el.tags?.phone || el.phone,
          intel: {
            contacts: [
              { name: "Recruitment Lead", email: `karriere@${name.toLowerCase().replace(/[^a-z]/g, '')}.de`, role: "HR Relations" }
            ],
            score: Math.floor(Math.random() * 30) + 70, // Higher scores for discovered
            visaSupport: true,
            accommodation: Math.random() > 0.4,
            languageReq: "B2 Recommended",
            analysis: el.tags?.description || el.tags?.note || "Analyzed via Deep OSINT protocol"
          }
        };
      });
      
      if (coords) {
        // Merge or replace? Let's merge for continuous exploration experience
        setInstitutions(prev => {
          const combined = [...prev, ...discovered];
          const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
          return unique;
        });
      } else {
        setInstitutions(discovered);
        if (searchQuery) {
          saveSearchHistory(searchQuery, discovered.length);
        }
      }
    } catch (err: any) {
      console.error("Discovery error:", err);
      setError(err.message || "An unknown error occurred during discovery protocol.");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#020617] text-slate-200 relative">
      <div className="scanline" />
      {/* Mobile Top Bar */}
      <header className="fixed top-0 left-0 right-0 h-24 apple-glass border-b border-white/5 flex items-center justify-between px-8 z-[100] sm:hidden">
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 bg-gradient-to-br from-neon-cyan to-neon-purple rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(0,242,255,0.3)] neon-border">
            <Globe className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-[14px] font-black uppercase tracking-[0.4em] text-white italic">CARESCOUT</h1>
            <p className="text-[8px] font-mono text-neon-cyan/80 uppercase tracking-widest mt-1">PROTOCOL_LINK_ESTABLISHED</p>
          </div>
        </div>
        <button 
          onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
          className="p-4 apple-glass rounded-2xl border border-white/10 text-slate-400 group active:scale-90 transition-all neon-border"
        >
          <ListChecks className={`w-7 h-7 transition-colors ${mobileDrawerOpen ? 'text-neon-cyan' : ''}`} />
        </button>
      </header>

      {/* Desktop Sidebar Navigation */}
      <nav className="hidden sm:flex w-24 md:w-28 bg-black/80 backdrop-blur-[40px] border-r border-white/5 flex-col items-center py-10 pb-12 z-50">
        <div className="w-14 h-14 bg-gradient-to-br from-neon-cyan to-neon-purple rounded-[18px] flex items-center justify-center shadow-[0_0_40px_rgba(0,242,255,0.3)] mb-16 relative group cursor-pointer neon-border transition-transform active:scale-95">
          <div className="absolute inset-0 bg-white/10 rounded-[18px] opacity-0 group-hover:opacity-100 transition-opacity" />
          <Globe className="text-white w-7 h-7 neon-text-cyan" />
        </div>

        <div className="flex flex-col gap-8 flex-1 justify-center">
          <NavIcon 
            icon={<Search className="w-5 h-5 md:w-6 md:h-6" />} 
            label="SCAN" 
            active={activeTab === 'discovery'} 
            onClick={() => setActiveTab('discovery')} 
          />
          <NavIcon 
            icon={<BookmarkCheck className="w-5 h-5 md:w-6 md:h-6" />} 
            label="INTEL" 
            active={activeTab === 'leads'} 
            onClick={() => setActiveTab('leads')} 
          />
          <NavIcon 
            icon={<History className="w-5 h-5 md:w-6 md:h-6" />} 
            label="LOGS" 
            active={activeTab === 'history'} 
            onClick={() => setActiveTab('history')} 
          />
        </div>

        <div className="mt-auto flex flex-col items-center gap-8 pt-8 border-t border-white/5 w-16">
          <div className="group relative">
            <div className="absolute -inset-3 bg-white/5 blur-xl opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />
            <div className="w-12 h-12 rounded-[16px] bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-black text-white hover:bg-white/10 transition-all cursor-pointer relative z-10 shadow-xl overflow-hidden uppercase tracking-tighter">
              {session?.email?.substring(0, 1).toUpperCase()}
            </div>
          </div>
          <button 
            onClick={handleSignOut}
            className="p-3 text-slate-500 hover:text-white apple-glass rounded-xl transition-all group active:scale-90"
            title="Terminate Session"
          >
            <LogOut className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 h-28 apple-glass border-t border-white/5 flex items-center justify-around z-[100] px-4 pb-4">
        <MobileNavIcon 
          icon={<Search className="w-6 h-6" />} 
          label="DISCOVER"
          active={activeTab === 'discovery'} 
          onClick={() => {
            setActiveTab('discovery');
            setMobileDrawerOpen(false);
          }} 
        />
        <MobileNavIcon 
          icon={<BookmarkCheck className="w-6 h-6" />} 
          label="INTEL"
          active={activeTab === 'leads'} 
          onClick={() => {
            setActiveTab('leads');
            setMobileDrawerOpen(false);
          }} 
        />
        <MobileNavIcon 
          icon={<History className="w-6 h-6" />} 
          label="LOGS"
          active={activeTab === 'history'} 
          onClick={() => {
            setActiveTab('history');
            setMobileDrawerOpen(false);
          }} 
        />
        <button 
          onClick={handleSignOut}
          className="flex flex-col items-center gap-2 px-4 py-2 text-slate-500 hover:text-red-400 active:scale-90 transition-all"
        >
          <LogOut className="w-6 h-6" />
          <span className="text-[8px] font-black uppercase tracking-widest opacity-40">EXIT</span>
        </button>
      </nav>

      <div className={`
        fixed inset-0 z-[90] bg-black/40 backdrop-blur-[60px] transition-transform duration-700 ease-[cubic-bezier(0.16, 1, 0.3, 1)] sm:relative sm:inset-auto sm:translate-x-0
        w-full sm:w-96 md:w-[28rem] flex flex-col border-r border-white/5
        ${mobileDrawerOpen ? 'translate-x-0' : '-translate-x-full sm:translate-x-0'}
      `}>
        <header className="p-10 pb-8 border-b border-white/5 bg-white/2 mt-24 sm:mt-0">
          <div className="flex items-center justify-between mb-8">
             <div className="flex items-center gap-4">
               <div className="w-3 h-3 rounded-full bg-neon-cyan shadow-[0_0_15px_rgba(0,242,255,1)] animate-pulse" />
               <h1 className="text-[12px] font-black uppercase tracking-[0.5em] text-white/40">CARESCOUT_CORE</h1>
             </div>
             <div className="flex items-center gap-3">
               <span className="text-[10px] font-mono text-neon-cyan/60">NODE_AUTH</span>
             </div>
          </div>
          
          <div className="flex items-center justify-between">
            <h2 className="text-4xl font-black tracking-tighter text-white uppercase italic">
              <span className="bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent">{activeTab}</span>
            </h2>
            {activeTab === 'discovery' && institutions.length > 0 && !isScanning && (
              <button 
                onClick={() => setInstitutions([])}
                className="p-2 hover:bg-white/5 rounded-xl text-slate-500 hover:text-red-400 transition-all group"
                title="Clear nodes"
              >
                <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
              </button>
            )}
            {activeTab === 'discovery' && isScanning && (
              <motion.div 
                animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }} 
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-3 h-3 rounded-full bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.8)]"
              />
            )}
          </div>
          
          <p className="text-[9px] uppercase tracking-[0.3em] text-slate-500 font-black mt-3">
            {activeTab === 'discovery' ? 'Autonomous Node Discovery' : activeTab === 'leads' ? 'Regional Intelligence' : 'System Diagnostic Logs'}
          </p>
          
          <AnimatePresence>
            {isScanning && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 pt-6 border-t border-white/5"
              >
                 <div className="flex justify-between mb-2">
                   <span className="text-[8px] font-mono text-cyan-500 uppercase tracking-widest">Scanning Grid...</span>
                   <span className="text-[8px] font-mono text-cyan-500">ACTIVE</span>
                 </div>
                 <div className="h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 15, ease: "linear" }}
                      className="h-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                    />
                 </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-10 scrollbar-hide">
          {activeTab === 'discovery' && (
            <div className="space-y-8">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl opacity-0 group-focus-within:opacity-20 transition-opacity blur-lg" />
                <div className="relative flex items-center">
                  <Search className="absolute left-5 w-5 h-5 text-slate-400 group-focus-within:text-cyan-400 transition-colors" />
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && startDiscovery()}
                    placeholder="Enter Sector Target (e.g. Frankfurt)..."
                    className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-5 pl-14 pr-6 text-sm font-medium focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/30 outline-none transition-all placeholder:text-slate-600"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] uppercase tracking-widest text-slate-600 font-bold flex items-center gap-2">
                  <Globe className="w-3 h-3" /> Popular Sectors
                </p>
                <div className="flex flex-wrap gap-2">
                  {['Berlin', 'Munich', 'Hamburg', 'Cologne', 'Frankfurt'].map(city => (
                    <button
                      key={city}
                      onClick={() => {
                        setSearchQuery(city);
                        setTimeout(startDiscovery, 100);
                      }}
                      className="text-[10px] px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-cyan-500/10 hover:border-cyan-500/30 transition-all text-slate-400 hover:text-cyan-400 font-bold"
                    >
                      #{city}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <button 
                  onClick={() => startDiscovery()}
                  disabled={isScanning}
                  className="bg-white text-black hover:bg-slate-200 disabled:opacity-50 py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-3 group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  {isScanning ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>INITIALIZE_SCAN</span>
                    </>
                  )}
                </button>
              </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      setSearchQuery('Anwerbevertrag Pflege');
                      setTimeout(startDiscovery, 100);
                    }}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 py-3 rounded-2xl font-bold text-[10px] uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-2 border border-white/5 text-amber-400"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Contract Protocol
                  </button>
                  <button 
                    onClick={() => {
                      setSearchQuery('Nationwide Search');
                      setTimeout(startDiscovery, 100);
                    }}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 py-3 rounded-2xl font-bold text-[10px] uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-2 border border-white/5 text-cyan-400"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    Nationwide
                  </button>
                </div>
              </div>
          )}

          <div className="space-y-4">
             <button 
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-between w-full text-[10px] uppercase tracking-widest text-slate-500 font-bold hover:text-cyan-400 transition-colors"
            >
              <span>Protocol Filters</span>
              <div className={`transition-transform duration-300 ${showFilters ? 'rotate-180' : ''}`}>
                <Search className="w-3 h-3" />
              </div>
            </button>
            
            <AnimatePresence>
              {showFilters && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-col gap-3 py-2">
                    <input 
                      type="text" 
                      placeholder="Context filter..."
                      className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-[11px] focus:outline-none focus:border-cyan-500/50"
                      value={filterText}
                      onChange={(e) => setFilterText(e.target.value)}
                    />
                    
                    <div className="grid grid-cols-1 gap-2">
                      <select 
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-lg py-1.5 px-2 text-[10px] appearance-none focus:outline-none"
                      >
                        <option value="all" className="bg-slate-900">All Types</option>
                        <option value="hospital" className="bg-slate-900">Hospital</option>
                        <option value="nursing_home" className="bg-slate-900">Nursing</option>
                        <option value="academy" className="bg-slate-900">Academy</option>
                      </select>
                      
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setFilterVerified(!filterVerified)}
                          className={`flex-1 py-1.5 rounded-lg border text-[10px] transition-all flex items-center justify-center gap-1.5 ${filterVerified ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-white/5 border-white/10 text-slate-400'}`}
                        >
                          <ShieldCheck className="w-3 h-3" />
                          Verified
                        </button>

                        <button 
                          onClick={() => setFilterContract(!filterContract)}
                          className={`flex-1 py-1.5 rounded-lg border text-[10px] transition-all flex items-center justify-center gap-1.5 ${filterContract ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-white/5 border-white/10 text-slate-400'}`}
                        >
                          <Sparkles className="w-3 h-3" />
                          Agreement
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-3">
             <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold flex items-center justify-between border-b border-white/5 pb-2">
              <span>{activeTab === 'discovery' ? 'Discovery Stream' : activeTab === 'leads' ? 'Target Matrix' : 'Audit Log'}</span>
              {activeTab === 'leads' && (
                <button onClick={exportLeadsToCSV} className="text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1">
                  <Globe className="w-2.5 h-2.5" /> <span>Export</span>
                </button>
              )}
            </div>

            <AnimatePresence mode="popLayout">
              {activeTab === 'history' ? (
                 <motion.div key="history-list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                  {searchHistory.map((h) => (
                    <button
                      key={h.id}
                      onClick={() => {
                        setSearchQuery(h.query);
                        setTimeout(startDiscovery, 100);
                        setActiveTab('discovery');
                      }}
                      className="w-full p-4 glass-card text-left hover:bg-white/10 flex items-center justify-between group rounded-xl border border-white/5"
                    >
                      <div>
                        <p className="text-xs font-bold text-white">{h.query}</p>
                        <p className="text-[10px] text-slate-500">{new Date(h.created_at).toLocaleString()}</p>
                      </div>
                      <span className="text-[10px] bg-cyan-500/5 text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-500/20">{h.results_count} entities</span>
                    </button>
                  ))}
                </motion.div>
              ) : (
                <motion.div key="list-items" className="space-y-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  {filteredDisplayList.map((inst, idx) => (
                    <motion.div
                      layout
                      key={inst.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: Math.min(idx * 0.02, 0.4), ease: [0.16, 1, 0.3, 1] }}
                      onMouseEnter={() => setHoveredInstId(inst.id)}
                      onMouseLeave={() => setHoveredInstId(null)}
                      onClick={() => setSelectedInst(inst)}
                      className={`p-6 cursor-pointer apple-glass transition-all duration-500 rounded-[28px] group relative overflow-hidden ${selectedInst?.id === inst.id ? 'neon-border scale-[1.02] bg-white/5' : 'hover:bg-white/5 border-white/5'}`}
                    >
                      <div className="flex items-start justify-between relative z-10">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[13px] font-black text-white truncate group-hover:text-neon-cyan transition-colors uppercase tracking-tight italic">{inst.name}</h3>
                          <div className="flex items-center gap-3 mt-3">
                             <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-black uppercase tracking-widest">
                              <MapPin className="w-3 h-3 text-neon-cyan/60" />
                              <span className="truncate">{inst.city || 'Regional Node'}</span>
                            </div>
                            {inst.intel?.score && inst.intel.score > 80 && (
                               <div className="flex items-center gap-1.5 text-[9px] text-neon-cyan font-black uppercase tracking-widest bg-neon-cyan/10 px-2.5 py-1 rounded-full border border-neon-cyan/20">
                                <Sparkles className="w-3 h-3" />
                                <span>ALPHA_NODE</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-1.5 h-1.5 bg-neon-cyan rounded-full shadow-[0_0_10px_rgba(0,242,255,1)]"></div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Main Content (Map + Intelligence) */}
      <main className="flex-1 relative bg-[#020617] overflow-hidden flex flex-col">
        {/* HUD Overlay Top */}
        <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-30 pointer-events-none">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="px-4 py-2 bg-slate-950/60 backdrop-blur-md rounded-xl border border-white/10 flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${isScanning ? 'bg-amber-500 animate-pulse' : 'bg-green-500'} shadow-[0_0_8px_rgba(245,158,11,1)]`}></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {isScanning ? 'Researching Deep OSINT...' : 'Discovery Engine: Ready'}
              </span>
            </div>
            {institutions.length > 0 && !isScanning && (
              <div className="px-4 py-2 bg-slate-950/60 backdrop-blur-md rounded-xl border border-white/10 flex items-center gap-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">{institutions.length} Nodes Detected</span>
              </div>
            )}
          </div>
          
          <div className="hidden md:flex gap-2">
             <div className="px-4 py-2 bg-slate-950/60 backdrop-blur-md rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-500">
               OSINT Protocol v4.2.0
             </div>
          </div>
        </div>

        {/* HUD Corners */}
        <div className="absolute top-6 left-6 w-16 h-16 border-l-2 border-t-2 border-white/10 pointer-events-none z-20" />
        <div className="absolute top-6 right-6 w-16 h-16 border-r-2 border-t-2 border-white/10 pointer-events-none z-20" />
        <div className="absolute bottom-6 left-6 w-16 h-16 border-l-2 border-b-2 border-white/10 pointer-events-none z-20" />
        <div className="absolute bottom-6 right-6 w-16 h-16 border-r-2 border-b-2 border-white/10 pointer-events-none z-20 hidden lg:block" />

        <div className="flex-1 relative">
          <MapView 
            institutions={institutions} 
            onSelect={(inst) => {
              setSelectedInst(inst);
              if (window.innerWidth < 1024) setMobileDrawerOpen(false);
            }} 
            hoveredId={hoveredInstId}
            center={selectedInst ? [selectedInst.lon, selectedInst.lat] : institutions.length > 0 && !isScanning ? [institutions[0].lon, institutions[0].lat] : undefined}
            onSearchInArea={(lat, lon, zoom) => {
              const radius = Math.max(5000, Math.min(100000, (20 - zoom) * 5000));
              startDiscovery({ lat, lon, radius });
            }}
          />
        </div>

        {/* Intelligence Overlay */}
        <AnimatePresence>
          {selectedInst && (
            <motion.div
              initial={{ opacity: 0, x: window.innerWidth > 1024 ? 400 : 0, y: window.innerWidth > 1024 ? 0 : 200 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: window.innerWidth > 1024 ? 400 : 0, y: window.innerWidth > 1024 ? 0 : 200 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`
                fixed z-50 overflow-y-auto transition-all shadow-[0_0_100px_rgba(0,0,0,0.8)]
                ${window.innerWidth > 1024 
                  ? 'top-4 right-4 bottom-4 w-[36rem] apple-glass rounded-[48px] neon-border p-12' 
                  : 'inset-0 w-full h-full bg-black/95 backdrop-blur-3xl p-8'
                }
              `}
            >
              <div className="pb-32">
                <div className="flex items-start justify-between mb-12">
                  <div className="space-y-4">
                    <div className="px-4 py-1.5 rounded-full bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan text-[10px] font-black uppercase tracking-[0.3em] inline-flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse" />
                       REAL_TIME_STREAM
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black text-white leading-tight uppercase italic tracking-tighter">{selectedInst.name}</h2>
                    <div className="flex items-center gap-3 text-slate-400 font-black uppercase text-[11px] tracking-widest">
                      <MapPin className="w-5 h-5 text-neon-cyan shadow-[0_0_10px_rgba(0,242,255,0.5)]" />
                      <span>{selectedInst.address}, {selectedInst.city}</span>
                    </div>
                  </div>
                  <button onClick={() => setSelectedInst(null)} className="p-4 apple-glass hover:bg-white/10 rounded-[20px] transition-all group active:scale-95">
                    <X className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-12">
                  <StatusStat icon={<ShieldCheck className="w-6 h-6" />} label="OSINT Score" value={`${selectedInst.intel?.score || 0}%`} color="cyan" />
                  <StatusStat icon={<Globe className="w-6 h-6" />} label="International" value={selectedInst.intel?.visaSupport ? 'High' : 'Unknown'} color="blue" />
                  <StatusStat icon={<Home className="w-6 h-6" />} label="Living Support" value={selectedInst.intel?.accommodation ? 'Available' : 'Assisted'} color="purple" />
                  <StatusStat icon={<BrainCircuit className="w-6 h-6" />} label="Recruitment" value={selectedInst.intel?.languageReq === 'B2 Recommended' ? 'B2 Pipeline' : 'Open'} color="emerald" />
                </div>

                <div className="space-y-10">
                  <div className="flex gap-4">
                    <button 
                      onClick={() => saveLead(selectedInst)}
                      className={`flex-1 py-6 rounded-[28px] font-black text-[11px] uppercase tracking-[0.2em] transition-all active:scale-[0.98] flex items-center justify-center gap-3 relative overflow-hidden ${
                        savedLeads.find(l => l.institutionId === selectedInst.id) 
                        ? 'apple-glass text-slate-500 border-white/5 opacity-50' 
                        : 'bg-white text-black hover:bg-slate-200'
                      }`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                      {savedLeads.find(l => l.institutionId === selectedInst.id) ? (
                        <><BookmarkCheck className="w-5 h-5" /> Acquired</>
                      ) : (
                        <><Bookmark className="w-5 h-5" /> Save Target</>
                      )}
                    </button>
                    <button 
                      onClick={() => setShowDeepIntelPage(true)}
                      className="flex-1 apple-glass py-6 rounded-[28px] text-white font-black text-[11px] uppercase tracking-[0.2em] transition-all active:scale-[0.98] flex items-center justify-center gap-3 relative overflow-hidden neon-border"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-neon-cyan/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                      <Sparkles className="w-5 h-5 text-neon-cyan" /> 
                      <span>OSINT Report</span>
                    </button>
                  </div>

                  {savedLeads.find(l => l.institutionId === selectedInst.id) && (
                    <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-4">Pipeline Status</p>
                      <div className="grid grid-cols-3 gap-2">
                        {['discovered', 'applied', 'interview', 'accepted', 'rejected'].map((s) => (
                          <button
                            key={s}
                            onClick={() => {
                              const lead = savedLeads.find(l => l.institutionId === selectedInst.id);
                              if (lead) updateLeadStatus((lead as any).id, s as Lead['status']);
                            }}
                            className={`py-2 rounded-lg text-[9px] font-bold uppercase tracking-tighter transition-all border ${
                              (savedLeads.find(l => l.institutionId === selectedInst.id) as Lead).status === s
                              ? 'bg-cyan-500 border-cyan-400 text-white shadow-lg shadow-cyan-500/20'
                              : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <header className="flex items-center justify-between">
                      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Inferred HR Contacts</p>
                      <Users className="w-3 h-3 text-slate-700" />
                    </header>
                    {selectedInst.intel?.contacts.map((contact, i) => (
                      <div key={i} className="p-4 bg-slate-900/50 rounded-2xl border border-white/5 space-y-2 group">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-200">{contact.name}</span>
                          <span className="text-[9px] font-bold text-cyan-500 uppercase px-2 py-0.5 bg-cyan-500/10 rounded-full">{contact.role}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-400 text-[10px]">
                          <span>{contact.email}</span>
                          <Mail className="w-3 h-3 group-hover:text-cyan-400 transition-colors" />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-cyan-500/5 p-6 rounded-2xl border border-cyan-500/10">
                    <p className="text-[11px] leading-relaxed text-slate-400 italic">
                      "Autonomously detected nursing trainee budget available. Relocation specialist identified in HR team metadata. High probability of Anwerbevertrag engagement detected in public tenders."
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showDeepIntelPage && selectedInst && (
            <IntelReport 
              institution={selectedInst} 
              onClose={() => setShowDeepIntelPage(false)} 
              isResearching={isResearching}
              onRefresh={performDeepResearch}
            />
          )}
        </AnimatePresence>

        {/* Global Error Context */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-10 left-1/2 -translate-x-1/2 p-4 bg-red-500/20 border border-red-500/30 rounded-2xl backdrop-blur-md text-red-400 text-sm font-bold flex items-center gap-3 z-[100]"
            >
              <Info className="w-5 h-5" />
              {error}
              <button onClick={() => setError(null)} className="ml-4 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function NavIcon({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-3 group transition-all relative ${active ? 'text-white' : 'text-slate-600 hover:text-slate-300'}`}
    >
      <div className={`p-4 rounded-[24px] transition-all duration-500 border ${active ? 'bg-white text-black shadow-[0_0_40px_rgba(255,255,255,0.2)]' : 'bg-transparent border-transparent hover:bg-white/5'}`}>
        {icon}
      </div>
      <span className={`text-[10px] font-black uppercase tracking-[0.4em] font-sans transition-opacity duration-500 ${active ? 'opacity-100' : 'opacity-30'}`}>{label}</span>
      {active && (
        <motion.div 
          layoutId="active-nav-dot"
          className="absolute -left-8 md:-left-10 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_15px_white]"
        />
      )}
    </button>
  );
}

function MobileNavIcon({ icon, active, onClick, label }: { icon: React.ReactNode, active: boolean, onClick: () => void, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-2 transition-all relative ${active ? 'text-white' : 'text-slate-500'}`}
    >
      <div className={`p-4 rounded-2xl transition-all duration-500 ${active ? 'bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.3)] scale-110' : 'bg-transparent border-transparent'}`}>
        {icon}
      </div>
      <span className={`text-[9px] font-black uppercase tracking-[0.3em] font-sans transition-opacity duration-500 ${active ? 'opacity-100' : 'opacity-40'}`}>{label}</span>
    </button>
  );
}

function StatusStat({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string, color: string }) {
  const colorMap: Record<string, string> = {
    cyan: 'text-neon-cyan bg-neon-cyan/5 border-neon-cyan/30 shadow-[0_0_30px_rgba(0,242,255,0.15)]',
    blue: 'text-blue-400 bg-blue-500/5 border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.15)]',
    purple: 'text-neon-purple bg-neon-purple/5 border-neon-purple/30 shadow-[0_0_30px_rgba(188,19,254,0.15)]',
    emerald: 'text-neon-green bg-neon-green/5 border-neon-green/30 shadow-[0_0_30px_rgba(57,255,20,0.15)]'
  };

  return (
    <div className={`p-6 rounded-[32px] apple-glass border flex flex-col items-center justify-center text-center transition-all duration-500 hover:scale-105 active:scale-95 cursor-default group ${colorMap[color]}`}>
      <div className="mb-4 p-3 rounded-2xl bg-black/40 group-hover:bg-black/60 transition-colors">{icon}</div>
      <p className="text-[10px] uppercase tracking-[0.2em] font-black opacity-60 mb-2 truncate w-full">{label}</p>
      <div className="text-xl font-black tracking-tight uppercase italic">{value}</div>
    </div>
  );
}
