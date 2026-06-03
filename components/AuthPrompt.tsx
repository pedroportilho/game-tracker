'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { Button, Input } from '@/components/ui'

type AuthPromptProps = {
  title: string
  description: string
}

export function AuthPrompt({ title, description }: AuthPromptProps) {
  const { user, login, register } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const refreshed = useRef(false)

  useEffect(() => {
    if (user && !refreshed.current) {
      refreshed.current = true
      router.refresh()
    }
  }, [user, router])

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    setInfo('')

    const result = mode === 'login'
      ? await login(email, password)
      : await register(email, password)

    setLoading(false)

    if (!result.success) {
      setError(result.message ?? 'Erro ao processar. Tente novamente.')
      return
    }

    if (result.needsConfirmation) {
      setInfo(result.message ?? 'Cadastro realizado. Verifique seu e-mail para confirmar a conta.')
      return
    }

    setInfo(result.message ?? (mode === 'login' ? 'Login realizado com sucesso.' : 'Cadastro concluído com sucesso.'))
  }

  return (
    <div className="max-w-md w-full rounded-3xl border border-white/10 bg-[#0f1117] p-8 shadow-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-display font-bold text-zinc-100 mb-2">{title}</h1>
        <p className="text-sm text-zinc-400">{description}</p>
      </div>

      <div className="flex flex-col gap-4">
        <Input
          label="E-mail"
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(''); setInfo('') }}
          placeholder="seu@email.com"
          autoFocus
        />

        <Input
          label="Senha"
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(''); setInfo('') }}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          error={error}
          placeholder="••••••••"
        />

        {info ? <div className="rounded-xl bg-emerald-950/60 border border-emerald-700/40 p-3 text-sm text-emerald-300">{info}</div> : null}
        {error ? <div className="rounded-xl bg-red-950/60 border border-red-700/40 p-3 text-sm text-red-300">{error}</div> : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={loading || !email || !password}
            className="w-full sm:w-auto"
          >
            {loading ? 'Enviando…' : mode === 'login' ? 'Entrar' : 'Cadastrar'}
          </Button>

          <button
            type="button"
            className="text-xs text-violet-300 hover:text-violet-100 transition"
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login')
              setError('')
              setInfo('')
            }}
          >
            {mode === 'login' ? 'Precisa criar uma conta?' : 'Já tenho conta'}
          </button>
        </div>
      </div>
    </div>
  )
}
