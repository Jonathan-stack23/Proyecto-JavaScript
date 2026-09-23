/**
 * Runner automático para la colección Postman del Quinto Avance
 * Ejecuta todas las peticiones con validación de tests y genera reporte de evidencias.
 * SENA Ficha 3406204 - Quinto Avance
 */
const http = require('http');

const BASE_URL = 'http://127.0.0.1:8000';
let tokenAdmin = '';
let tokenCliente = '';
let radicadoPQR = '';
let pqrId = null;
let facturaId = null;

let passed = 0;
let failed = 0;

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}${path}`);
    const headers = {};
    if (body) {
      headers['Content-Type'] = 'application/json';
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(
      url,
      {
        method,
        headers,
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const buffer = Buffer.concat(chunks);
          const ctype = res.headers['content-type'] || '';
          let data = null;
          if (ctype.includes('application/json')) {
            try {
              data = JSON.parse(buffer.toString('utf-8'));
            } catch (e) {
              data = buffer.toString('utf-8');
            }
          } else {
            data = buffer;
          }
          resolve({ status: res.statusCode, headers: res.headers, data, length: buffer.length });
        });
      }
    );

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passed++;
  } else {
    console.log(`  ❌ [FAIL] ${testName}`);
    failed++;
  }
}

async function run() {
  console.log('\n================================================================');
  console.log('🚀 SUITE DE PRUEBAS POSTMAN - QUINTO AVANCE (FASTAPI + SQL + IA)');
  console.log('SENA Ficha 3406204 | Instructor: Jhan Hader Muñoz');
  console.log('================================================================\n');

  try {
    // 1. Auth Admin
    console.log('📦 01. AUTENTICACIÓN JWT');
    const authAdmin = await request('POST', '/api/auth/login', {
      email: 'admin@mitienda.com',
      password: 'password123',
    });
    assert(authAdmin.status === 200 && authAdmin.data?.token, 'Login Admin retorna JWT válido');
    tokenAdmin = authAdmin.data?.token || '';

    // 2. Auth Cliente
    const authCliente = await request('POST', '/api/auth/login', {
      email: 'cliente@mitienda.com',
      password: 'password123',
    });
    assert(authCliente.status === 200 && authCliente.data?.token, 'Login Cliente retorna JWT válido');
    tokenCliente = authCliente.data?.token || '';

    // 3. Ventas (Req 1, 2, 3)
    console.log('\n📦 02. GESTIÓN COMERCIAL Y VENTAS');
    const regVenta = await request(
      'POST',
      '/api/ventas',
      {
        cliente_nombre: 'Andrés López',
        cliente_documento: '1098765432',
        cliente_email: 'andres.lopez@example.com',
        cliente_telefono: '3157778899',
        direccion_entrega: 'Calle 26 # 68-10',
        ciudad: 'Bogotá',
        metodo_pago: 'transferencia',
        descuento: 2000,
        notas: 'Venta de prueba suite',
        items: [
          {
            tipo_item: 'producto',
            producto_id: 1,
            nombre_item: 'Mouse Ergonómico',
            precio_unitario: 95000,
            cantidad: 1,
            descuento: 0,
          },
          {
            tipo_item: 'servicio',
            servicio_id: 1,
            nombre_item: 'Diagnóstico de Hardware',
            precio_unitario: 45000,
            cantidad: 1,
            descuento: 0,
          },
        ],
      },
      tokenAdmin
    );
    assert(regVenta.status === 201 && regVenta.data?.venta?.numero_venta, 'POST /api/ventas registra venta y genera factura');

    const histVentas = await request('GET', '/api/ventas?estado=completada', null, tokenAdmin);
    assert(histVentas.status === 200 && Array.isArray(histVentas.data?.ventas), 'GET /api/ventas consulta historial con filtros');

    // 4. Facturación (Req 7, 8, 9)
    console.log('\n📦 03. MÓDULO DE FACTURACIÓN');
    const facturasList = await request('GET', '/api/facturas', null, tokenAdmin);
    assert(facturasList.status === 200 && Array.isArray(facturasList.data?.facturas), 'GET /api/facturas lista facturas emitidas');
    if (facturasList.data?.facturas?.length > 0) {
      facturaId = facturasList.data.facturas[0].id;
    }

    if (facturaId) {
      const facturaPdf = await request('GET', `/api/facturas/${facturaId}/pdf`, null, tokenAdmin);
      assert(
        facturaPdf.status === 200 &&
          (facturaPdf.headers['content-type'] || '').includes('application/pdf') &&
          facturaPdf.length > 500,
        `GET /api/facturas/${facturaId}/pdf descarga documento PDF comercial válido (${facturaPdf.length} bytes)`
      );
    }

    // 5. Reportes (Req 4, 5, 6)
    console.log('\n📦 04. REPORTES DIARIOS DE VENTAS (PDF & EXCEL)');
    const repDiario = await request('GET', '/api/reportes/ventas/diario', null, tokenAdmin);
    assert(repDiario.status === 200 && repDiario.data?.reporte?.total_general !== undefined, 'GET /api/reportes/ventas/diario consolida totales del día');

    const repPdf = await request('GET', '/api/reportes/ventas/pdf', null, tokenAdmin);
    assert(
      repPdf.status === 200 && (repPdf.headers['content-type'] || '').includes('application/pdf') && repPdf.length > 500,
      `GET /api/reportes/ventas/pdf genera reporte institucional en PDF (${repPdf.length} bytes)`
    );

    const repExcel = await request('GET', '/api/reportes/ventas/excel', null, tokenAdmin);
    const ctypeExcel = repExcel.headers['content-type'] || '';
    assert(
      repExcel.status === 200 &&
        (ctypeExcel.includes('spreadsheetml') || ctypeExcel.includes('octet-stream')) &&
        repExcel.length > 500,
      `GET /api/reportes/ventas/excel genera archivo .xlsx con formato contable (${repExcel.length} bytes)`
    );

    // 6. Dashboards (Req 10, 11, 12, 13, 15)
    console.log('\n📦 05. DASHBOARDS ANALÍTICOS DIFERENCIADOS POR ROL');
    const statsAdmin = await request('GET', '/api/dashboard/stats', null, tokenAdmin);
    assert(
      statsAdmin.status === 200 &&
        statsAdmin.data?.stats?.total_ventas !== undefined &&
        statsAdmin.data?.stats?.facturacion_total !== undefined,
      'GET /api/dashboard/stats retorna KPIs de administración (Ventas, Facturación, Usuarios, PQR)'
    );

    const chartsData = await request('GET', '/api/dashboard/charts?dias=14', null, tokenAdmin);
    assert(
      chartsData.status === 200 &&
        Array.isArray(chartsData.data?.ventas_por_periodo) &&
        Array.isArray(chartsData.data?.ingresos_acumulados),
      'GET /api/dashboard/charts retorna series temporales para gráficos de barras y líneas'
    );

    const statsCliente = await request('GET', '/api/dashboard/stats', null, tokenCliente);
    assert(
      statsCliente.status === 200 && statsCliente.data?.rol === 'Cliente' && statsCliente.data?.stats?.total_compras !== undefined,
      'GET /api/dashboard/stats discrimina rol y retorna métricas personales del Cliente'
    );

    // 7. PQR (Req 16)
    console.log('\n📦 06. MÓDULO DE PQR');
    const radicarPqr = await request('POST', '/api/pqr', {
      cliente_nombre: 'Mariana Duarte',
      cliente_email: 'mariana.duarte@example.com',
      cliente_telefono: '3124445566',
      tipo: 'peticion',
      asunto: 'Solicitud de certificado de garantía',
      descripcion: 'Requiero copia del certificado de garantía de mi producto adquirido.',
      prioridad: 'baja',
    });
    assert(
      radicarPqr.status === 201 && radicarPqr.data?.pqr?.numero_radicado?.startsWith('PQR-'),
      `POST /api/pqr radica solicitud y asigna radicado único: ${radicarPqr.data?.pqr?.numero_radicado}`
    );
    radicadoPQR = radicarPqr.data?.pqr?.numero_radicado || '';
    pqrId = radicarPqr.data?.pqr?.id || null;

    if (radicadoPQR) {
      const pqrCheck = await request('GET', `/api/pqr/radicado/${radicadoPQR}`);
      assert(pqrCheck.status === 200 && pqrCheck.data?.pqr?.numero_radicado === radicadoPQR, 'GET /api/pqr/radicado/{num} consulta pública por radicado');
    }

    if (pqrId) {
      const pqrResp = await request(
        'PATCH',
        `/api/pqr/${pqrId}/responder`,
        {
          respuesta: 'Estimada Mariana, hemos adjuntado tu certificado a tu correo.',
          estado: 'respondida',
        },
        tokenAdmin
      );
      assert(pqrResp.status === 200 && pqrResp.data?.pqr?.estado === 'respondida', 'PATCH /api/pqr/{id}/responder registra respuesta oficial y cambia estado');
    }

    // 8. Chatbot con IA (Req 17, 18)
    console.log('\n📦 07. CHATBOT CON INTELIGENCIA ARTIFICIAL');
    const botCatalogo = await request('POST', '/api/chatbot/message', {
      message: '¿Qué productos y servicios técnicos ofrecen?',
      session_id: 'test-runner-session',
    });
    assert(botCatalogo.status === 200 && botCatalogo.data?.reply?.length > 20, 'POST /api/chatbot/message atiende consultas con contexto de catálogo e IA');

    if (radicadoPQR) {
      const botPqr = await request('POST', '/api/chatbot/message', {
        message: `Quiero consultar mi radicado ${radicadoPQR}`,
        session_id: 'test-runner-session-2',
      });
      assert(botPqr.status === 200 && botPqr.data?.reply?.includes(radicadoPQR), 'POST /api/chatbot/message consulta estado de PQR por radicado dentro del chat');
    }

    console.log('\n================================================================');
    console.log(`📊 RESULTADOS FINALES: ${passed} PASADAS | ${failed} FALLIDAS`);
    console.log('================================================================\n');

    if (failed === 0) {
      console.log('🎉 TODOS LOS ENDPOINTS DEL QUINTO AVANCE OPERAN CON ÉXITO AL 100%!');
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error('Error ejecutando la suite:', err);
    process.exit(1);
  }
}

run();
