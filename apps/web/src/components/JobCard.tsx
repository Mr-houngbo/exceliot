import React from 'react';

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
  redirect_url: string;
  contract_type?: string;
  created_at?: string;
}

export const JobCard: React.FC<{ job: Job }> = ({ job }) => {
  // Configuration des badges de score selon le tier
  const tierConfig = {
    HIGH: { 
      bg: 'bg-[#DCFCE7]', 
      text: 'text-[#16A34A]', 
      border: 'border-[#BBF7D0]', 
      label: '🟢' 
    },
    MEDIUM: { 
      bg: 'bg-[#FEF9C3]', 
      text: 'text-[#CA8A04]', 
      border: 'border-[#FDE68A]', 
      label: '🟡' 
    },
    LOW: { 
      bg: 'bg-[#FEE2E2]', 
      text: 'text-[#DC2626]', 
      border: 'border-[#FECACA]', 
      label: '🔴' 
    },
    SKIP: { 
      bg: 'bg-[#F5F5F4]', 
      text: 'text-[#78716C]', 
      border: 'border-[#E8E4DF]', 
      label: '⚪' 
    }
  }[job.relevance_tier as keyof typeof tierConfig] || { 
    bg: 'bg-zinc-100', 
    text: 'text-zinc-500', 
    border: 'border-zinc-200', 
    label: '⚪' 
  };

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return "Salaire non communiqué";
    if (min && max) return `${(min/1000).toFixed(0)}k – ${(max/1000).toFixed(0)}k €/an`;
    return `${((min || max || 0)/1000).toFixed(0)}k €/an`;
  };

  const getTimeAgo = (dateStr?: string) => {
    if (!dateStr) return "Récemment";
    const date = new Date(dateStr);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    if (diffInHours < 1) return "À l'instant";
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    return `Il y a ${Math.floor(diffInHours / 24)}j`;
  };

  return (
    <div className="group bg-white border border-[#E8E4DF] rounded-[12px] p-5 transition-all hover:border-[#F97316] hover:shadow-[0_4px_20px_rgba(249,115,22,0.08)]">
      
      {/* Header : Titre & Score */}
      <div className="flex justify-between items-start gap-4 mb-4">
        <div className="flex gap-3">
          <div className="w-10 h-10 bg-[#FAFAF9] border border-[#E8E4DF] rounded-lg flex items-center justify-center font-bold text-[#F97316] shrink-0">
            {job.company.charAt(0)}
          </div>
          <div>
            <h3 className="text-[17px] font-bold text-[#1C1917] leading-tight group-hover:text-[#F97316] transition-colors line-clamp-1">
              {job.title}
            </h3>
            <p className="text-[14px] text-[#78716C] font-medium mt-0.5">{job.company}</p>
          </div>
        </div>
        
        <div className={`${tierConfig.bg} ${tierConfig.text} ${tierConfig.border} border px-2.5 py-1 rounded-full text-[13px] font-bold font-mono whitespace-nowrap`}>
          {tierConfig.label} {job.relevance_score}
        </div>
      </div>

      {/* Metadata : Location, Contract, Remote */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-4 text-[13px] text-[#78716C] font-medium">
        <div className="flex items-center gap-1">📍 {job.location}</div>
        <div className="text-[#E8E4DF]">•</div>
        <div className="flex items-center gap-1">💼 {job.contract_type || "CDI"}</div>
        <div className="text-[#E8E4DF]">•</div>
        <div className="flex items-center gap-1">
          {job.remote_policy === 'full_remote' ? '🏠 Remote' : job.remote_policy === 'hybrid' ? '🔄 Hybride' : '🏢 Sur site'}
        </div>
      </div>

      {/* Salary */}
      <div className="mb-4 py-2 px-3 bg-[#FAFAF9] rounded-lg border border-[#E8E4DF]/50 text-[14px] font-bold text-[#1C1917]">
        💰 {formatSalary(job.salary_min, job.salary_max)}
      </div>

      {/* Skills Tags */}
      <div className="flex flex-wrap gap-2 mb-6">
        {job.key_excel_skills?.slice(0, 4).map((skill, i) => (
          <span 
            key={i} 
            className="bg-[#F5F5F4] text-[#44403C] px-2.5 py-1 rounded-[6px] text-[12px] font-medium border border-transparent hover:border-[#F97316]/30 hover:bg-[#FFF7ED] hover:text-[#EA580C] cursor-default"
          >
            {skill}
          </span>
        ))}
        {job.key_excel_skills && job.key_excel_skills.length > 4 && (
          <span className="text-[11px] font-bold text-[#A8A29E] self-center">
            +{job.key_excel_skills.length - 4}
          </span>
        )}
      </div>

      {/* Footer : Date & Action */}
      <div className="flex items-center justify-between pt-4 border-t border-[#E8E4DF]">
        <span className="text-[12px] text-[#A8A29E] font-medium italic">
          {getTimeAgo(job.created_at)}
        </span>
        <a 
          href={job.redirect_url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-[#F97316] text-[14px] font-bold hover:bg-[#FFF7ED] px-4 py-2 rounded-[8px] flex items-center gap-1.5 transition-colors"
        >
          Voir l'offre <span className="text-[16px]">→</span>
        </a>
      </div>

    </div>
  );
};
