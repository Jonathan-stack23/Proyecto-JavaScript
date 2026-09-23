import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary capturó un error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-surface-alt">
          <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-custom-lg border border-gray-100 max-w-lg w-full text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-500 mx-auto flex items-center justify-center text-3xl shadow-sm">
              ⚠️
            </div>
            <div>
              <h2 className="text-2xl font-black text-text-heading">Algo no salió como esperábamos</h2>
              <p className="text-sm text-gray-500 mt-2">
                Ocurrió un error inesperado en la interfaz. Puedes volver al inicio o recargar la página.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <a
                href="/"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-accent text-white font-bold text-sm shadow-md hover:bg-accent-dark transition-all"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                </svg>
                Volver al inicio
              </a>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-all"
              >
                Recargar página
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
