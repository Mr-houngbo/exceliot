import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const fifteenDaysAgo = new Date()
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15)

    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('is_active', true)
      .eq('is_duplicate', false)
      .gt('created_at', fifteenDaysAgo.toISOString())
      .order('relevance_score', { ascending: false })
      .limit(500)

    if (error) throw error

    return NextResponse.json({ jobs: data, count: data.length })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
