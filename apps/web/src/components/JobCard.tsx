import React from 'react';
import { MapPin, Briefcase, Home, Clock, ChevronRight, Euro } from 'lucide-react';

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  relevance_score: number;
  relevance_tier: string;
  remote_policy: string;
  salary_min?: number;
  salary_max?: number;
  excel_level: string;
  sector: string;
  key_excel_skills: string[];
  url: string;
  contract_type?: string;
  created_at?: string;
}

export const JobCard: React.FC<{ job: Job }> = ({ job }) => {
  const tierConfig = {
    HIGH: { color: '#16A34A', bg: 'rgba(22, 163, 74, 0.08)', border: 'rgba(22, 163, 74, 0.2)' },
    MEDIUM: { color: '#CA8A04', bg: 'rgba(202, 138, 4, 0.08)', border: 'rgba(202, 138, 4, 0.2)' },
    LOW: { color: '#DC2626', bg: 'rgba(220, 38, 38, 0.08)', border: 'rgba(220, 38, 38, 0.2)' },
    SKIP: { color: '#78716C', bg: 'rgba(120, 113, 108, 0.08)', border: 'rgba(120, 113, 108, 0.2)' }
  }[job.relevance_tier as keyof typeof tierConfig] || { color: '#78716C', bg: '#f5f5f4', border: '#e8e4df' };

  const formatSalary = () => {
    if (!job.salary_min && !job.salary_max) return "Salaire non communiqué";
    if (job.salary_min && job.salary_max) return `${job.salary_min/1000}k – ${job.salary_max/1000}k €`;
    return `${(job.salary_min || job.salary_max || 0)/1000}k €`;
  };

  return (
    <div className="glass-card rounded-2xl p-6 flex flex-col h-full group transition-all">
      
      {/* Header Section */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-xl font-black text-orange-500 shadow-inner group-hover:bg-orange-500 group-hover:text-white transition-all duration-300">
            {job.company.charAt(0)}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-zinc-900 leading-snug group-hover:text-orange-600 transition-colors line-clamp-2">
              {job.title}
            </h3>
            <span className="text-sm font-semibold text-zinc-500">{job.company}</span>
          </div>
        </div>
        
        <div 
          className="px-3 py-1.5 rounded-full border flex items-center gap-2 font-mono font-bold text-xs"
          style={{ backgroundColor: tierConfig.bg, borderColor: tierConfig.border, color: tierConfig.color }}
        >
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tierConfig.color }}></div>
          {job.relevance_score}
        </div>
      </div>

      {/* Metadata Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
          <MapPin size={14} className="text-zinc-400" />
          <span className="truncate">{job.location}</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
          <Briefcase size={14} className="text-zinc-400" />
          <span>{job.contract_type || "CDI"}</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
          <Home size={14} className="text-zinc-400" />
          <span>{job.remote_policy === 'full_remote' ? 'Remote' : 'Hybride'}</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
          <Euro size={14} className="text-zinc-400" />
          <span className="font-bold text-zinc-700">{formatSalary()}</span>
        </div>
      </div>

      {/* Skills / Tags */}
      <div className="flex flex-wrap gap-2 mb-8">
        {job.key_excel_skills?.slice(0, 3).map((skill, i) => (
          <span key={i} className="px-2.5 py-1 rounded-md bg-zinc-50 border border-zinc-100 text-[11px] font-bold text-zinc-600 uppercase tracking-tight">
            {skill}
          </span>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-auto pt-5 border-t border-zinc-100 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-zinc-400 text-[11px] font-medium">
          <Clock size={12} />
          {new Date(job.created_at || "").toLocaleDateString('fr-FR')}
        </div>
        <a 
          href={job.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-sm font-bold text-orange-500 hover:text-orange-700 transition-colors"
        >
          Voir l'offre
          <ChevronRight size={16} />
        </a>
      </div>

    </div>
  );
};
