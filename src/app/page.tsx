"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { AuthModal } from '@/components/AuthModal'
import { Footer } from '@/components/Footer'
import { useAuthStore } from '@/store/authStore'
import { LogIn, CalendarDays, MessageCircle, MapPin, Scissors } from 'lucide-react'
import { createClient } from '@/lib/supabase-browser'

const EMPRESA_ID = process.env.NEXT_PUBLIC_EMPRESA_ID!

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function LandingPage() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const { user } = useAuthStore()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [services, setServices] = useState<any[]>([])
  const [isOpenNow, setIsOpenNow] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isInactive, setIsInactive] = useState(false)
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function checkIfOpen(config: any) {
    if (!config.open_time || !config.close_time || !config.open_days) return
    const now = new Date()
    const day = now.getDay()
    if (!config.open_days.includes(day)) { setIsOpenNow(false); return }
    const currentTime = now.getHours() * 60 + now.getMinutes()
    const [openH, openM] = config.open_time.split(':').map(Number)
    const [closeH, closeM] = config.close_time.split(':').map(Number)
    setIsOpenNow(currentTime >= openH * 60 + openM && currentTime <= closeH * 60 + closeM)
  }

  useEffect(() => {
    async function fetchData() {
      // 1. Gate: check if empresa is active
      const { data: empresa } = await supabase
        .from('empresas')
        .select('ativo')
        .eq('id', EMPRESA_ID)
        .single()

      if (empresa && !empresa.ativo) {
        setIsInactive(true)
        setIsLoading(false)
        return
      }

      // 2. Fetch business config scoped to this empresa
      const { data: configData } = await supabase
        .from('business_config')
        .select('*')
        .eq('empresa_id', EMPRESA_ID)
        .limit(1)
        .single()

      if (configData) {
        checkIfOpen(configData)
        const { data: svcData } = await supabase
          .from('services')
          .select('*')
          .eq('empresa_id', EMPRESA_ID)
          .order('name')
        if (svcData) setServices(svcData)
      }
      setIsLoading(false)
    }
    fetchData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // --- Inactive Gate Screen ---
  if (isInactive) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="text-center p-8 max-w-md">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Scissors className="w-10 h-10 text-green-800" />
          </div>
          <h1 className="text-2xl font-bold text-green-950 mb-3">Serviço temporariamente indisponível</h1>
          <p className="text-green-700 leading-relaxed">
            Estamos em manutenção ou temporariamente fora do ar. Por favor, tente novamente mais tarde ou entre em contato pelo WhatsApp.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-white">

      {/* Header */}
      <header className="w-full border-b border-green-100 bg-white/95 backdrop-blur-xl sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center">
              <img src="https://gnjcdjhvekshzkwvwfdb.supabase.co/storage/v1/object/public/logo-banner/logo_salao.png" alt="Seu Salão" className="h-10 w-auto object-contain" />
            </div>
            <div className="flex flex-col pr-2">
              <span className="font-bold text-[15px] sm:text-lg tracking-tight text-green-950 leading-none">Seu Salão Aqui</span>
              {isOpenNow !== null && (
                <span className={`text-xs font-semibold mt-1 flex items-center justify-start gap-1.5 ${isOpenNow ? 'text-emerald-600' : 'text-red-500'}`}>
                  <span className="relative flex h-2 w-2">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isOpenNow ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                    <span className={`relative inline-flex rounded-full h-2 w-2 shadow-[0_0_8px] ${isOpenNow ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-red-500 shadow-red-500/50'}`}></span>
                  </span>
                  {isOpenNow ? 'Aberto agora' : 'Fechado'}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <Button variant="ghost" className="hidden sm:flex" onClick={() => window.location.href = '/dashboard'}>
                Meu Painel
              </Button>
            ) : (
              <Button variant="ghost" className="hidden sm:flex" onClick={() => setIsAuthModalOpen(true)}>
                <LogIn className="w-4 h-4 mr-2" />
                <span>Entrar</span>
              </Button>
            )}
            <Button className="font-semibold shadow-lg shadow-green-900/20" onClick={() => user ? window.location.href = '/dashboard' : setIsAuthModalOpen(true)}>
              <CalendarDays className="w-4 h-4 mr-2" />
              Agendar
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      {/* We apply a negative top margin to pull it behind the 80px static relative header, while adjusting min-heights */}
      <div className="w-full relative min-h-[100dvh] flex items-center justify-center overflow-hidden -mt-20">
        
        {/* Mobile Background Video */}
        <video 
          className="absolute inset-0 w-full h-full object-cover sm:hidden" 
          autoPlay 
          loop 
          muted 
          playsInline
        >
          <source src="https://gnjcdjhvekshzkwvwfdb.supabase.co/storage/v1/object/public/logo-banner/home_salao_mobile.mp4" type="video/mp4" />
        </video>

        {/* Desktop Background Video */}
        <video 
          className="absolute inset-0 w-full h-full object-cover hidden sm:block" 
          autoPlay 
          loop 
          muted 
          playsInline
        >
          <source src="https://gnjcdjhvekshzkwvwfdb.supabase.co/storage/v1/object/public/logo-banner/home_salao_desk.mp4" type="video/mp4" />
        </video>
        
        {/* Gradient Overlay for Readability (Now active on BOTH mobile and desktop) */}
        <div className="absolute inset-0 bg-gradient-to-b from-green-950/60 via-green-900/50 to-green-950/90 mix-blend-multiply pointer-events-none"></div>

        <main className="w-full max-w-6xl mx-auto px-4 relative z-10 flex flex-col justify-center items-center h-full pt-16 text-center scale-[1.05] sm:scale-110">
          <section className="flex flex-col items-center space-y-6 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-black/30 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 text-white/90 text-sm font-medium">
              <Scissors className="w-4 h-4 text-emerald-300" />
              Atendimento Premium
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-[1.1] drop-shadow-md">
              A sua beleza em <br />
              <span className="text-emerald-400">boas mãos.</span>
            </h1>
            <p className="text-green-50 text-lg md:text-xl max-w-xl font-medium leading-relaxed drop-shadow">
              Agende seu horário com praticidade e desfrute de um espaço dedicado ao seu bem-estar.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4 w-full sm:w-auto justify-center">
              <Button
                size="lg"
                className="w-full sm:w-auto text-lg bg-white text-green-900 hover:bg-green-50 h-14 px-8 shadow-2xl font-semibold"
                onClick={() => user ? window.location.href = '/dashboard' : setIsAuthModalOpen(true)}
              >
                <CalendarDays className="w-5 h-5 mr-2" />
                Ver Horários Disponíveis
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto text-lg gap-2 h-14 px-8 border-white/30 text-white bg-white/10 backdrop-blur-sm hover:bg-white/20 hover:text-white"
                onClick={() => window.open('https://wa.me/?text=Olá%2C%20gostaria%20de%20informações%20sobre%20o%20salão.', '_blank')}
              >
                <MessageCircle className="w-5 h-5 text-emerald-400" />
                Dúvidas (WhatsApp)
              </Button>
            </div>
          </section>
        </main>
      </div>

      {/* Services Showcase */}
      <section className="py-20 w-full max-w-6xl mx-auto px-4 z-10">
        <div className="flex flex-col items-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-green-950 text-center">Nossos Serviços</h2>
          <div className="w-20 h-1 bg-green-800 mt-4 rounded-full"></div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-green-100 bg-green-50 p-5 flex flex-col animate-pulse">
                <div className="w-full h-48 bg-green-200/60 rounded-xl mb-5"></div>
                <div className="h-7 w-3/4 bg-green-200/60 rounded-lg mb-3"></div>
                <div className="h-5 w-1/2 bg-green-200/60 rounded-lg mb-5"></div>
                <div className="mt-auto h-12 w-full bg-green-200/60 rounded-xl"></div>
              </div>
            ))}
          </div>
        ) : services.length > 0 ? (
          <div className="space-y-12">
            {/* Hair Services */}
            {services.filter(s => s.name?.toLowerCase().includes('cabelo') || s.name?.toLowerCase().includes('corte') || s.name?.toLowerCase().includes('coloração') || s.name?.toLowerCase().includes('mechas') || s.name?.toLowerCase().includes('escova') || s.name?.toLowerCase().includes('penteado') || s.name?.toLowerCase().includes('hidratação') || s.description?.toLowerCase().includes('cabelo')).length > 0 && (
              <div>
                <h3 className="text-2xl font-bold text-green-900 mb-6 flex items-center gap-2">
                  Cabelo
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {services.filter(s => s.name?.toLowerCase().includes('cabelo') || s.name?.toLowerCase().includes('corte') || s.name?.toLowerCase().includes('coloração') || s.name?.toLowerCase().includes('mechas') || s.name?.toLowerCase().includes('escova') || s.name?.toLowerCase().includes('penteado') || s.name?.toLowerCase().includes('hidratação') || s.description?.toLowerCase().includes('cabelo')).map((service) => (
                    <div key={service.id} className="rounded-2xl border border-green-100 bg-white p-5 flex flex-col hover:border-green-300 hover:shadow-lg hover:shadow-green-900/5 transition-all group">
                      <div className="w-full h-48 rounded-xl mb-5 overflow-hidden bg-green-100">
                        <img
                          src={service.image_url || "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=800&auto=format&fit=crop"}
                          alt={service.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <h3 className="text-xl font-bold text-green-950 mb-2">{service.name}</h3>
                      {service.description && (
                        <p className="text-sm text-green-700 mb-4 line-clamp-2">{service.description}</p>
                      )}
                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-green-100">
                        <span className="text-xl font-bold text-green-800">
                          R$ {Number(service.price).toFixed(2).replace('.', ',')}
                        </span>
                        <span className="text-sm text-green-600 font-medium">{service.duration_minutes} min</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Nails Services */}
            {services.filter(s => s.name?.toLowerCase().includes('unha') || s.name?.toLowerCase().includes('manicure') || s.name?.toLowerCase().includes('pedicure') || s.name?.toLowerCase().includes('esmaltação') || s.name?.toLowerCase().includes('alongamento') || s.description?.toLowerCase().includes('unha')).length > 0 && (
              <div>
                <h3 className="text-2xl font-bold text-green-900 mb-6 flex items-center gap-2">
                  Unhas
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {services.filter(s => s.name?.toLowerCase().includes('unha') || s.name?.toLowerCase().includes('manicure') || s.name?.toLowerCase().includes('pedicure') || s.name?.toLowerCase().includes('esmaltação') || s.name?.toLowerCase().includes('alongamento') || s.description?.toLowerCase().includes('unha')).map((service) => (
                    <div key={service.id} className="rounded-2xl border border-green-100 bg-white p-5 flex flex-col hover:border-green-300 hover:shadow-lg hover:shadow-green-900/5 transition-all group">
                      <div className="w-full h-48 rounded-xl mb-5 overflow-hidden bg-green-100">
                        <img
                          src={service.image_url || "https://images.unsplash.com/photo-1519014816548-bf5fe059e98b?q=80&w=800&auto=format&fit=crop"}
                          alt={service.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <h3 className="text-xl font-bold text-green-950 mb-2">{service.name}</h3>
                      {service.description && (
                        <p className="text-sm text-green-700 mb-4 line-clamp-2">{service.description}</p>
                      )}
                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-green-100">
                        <span className="text-xl font-bold text-green-800">
                          R$ {Number(service.price).toFixed(2).replace('.', ',')}
                        </span>
                        <span className="text-sm text-green-600 font-medium">{service.duration_minutes} min</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Other Services */}
            {services.filter(s => !s.name?.toLowerCase().includes('cabelo') && !s.name?.toLowerCase().includes('corte') && !s.name?.toLowerCase().includes('coloração') && !s.name?.toLowerCase().includes('mechas') && !s.name?.toLowerCase().includes('escova') && !s.name?.toLowerCase().includes('penteado') && !s.name?.toLowerCase().includes('hidratação') && !s.description?.toLowerCase().includes('cabelo') && !s.name?.toLowerCase().includes('unha') && !s.name?.toLowerCase().includes('manicure') && !s.name?.toLowerCase().includes('pedicure') && !s.name?.toLowerCase().includes('esmaltação') && !s.name?.toLowerCase().includes('alongamento') && !s.description?.toLowerCase().includes('unha')).length > 0 && (
              <div>
                <h3 className="text-2xl font-bold text-green-900 mb-6 flex items-center gap-2">
                  Outros Serviços
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {services.filter(s => !s.name?.toLowerCase().includes('cabelo') && !s.name?.toLowerCase().includes('corte') && !s.name?.toLowerCase().includes('coloração') && !s.name?.toLowerCase().includes('mechas') && !s.name?.toLowerCase().includes('escova') && !s.name?.toLowerCase().includes('penteado') && !s.name?.toLowerCase().includes('hidratação') && !s.description?.toLowerCase().includes('cabelo') && !s.name?.toLowerCase().includes('unha') && !s.name?.toLowerCase().includes('manicure') && !s.name?.toLowerCase().includes('pedicure') && !s.name?.toLowerCase().includes('esmaltação') && !s.name?.toLowerCase().includes('alongamento') && !s.description?.toLowerCase().includes('unha')).map((service) => (
                    <div key={service.id} className="rounded-2xl border border-green-100 bg-white p-5 flex flex-col hover:border-green-300 hover:shadow-lg hover:shadow-green-900/5 transition-all group">
                      <div className="w-full h-48 rounded-xl mb-5 overflow-hidden bg-green-100">
                        <img
                          src={service.image_url || "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=800&auto=format&fit=crop"}
                          alt={service.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <h3 className="text-xl font-bold text-green-950 mb-2">{service.name}</h3>
                      {service.description && (
                        <p className="text-sm text-green-700 mb-4 line-clamp-2">{service.description}</p>
                      )}
                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-green-100">
                        <span className="text-xl font-bold text-green-800">
                          R$ {Number(service.price).toFixed(2).replace('.', ',')}
                        </span>
                        <span className="text-sm text-green-600 font-medium">{service.duration_minutes} min</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full text-center text-green-600 py-10">
            Nenhum serviço disponível no momento.
          </div>
        )}
      </section>

      {/* Location Section */}
      <section className="py-20 w-full bg-green-50 border-t border-green-100">
        <div className="max-w-6xl mx-auto px-4 flex flex-col gap-12 items-center text-center">
          <div className="flex-1 space-y-6 max-w-2xl">
            <h2 className="text-3xl font-bold text-green-950 flex items-center justify-center gap-3">
              <MapPin className="w-8 h-8 text-green-800" />
              Nossa Localização
            </h2>
            <p className="text-green-700 text-lg">
              Venha nos visitar! Estamos em uma localização de fácil acesso, com ambiente climatizado e conforto garantido para o seu atendimento.
            </p>
          </div>
          <div className="w-full rounded-2xl overflow-hidden shadow-xl border border-green-200 relative h-[400px]">
            <iframe
              src="https://www.google.com/maps?q=Avenida+Paulista,+1000,+Sao+Paulo&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={true}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="absolute inset-0"
            ></iframe>
          </div>
        </div>
      </section>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => window.location.href = '/dashboard'}
      />
      <Footer />
    </div>
  )
}
