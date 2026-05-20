import { useState } from 'react'
import { Modal, Button, Input } from '@/components/ui'

export function AuthModal({ isOpen, onClose, onSubmit }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = () => {
    const ok = onSubmit(password)
    if (!ok) {
      setError('Senha incorreta')
      setPassword('')
    } else {
      setPassword('')
      setError('')
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Autenticação necessária">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-zinc-400">Digite a senha para continuar.</p>
        <Input
          label="Senha"
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError('') }}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          error={error}
          placeholder="••••••••"
          autoFocus
        />
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={handleSubmit}>Entrar</Button>
        </div>
      </div>
    </Modal>
  )
}