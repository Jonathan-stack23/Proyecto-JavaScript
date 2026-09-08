const soloLetras = (s) => /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(s);
const soloNumeros = (s) => /^[0-9]+$/.test(s);
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const validarCamposUsuario = (body, modo = 'create') => {
  const errors = {};
  const { nombre, apellido, tipoDocumento, tipo_documento, numeroDocumento, numero_documento, direccion, telefono, email, password } = body;

  const tipoDoc = tipoDocumento || tipo_documento;
  const numDoc = numeroDocumento || numero_documento;

  if (modo === 'create' || nombre !== undefined) {
    if (!nombre || !String(nombre).trim()) errors.nombre = 'El nombre es obligatorio';
    else if (String(nombre).trim().length < 2) errors.nombre = 'El nombre debe tener al menos 2 caracteres';
    else if (String(nombre).length > 50) errors.nombre = 'El nombre no puede exceder 50 caracteres';
    else if (!soloLetras(String(nombre).trim())) errors.nombre = 'El nombre solo puede contener letras y espacios';
  }

  if (modo === 'create' || apellido !== undefined) {
    if (!apellido || !String(apellido).trim()) errors.apellido = 'El apellido es obligatorio';
    else if (String(apellido).trim().length < 2) errors.apellido = 'El apellido debe tener al menos 2 caracteres';
    else if (String(apellido).length > 50) errors.apellido = 'El apellido no puede exceder 50 caracteres';
    else if (!soloLetras(String(apellido).trim())) errors.apellido = 'El apellido solo puede contener letras y espacios';
  }

  if (modo === 'create' || tipoDoc !== undefined) {
    if (!tipoDoc) errors[modo === 'create' ? 'tipoDocumento' : 'tipo_documento'] = 'Selecciona un tipo de documento';
  }

  if (modo === 'create' || numDoc !== undefined) {
    const field = modo === 'create' ? 'numeroDocumento' : 'numero_documento';
    if (!numDoc || !String(numDoc).trim()) errors[field] = 'El número de documento es obligatorio';
    else if (!soloNumeros(String(numDoc))) errors[field] = 'El documento solo puede contener números';
    else if (String(numDoc).length < 5) errors[field] = 'El documento debe tener al menos 5 dígitos';
    else if (String(numDoc).length > 15) errors[field] = 'El documento no puede exceder 15 dígitos';
  }

  if (modo === 'create' || direccion !== undefined) {
    if (!direccion || !String(direccion).trim()) errors.direccion = 'La dirección es obligatoria';
    else if (String(direccion).trim().length < 5) errors.direccion = 'La dirección debe tener al menos 5 caracteres';
    else if (String(direccion).length > 100) errors.direccion = 'La dirección no puede exceder 100 caracteres';
  }

  if (modo === 'create' || telefono !== undefined) {
    if (!telefono || !String(telefono).trim()) errors.telefono = 'El teléfono es obligatorio';
    else {
      const clean = String(telefono).replace(/[\s\-+]/g, '');
      if (!soloNumeros(clean)) errors.telefono = 'El teléfono solo puede contener números';
      else if (clean.length < 7) errors.telefono = 'El teléfono debe tener al menos 7 dígitos';
      else if (clean.length > 15) errors.telefono = 'El teléfono no puede exceder 15 dígitos';
    }
  }

  if (modo === 'create' || email !== undefined) {
    if (!email || !String(email).trim()) errors.email = 'El correo electrónico es obligatorio';
    else if (!emailRegex.test(String(email).trim())) errors.email = 'Ingresa un correo electrónico válido';
    else if (String(email).length > 100) errors.email = 'El correo no puede exceder 100 caracteres';
  }

  if (modo === 'create' || password) {
    if (!password) errors.password = modo === 'create' ? 'La contraseña es obligatoria' : 'La contraseña no puede estar vacía';
    else if (String(password).length < 8) errors.password = 'La contraseña debe tener al menos 8 caracteres';
    else if (String(password).length > 50) errors.password = 'La contraseña no puede exceder 50 caracteres';
    else if (!/[A-Z]/.test(String(password))) errors.password = 'La contraseña debe tener al menos una letra mayúscula';
    else if (!/[a-z]/.test(String(password))) errors.password = 'La contraseña debe tener al menos una letra minúscula';
    else if (!/[0-9]/.test(String(password))) errors.password = 'La contraseña debe tener al menos un número';
  }

  return errors;
};

export const validateRegister = (req, res, next) => {
  const errors = validarCamposUsuario(req.body, 'create');
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ ok: false, message: 'Errores de validación', errors });
  }
  next();
};

export const validateCreateUsuario = (req, res, next) => {
  const errors = validarCamposUsuario(req.body, 'create');
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ ok: false, message: 'Errores de validación', errors });
  }
  next();
};

export const validateUpdateUsuario = (req, res, next) => {
  const errors = validarCamposUsuario(req.body, 'update');
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ ok: false, message: 'Errores de validación', errors });
  }
  next();
};

export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = {};
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!email || !email.trim()) errors.email = 'El correo electrónico es obligatorio';
  else if (!emailRegex.test(email)) errors.email = 'Ingresa un correo electrónico válido';

  if (!password) errors.password = 'La contraseña es obligatoria';
  else if (password.length < 6) errors.password = 'La contraseña debe tener al menos 6 caracteres';

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      ok: false,
      message: 'Errores de validación',
      errors,
    });
  }
  next();
};
