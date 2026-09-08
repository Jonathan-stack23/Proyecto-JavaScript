function About() {
  const valores = [
    { icono: '✨', titulo: 'Calidad', desc: 'Solo trabajamos con productos y marcas de la más alta calidad certificada.' },
    { icono: '🤝', titulo: 'Honestidad', desc: 'Precios justos y transparentes. Sin costos ocultos ni sorpresas.' },
    { icono: '💯', titulo: 'Compromiso', desc: 'Tu satisfacción es nuestra prioridad. Garantía total en cada compra.' },
    { icono: '🚀', titulo: 'Innovación', desc: 'Siempre a la vanguardia, trayendo lo último en tecnología para ti.' },
  ]

  const equipo = [
    { nombre: 'Carlos Pérez', cargo: 'Director General', desc: 'Liderando la visión y el crecimiento de MiTienda.', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&h=240&q=80' },
    { nombre: 'María Gómez', cargo: 'Gerente de Ventas', desc: 'Especialista en atención al cliente y estrategias comerciales.', img: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=240&h=240&q=80' },
    { nombre: 'Juan Rodríguez', cargo: 'Jefe de Soporte Técnico', desc: 'Soluciones expertas para cualquier duda técnica.', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=240&h=240&q=80' },
  ]

  return (
    <div className="about-page">
      <section className="relative overflow-hidden bg-gradient-to-br from-accent-light via-white to-purple-50 py-16 md:py-24">
        <div className="absolute -top-32 -right-24 w-96 h-96 rounded-full bg-purple-200/40 blur-3xl -z-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold bg-white border border-gray-100 shadow-sm text-accent mb-4">
            Sobre Nosotros
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-text-heading mb-4">
            Quiénes Somos
          </h2>
          <p className="text-text max-w-2xl mx-auto text-lg">
            Conoce nuestra historia, nuestros valores y el equipo que hace posible MiTienda cada día.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 space-y-16 md:space-y-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h3 className="flex items-center gap-3 text-2xl font-bold text-text-heading mb-5">
              <span className="text-3xl">📖</span> Nuestra Historia
            </h3>
            <p className="text-text mb-4 leading-relaxed">
              MiTienda nació en el año 2020 con el objetivo de ofrecer productos tecnológicos
              de alta calidad a precios accesibles para todos. Desde nuestros inicios, trabajamos
              con dedicación para convertirnos en una tienda de confianza.
            </p>
            <p className="text-text leading-relaxed">
              Contamos con un equipo de profesionales apasionados por la tecnología, dedicados
              a brindarte la mejor experiencia de compra, asesoría personalizada y soporte
              técnico especializado en cada paso.
            </p>
          </div>
          <div className="rounded-3xl overflow-hidden shadow-custom-xl ring-1 ring-gray-100 aspect-[4/3]">
            <img
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&h=450&q=80"
              alt="Nuestro equipo trabajando"
              loading="lazy"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=600&h=450&q=80'
              }}
            />
          </div>
        </div>

        <div>
          <h3 className="text-2xl md:text-3xl font-bold text-text-heading mb-3 text-center">
            Nuestros Valores
          </h3>
          <p className="text-text text-center mb-10">Los pilares que guían cada decisión</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {valores.map((v, i) => (
              <div key={i} className="bg-white rounded-2xl p-7 shadow-custom-sm ring-1 ring-gray-100 text-center hover:shadow-custom-lg hover:-translate-y-1 transition-all duration-300">
                <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center text-3xl mx-auto mb-4">
                  {v.icono}
                </div>
                <h4 className="font-bold text-text-heading mb-2">{v.titulo}</h4>
                <p className="text-sm text-text leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="text-center mb-10">
            <h3 className="text-2xl md:text-3xl font-bold text-text-heading mb-2">
              Nuestro Equipo
            </h3>
            <p className="text-text">Las personas detrás de MiTienda</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {equipo.map((m, i) => (
              <div key={i} className="bg-white rounded-3xl overflow-hidden shadow-custom-md ring-1 ring-gray-100 hover:shadow-custom-xl transition-all duration-300 group">
                <div className="aspect-square overflow-hidden bg-gray-100">
                  <img
                    src={m.img}
                    alt={m.nombre}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&h=240&q=80'
                    }}
                  />
                </div>
                <div className="p-6 text-center">
                  <h4 className="text-lg font-bold text-text-heading mb-1">{m.nombre}</h4>
                  <p className="text-accent text-sm font-semibold mb-2">{m.cargo}</p>
                  <p className="text-sm text-text">{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default About
