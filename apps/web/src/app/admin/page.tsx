'use client'
import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
         Tooltip, ResponsiveContainer } from 'recharts'

const TIER_COLORS = {
  HIGH: '#22c55e', MEDIUM: '#eab308', LOW: '#ef4444', unscored: '#3f3f46'
}

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(e => console.error("Error fetching stats:", e))
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-green-600 font-bold tracking-widest uppercase text-xs">
          Initialisation du Dashboard...
        </div>
      </div>
    </div>
  )

  const tierChartData = Object.entries(data.tierCounts)
    .map(([name, value]) => ({ name, value }))

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      
      {/* Sidebar / Layout Wrapper would go here, using a simple padding for now */}
      <div className="max-w-7xl mx-auto p-6 md:p-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-white uppercase">EXCEL<span className="text-green-600">IOT</span> ADMIN</h1>
            <p className="text-zinc-500 font-medium mt-1 uppercase text-xs tracking-widest">
              {new Date().toLocaleDateString('fr-FR', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
              })}
            </p>
          </div>
          <button className="bg-zinc-900 border border-zinc-800 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-zinc-800 transition-all flex items-center gap-2">
             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
             Live System Status
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {[
            { label: 'Total Jobs', value: data.totalJobs, color: 'text-white', icon: '📊' },
            { label: 'HIGH du jour', value: data.highToday, color: 'text-green-500', icon: '🔥' },
            { label: 'Abonnés Alertes', value: data.subscribers?.length, color: 'text-blue-500', icon: '🔔' },
            { label: 'Emails envoyés', value: data.emailsSent?.length, color: 'text-yellow-500', icon: '📧' },
          ].map(kpi => (
            <div key={kpi.label}
                 className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-6 hover:border-zinc-700 transition-all group shadow-lg">
              <div className="flex justify-between items-start mb-4">
                <span className="text-2xl">{kpi.icon}</span>
                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-tighter group-hover:text-zinc-400 transition-colors">Realtime</span>
              </div>
              <div className={`text-4xl font-black ${kpi.color} mb-1 tracking-tighter`}>{kpi.value}</div>
              <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider">{kpi.label}</div>
            </div>
          ))}
        </div>

        {/* Graphiques */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">

          {/* Répartition Tiers */}
          <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-8">
            <h2 className="text-lg font-black uppercase tracking-tight mb-8">Répartition des Tiers</h2>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={tierChartData} dataKey="value" nameKey="name"
                       cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                    {tierChartData.map((entry) => (
                      <Cell key={entry.name}
                        fill={TIER_COLORS[entry.name as keyof typeof TIER_COLORS]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-4 flex-wrap">
               {Object.entries(TIER_COLORS).map(([name, color]) => (
                 <div key={name} className="flex items-center gap-2">
                   <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
                   <span className="text-[10px] font-bold text-zinc-500 uppercase">{name}</span>
                 </div>
               ))}
            </div>
          </div>

          {/* Top Secteurs */}
          <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-8">
            <h2 className="text-lg font-black uppercase tracking-tight mb-8">Top Secteurs</h2>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.topSectors} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fill: '#71717a', fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
                  />
                  <Bar dataKey="count" fill="#16a34a" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Dernières offres HIGH */}
        <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-8 mb-10 shadow-xl">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-lg font-black uppercase tracking-tight">🟢 Dernières Offres HIGH</h2>
            <button className="text-green-600 text-xs font-black uppercase hover:underline tracking-widest">Tout voir</button>
          </div>
          <div className="space-y-4">
            {data.recentHigh?.map((job: any) => (
              <div key={job.id}
                   className="flex items-center justify-between
                              bg-black/40 border border-zinc-800/50 rounded-xl p-5
                              hover:border-green-600/50 transition-all group">
                <div className="flex-1">
                  <div className="font-bold text-white group-hover:text-green-500 transition-colors">{job.title}</div>
                  <div className="text-xs text-zinc-500 font-medium mt-1">
                    {job.company} · {job.location} · <span className="text-zinc-600 uppercase">{job.contract_type}</span>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-green-500 font-black text-xl leading-none">{job.relevance_score}</div>
                    <div className="text-[8px] font-black text-zinc-700 uppercase tracking-tighter">Score</div>
                  </div>
                  <a href={job.url} target="_blank"
                     className="bg-zinc-800 text-white p-2 rounded-lg hover:bg-green-600 transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
