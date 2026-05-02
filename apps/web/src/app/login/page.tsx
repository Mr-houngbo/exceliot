'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      setError(error.message)
    } else {
      router.push('/admin')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 w-full max-w-md shadow-2xl">

        <div className="text-center mb-10">
          <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center text-white font-black mx-auto mb-4">X</div>
          <h1 className="text-2xl font-black text-white tracking-tight uppercase">EXCEL<span className="text-green-600">IOT</span></h1>
          <p className="text-zinc-500 text-sm mt-2">Espace Admin Cabinet</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="bg-red-900/20 border border-red-900/50 text-red-500 text-xs p-3 rounded-lg font-bold">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs font-black uppercase text-zinc-500 mb-2 block tracking-wider">Email</label>
            <input
              type="email"
              placeholder="votre@cabinet.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl
                         px-4 py-4 text-white placeholder-zinc-600 focus:outline-none
                         focus:ring-2 focus:ring-green-600/50 focus:border-green-600 transition-all"
              required
            />
          </div>

          <div>
            <label className="text-xs font-black uppercase text-zinc-500 mb-2 block tracking-wider">Mot de passe</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl
                         px-4 py-4 text-white placeholder-zinc-600 focus:outline-none
                         focus:ring-2 focus:ring-green-600/50 focus:border-green-600 transition-all"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50
                       text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-green-600/20 active:scale-95"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>

          <p className="text-center text-[10px] text-zinc-600 uppercase tracking-widest font-bold">
            Accès sécurisé · Cabinet Exceliot
          </p>
        </form>
      </div>
    </div>
  )
}
