'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleLogin = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
    })
    
    if (error) {
      alert(error.message)
    } else {
      setSent(true)
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

        {sent ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-green-900/30 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
               </svg>
            </div>
            <p className="text-white text-xl font-bold mb-2">Vérifiez votre email</p>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Un lien de connexion magique a été envoyé à <br/><span className="text-white font-medium">{email}</span>
            </p>
            <button 
              onClick={() => setSent(false)}
              className="mt-8 text-green-600 text-sm font-bold hover:underline"
            >
              Retour
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <label className="text-xs font-black uppercase text-zinc-500 mb-2 block tracking-wider">Adresse Email Professional</label>
              <input
                type="email"
                placeholder="votre@cabinet.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl
                           px-4 py-4 text-white placeholder-zinc-600 focus:outline-none
                           focus:ring-2 focus:ring-green-600/50 focus:border-green-600 transition-all"
              />
            </div>
            <button
              onClick={handleLogin}
              disabled={loading || !email}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50
                         text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-green-600/20 active:scale-95"
            >
              {loading ? 'Envoi du lien...' : 'Se connecter'}
            </button>
            <p className="text-center text-[10px] text-zinc-600 uppercase tracking-widest font-bold">
              Accès réservé au personnel autorisé
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
