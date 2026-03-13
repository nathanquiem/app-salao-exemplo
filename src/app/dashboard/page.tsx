"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { LogOut, Plus, Clock, CalendarDays, Ban, X, Settings, Shield, User as UserIcon } from 'lucide-react'
import { formatPhone, maskPhoneInput } from '@/lib/formatPhone'
import { format, isAfter, subHours, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import { BookingModal } from '@/components/BookingModal'
import { Footer } from '@/components/Footer'

const EMPRESA_ID = process.env.NEXT_PUBLIC_EMPRESA_ID!

export default function DashboardPage() {
  const { user, profile, setProfile, logout, isLoading: authLoading } = useAuthStore()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [bookings, setBookings] = useState<any[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [cancelLimit, setCancelLimit] = useState(2)
  const [mounted, setMounted] = useState(false)
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
  const router = useRouter()

  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editLoading, setEditLoading] = useState(false)

  const [supabase] = useState(() => createClient())

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (mounted && !authLoading && !user) router.push('/')
  }, [mounted, authLoading, user, router])

  useEffect(() => {
    async function loadData() {
      if (authLoading || !user) return
      try {
        if (!profile) {
          const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
          if (prof) setProfile(prof)
        }
        const { data: config } = await supabase
          .from('business_config').select('cancel_limit_hours').limit(1).maybeSingle()
        if (config) setCancelLimit(config.cancel_limit_hours)

        const { data: userBookings } = await supabase
          .from('bookings')
          .select(`*, services (name, duration_minutes, price), barbers (name)`)
          .eq('client_id', user.id)
          .order('start_time', { ascending: true })
        if (userBookings) setBookings(userBookings)
      } catch (error) {
        console.error("Error loading dashboard data", error)
      } finally {
        setDataLoading(false)
      }
    }
    loadData()
  }, [authLoading, user, profile, supabase, setProfile])

  const handleLogout = async () => {
    try { await supabase.auth.signOut() } catch (e) { console.warn("Erro ao deslogar:", e) }
    finally { logout(); window.location.href = '/' }
  }

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm("Tem certeza que deseja cancelar este agendamento?")) return
    try {
      const { error } = await supabase.from('bookings').update({ status: 'canceled' }).eq('id', bookingId)
      if (error) throw error
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'canceled' } : b))
      alert("Agendamento cancelado com sucesso.")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) { alert("Erro ao cancelar: " + error.message) }
  }

  const checkCanCancel = (startTimeStr: string) => {
    return isAfter(subHours(parseISO(startTimeStr), cancelLimit), new Date())
  }

  if (!mounted || authLoading || dataLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-green-800 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-green-700 font-medium">Carregando painel...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  const upcomingBookings = bookings.filter(b => isAfter(parseISO(b.start_time), new Date()) && b.status === 'confirmed')
  const pastBookings = bookings.filter(b => !isAfter(parseISO(b.start_time), new Date()) || b.status === 'canceled')

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-green-100 bg-white px-6 py-4 flex justify-between items-center shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-green-950">Olá, {profile?.full_name?.split(' ')[0]} 👋</h1>
          <p className="text-sm text-green-700">Gerencie seus horários</p>
        </div>
        <div className="flex gap-2 sm:gap-4">
          {profile?.role === 'admin' && (
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => router.push('/admin')}
            >
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">PainelSalão</span>
            </Button>
          )}
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => {
              setEditName(profile?.full_name || '')
              setEditPhone(profile?.phone || '')
              setIsSettingsOpen(true)
            }}
          >
            <Settings className="w-4 h-4 hidden sm:block" />
            <span className="hidden sm:inline">Configurações</span>
            <Settings className="w-4 h-4 sm:hidden" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleLogout} title="Sair">
            <LogOut className="w-5 h-5 text-green-700" />
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6 space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-green-950">Próximos Agendamentos</h2>
          <Button onClick={() => setIsBookingModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Novo Agendamento</span>
            <span className="sm:hidden">Novo</span>
          </Button>
        </div>

        {upcomingBookings.length === 0 ? (
          <div className="rounded-xl border border-green-100 bg-green-50 p-12 text-center">
            <CalendarDays className="w-12 h-12 text-green-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-green-800">Você não tem horários marcados</h3>
            <p className="text-green-600 mt-2">Agende agora para garantir seu atendimento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingBookings.map(booking => {
              const date = parseISO(booking.start_time)
              const canCancel = checkCanCancel(booking.start_time)
              return (
                <Card key={booking.id} className="border-green-100 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex justify-between items-start text-green-950">
                      <span>{booking.services?.name}</span>
                      <span className="text-green-800 font-bold">R$ {booking.services?.price}</span>
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4 text-green-600">
                      <span className="flex items-center gap-2">
                        <Clock className="w-4 h-4" /> {booking.services?.duration_minutes} minutos
                      </span>
                      {booking.barbers?.name && (
                        <span className="flex items-center gap-2">
                          <UserIcon className="w-4 h-4" /> {booking.barbers.name}
                        </span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                      <p className="font-medium text-green-900 capitalize">
                        {format(date, "EEEE, d 'de' MMMM", { locale: ptBR })}
                      </p>
                      <p className="text-2xl font-bold text-green-800 mt-1">
                        {format(date, "HH:mm")}
                      </p>
                    </div>
                    {canCancel ? (
                      <Button
                        variant="outline"
                        className="w-full text-red-500 hover:text-red-600 hover:border-red-400 border-red-300"
                        onClick={() => handleCancelBooking(booking.id)}
                      >
                        Cancelar Horário
                      </Button>
                    ) : (
                      <div className="flex items-center justify-center p-2 text-sm text-green-600 bg-green-50 rounded-md">
                        <Ban className="w-4 h-4 mr-2" />
                        Cancelamento indisponível ({cancelLimit}h limite)
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        <div className="pt-8 border-t border-green-100">
          <h2 className="text-xl font-bold text-green-800 mb-6">Histórico</h2>
          <div className="space-y-4">
            {pastBookings.length === 0 ? (
              <p className="text-green-600 text-sm">Nenhum histórico encontrado.</p>
            ) : (
              pastBookings.map(booking => (
                <div key={booking.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg border border-green-100 bg-green-50 gap-4">
                  <div>
                    <p className="font-medium text-green-900">{booking.services?.name}</p>
                    <p className="text-sm text-green-600">
                      {format(parseISO(booking.start_time), "dd/MM/yyyy 'às' HH:mm")}
                    </p>
                  </div>
                  <div className="sm:text-right">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      booking.status === 'canceled'
                        ? 'bg-red-50 text-red-600 border border-red-200'
                        : 'bg-green-100 text-green-700 border border-green-200'
                    }`}>
                      {booking.status === 'canceled' ? 'Cancelado' : 'Concluído'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        onSuccess={() => window.location.reload()}
        userId={user.id}
        empresaId={profile?.empresa_id || EMPRESA_ID}
      />

      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white border border-green-100 rounded-2xl w-full max-w-md p-6 relative shadow-2xl">
            <button onClick={() => setIsSettingsOpen(false)} className="absolute top-4 right-4 text-green-500 hover:text-green-800">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-green-950 mb-6">Configurações do Perfil</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-green-700">Nome</label>
                <input
                  type="text"
                  className="w-full mt-1.5 bg-white border border-green-200 rounded-lg p-2.5 text-green-900 focus:outline-none focus:border-green-700 transition-colors"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder="Seu nome completo"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-green-700">Telefone</label>
                <input
                  type="text"
                  className="w-full mt-1.5 bg-white border border-green-200 rounded-lg p-2.5 text-green-900 focus:outline-none focus:border-green-700 transition-colors"
                  value={editPhone}
                  onChange={e => setEditPhone(maskPhoneInput(e.target.value))}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-green-700">E-mail</label>
                <input
                  type="email"
                  disabled
                  className="w-full mt-1.5 bg-green-50 border border-green-100 rounded-lg p-2.5 text-green-400 cursor-not-allowed"
                  value={user.email || ''}
                />
                <p className="text-xs text-green-500 mt-1">O e-mail vinculado à conta não pode ser alterado.</p>
              </div>
              <Button
                className="w-full mt-6"
                disabled={editLoading}
                onClick={async () => {
                  setEditLoading(true)
                  const { error } = await supabase
                    .from('profiles')
                    .update({ full_name: editName, phone: editPhone })
                    .eq('id', user.id)
                  if (!error) {
                    setProfile({ ...profile, full_name: editName, phone: editPhone, id: user.id } as any)
                    setIsSettingsOpen(false)
                    alert("Perfil atualizado com sucesso!")
                  } else { alert("Erro ao atualizar perfil: " + error.message) }
                  setEditLoading(false)
                }}
              >
                {editLoading ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  )
}
