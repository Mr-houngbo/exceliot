'use client';

import React, { useEffect, useState } from 'react';
import { JobCard } from '@/components/JobCard';

export default function Home() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tier, setTier] = useState('');

  useEffect(() => {
    fetchJobs();
  }, [tier]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const url = new URL('http://localhost:8000/api/v1/jobs/');
      if (tier) url.searchParams.append('tier', tier);
      
      const res = await fetch(url.toString());
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch (err) {
      console.error("Failed to fetch jobs:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 font-sans">
      {/* Header / Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white font-black">X</div>
              <span className="text-xl font-black tracking-tight uppercase">Excel<span className="text-green-600">iot</span></span>
            </div>
            <div className="hidden md:flex gap-6 items-center">
              <a href="#" className="text-sm font-medium hover:text-green-600 transition-colors">Offres</a>
              <a href="#" className="text-sm font-medium hover:text-green-600 transition-colors">Entreprises</a>
              <button className="bg-green-600 text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-green-700 transition-all">
                Publier une offre
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="py-20 px-4 bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-950 dark:to-black">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-500">
            Trouvez les meilleures opportunités <span className="text-green-600">Excel</span>.
          </h1>
          <p className="text-lg md:text-xl text-zinc-500 dark:text-zinc-400 mb-10 max-w-2xl mx-auto">
            Nous analysons des milliers d'offres chaque jour pour extraire les jobs "cachés" nécessitant une expertise avancée sur Excel et VBA.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar / Filters */}
          <aside className="w-full md:w-64 flex-shrink-0">
            <div className="sticky top-24 p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
              <h2 className="text-lg font-bold mb-6">Filtres</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-black uppercase text-zinc-400 dark:text-zinc-500 mb-3 block">Niveau de Pertinence</label>
                  <div className="flex flex-col gap-2">
                    {['', 'HIGH', 'MEDIUM', 'LOW'].map((t) => (
                      <button 
                        key={t}
                        onClick={() => setTier(t)}
                        className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          tier === t 
                          ? 'bg-green-600 text-white shadow-lg shadow-green-600/20' 
                          : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
                        }`}
                      >
                        {t || 'Tous les jobs'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Job Feed */}
          <section className="flex-1">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">{jobs.length} opportunités trouvées</h2>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-64 bg-zinc-200 dark:bg-zinc-800 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {jobs.map((job: any) => (
                  <JobCard key={job.id} job={job} />
                ))}
                {jobs.length === 0 && (
                  <div className="col-span-full py-20 text-center text-zinc-500">
                    Aucune offre ne correspond à vos critères.
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
