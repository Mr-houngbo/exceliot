import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const fifteenDaysAgo = new Date()
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15)

    // 1. Fetch Regional Jobs (Priority)
    const { data: regionalJobs, error: regError } = await supabase
      .from('jobs')
      .select('*')
      .eq('is_active', true)
      .eq('is_duplicate', false)
      .gt('created_at', fifteenDaysAgo.toISOString())
      .or('url.ilike.%senjob%,url.ilike.%.sn%,url.ilike.%.ci%,url.ilike.%educarriere%,url.ilike.%emploi.ci%')
      .limit(200)

    // 2. Fetch Global Jobs
    const { data: globalJobs, error: globError } = await supabase
      .from('jobs')
      .select('*')
      .eq('is_active', true)
      .eq('is_duplicate', false)
      .gt('created_at', fifteenDaysAgo.toISOString())
      .not('url', 'ilike', '%senjob%')
      .not('url', 'ilike', '%.sn%')
      .not('url', 'ilike', '%.ci%')
      .not('url', 'ilike', '%educarriere%')
      .order('relevance_score', { ascending: false })
      .limit(2500)

    if (regError || globError) throw regError || globError

    // Combine
    const allJobs = [...(regionalJobs || []), ...(globalJobs || [])]

    return NextResponse.json({
      jobs: allJobs,
      count: allJobs.length
    })
  } catch (error: any) {
    console.error('Jobs API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
