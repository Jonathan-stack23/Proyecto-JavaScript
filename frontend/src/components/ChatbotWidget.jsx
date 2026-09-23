import { useMemo, useState } from 'react';
import api from '../services/api';

const initialMessages = [
  {
    id: 1,
    from: 'bot',
    text: '¡Hola! Soy TiendaBot. Puedo ayudarte con productos, servicios, facturas, envíos y PQR.',
  },
];

function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState(initialMessages);

  const quickActions = useMemo(
    () => ['Ver productos', 'Servicios técnicos', 'Consultar PQR', 'Métodos de pago'],
    []
  );

  const sendMessage = async (text = input) => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;

    setMessages((prev) => [
      ...prev,
      { id: Date.now(), from: 'user', text: trimmed },
    ]);
    setInput('');
    setIsSending(true);

    try {
      const response = await api.post('/chatbot/message', { message: trimmed, session_id: 'frontend-widget' });
      const reply = response.data?.reply || 'No pude responder en este momento.';
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, from: 'bot', text: reply },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 2,
          from: 'bot',
          text: 'No pude contactar al chatbot en este momento, pero puedes revisar el catálogo o radicar una PQR desde la tienda.',
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed bottom-24 right-5 md:bottom-28 md:right-8 z-50">
      {open ? (
        <div className="w-[360px] max-w-[92vw] rounded-3xl border border-gray-200 bg-white shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 text-white">
            <div>
              <p className="font-bold">TiendaBot</p>
              <p className="text-[10px] text-violet-100">Asistente virtual</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="text-xl font-bold">×</button>
          </div>

          <div className="h-72 overflow-y-auto bg-slate-50 p-3 space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${msg.from === 'user' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 border border-slate-200'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-slate-200 bg-white">
            <div className="flex flex-wrap gap-2 mb-3">
              {quickActions.map((action) => (
                <button
                  key={action}
                  type="button"
                  onClick={() => sendMessage(action)}
                  className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11px] text-indigo-700 hover:bg-indigo-100"
                >
                  {action}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Escribe tu consulta..."
                className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
              <button
                type="button"
                onClick={() => sendMessage()}
                disabled={isSending}
                className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {isSending ? '...' : 'Enviar'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-3 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg hover:scale-[1.02]"
        >
          <span className="text-lg">💬</span>
          Chatbot
        </button>
      )}
    </div>
  );
}

export default ChatbotWidget;
