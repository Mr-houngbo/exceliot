'use client'
import { useEffect, useState } from 'react'
import { JobCard, Job } from '@/components/JobCard'
import { Search, Zap, TrendingUp, Clock, AlertCircle, RefreshCw, Command } from 'lucide-react'

export default function HomePage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('ALL')

  const fetchJobs = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/jobs')
      if (!response.ok) throw new Error(`Erreur serveur: ${response.status}`)
      const data = await response.json()
      const jobsArray = data.jobs || data
      if (Array.isArray(jobsArray)) {
        const sortedData = jobsArray.sort((a: Job, b: Job) => (b.relevance_score || 0) - (a.relevance_score || 0))
        setJobs(sortedData)
      } else {
        throw new Error('Format de données invalide')
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

  useEffect(() => {
    let result = [...jobs]
    if (filter !== 'ALL') {
      if (filter === 'REMOTE') result = result.filter(j => j.remote_policy === 'full_remote')
      else result = result.filter(j => j.relevance_tier === filter)
    }
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(j => 
        j.title.toLowerCase().includes(q) || 
        j.company.toLowerCase().includes(q) ||
        j.key_excel_skills?.some(s => s.toLowerCase().includes(q))
      )
    }
    setFilteredJobs(result)
  }, [search, filter, jobs])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchJobs()
    setTimeout(() => setIsRefreshing(false), 500)
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex flex-col font-sans">
      
      {/* ─── MODERN NAVBAR ─── */}
      <nav className="sticky top-0 z-50 bg-white/60 backdrop-blur-xl border-b border-zinc-200/50">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <div className="text-xl font-black tracking-tighter text-zinc-900 flex items-center gap-2">
              <div className="w-6 h-6 bg-orange-500 rounded-md flex items-center justify-center text-[12px] text-white">X</div>
              EXCELIOT
            </div>
            <div className="hidden md:flex items-center gap-6 text-sm font-bold text-zinc-500">
              <a href="#" className="text-zinc-900">Explorer</a>
              <a href="#" className="hover:text-zinc-900 transition-colors">Analyses</a>
              <a href="#" className="hover:text-zinc-900 transition-colors">Alertes</a>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a href="/login" className="text-sm font-bold text-zinc-500 hover:text-zinc-900 px-4 py-2">Connexion</a>
            <button className="btn-primary px-5 py-2 text-sm shadow-orange-200">Essai Gratuit</button>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative pt-24 pb-20 border-b border-zinc-200/50 overflow-hidden">
        <div className="absolute inset-0 bg-grid pointer-events-none"></div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-100 text-orange-600 text-[11px] font-black uppercase tracking-wider mb-8">
            <Zap size={12} fill="currentColor" />
            Intelligence Emploi 2.0
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-zinc-900 tracking-tight leading-[0.95] mb-8 text-balance">
            Trouvez les offres Excel <br />
            <span className="text-zinc-400">que les autres ignorent.</span>
          </h1>

          {/* Linear-Style Search */}
          <div className="max-w-2xl mx-auto relative group mt-12">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-orange-500 transition-colors">
              <Search size={20} />
            </div>
            <input 
              type="text" 
              placeholder="Rechercher VBA, Power Query, Analyste..."
              className="w-full bg-white border border-zinc-200 rounded-2xl py-5 pl-14 pr-24 text-lg font-medium shadow-sm focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500 outline-none transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="absolute right-4 inset-y-0 flex items-center gap-2">
               <button onClick={handleRefresh} className="p-2 text-zinc-400 hover:text-orange-500 transition-colors">
                  <RefreshCw size={18} className={isRefreshing ? "animate-spin" : ""} />
               </button>
               <div className="hidden md:flex items-center gap-1 bg-zinc-50 border border-zinc-200 px-2 py-1 rounded-md text-[10px] font-bold text-zinc-400">
                 <Command size={10} /> K
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── MAIN FEED ─── */}
      <main className="max-w-7xl mx-auto px-6 w-full py-16">
        
        {/* Sub-Header / Filters */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div>
            <h2 className="text-2xl font-black text-zinc-900 tracking-tight mb-2">Opportunités du moment</h2>
            <p className="text-sm font-medium text-zinc-500">Mises à jour en temps réel via l'IA</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'ALL', label: 'Tout' },
              { id: 'HIGH', label: '🔥 High' },
              { id: 'MEDIUM', label: '🟡 Medium' },
              { id: 'REMOTE', label: '🏠 Remote' }
            ].map((f) => (
              <button 
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-5 py-2 rounded-xl text-xs font-bold border transition-all ${
                  filter === f.id 
                    ? 'bg-white border-zinc-900 text-zinc-900 shadow-sm shadow-zinc-200' 
                    : 'bg-white/50 border-zinc-200 text-zinc-500 hover:bg-white hover:border-zinc-300'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid Feed */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-[350px] bg-zinc-100 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="py-32 text-center">
             <AlertCircle className="mx-auto text-zinc-300 mb-6" size={64} strokeWidth={1} />
             <h3 className="text-xl font-bold text-zinc-900 mb-2">Aucun résultat</h3>
             <p className="text-zinc-500 text-sm mb-8">Modifiez votre recherche ou vos filtres.</p>
             <button onClick={() => {setFilter('ALL'); setSearch('')}} className="btn-primary px-8 py-3 text-sm">Réinitialiser</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}

      </main>

      {/* ─── MINIMAL FOOTER ─── */}
      <footer className="mt-auto border-t border-zinc-200 bg-white py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-lg font-black tracking-tighter text-zinc-900">EXCELIOT</div>
          <div className="flex gap-8 text-xs font-bold text-zinc-400 uppercase tracking-widest">
            <a href="#" className="hover:text-zinc-900">Privacy</a>
            <a href="#" className="hover:text-zinc-900">Terms</a>
            <a href="#" className="hover:text-zinc-900">Contact</a>
          </div>
          <div className="text-[11px] font-medium text-zinc-400">© 2026 EXCELIOT INTEL. ALL RIGHTS RESERVED.</div>
        </div>
      </footer>
    </div>
  )
}
