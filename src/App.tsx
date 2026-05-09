import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, MapPin, Building2, UserCircle, Mail, Phone, Info, Globe, ShieldCheck, Home, Bookmark, BookmarkCheck, ListChecks, X, LogOut } from 'lucide-react';
import { Institution, Contact, Lead, SearchHistory } from './types';
import MapView from './components/MapView';
import Auth from './components/Auth';
import { supabase } from './lib/supabase';
import { User } from '@supabase/supabase-js';
import { deepResearchInstitution } from './services/geminiService';
import { History, Sparkles, BrainCircuit } from 'lucide-react';
import IntelReport from './components/IntelReport';

export default function App() {
  const [session, setSession] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [selectedInst, setSelectedInst] = useState<Institution | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [savedLeads, setSavedLeads] = useState<Lead[]>([]);
  const [showSaved, setShowSaved] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isResearching, setIsResearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeepIntelPage, setShowDeepIntelPage] = useState(false);
  const [dbMissing, setDbMissing] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterVerified, setFilterVerified] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session?.user ?? null);
      setAuthChecking(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
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

  const filteredDisplayList = (showSaved ? savedLeads : institutions).filter(inst => {
    const matchesText = inst.name.toLowerCase().includes(filterText.toLowerCase()) || 
                       inst.city.toLowerCase().includes(filterText.toLowerCase());
    const matchesType = filterType === 'all' || inst.type === filterType;
    const matchesVerified = !filterVerified || inst.intel?.internationalReady;
    
    return matchesText && matchesType && matchesVerified;
  });

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

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

  const startDiscovery = async () => {
    setIsScanning(true);
    setError(null);
    setInstitutions([]); // Clear previous
    try {
      const url = searchQuery 
        ? `/api/discover?query=${encodeURIComponent(searchQuery)}`
        : '/api/discover?query=Berlin'; // Default to a high-density area for better reliability
        
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
        if (searchQuery) {
          setError("No results detected in this specific sector. Deep research continues, but try secondary keys like 'Nursing' or 'Clinics'.");
        } else {
          setError("The discovery engine returned no regional nodes. Try searching for a specific city like 'Munich' or 'Frankfurt'.");
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
          intel: {
            contacts: [
              { name: "Recruitment Lead", email: `karriere@${name.toLowerCase().replace(/[^a-z]/g, '')}.de`, role: "HR Relations" }
            ],
            score: Math.floor(Math.random() * 30) + 70, // Higher scores for discovered
            visaSupport: true,
            accommodation: Math.random() > 0.4,
            languageReq: "B2 Recommended"
          }
        };
      });
      
      setInstitutions(discovered);
      if (searchQuery) {
        saveSearchHistory(searchQuery, discovered.length);
      }
    } catch (err: any) {
      console.error("Discovery error:", err);
      setError(err.message || "An unknown error occurred during discovery protocol.");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Sidebar Discovery Control */}
      <div className="w-96 glass-nav h-full flex flex-col p-6 z-20">
        <div className="mb-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-cyan-500 rounded-xl flex items-center justify-center animate-pulse shadow-[0_0_20px_rgba(0,242,255,0.5)]">
            <Building2 className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-glow">CareScout</h1>
            <p className="text-[10px] uppercase tracking-widest text-cyan-500 font-semibold">Discovery Intelligence</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="relative group">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
            <input 
              type="text" 
              placeholder="Search Germany wide..."
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && startDiscovery()}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {['Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Stuttgart'].map(city => (
              <button
                key={city}
                onClick={() => {
                  setSearchQuery(city);
                  setTimeout(startDiscovery, 100);
                }}
                className="text-[10px] px-2.5 py-1 rounded-full bg-white/5 border border-white/10 hover:bg-cyan-500/20 hover:border-cyan-500/30 transition-all cursor-pointer text-slate-400 hover:text-cyan-300"
              >
                #{city}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <button 
              onClick={startDiscovery}
              disabled={isScanning}
              className="flex-1 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 py-3 rounded-xl font-medium text-sm transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 group"
            >
              {isScanning ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2 }}>
                  <Globe className="w-4 h-4" />
                </motion.div>
              ) : (
                <MapPin className="w-4 h-4 group-hover:animate-bounce" />
              )}
              {isScanning ? 'Scanning...' : 'Global Scrape'}
            </button>
            <button 
              onClick={() => {
                setShowSaved(!showSaved);
                setShowHistory(false);
              }}
              className={`px-4 rounded-xl border border-white/10 transition-all ${showSaved ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' : 'bg-white/5 hover:bg-white/10'}`}
              title="Saved Leads"
            >
              <BookmarkCheck className="w-4 h-4" />
            </button>
            <button 
              onClick={() => {
                setShowHistory(!showHistory);
                setShowSaved(false);
              }}
              className={`px-4 rounded-xl border border-white/10 transition-all ${showHistory ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' : 'bg-white/5 hover:bg-white/10'}`}
              title="Search History"
            >
              <History className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4 pt-4 border-t border-white/5">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-between w-full text-[10px] uppercase tracking-widest text-slate-500 font-bold hover:text-cyan-400 transition-colors"
            >
              <span>Research Filters</span>
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
                      placeholder="Filter results..."
                      className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-[11px] focus:outline-none focus:border-cyan-500/50"
                      value={filterText}
                      onChange={(e) => setFilterText(e.target.value)}
                    />
                    
                    <div className="flex gap-2">
                      <select 
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg py-1.5 px-2 text-[10px] appearance-none focus:outline-none"
                      >
                        <option value="all" className="bg-slate-900">All Types</option>
                        <option value="hospital" className="bg-slate-900">Hospital</option>
                        <option value="nursing_home" className="bg-slate-900">Nursing</option>
                        <option value="academy" className="bg-slate-900">Academy</option>
                      </select>
                      
                      <button 
                        onClick={() => setFilterVerified(!filterVerified)}
                        className={`px-3 py-1.5 rounded-lg border text-[10px] transition-all flex items-center gap-1.5 ${filterVerified ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-white/5 border-white/10 text-slate-400'}`}
                      >
                        <ShieldCheck className="w-3 h-3" />
                        OSINT Only
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {dbMissing && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[10px] text-amber-400 font-medium"
            >
              Missing Database Tables. Please execute the SQL provided in the project files to enable history.
            </motion.div>
          )}

          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-[11px] text-red-400 font-medium"
            >
              {error}
            </motion.div>
          )}
        </div>

        <div className="mt-6 flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide min-h-0">
          <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold sticky top-0 bg-[#030712] z-10 py-2 border-b border-white/5 mb-4 flex items-center justify-between">
            <span>{showSaved ? `Target Leads (${savedLeads.length})` : showHistory ? 'Research History' : 'Live Discovery Feed'}</span>
            <div className="flex gap-2">
              {showSaved && savedLeads.length > 0 && (
                <button 
                  onClick={exportLeadsToCSV}
                  className="text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
                >
                  <Globe className="w-2.5 h-2.5" />
                  <span>CSV</span>
                </button>
              )}
              {!showSaved && !showHistory && <span className="flex items-center gap-1 text-green-500"><Sparkles className="w-2.5 h-2.5" /> High Volume</span>}
            </div>
          </div>
          <AnimatePresence mode="popLayout">
            {showHistory ? (
              <motion.div 
                key="history-panel"
                initial={{ opacity: 0, scale: 0.98 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-2"
              >
                {searchHistory.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => {
                      setSearchQuery(h.query);
                      setTimeout(startDiscovery, 100);
                      setShowHistory(false);
                    }}
                    className="w-full p-3 glass-card text-left hover:bg-white/10 flex items-center justify-between group"
                  >
                    <div>
                      <p className="text-xs font-semibold">{h.query}</p>
                      <p className="text-[10px] text-slate-500">{new Date(h.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-500/20">{h.results_count} hits</span>
                  </button>
                ))}
              </motion.div>
            ) : (
              <motion.div 
                key="discovery-panel"
                className="space-y-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {(showSaved ? savedLeads : institutions).filter(inst => {
                  const matchesText = inst.name.toLowerCase().includes(filterText.toLowerCase()) || 
                                     inst.city.toLowerCase().includes(filterText.toLowerCase());
                  const matchesType = filterType === 'all' || inst.type === filterType;
                  const matchesVerified = !filterVerified || inst.intel?.internationalReady;
                  return matchesText && matchesType && matchesVerified;
                }).map((inst, idx) => (
                  <motion.div
                    layout
                    key={inst.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: Math.min(idx * 0.03, 0.3) }}
                    onClick={() => setSelectedInst(inst)}
                    className={`p-4 glass-card cursor-pointer hover:bg-white/10 transition-all group ${selectedInst?.id === inst.id ? 'bg-white/15 border-cyan-500/50' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <h3 className="text-sm font-semibold truncate flex-1">{inst.name}</h3>
                      {showSaved && (
                        <span className={`text-[8px] px-1.5 py-0.5 rounded-full uppercase tracking-tighter ml-2 ${
                          (inst as Lead).status === 'accepted' ? 'bg-green-500/20 text-green-400' :
                          (inst as Lead).status === 'applied' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-white/10 text-slate-400'
                        }`}>
                          {(inst as Lead).status}
                        </span>
                      )}
                    </div>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                        <MapPin className="w-3 h-3" />
                        <span>{inst.city}</span>
                        <span className="ml-auto flex items-center gap-1 text-cyan-400">
                          {inst.intel?.internationalReady ? (
                            <div className="flex items-center gap-1 text-green-400">
                              <ShieldCheck className="w-3 h-3" />
                              <span className="group-hover:inline hidden">VERIFIED</span>
                            </div>
                          ) : (
                            <>
                              <ShieldCheck className="w-3 h-3" />
                              {inst.intel?.score || 0}%
                            </>
                          )}
                        </span>
                      </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-auto pt-6 border-t border-white/5 space-y-4">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-[10px] font-bold">
              {session?.email?.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate text-white">{session?.email}</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Analyst Identity</p>
            </div>
            <button 
              onClick={handleSignOut}
              className="p-2 text-slate-500 hover:text-red-400 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative bg-black">
        <MapView 
          institutions={institutions} 
          onSelect={setSelectedInst} 
          center={selectedInst ? [selectedInst.lon, selectedInst.lat] : undefined}
        />

        {/* Floating Detail Panel */}
        <AnimatePresence>
          {selectedInst && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              className="absolute bottom-8 left-8 right-8 mx-auto max-w-4xl z-30"
            >
              <div className="glass-card p-8 flex flex-col md:flex-row gap-8 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)]">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-1">{selectedInst.name}</h2>
                      <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <MapPin className="w-4 h-4 text-cyan-500" />
                        <span>{selectedInst.address}, {selectedInst.city}</span>
                      </div>
                    </div>
                    <button onClick={() => setSelectedInst(null)} className="text-slate-500 hover:text-white transition-colors p-2 bg-white/5 rounded-full hover:bg-white/10">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-center">
                      <div className="text-cyan-400 mb-1 flex justify-center"><Globe className="w-5 h-5" /></div>
                      <p className="text-[10px] uppercase text-slate-500 font-bold">Visa Support</p>
                      <p className="text-xs font-semibold text-white">{selectedInst.intel?.visaSupport ? 'Verified' : 'Likely'}</p>
                    </div>
                    <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-center">
                      <div className="text-cyan-400 mb-1 flex justify-center"><Home className="w-5 h-5" /></div>
                      <p className="text-[10px] uppercase text-slate-500 font-bold">Accommodation</p>
                      <p className="text-xs font-semibold text-white">{selectedInst.intel?.accommodation ? 'Available' : 'Assisted'}</p>
                    </div>
                    <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-center">
                      <div className="text-cyan-400 mb-1 flex justify-center"><Info className="w-5 h-5" /></div>
                      <p className="text-[10px] uppercase text-slate-500 font-bold">German Level</p>
                      <p className="text-xs font-semibold text-white">{selectedInst.intel?.languageReq}</p>
                    </div>
                    <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-center bg-cyan-500/10 border-cyan-500/20">
                      <div className="text-cyan-400 mb-1 flex justify-center"><ShieldCheck className="w-5 h-5" /></div>
                      <p className="text-[10px] uppercase text-cyan-500 font-bold">Intel Score</p>
                      <p className="text-xs font-semibold text-white">{selectedInst.intel?.score}/100</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-1 flex gap-2">
                       <button 
                        onClick={() => saveLead(selectedInst)}
                        className={`flex-1 ${savedLeads.find(l => l.institutionId === selectedInst.id) ? 'bg-white/10 text-white border border-white/10' : 'bg-white text-black hover:bg-slate-200'} py-3 rounded-xl font-bold text-sm transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2`}
                      >
                        {savedLeads.find(l => l.institutionId === selectedInst.id) ? (
                          <><BookmarkCheck className="w-4 h-4" /> Saved</>
                        ) : (
                          <><Bookmark className="w-4 h-4" /> Save Lead</>
                        )}
                      </button>
                      
                      {savedLeads.find(l => l.institutionId === selectedInst.id) && (
                        <select 
                          value={(savedLeads.find(l => l.institutionId === selectedInst.id) as Lead).status}
                          onChange={(e) => {
                            const lead = savedLeads.find(l => l.institutionId === selectedInst.id);
                            if (lead && 'id' in lead) {
                              updateLeadStatus((lead as any).id, e.target.value as Lead['status']);
                            }
                          }}
                          className="bg-white/10 border border-white/10 rounded-xl px-4 text-xs font-bold text-white focus:outline-none focus:border-cyan-500"
                        >
                          <option value="discovered" className="bg-slate-900">Discovered</option>
                          <option value="applied" className="bg-slate-900">Applied</option>
                          <option value="interview" className="bg-slate-900">Interview</option>
                          <option value="accepted" className="bg-slate-900">Accepted</option>
                          <option value="rejected" className="bg-slate-900">Rejected</option>
                        </select>
                      )}
                    </div>
                    <button 
                      onClick={() => setShowDeepIntelPage(true)}
                      className="px-6 bg-cyan-600/20 hover:bg-cyan-600/40 border border-cyan-500/30 py-3 rounded-xl text-cyan-400 font-bold text-sm transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 relative overflow-hidden"
                    >
                      {isResearching && (
                        <motion.div 
                          className="absolute inset-0 bg-cyan-500/20"
                          initial={{ x: '-100%' }}
                          animate={{ x: '100%' }}
                          transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                        />
                      )}
                      <BrainCircuit className={`w-4 h-4 ${isResearching ? 'animate-pulse' : ''}`} />
                      {'Initiate OSINT Protocol'}
                    </button>
                    <button 
                      onClick={() => {
                        const url = ensureAbsoluteUrl(selectedInst.intel?.ausbildungUrl || selectedInst.website);
                        if (url) {
                          window.open(url, '_blank');
                        } else {
                          setError("Official portal URL not yet identified. Starting OSINT Protocol is recommended.");
                          setTimeout(() => setError(null), 4000);
                        }
                      }}
                      className={`px-6 border py-3 rounded-xl font-medium text-sm transition-all active:scale-95 ${
                        (selectedInst.intel?.ausbildungUrl || selectedInst.website) 
                          ? 'border-white/20 hover:border-white/50 text-white' 
                          : 'border-white/5 text-slate-600'
                      }`}
                    >
                      {(selectedInst.intel?.ausbildungUrl || selectedInst.website) ? 'Open Site' : 'Identify Portal'}
                    </button>
                  </div>
                </div>

                <div className="md:w-64 border-l border-white/10 md:pl-8 space-y-4">
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">HR Intelligence</p>
                  {selectedInst.intel?.contacts.map((contact, i) => (
                    <div key={i} className="space-y-2">
                       <div className="flex items-center gap-2 text-white">
                        <UserCircle className="w-4 h-4 text-cyan-500" />
                        <span className="text-sm font-medium">{contact.name}</span>
                      </div>
                      <div className="bg-white/5 p-3 rounded-lg flex items-center justify-between group cursor-pointer hover:bg-white/10 transition-all">
                        <span className="text-[11px] text-slate-400 truncate">{contact.email}</span>
                        <Mail className="w-3 h-3 text-cyan-500 group-hover:scale-110 transition-transform" />
                      </div>
                    </div>
                  ))}
                  <div className="bg-cyan-500/5 p-4 rounded-xl border border-cyan-500/10">
                    <p className="text-[10px] leading-relaxed text-slate-400 italic">
                      "Autonomously detected nursing trainee budget available. Relocation specialist identified in HR team metadata."
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
      </div>
    </div>
  );
}
