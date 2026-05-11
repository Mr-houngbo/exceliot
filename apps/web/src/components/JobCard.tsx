import React from 'react';
import { MapPin, Briefcase, Home, Clock, ChevronRight, Euro, Share2, Star } from 'lucide-react';

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
  source_id?: string;
}

export const JobCard: React.FC<{ job: Job }> = ({ job }) => {
  const tierConfig: Record<string, { color: string, bg: string, border: string, label: string }> = {
    HIGH: { color: '#10B981', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-100 dark:border-emerald-500/20', label: 'High Potential' },
    MEDIUM: { color: '#F59E0B', bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-100 dark:border-amber-500/20', label: 'Medium Match' },
    LOW: { color: '#71717A', bg: 'bg-zinc-50 dark:bg-zinc-800/30', border: 'border-zinc-100 dark:border-zinc-800/50', label: 'Low Match' },
    SKIP: { color: '#71717A', bg: 'bg-zinc-50', border: 'border-zinc-100', label: 'Filtered' }
  };
  const currentTier = tierConfig[job.relevance_tier] || tierConfig.LOW;

  const formatSalary = () => {
    if (!job.salary_min && !job.salary_max) return "Competitive";
    if (job.salary_min && job.salary_max) return `${Math.round(job.salary_min/1000)}k-${Math.round(job.salary_max/1000)}k`;
    return `${Math.round((job.salary_min || job.salary_max || 0)/1000)}k`;
  };

  const getRegionTag = () => {
    const loc = job.location?.toLowerCase() || '';
    if (loc.includes('ivoire') || loc.includes('abidjan')) return { label: 'CI', icon: '🇨🇮' };
    if (loc.includes('senegal') || loc.includes('dakar')) return { label: 'SN', icon: '🇸🇳' };
    return { label: 'FR', icon: '🇫🇷' };
  };

  const region = getRegionTag();

  return (
    <div className="glass-card rounded-[2rem] p-7 flex flex-col h-full group relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors"></div>

      {/* Header */}
      <div className="flex justify-between items-start mb-6 z-10">
        <div className="flex gap-4">
          <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xl font-black text-zinc-400 dark:text-zinc-600 border border-zinc-200/50 dark:border-zinc-700/50 group-hover:border-primary/50 group-hover:text-primary transition-all shadow-sm">
            {job.company.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
               <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${currentTier.bg} ${currentTier.border}`} style={{ color: currentTier.color }}>
                 {currentTier.label}
               </span>
               <span className="text-[10px] font-bold text-zinc-400 bg-zinc-100 dark:bg-zinc-900 px-2 py-0.5 rounded-md border border-zinc-200/50 dark:border-zinc-800/50">
                 {region.icon} {region.label}
               </span>
            </div>
            <h3 className="text-[17px] font-black text-zinc-900 dark:text-white leading-tight group-hover:text-primary transition-colors line-clamp-2 pr-4">
              {job.title}
            </h3>
          </div>
        </div>
      </div>

      {/* Meta Pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/50 text-[11px] font-bold text-zinc-500">
           <MapPin size={12} className="text-primary" />
           <span className="max-w-[80px] truncate">{job.location || "On-site"}</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/50 text-[11px] font-bold text-zinc-500">
           <Euro size={12} className="text-primary" />
           <span>{formatSalary()}</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/50 text-[11px] font-bold text-zinc-500">
           <Home size={12} className="text-primary" />
           <span>{job.remote_policy === 'full_remote' ? 'Remote' : 'Hybrid'}</span>
        </div>
      </div>

      {/* Excel Skills Section */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
           <Star size={12} className="text-amber-500 fill-amber-500" />
           <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Excel Stack</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {(job.key_excel_skills && job.key_excel_skills.length > 0) ? (
            job.key_excel_skills.slice(0, 3).map((skill, i) => (
              <span key={i} className="px-2.5 py-1 rounded-lg bg-primary/5 text-[11px] font-black text-primary border border-primary/10">
                {skill}
              </span>
            ))
          ) : (
             <span className="text-[11px] font-bold text-zinc-400 italic">Advanced Spreadsheets</span>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-auto pt-6 border-t border-zinc-100 dark:border-zinc-800/50 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-zinc-400 dark:text-zinc-500 text-[11px] font-bold">
          <Clock size={12} />
          {job.created_at ? new Date(job.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Recently'}
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              navigator.clipboard.writeText(job.url);
              alert('Lien copié !');
            }}
            className="p-2 text-zinc-400 hover:text-primary transition-colors"
          >
            <Share2 size={16} />
          </button>
          <a 
            href={job.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 rounded-xl text-xs font-black hover:bg-primary dark:hover:bg-primary hover:text-white transition-all shadow-lg shadow-zinc-200 dark:shadow-none"
          >
            Apply Now
            <ChevronRight size={14} />
          </a>
        </div>
      </div>

    </div>
  );
};
