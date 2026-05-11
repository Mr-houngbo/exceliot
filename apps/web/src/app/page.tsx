'use client'
import { useEffect, useState, useMemo } from 'react'
import { JobCard, Job } from '@/components/JobCard'
import { 
  Search, Zap, TrendingUp, Clock, AlertCircle, 
  RefreshCw, Command, MapPin, Filter, Layers, 
  BarChart3, Globe, Sparkles, ChevronRight
} from 'lucide-react'

export default function HomePage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  const [search, setSearch] = useState('')
  const [tierFilter, setTierFilter] = useState('ALL')
  const [locationFilter, setLocationFilter] = useState('ALL')

  const fetchJobs = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/jobs')
      if (!response.ok) throw new Error(`Server Error: ${response.status}`)
      const data = await response.json()
      const jobsArray = data.jobs || data
      if (Array.isArray(jobsArray)) {
        setJobs(jobsArray)
      } else {
        throw new Error('Invalid data format')
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

  const filteredJobs = useMemo(() => {
    let result = [...jobs]
    
    // Tier Filter
    if (tierFilter !== 'ALL') {
      result = result.filter(j => j.relevance_tier === tierFilter)
    }

    // Location Filter
    if (locationFilter !== 'ALL') {
      const countryCodes: Record<string, string[]> = {
        'CI': ['ivoire', 'abidjan', 'ci', 'côte'],
        'SN': ['senegal', 'dakar', 'sn', 'sénégal'],
        'FR': ['france', 'paris', 'lyon', 'fr']
      }
      const keywords = countryCodes[locationFilter]
      result = result.filter(j => 
        keywords.some(k => j.location?.toLowerCase().includes(k)) ||
        keywords.some(k => j.title.toLowerCase().includes(k))
      )
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

    return result.sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0))
  }, [search, tierFilter, locationFilter, jobs])

  const stats = useMemo(() => {
    return {
      high: jobs.filter(j => j.relevance_tier === 'HIGH').length,
      total: jobs.length,
      regions: {
        ci: jobs.filter(j => {
          const l = j.location?.toLowerCase() || '';
          return l.includes('ivoire') || l.includes('abidjan') || l.includes('côte');
        }).length,
        sn: jobs.filter(j => {
          const l = j.location?.toLowerCase() || '';
          return l.includes('senegal') || l.includes('dakar') || l.includes('sénégal');
        }).length,
      }
    }
  }, [jobs])

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col font-sans selection:bg-primary selection:text-white">
      
      {/* ─── PREMIUM NAVBAR ─── */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-2xl border-b border-zinc-200/50 dark:border-zinc-800/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-12">
            <div className="group flex items-center gap-3 cursor-pointer">
              <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-white shadow-xl shadow-primary/20 rotate-3 group-hover:rotate-0 transition-transform">
                <Zap size={18} fill="currentColor" />
              </div>
              <span className="text-xl font-black tracking-tighter text-zinc-900 dark:text-white">EXCELIOT</span>
            </div>
            <div className="hidden lg:flex items-center gap-8 text-[13px] font-bold text-zinc-500 dark:text-zinc-400">
              <a href="#" className="text-primary border-b-2 border-primary pb-1">Discovery</a>
              <a href="#" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Market Intel</a>
              <a href="#" className="hover:text-zinc-900 dark:hover:text-white transition-colors">VBA Scripts</a>
            </div>
          </div>
             <div className="flex items-center gap-4">
             <div className="hidden sm:flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900 px-3 py-1.5 rounded-full">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-widest">{stats.total} Actives</span>
             </div>
             <a href="/admin" className="btn-primary py-2 text-sm">Admin Intel</a>
          </div>
        </div>
      </nav>

      <div className="flex flex-1 max-w-7xl mx-auto w-full px-6 py-12 gap-12">
        
        {/* ─── SIDEBAR FILTERS (DYNAMISME) ─── */}
        <aside className="hidden lg:flex flex-col w-72 shrink-0 gap-8">
          
          <div className="glass-card p-6 rounded-3xl sticky top-24">
            <div className="flex items-center gap-3 mb-6 text-zinc-900 dark:text-white">
              <Filter size={18} className="text-primary" />
              <h3 className="font-black tracking-tight">Intelligence Filter</h3>
            </div>
            
            <div className="space-y-6">
              {/* Relevance Section */}
              <div>
                <label className="text-[11px] font-black uppercase tracking-widest text-zinc-400 mb-3 block">Relevance</label>
                <div className="flex flex-col gap-1.5">
                  {[
                    { id: 'ALL', label: 'All Tiers', icon: Layers },
                    { id: 'HIGH', label: 'High Potential', icon: Zap, color: 'text-emerald-500' },
                    { id: 'MEDIUM', label: 'Medium Fit', icon: TrendingUp, color: 'text-amber-500' }
                  ].map((f) => (
                    <button 
                      key={f.id}
                      onClick={() => setTierFilter(f.id)}
                      className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                        tierFilter === f.id ? 'bg-primary/10 text-primary border border-primary/20' : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <f.icon size={16} className={f.color} />
                        {f.label}
                      </div>
                      {tierFilter === f.id && <ChevronRight size={14} />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Regions Section */}
              <div>
                <label className="text-[11px] font-black uppercase tracking-widest text-zinc-400 mb-3 block">Regions</label>
                <div className="flex flex-col gap-1.5">
                  {[
                    { id: 'ALL', label: 'Global', count: stats.total },
                    { id: 'CI', label: 'Côte d\'Ivoire', count: stats.regions.ci },
                    { id: 'SN', label: 'Sénégal', count: stats.regions.sn },
                    { id: 'FR', label: 'France', count: stats.total - stats.regions.ci - stats.regions.sn }
                  ].map((r) => (
                    <button 
                      key={r.id}
                      onClick={() => setLocationFilter(r.id)}
                      className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                        locationFilter === r.id ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xl' : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                      }`}
                    >
                      {r.label}
                      <span className="text-[10px] opacity-50 font-mono">{r.count}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/10 rounded-3xl p-6">
            <Sparkles className="text-primary mb-3" size={24} />
            <h4 className="font-bold text-zinc-900 dark:text-white mb-2">Excel Expert AI</h4>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Our NLP engine analyzes every job description to find "hidden" Excel requirements even when not explicitly mentioned in titles.
            </p>
          </div>
        </aside>

        {/* ─── MAIN FEED ─── */}
        <main className="flex-1">
          
          {/* Header & Search */}
          <div className="mb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
              <div>
                <h1 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tighter mb-2">
                  Discovery <span className="text-zinc-400">Feed</span>
                </h1>
                <p className="text-sm font-bold text-zinc-500">Real-time curated opportunities for Excel Professionals</p>
              </div>
              
              <div className="relative group min-w-[300px]">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-primary transition-colors" />
                <input 
                  type="text" 
                  placeholder="VBA, Analyst, Controller..."
                  className="w-full bg-zinc-100 dark:bg-zinc-900 border-none rounded-2xl py-3.5 pl-12 pr-6 text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Quick Summary Chips */}
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl">
                 <Zap size={14} className="text-emerald-500" />
                 <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{stats.high} High Priority Hits</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-xl">
                 <Globe size={14} className="text-blue-500" />
                 <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{stats.regions.ci + stats.regions.sn} Regional Matches</span>
              </div>
              <button onClick={fetchJobs} className="flex items-center gap-2 px-4 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-xl transition-colors">
                 <RefreshCw size={14} className={`text-zinc-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                 <span className="text-xs font-bold text-zinc-500">Refresh Data</span>
              </button>
            </div>
          </div>

          {/* Grid Feed */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-64 bg-zinc-100 dark:bg-zinc-900 rounded-3xl animate-pulse"></div>
              ))}
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="py-24 glass-card rounded-[3rem] text-center border-dashed">
               <AlertCircle className="mx-auto text-zinc-300 mb-6" size={64} strokeWidth={1} />
               <h3 className="text-2xl font-black text-zinc-900 dark:text-white mb-2">No matching Intel found.</h3>
               <p className="text-zinc-500 text-sm mb-8 font-medium">Try broadening your search criteria or region.</p>
               <button onClick={() => {setTierFilter('ALL'); setLocationFilter('ALL'); setSearch('')}} className="btn-primary">Clear all filters</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
              {filteredJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}

        </main>
      </div>

    </div>
  )
}
