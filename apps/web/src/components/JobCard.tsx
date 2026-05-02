import React from 'react';

interface Job {
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
}

const tierColorMapping: Record<string, string> = {
  HIGH: 'bg-green-500',
  MEDIUM: 'bg-yellow-500',
  LOW: 'bg-blue-500',
  SKIP: 'bg-gray-500',
};

export const JobCard: React.FC<{ job: Job }> = ({ job }) => {
  const tierColor = tierColorMapping[job.relevance_tier] || 'bg-gray-500';

  return (
    <div className="group relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 transition-all hover:shadow-xl hover:-translate-y-1">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-green-600 transition-colors">
            {job.title}
          </h3>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">{job.company} • {job.location}</p>
        </div>
        <div className={`${tierColor} text-white text-xs font-black px-3 py-1 rounded-full shadow-lg`}>
          {job.relevance_tier} ({job.relevance_score})
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-700">
          {job.remote_policy}
        </span>
        <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-700">
          {job.excel_level}
        </span>
        <span className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs px-2 py-1 rounded-md border border-green-100 dark:border-green-900/30">
          {job.sector}
        </span>
      </div>

      <div className="flex flex-wrap gap-1 mb-4">
        {job.key_excel_skills?.map((skill, i) => (
          <span key={i} className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 dark:text-zinc-500">
            #{skill}
          </span>
        ))}
      </div>

      <p className="text-zinc-600 dark:text-zinc-400 text-sm line-clamp-3 mb-6">
        {job.description}
      </p>

      <div className="flex items-center justify-between mt-auto">
        <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
          {job.salary_max ? `${(job.salary_max / 1000).toFixed(0)}k€` : 'N/A'}
        </div>
        <a 
          href={job.redirect_url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-xl transition-colors text-sm"
        >
          Voir l'offre
        </a>
      </div>
    </div>
  );
};
