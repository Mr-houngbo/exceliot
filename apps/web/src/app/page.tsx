'use client'
import { useEffect, useState } from 'react'
import { JobCard, Job } from '@/components/JobCard'
import { Search, Zap, TrendingUp, Clock, AlertCircle } from 'lucide-react'

export default function HomePage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('ALL')

  // 1. Fetch des données réelles
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await fetch('/api/jobs')
        if (!response.ok) throw new Error(`Erreur serveur: ${response.status}`)
        
        const data = await response.json()
        
        // Extraction des jobs depuis l'objet {"jobs": [...], "count": ...}
        const jobsArray = data.jobs || data
        
        if (Array.isArray(jobsArray)) {
          const sortedData = jobsArray.sort((a: Job, b: Job) => (b.relevance_score || 0) - (a.relevance_score || 0))
          setJobs(sortedData)
          setFilteredJobs(sortedData)
        } else {
          throw new Error('Format de données invalide')
        }
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchJobs()
  }, [])

  // 2. Logique de filtrage et recherche (Client-side pour réactivité max)
  useEffect(() => {
    let result = [...jobs]

    if (filter !== 'ALL') {
      if (filter === 'REMOTE') {
        result = result.filter(j => j.remote_policy === 'full_remote')
      } else {
        result = result.filter(j => j.relevance_tier === filter)
      }
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

  const stats = {
    total: jobs.length,
    high: jobs.filter(j => j.relevance_tier === 'HIGH').length,
    lastUpdate: '6h'
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex flex-col">
      
      {/* ─── NAVBAR ─── */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#E8E4DF]">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="text-2xl font-black tracking-tighter text-[#1C1917] font-display">
              EXCEL<span className="text-[#F97316]">I</span>OT
            </div>
            <div className="hidden md:flex items-center gap-6 text-[14px] font-medium text-[#78716C]">
              <a href="#" className="text-[#1C1917] hover:text-[#F97316]">Offres</a>
              <a href="#" className="hover:text-[#F97316]">Marché</a>
              <a href="#" className="hover:text-[#F97316]">À propos</a>
            </div>
          </div>
          <a href="/login" className="bg-[#F97316] text-white px-5 py-2 rounded-lg font-bold text-[14px] hover:bg-[#EA580C] shadow-sm active:scale-95 transition-all">
            Connexion Admin
          </a>
        </div>
      </nav>

      {/* ─── HERO SECTION ─── */}
      <section className="relative pt-20 pb-24 overflow-hidden border-b border-[#E8E4DF]">
        <div className="absolute inset-0 grid-pattern pointer-events-none"></div>
        
        <div className="relative z-10 max-w-[1200px] mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-[#1C1917] tracking-tight leading-[1.1] mb-6 font-display">
            Trouvez les offres <span className="relative inline-block">
              Excel
              <span className="absolute -bottom-2 left-0 w-full h-1.5 bg-[#F97316]/20 rounded-full"></span>
            </span> <br className="hidden md:block" />
            que les autres ne voient pas.
          </h1>
          <p className="text-[18px] md:text-[20px] text-[#78716C] max-w-2xl mx-auto mb-12">
            Notre IA analyse et score chaque offre pour ne vous montrer <br className="hidden md:block" /> que ce qui compte vraiment pour votre carrière.
          </p>

          <div className="max-w-3xl mx-auto mb-8">
            <div className="bg-white border-2 border-[#E8E4DF] rounded-2xl p-1.5 flex items-center shadow-sm focus-within:border-[#F97316] focus-within:ring-4 focus-within:ring-orange-50 transition-all">
              <div className="pl-4 text-[#F97316]">
                <Search size={22} />
              </div>
              <input 
                type="text" 
                placeholder="Rechercher VBA, Power Query, modélisation..."
                className="flex-1 bg-transparent border-none focus:ring-0 px-4 py-3 text-[16px] text-[#1C1917] placeholder-[#A8A29E]"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <div className="bg-[#FFF7ED] border border-[#FED7AA] text-[#EA580C] px-3.5 py-1.5 rounded-full text-[13px] font-bold flex items-center gap-2">
              <TrendingUp size={14} /> {stats.total} offres analysées
            </div>
            <div className="bg-green-50 border border-green-200 text-green-700 px-3.5 py-1.5 rounded-full text-[13px] font-bold flex items-center gap-2">
              <Zap size={14} /> {stats.high} HIGH relevance
            </div>
            <div className="bg-zinc-50 border border-zinc-200 text-zinc-600 px-3.5 py-1.5 rounded-full text-[13px] font-bold flex items-center gap-2">
              <Clock size={14} /> Mis à jour toutes les {stats.lastUpdate}
            </div>
          </div>
        </div>
      </section>

      {/* ─── CONTENT AREA ─── */}
      <main className="flex-1 max-w-[1200px] mx-auto px-6 w-full py-12">
        
        {/* Filters Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'ALL', label: 'Tous' },
              { id: 'HIGH', label: '🟢 HIGH Relevance' },
              { id: 'MEDIUM', label: '🟡 Medium' },
              { id: 'LOW', label: '🔴 Low' },
              { id: 'REMOTE', label: '🏠 Full Remote' }
            ].map((f) => (
              <button 
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-4 py-2 rounded-full text-[13px] font-bold border transition-all ${
                  filter === f.id 
                    ? 'bg-[#FFF7ED] border-[#F97316] text-[#F97316]' 
                    : 'bg-[#F5F5F4] border-transparent text-[#78716C] hover:bg-[#E8E4DF]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="text-[13px] font-bold text-[#A8A29E] uppercase tracking-widest">
            {filteredJobs.length} offres disponibles
          </div>
        </div>

        {/* State Handling */}
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-12 text-center">
             <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
             <h3 className="text-red-900 font-bold text-lg mb-2">Erreur de connexion</h3>
             <p className="text-red-700 text-sm">{error}</p>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white border border-[#E8E4DF] rounded-[12px] p-5 h-[320px] animate-pulse">
                <div className="w-10 h-10 bg-[#F5F5F4] rounded-lg mb-4"></div>
                <div className="h-4 bg-[#F5F5F4] rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-[#F5F5F4] rounded w-1/2 mb-8"></div>
                <div className="space-y-3">
                  <div className="h-3 bg-[#F5F5F4] rounded w-full"></div>
                  <div className="h-3 bg-[#F5F5F4] rounded w-5/6"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="bg-white border border-[#E8E4DF] rounded-2xl p-20 text-center">
             <Search className="mx-auto text-[#A8A29E] mb-4 opacity-20" size={64} />
             <h3 className="text-[#1C1917] font-bold text-xl mb-2">Aucune offre trouvée</h3>
             <p className="text-[#78716C] text-sm mb-8">Essayez de modifier vos filtres ou votre recherche.</p>
             <button 
              onClick={() => {setFilter('ALL'); setSearch('')}}
              className="text-[#F97316] font-bold text-sm border-b-2 border-[#F97316]"
             >
               Réinitialiser les filtres
             </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}

      </main>

      {/* ─── FOOTER ─── */}
      <footer className="bg-[#1C1917] text-white pt-16 pb-8">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between gap-12 mb-12">
            <div className="max-w-xs">
              <div className="text-2xl font-black tracking-tighter text-white mb-4">
                EXCEL<span className="text-[#F97316]">I</span>OT
              </div>
              <p className="text-[#A8A29E] text-[14px] leading-relaxed">
                La plateforme n°1 d'intelligence emploi spécialisée Excel. Propulsé par une IA de scoring de pointe.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-12">
              <div>
                <h4 className="text-[14px] font-black uppercase tracking-widest mb-6">Plateforme</h4>
                <ul className="space-y-3 text-[14px] text-[#A8A29E]">
                  <li><a href="#" className="hover:text-white transition-colors">Offres Excel</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Analyses Marché</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Alertes Email</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-[14px] font-black uppercase tracking-widest mb-6">Légal</h4>
                <ul className="space-y-3 text-[14px] text-[#A8A29E]">
                  <li><a href="#" className="hover:text-white transition-colors">Confidentialité</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Se désabonner</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-4 text-[12px] text-zinc-500 font-medium">
            <div>© 2026 ExcelIoT Intelligence. Tous droits réservés.</div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              Propulsé par l'IA · Mis à jour toutes les 6h
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
