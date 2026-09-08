function WhatsAppButton({
  phone = '573001234567',
  message = 'Hola, estoy interesado en sus productos y servicios.',
  label = 'Contactar por WhatsApp',
}) {
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className="fixed z-50 bottom-5 right-5 md:bottom-8 md:right-8 group"
    >
      <div className="relative">
        <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-40" />
        <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-green-400 to-green-600 shadow-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-green-500/40">
          <svg
            className="w-7 h-7 md:w-8 md:h-8 text-white"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </div>
      </div>
      <span className="absolute top-1/2 -translate-y-1/2 right-full mr-3 px-3 py-1.5 bg-white text-gray-700 text-xs font-medium rounded-lg shadow-md border border-gray-100 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none hidden md:block">
        {label}
      </span>
    </a>
  );
}

export default WhatsAppButton;
