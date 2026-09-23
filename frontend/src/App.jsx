import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import ProtectedRoute from './components/ProtectedRoute';
import WhatsAppButton from './components/WhatsAppButton';
import Header from './components/Header';
import Footer from './components/Footer';
import Index from './pages/Index';
import About from './pages/About';
import Products from './pages/Products';
import Services from './pages/Services';
import CartPage from './pages/CartPage';
import PedidoConfirmadoPage from './pages/PedidoConfirmadoPage';
import Login from './components/Login';
import RecoverPassword from './components/RecoverPassword';
import ErrorBoundary from './components/ErrorBoundary';

import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsuarios from './pages/admin/AdminUsuarios';
import AdminProductos from './pages/admin/AdminProductos';
import AdminServicios from './pages/admin/AdminServicios';
import GestionPedidos from './pages/admin/GestionPedidos';
import GestionCitas from './pages/admin/GestionCitas';
import GestionVentas from './pages/admin/GestionVentas';
import GestionFacturas from './pages/admin/GestionFacturas';
import ReportesVentas from './pages/admin/ReportesVentas';
import GestionPQR from './pages/admin/GestionPQR';
import PerfilUsuario from './components/PerfilUsuario';
import ChatbotWidget from './components/ChatbotWidget';

import EmpleadoLayout from './pages/empleado/EmpleadoLayout';
import { EmpleadoProductos, EmpleadoServicios, EmpleadoPerfil } from './pages/empleado/EmpleadoDashboard';
import EmpleadoDashboard from './pages/empleado/EmpleadoDashboard';

import ClienteLayout from './pages/cliente/ClienteLayout';
import { ClientePerfil, ClienteCompras } from './pages/cliente/ClienteDashboard';
import ClienteDashboard from './pages/cliente/ClienteDashboard';
import ClientePQR from './pages/cliente/ClientePQR';

import './App.css';

function PublicLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-surface-alt">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, hasRole } = useAuth();

  if (isAuthenticated) {
    if (hasRole('Administrador')) return <Navigate to="/admin/dashboard" replace />;
    if (hasRole('Empleado')) return <Navigate to="/empleado/dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  return <Login onNavigateRecover={() => navigate('/recuperar-contrasena')} />;
}

function RecoverPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) return <Navigate to="/" replace />;

  return <RecoverPassword onNavigateBack={() => navigate('/login')} />;
}

