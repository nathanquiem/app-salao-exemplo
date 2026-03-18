"use client"

import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { Footer } from './Footer'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Label } from './ui/Label'
import { X, Check, Eye, EyeOff } from 'lucide-react'
import { maskPhoneInput } from '@/lib/formatPhone'

const EMPRESA_ID = process.env.NEXT_PUBLIC_EMPRESA_ID!

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  
  // Form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')

  if (!isOpen) return null

  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password
        })
        if (error) throw error
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName,
              phone,
              
            }
          }
        })
        if (signUpError) throw signUpError

        // Trigger handle_new_user() automatically creates the profile.
        // Also try direct INSERT as fallback (silent — ignores conflict).
        if (data.user) {
          await supabase.from('profiles_salao').insert({
            id: data.user.id,
            full_name: fullName,
            phone,
            email: email.trim(),
            role: 'client',
            
          }).catch((e: unknown) => { console.warn('Fallback insert skipped:', (e as Error)?.message) })
        }

        // If session came back immediately (email confirmation OFF),
        // redirect to dashboard right away — no need to login again.
        if (data.session) {
          onClose()
          window.location.href = '/dashboard'
          return
        }

        // Email confirmation is ON — show a friendly message
        setError('Cadastro realizado! Verifique seu e-mail para confirmar a conta.')
        setLoading(false)
        return
      }
      
      if (onSuccess) onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro na autenticação')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-green-100 bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-green-950">
            {isLogin ? 'Entrar na sua conta' : 'Criar nova conta'}
          </h2>
          <button onClick={onClose} className="text-green-500 hover:text-green-800">
            <X size={20} />
          </button>
        </div>

        <div className="flex gap-2 mb-6 p-1 bg-green-50 rounded-lg">
          <button 
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${isLogin ? 'bg-white text-green-900 shadow-sm border border-green-200' : 'text-green-600 hover:text-green-800'}`}
            onClick={() => setIsLogin(true)}
          >
            Login
          </button>
          <button 
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${!isLogin ? 'bg-white text-green-900 shadow-sm border border-green-200' : 'text-green-600 hover:text-green-800'}`}
            onClick={() => setIsLogin(false)}
          >
            Cadastro
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-green-800">Nome Completo</Label>
                <Input 
                  id="fullName" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Seu nome"
                  autoComplete="name"
                  autoCapitalize="words"
                  required={!isLogin}
                  className="bg-white border-green-200 focus:border-green-700 text-green-900"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-green-800">Celular (WhatsApp)</Label>
                <Input 
                  id="phone" 
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(maskPhoneInput(e.target.value))}
                  placeholder="(00) 00000-0000"
                  autoComplete="tel"
                  required={!isLogin}
                  className="bg-white border-green-200 focus:border-green-700 text-green-900"
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-green-800">E-mail</Label>
            <Input 
              id="email" 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              required
              className="bg-white border-green-200 focus:border-green-700 text-green-900"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-green-800">Senha</Label>
            <div className="relative">
              <Input 
                id="password" 
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="bg-white border-green-200 focus:border-green-700 text-green-900 pr-10"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600 hover:text-green-800"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {isLogin && (
              <div className="flex justify-end mt-1">
                <a href="/reset-password" className="text-xs font-medium text-green-600 hover:text-green-800">
                  Esqueci minha senha
                </a>
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button type="submit" className="w-full mt-4" disabled={loading}>
            {loading ? 'Aguarde...' : isLogin ? 'Entrar' : 'Cadastrar'}
          </Button>
        </form>
        <div className="-mx-6 border-t-0 -mb-6">
          <Footer />
        </div>
      </div>
    </div>
  )
}
