import { useState } from 'react'
import { Modal, Button, Input } from '@/components/ui'

type AuthModalProps = {
  isOpen: boolean
  onClose: () => void
  onLogin: (email: string, password: string) => Promise<{ success: boolean; message?: string; needsConfirmation?: boolean }>
  onRegister: (email: string, password: string) => Promise<{ success: boolean; message?: string; needsConfirmation?: boolean }>
}

export function AuthModal({ isOpen, onClose, onLogin, onRegister }: AuthModalProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [info, setInfo] = useState('')

  const handleSubmit = async () => {
    setLoading(true)
    const result = mode === 'login' ? await onLogin(email, password) : await onRegister(email, password)
    setLoading(false)

    if (!result.success) {
      setError(result.message ?? 'Falha ao autenticar. Verifique e-mail e senha.')
      return
    }

    setEmail('')
    setPassword('')
    setError('')
    setInfo(result.needsConfirmation ? 'Cadastro realizado. Verifique seu e-mail para confirmar a conta.' : mode === 'register' ? 'Cadastro concluído com sucesso.' : '')
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={mode === 'login' ? 'Entrar na conta' : 'Criar nova conta'}>
      <div className='flex flex-col gap-4'>
        <p className='text-sm text-zinc-400'>Use seu e-mail e senha para acessar seus dados.</p>
        <Input
          label='E-mail'
          type='email'
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError('') }}
          placeholder='seu@email.com'
          autoFocus
        />
        <Input
          label='Senha'
          type='password'
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError('') }}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          error={error}
          placeholder='••••••••'
        />
        <div className='flex gap-2 justify-end'>
          <Button variant='ghost' onClick={onClose}>Cancelar</Button>
          <Button variant='primary' onClick={handleSubmit} disabled={loading || !email || !password}>
            {loading ? 'Enviando…' : mode === 'login' ? 'Entrar' : 'Cadastrar'}
          </Button>
        </div>
        {info ? <p className='text-sm text-emerald-300'>{info}</p> : null}
        <div className='flex items-center justify-between text-xs text-zinc-500'>
          <span>{mode === 'login' ? 'Ainda não tem conta?' : 'Já tem conta?'}</span>
          <button
            type='button'
            className='text-violet-400 hover:text-violet-200 transition'
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login')
              setError('')
              setInfo('')
            }}
          >
            {mode === 'login' ? 'Criar conta' : 'Entrar'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
