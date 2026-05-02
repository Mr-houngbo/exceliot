import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Stats globales
  const [
    { count: totalJobs },
    { count: highToday },
    { data: tierData },
    { data: sectorData },
    { data: recentHigh },
    { data: subscribers },
    { data: emailsSent }
  ] = await Promise.all([

    supabase.from('jobs').select('*', { count: 'exact', head: true })
      .eq('is_active', true).eq('is_duplicate', false),

    supabase.from('jobs').select('*', { count: 'exact', head: true })
      .eq('relevance_tier', 'HIGH')
      .gte('created_at', today.toISOString()),

    supabase.from('jobs').select('relevance_tier')
      .eq('is_active', true).eq('is_duplicate', false),

    supabase.from('jobs').select('sector')
      .eq('is_active', true).neq('sector', null),

    supabase.from('jobs').select('*')
      .eq('relevance_tier', 'HIGH')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(10),

    supabase.from('alert_subscribers').select('*').eq('is_active', true),

    supabase.from('alert_emails_sent').select('*')
      .order('sent_at', { ascending: false }).limit(5)
  ])

  // Calculer répartition tiers
  const tierCounts = { HIGH: 0, MEDIUM: 0, LOW: 0, unscored: 0 }
  tierData?.forEach(j => {
    const t = j.relevance_tier as keyof typeof tierCounts
    if (t in tierCounts)
      tierCounts[t]++
  })

  // Top secteurs
  const sectorCounts: Record<string, number> = {}
  sectorData?.forEach(j => {
    if (j.sector) sectorCounts[j.sector] = (sectorCounts[j.sector] || 0) + 1
  })
  const topSectors = Object.entries(sectorCounts)
    .sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([name, count]) => ({ name, count }))

  return NextResponse.json({
    totalJobs,
    highToday,
    tierCounts,
    topSectors,
    recentHigh,
    subscribers,
    emailsSent
  })
}
