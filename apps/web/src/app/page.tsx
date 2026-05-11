'use client'
import { useEffect, useState, useMemo } from 'react'
import { JobCard, Job } from '@/components/JobCard'
import { 
  Search, Zap, TrendingUp, Clock, AlertCircle, 
  RefreshCw, MapPin, Filter, Layers, 
  Globe, Sparkles, ChevronRight, LayoutGrid, ListFilter
} from 'lucide-react'

export default function HomePage() {
  const [allJobs, setAllJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  const [search, setSearch] = useState('')
  const [tierFilter, setTierFilter] = useState('ALL')
  const [locationFilter, setLocationFilter] = useState('ALL')
  
  const [globalVisibleCount, setGlobalVisibleCount] = useState(100)

  const fetchJobs = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/jobs')
      if (!response.ok) throw new Error(`Server Error: ${response.status}`)
      const data = await response.json()
      const jobsArray = data.jobs || data
      if (Array.isArray(jobsArray)) {
        setAllJobs(jobsArray)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJobs()
  }, [])

  // ─── ROBUST FILTERING ENGINE ───
  const { regionalFiltered, globalFiltered } = useMemo(() => {
    let result = [...allJobs]
    
    // Tier Filter
    if (tierFilter !== 'ALL') {
      result = result.filter(j => j.relevance_tier === tierFilter)
    }

    // Search Filter
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(j => 
        j.title.toLowerCase().includes(q) || 
        j.company.toLowerCase().includes(q) ||
        j.key_excel_skills?.some(s => s.toLowerCase().includes(q))
      )
    }

    // Split Regional vs Global
    const regional = result.filter(j => {
      const u = (j.url || '').toLowerCase();
      return u.includes('.sn') || u.includes('senjob') || u.includes('.ci') || u.includes('educarriere') || u.includes('emploi.ci');
    });

    const global = result.filter(j => {
      const u = (j.url || '').toLowerCase();
      return !u.includes('.sn') && !u.includes('senjob') && !u.includes('.ci') && !u.includes('educarriere') && !u.includes('emploi.ci');
    });

    // Apply Location Sidebar Filter (Special Case)
    let finalRegional = [...regional];
    let finalGlobal = [...global];

    if (locationFilter === 'SN') {
      finalRegional = regional.filter(j => (j.url || '').includes('.sn') || (j.url || '').includes('senjob'));
      finalGlobal = [];
    } else if (locationFilter === 'CI') {
      finalRegional = regional.filter(j => (j.url || '').includes('.ci') || (j.url || '').includes('educarriere') || (j.url || '').includes('emploi.ci'));
      finalGlobal = [];
    } else if (locationFilter === 'FR') {
      finalRegional = [];
      finalGlobal = global; // Adzuna jobs
    }

    return {
      regionalFiltered: finalRegional.sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0)),
      globalFiltered: finalGlobal.sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0))
    }
  }, [allJobs, search, tierFilter, locationFilter])

  const stats = useMemo(() => ({
    total: allJobs.length,
    high: allJobs.filter(j => j.relevance_tier === 'HIGH').length,
    sn: allJobs.filter(j => (j.url || '').includes('.sn') || (j.url || '').includes('senjob')).length,
    ci: allJobs.filter(j => (j.url || '').includes('.ci') || (j.url || '').includes('educarriere') || (j.url || '').includes('emploi.ci')).length,
  }), [allJobs])

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col font-sans selection:bg-primary selection:text-white">
      
      {/* ─── NAVBAR ─── */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-2xl border-b border-zinc-200/50 dark:border-zinc-800/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-12">
            <div className="group flex items-center gap-3">
              <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-white shadow-xl shadow-primary/20 rotate-3 group-hover:rotate-0 transition-transform">
                <Zap size={18} fill="currentColor" />
              </div>
              <span className="text-xl font-black tracking-tighter text-zinc-900 dark:text-white">EXCELIOT</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="hidden sm:flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900 px-3 py-1.5 rounded-full border border-zinc-200/50 dark:border-zinc-800/50">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-widest">{stats.total} Total Intel</span>
             </div>
             <a href="/admin" className="btn-primary py-2 text-sm">Dashboard</a>
          </div>
        </div>
      </nav>

      <div className="flex flex-1 max-w-7xl mx-auto w-full px-6 py-12 gap-12">
        
        {/* ─── SIDEBAR ─── */}
        <aside className="hidden lg:flex flex-col w-72 shrink-0 gap-8">
          <div className="glass-card p-6 rounded-3xl sticky top-24 border-zinc-200/50">
            <div className="flex items-center gap-3 mb-6">
              <ListFilter size={18} className="text-primary" />
              <h3 className="font-black tracking-tight text-zinc-900 dark:text-white uppercase text-xs">Command Center</h3>
            </div>
            
            <div className="space-y-8">
              {/* Regions */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 block px-1">Target Zones</label>
                <div className="flex flex-col gap-1">
                  {[
                    { id: 'ALL', label: 'Global Feed', count: stats.total, icon: Globe },
                    { id: 'SN', label: 'Sénégal', count: stats.sn, icon: MapPin },
                    { id: 'CI', label: 'Côte d\'Ivoire', count: stats.ci, icon: MapPin },
                    { id: 'FR', label: 'Europe (Adzuna)', count: stats.total - stats.sn - stats.ci, icon: MapPin }
                  ].map((r) => (
                    <button 
                      key={r.id}
                      onClick={() => {setLocationFilter(r.id); setGlobalVisibleCount(100)}}
                      className={`flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-black transition-all ${
                        locationFilter === r.id ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <r.icon size={14} />
                        {r.label}
                      </div>
                      <span className={`text-[10px] opacity-70 font-mono ${locationFilter === r.id ? 'text-white' : 'text-zinc-400'}`}>{r.count}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tiers */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 block px-1">Relevance</label>
                <div className="flex flex-col gap-1">
                  {[
                    { id: 'ALL', label: 'All Intel', icon: Layers },
                    { id: 'HIGH', label: 'High Priority', icon: Zap, color: 'text-emerald-500' },
                    { id: 'MEDIUM', label: 'Medium Fit', icon: TrendingUp, color: 'text-amber-500' }
                  ].map((f) => (
                    <button 
                      key={f.id}
                      onClick={() => setTierFilter(f.id)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-black transition-all ${
                        tierFilter === f.id ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xl' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                      }`}
                    >
                      <f.icon size={14} className={f.color} />
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* ─── MAIN FEED ─── */}
        <main className="flex-1 space-y-12">
          
          {/* Header & Search */}
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <span className="badge-emerald mb-4 inline-block">2026 Edition</span>
                <h1 className="text-5xl font-black text-zinc-900 dark:text-white tracking-tighter">
                  Market <span className="text-zinc-400">Discovery</span>
                </h1>
              </div>
              
              <div className="relative group min-w-[320px]">
                <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-primary transition-colors" />
                <input 
                  type="text" 
                  placeholder="VBA, Analyst, Financial..."
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] py-4 pl-14 pr-6 text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all shadow-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Feed Grid */}
          <div className="space-y-16">
            
            {/* 1. REGIONAL SPOTLIGHT (PRIORITY) */}
            {(regionalFiltered.length > 0) && (
              <section className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800"></div>
                  <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-primary flex items-center gap-2">
                    <Sparkles size={14} /> Regional Highlights
                  </h2>
                  <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800"></div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {regionalFiltered.map(job => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
              </section>
            )}

            {/* 2. GLOBAL OPPORTUNITIES (ADZUNA) */}
            {(globalFiltered.length > 0) && (
              <section className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800"></div>
                  <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-zinc-400 flex items-center gap-2">
                    <Globe size={14} /> Global Intel (Adzuna)
                  </h2>
                  <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800"></div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {globalFiltered.slice(0, globalVisibleCount).map(job => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>

                {globalFiltered.length > globalVisibleCount && (
                  <div className="flex justify-center pt-8">
                    <button 
                      onClick={() => setGlobalVisibleCount(prev => prev + 100)}
                      className="group flex items-center gap-2 px-8 py-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs font-black text-zinc-600 dark:text-zinc-400 hover:border-primary hover:text-primary transition-all shadow-xl"
                    >
                      Load {globalFiltered.length - globalVisibleCount} More Global Leads
                      <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                )}
              </section>
            )}

            {/* Empty State */}
            {!loading && regionalFiltered.length === 0 && globalFiltered.length === 0 && (
              <div className="py-24 glass-card rounded-[3rem] text-center border-dashed">
                 <AlertCircle className="mx-auto text-zinc-300 mb-6" size={64} strokeWidth={1} />
                 <h3 className="text-2xl font-black text-zinc-900 dark:text-white mb-2">Intel Blockage</h3>
                 <p className="text-zinc-500 text-sm mb-8 font-medium italic">No signal detected for these parameters.</p>
                 <button onClick={() => {setTierFilter('ALL'); setLocationFilter('ALL'); setSearch('')}} className="btn-primary">Reset Command Center</button>
              </div>
            )}

            {loading && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-64 bg-zinc-200/50 dark:bg-zinc-900/50 rounded-3xl animate-pulse"></div>
                ))}
              </div>
            )}
          </div>

        </main>
      </div>

    </div>
  )
}