function ContactPage() {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    asunto: '',
    mensaje: '',
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [enviado, setEnviado] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validar = () => {
    const e = {};
    if (!formData.nombre.trim()) e.nombre = 'El nombre es obligatorio';
    else if (formData.nombre.length < 2) e.nombre = 'Mínimo 2 caracteres';
    if (!formData.email.trim()) e.email = 'El correo es obligatorio';
    else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email)) e.email = 'Correo inválido';
    if (!formData.asunto.trim()) e.asunto = 'El asunto es obligatorio';
    if (!formData.mensaje.trim()) e.mensaje = 'El mensaje es obligatorio';
    else if (formData.mensaje.length < 10) e.mensaje = 'Mínimo 10 caracteres';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };
  const handleBlur = (e) => {
    setTouched((p) => ({ ...p, [e.target.name]: true }));
    validar();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched({ nombre: true, email: true, asunto: true, mensaje: true });
    if (!validar()) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setEnviado(true);
      setFormData({ nombre: '', email: '', asunto: '', mensaje: '' });
      setTouched({});
    }, 1200);
  };

  return (
    <div className="contact-page">
      <section className="relative overflow-hidden bg-gradient-to-br from-accent-light via-white to-purple-50 py-16 md:py-20">
        <div className="absolute -top-32 -left-24 w-96 h-96 rounded-full bg-purple-200/40 blur-3xl -z-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold bg-white border border-gray-100 shadow-sm text-accent mb-4">
            Estamos para ayudarte
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-text-heading mb-4">Contáctanos</h2>
          <p className="text-text max-w-2xl mx-auto text-lg">
            ¿Tienes dudas, sugerencias o necesitas asesoría técnica? Escríbenos y te responderemos lo más pronto posible.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-custom-md border border-gray-100">
              <h3 className="text-xl font-bold text-text-heading mb-6">Información de contacto</h3>
              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-accent-light text-accent flex items-center justify-center shrink-0">
                    📍
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-text-heading">Ubicación</h4>
                    <p className="text-sm text-text mt-0.5">Calle 100 # 15-20, Bogotá, Colombia</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    📞
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-text-heading">Teléfono / WhatsApp</h4>
                    <p className="text-sm text-text mt-0.5">+57 (300) 123-4567</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                    ✉️
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-text-heading">Correo electrónico</h4>
                    <p className="text-sm text-text mt-0.5">contacto@mitienda.com</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-10 shadow-custom-md border border-gray-100">
            {enviado ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                  ✓
                </div>
                <h3 className="text-2xl font-bold text-text-heading mb-2">¡Mensaje enviado con éxito!</h3>
                <p className="text-text text-sm mb-6">Gracias por comunicarte con nosotros.</p>
                <button
                  type="button"
                  onClick={() => setEnviado(false)}
                  className="px-5 py-2.5 bg-accent text-white rounded-lg hover:bg-accent-dark transition-colors font-medium"
                >
                  Enviar otro mensaje
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5">
                  <div className="mb-5">
                    <label className="block text-sm font-medium text-text-heading mb-1.5">
                      Nombre <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      maxLength={50}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 outline-none"
                    />
                    {touched.nombre && errors.nombre && <p className="text-xs text-red-500 mt-1">{errors.nombre}</p>}
                  </div>
                  <div className="mb-5">
                    <label className="block text-sm font-medium text-text-heading mb-1.5">
                      Correo <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      maxLength={100}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 outline-none"
                    />
                    {touched.email && errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                  </div>
                </div>
                <div className="mb-5">
                  <label className="block text-sm font-medium text-text-heading mb-1.5">
                    Asunto <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="asunto"
                    value={formData.asunto}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    maxLength={100}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 outline-none"
                  />
                  {touched.asunto && errors.asunto && <p className="text-xs text-red-500 mt-1">{errors.asunto}</p>}
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-text-heading mb-1.5">
                    Mensaje <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="mensaje"
                    value={formData.mensaje}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    rows={5}
                    maxLength={500}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 outline-none resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-accent text-white font-medium rounded-lg shadow-md hover:bg-accent-dark transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Enviando...' : 'Enviar mensaje'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function WhatsAppButtonWrapper() {
  const location = useLocation();
  const hideOnRoutes = [
    '/login',
    '/recuperar-contrasena',
  ];
  const shouldHide =
    hideOnRoutes.includes(location.pathname) ||
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/empleado');

  if (shouldHide) return null;

  return (
    <WhatsAppButton
      phone="573001234567"
      message="Hola! Me gustaría obtener más información sobre los productos y servicios de MiTienda."
      label="Chatea con nosotros"
    />
  );
}

function ChatbotWidgetWrapper() {
  const location = useLocation();
  const hideOnRoutes = [
    '/login',
    '/recuperar-contrasena',
  ];
  const shouldHide =
    hideOnRoutes.includes(location.pathname) ||
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/empleado') ||
    location.pathname.startsWith('/cliente');

  if (shouldHide) return null;

  return <ChatbotWidget />;
}

function AppRoutes() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/recuperar-contrasena" element={<RecoverPage />} />

      {/* Rutas Públicas */}
      <Route
        path="/"
        element={
          <PublicLayout>
            <Index />
          </PublicLayout>
        }
      />
      <Route
        path="/quienes-somos"
        element={
          <PublicLayout>
            <About />
          </PublicLayout>
        }
      />
      <Route
        path="/productos"
        element={
          <PublicLayout>
            <Products />
          </PublicLayout>
        }
      />
      <Route
        path="/servicios"
        element={
          <PublicLayout>
            <Services />
          </PublicLayout>
        }
      />
      {/* RUTA DEL CARRITO */}
      <Route
        path="/carrito"
        element={
          <PublicLayout>
            <CartPage />
          </PublicLayout>
        }
      />
      {/* RUTA DE PEDIDO CONFIRMADO */}
      <Route
        path="/pedido-confirmado"
        element={
          <PublicLayout>
            <PedidoConfirmadoPage />
          </PublicLayout>
        }
      />
      <Route
        path="/pedido-exitoso"
        element={
          <PublicLayout>
            <PedidoConfirmadoPage />
          </PublicLayout>
        }
      />
      <Route
        path="/contacto"
        element={
          <PublicLayout>
            <ContactPage />
          </PublicLayout>
        }
      />

      {/* Panel Administrador */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['Administrador']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="pedidos" element={<GestionPedidos titulo="Gestión de Pedidos (Admin)" />} />
        <Route path="ventas" element={<GestionVentas />} />
        <Route path="facturas" element={<GestionFacturas />} />
        <Route path="reportes" element={<ReportesVentas />} />
        <Route path="citas" element={<GestionCitas titulo="Gestión de Citas de Servicios (Admin)" />} />
        <Route path="pqr" element={<GestionPQR />} />
        <Route path="usuarios" element={<AdminUsuarios />} />
        <Route path="productos" element={<AdminProductos />} />
        <Route path="servicios" element={<AdminServicios />} />
        <Route path="perfil" element={<PerfilUsuario backLink="/admin/dashboard" backLabel="← Volver al dashboard" />} />
      </Route>

      {/* Panel Empleado */}
      <Route
        path="/empleado"
        element={
          <ProtectedRoute allowedRoles={['Empleado', 'Administrador']}>
            <EmpleadoLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<EmpleadoDashboard />} />
        <Route path="pedidos" element={<GestionPedidos titulo="Gestión de Pedidos (Empleado)" />} />
        <Route path="ventas" element={<GestionVentas />} />
        <Route path="citas" element={<GestionCitas titulo="Gestión de Citas de Servicios (Empleado)" />} />
        <Route path="productos" element={<EmpleadoProductos />} />
        <Route path="servicios" element={<EmpleadoServicios />} />
        <Route path="perfil" element={<EmpleadoPerfil />} />
      </Route>

      {/* Panel Cliente */}
      <Route
        path="/cliente"
        element={
          <ProtectedRoute allowedRoles={['Cliente', 'Administrador', 'Empleado']}>
            <ClienteLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<ClienteDashboard />} />
        <Route path="perfil" element={<ClientePerfil />} />
        <Route path="compras" element={<ClienteCompras />} />
        <Route path="facturas" element={<GestionFacturas />} />
        <Route path="pqr" element={<ClientePQR />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
      <WhatsAppButtonWrapper />
      <ChatbotWidgetWrapper />
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;

