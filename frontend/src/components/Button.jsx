function Button({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  type = 'button',
  disabled = false,
  fullWidth = false,
  className = '',
}) {
  const baseClasses =
    'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

  const variants = {
    primary:
      'bg-accent text-white hover:bg-accent-dark focus:ring-accent-light shadow-md hover:shadow-lg active:scale-[0.98]',
    secondary:
      'bg-white text-text-heading border border-gray-200 hover:bg-gray-50 focus:ring-gray-200 shadow-sm',
    outline:
      'bg-transparent text-accent border border-accent hover:bg-accent-light focus:ring-accent-light',
    ghost:
      'bg-transparent text-text-heading hover:bg-gray-100 focus:ring-gray-200',
    danger:
      'bg-red-500 text-white hover:bg-red-600 focus:ring-red-200 shadow-md',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3.5 text-base',
  }

  const widthClass = fullWidth ? 'w-full' : ''

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
    >
      {children}
    </button>
  )
}

export default Button
