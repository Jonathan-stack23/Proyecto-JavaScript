function Select({
  label,
  name,
  value,
  onChange,
  onBlur,
  options,
  error,
  required = false,
  placeholder = 'Seleccione una opción',
}) {
  return (
    <div className="mb-4 w-full">
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-medium text-text-heading mb-1.5"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          className={`w-full px-4 py-2.5 rounded-lg border transition-all duration-200 outline-none bg-white appearance-none pr-10
            ${error
              ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200'
              : 'border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent-light'
            }
          `}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </div>
      {error && (
        <div className="mt-1.5 flex items-start gap-1 text-xs text-red-500">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}

export default Select
