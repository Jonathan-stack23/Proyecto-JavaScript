import pool from '../config/db.js';

/**
 * Crea un nuevo pedido con sus items correspondientes en una transacción MySQL
 */
export const createPedido = async (req, res) => {
  let conn;
  try {
    const {
      cliente_nombre,
      cliente_email,
      cliente_telefono,
      direccion_envio,
      ciudad = 'Bogotá',
      metodo_pago,
      notas = '',
      items = [],
    } = req.body;

    if (!cliente_nombre || !cliente_email || !cliente_telefono || !direccion_envio || !metodo_pago) {
      return res.status(400).json({
        ok: false,
        message: 'Todos los campos de contacto, dirección y método de pago son obligatorios.',
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        ok: false,
        message: 'El carrito no contiene productos.',
      });
    }

    let subtotal = 0;
    const itemsValidados = items.map((it) => {
      const precioUnit = parseFloat(it.precio_unitario || it.precio || 0);
      const cantidad = parseInt(it.cantidad || 1, 10);
      const itemSubtotal = precioUnit * cantidad;
      subtotal += itemSubtotal;
      return {
        producto_id: it.producto_id || it.id || null,
        nombre_producto: it.nombre_producto || it.nombre || 'Producto',
        precio_unitario: precioUnit,
        cantidad,
        subtotal: itemSubtotal,
        imagen_url: it.imagen_url || it.imagen || null,
      };
    });

    const envio = 0.0;
    const total = subtotal + envio;

    // Vincular automáticamente usuario_id del token o por coincidencia de email registrado
    let usuario_id = req.user ? req.user.id : null;
    if (!usuario_id && cliente_email) {
      try {
        const [uRows] = await pool.query('SELECT id FROM usuarios WHERE LOWER(email) = LOWER(?)', [
          cliente_email.trim(),
        ]);
        if (uRows.length > 0) {
          usuario_id = uRows[0].id;
        }
      } catch {}
    }

    conn = await pool.getConnection();
    await conn.beginTransaction();

    const [resultPedido] = await conn.query(
      `INSERT INTO pedidos (
        usuario_id, cliente_nombre, cliente_email, cliente_telefono,
        direccion_envio, ciudad, metodo_pago, notas, subtotal, envio, total, estado
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'en revision')`,
      [
        usuario_id,
        cliente_nombre.trim(),
        cliente_email.trim(),
        cliente_telefono.trim(),
        direccion_envio.trim(),
        ciudad.trim(),
        metodo_pago,
        notas ? notas.trim() : '',
        subtotal,
        envio,
        total,
      ]
    );

    const pedidoId = resultPedido.insertId;

    for (const it of itemsValidados) {
      // Verificar si el producto_id existe en la BD para evitar error de Foreign Key
      let prodIdParaInsertar = null;
      if (it.producto_id) {
        const [pExiste] = await conn.query('SELECT id FROM productos WHERE id = ?', [it.producto_id]);
        if (pExiste.length > 0) {
          prodIdParaInsertar = it.producto_id;
        }
      }

      await conn.query(
        `INSERT INTO pedido_items (
          pedido_id, producto_id, nombre_producto, precio_unitario, cantidad, subtotal, imagen_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          pedidoId,
          prodIdParaInsertar,
          it.nombre_producto,
          it.precio_unitario,
          it.cantidad,
          it.subtotal,
          it.imagen_url ? String(it.imagen_url).slice(0, 255) : null,
        ]
      );

      // Descontar stock si existe el producto
      if (prodIdParaInsertar) {
        await conn.query(
          'UPDATE productos SET stock = GREATEST(0, stock - ?) WHERE id = ?',
          [it.cantidad, prodIdParaInsertar]
        );
      }
    }

    await conn.commit();

    return res.status(201).json({
      ok: true,
      message: '¡Pedido realizado exitosamente!',
      pedido: {
        id: pedidoId,
        cliente_nombre,
        cliente_email,
        total,
        subtotal,
        estado: 'en revision',
        metodo_pago,
        itemsCount: itemsValidados.length,
      },
    });
  } catch (error) {
    if (conn) await conn.rollback();
    console.error('Error createPedido:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al procesar el pedido. Inténtalo de nuevo.',
    });
  } finally {
    if (conn) conn.release();
  }
};

/**
 * Obtener todos los pedidos (Para Empleado y Administrador)
 */
export const getPedidos = async (req, res) => {
  try {
    const { estado, q } = req.query;
    let sql = 'SELECT * FROM pedidos';
    const whereConditions = [];
    const params = [];

    if (estado && estado !== 'todos') {
      whereConditions.push('estado = ?');
      params.push(estado);
    }

    if (q) {
      whereConditions.push('(cliente_nombre LIKE ? OR cliente_email LIKE ? OR id = ?)');
      params.push(`%${q}%`, `%${q}%`, isNaN(Number(q)) ? -1 : Number(q));
    }

    if (whereConditions.length > 0) {
      sql += ' WHERE ' + whereConditions.join(' AND ');
    }

    sql += ' ORDER BY created_at DESC';

    const [pedidos] = await pool.query(sql, params);

    if (pedidos.length === 0) {
      return res.status(200).json({
        ok: true,
        total: 0,
        pedidos: [],
      });
    }

    const pedidoIds = pedidos.map((p) => p.id);
    const [items] = await pool.query(
      'SELECT * FROM pedido_items WHERE pedido_id IN (?)',
      [pedidoIds]
    );

    const itemsByPedido = {};
    for (const it of items) {
      if (!itemsByPedido[it.pedido_id]) itemsByPedido[it.pedido_id] = [];
      itemsByPedido[it.pedido_id].push(it);
    }

    const pedidosConItems = pedidos.map((p) => ({
      ...p,
      total_items: itemsByPedido[p.id]?.length || 0,
      items: itemsByPedido[p.id] || [],
    }));

    return res.status(200).json({
      ok: true,
      total: pedidosConItems.length,
      pedidos: pedidosConItems,
    });
  } catch (error) {
    console.error('Error getPedidos:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al obtener la lista de pedidos.',
    });
  }
};

/**
 * Obtener pedidos del cliente autenticado
 */
export const getMisPedidos = async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;

    const [pedidos] = await pool.query(
      'SELECT * FROM pedidos WHERE usuario_id = ? OR LOWER(cliente_email) = LOWER(?) ORDER BY created_at DESC',
      [userId, userEmail]
    );

    if (pedidos.length === 0) {
      return res.status(200).json({
        ok: true,
        total: 0,
        pedidos: [],
      });
    }

    const pedidoIds = pedidos.map((p) => p.id);
    const [items] = await pool.query(
      'SELECT * FROM pedido_items WHERE pedido_id IN (?)',
      [pedidoIds]
    );

    const itemsByPedido = {};
    for (const it of items) {
      if (!itemsByPedido[it.pedido_id]) itemsByPedido[it.pedido_id] = [];
      itemsByPedido[it.pedido_id].push(it);
    }

    const pedidosConItems = pedidos.map((p) => ({
      ...p,
      total_items: itemsByPedido[p.id]?.length || 0,
      items: itemsByPedido[p.id] || [],
    }));

    return res.status(200).json({
      ok: true,
      total: pedidosConItems.length,
      pedidos: pedidosConItems,
    });
  } catch (error) {
    console.error('Error getMisPedidos:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al obtener tus pedidos.',
    });
  }
};

/**
 * Obtener detalle de un pedido por ID
 */
export const getPedidoById = async (req, res) => {
  try {
    const { id } = req.params;
    const [pedidos] = await pool.query('SELECT * FROM pedidos WHERE id = ?', [id]);

    if (pedidos.length === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Pedido no encontrado.',
      });
    }

    const [items] = await pool.query('SELECT * FROM pedido_items WHERE pedido_id = ?', [id]);

    return res.status(200).json({
      ok: true,
      pedido: {
        ...pedidos[0],
        items,
      },
    });
  } catch (error) {
    console.error('Error getPedidoById:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al obtener el detalle del pedido.',
    });
  }
};

/**
 * Actualizar el estado de un pedido (en revision, revisado, hecho, cancelado)
 */
export const updateEstadoPedido = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const estadosValidos = ['en revision', 'revisado', 'hecho', 'cancelado'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({
        ok: false,
        message: `Estado inválido. Debe ser uno de: ${estadosValidos.join(', ')}`,
      });
    }

    const [result] = await pool.query(
      'UPDATE pedidos SET estado = ? WHERE id = ?',
      [estado, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Pedido no encontrado.',
      });
    }

    return res.status(200).json({
      ok: true,
      message: `Estado del pedido #${id} actualizado a "${estado}".`,
      estado,
    });
  } catch (error) {
    console.error('Error updateEstadoPedido:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al actualizar el estado del pedido.',
    });
  }
};
