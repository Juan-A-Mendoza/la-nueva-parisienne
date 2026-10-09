// Automated Test Suite for All Modules Integration in La Nueva Parisienne
const http = require('http');

function post(path, data) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const req = http.request({
      hostname: '127.0.0.1',
      port: 80,
      path: '/la-nueva-parisienne/' + path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve({ raw: body, status: res.statusCode });
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function get(path) {
  return new Promise((resolve, reject) => {
    http.get('http://127.0.0.1/la-nueva-parisienne/' + path, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve({ raw: body, status: res.statusCode });
        }
      });
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('=== TEST 1: Modulo 9 - Configuraciones & Empresa ===');
  const updateEmpresaRes = await post('api/update_empresa.php', {
    nombre: 'La Nueva Parisienne Panadería & Pastelería C.A.',
    rif: 'J-40123456-7',
    direccion: 'Av. Lara con Calle 8, Barquisimeto, Edo. Lara',
    telefono: '(0251) 555-1234',
    modo_tasa: 'auto',
    tasa_manual: 790.50
  });
  console.log('Update Empresa Result:', updateEmpresaRes.success ? 'PASS (MySQL updated)' : updateEmpresaRes);

  const getEmpresaRes = await get('api/get_empresa.php');
  console.log('Get Empresa Result:', getEmpresaRes.empresa ? `PASS (Nombre: ${getEmpresaRes.empresa.nombre}, RIF: ${getEmpresaRes.empresa.rif})` : getEmpresaRes);

  console.log('\n=== TEST 2: Modulo 7 - Personal & RRHH (Guardar Empleado & PIN) ===');
  const testPin = '8899';
  const newStaffRes = await post('api/staff/guardar_empleado.php', {
    nombre: 'Test Operador Caja',
    rol: 'Cajero',
    cedula: 'V-28999888',
    telefono: '0412-1112233',
    salario: 180,
    pin: testPin,
    username: 'test_cajero_' + Date.now()
  });
  const empId = newStaffRes.employee ? newStaffRes.employee.id : newStaffRes.user_id;
  console.log('Guardar Empleado Result:', newStaffRes.success ? `PASS (User ID: ${empId})` : newStaffRes);

  if (empId) {
    const pinRes = await post('api/staff/cambiar_pin.php', {
      user_id: empId,
      nuevo_pin: '9900'
    });
    console.log('Cambiar PIN Result:', pinRes.success ? 'PASS (PIN updated in MySQL)' : pinRes);
  }

  console.log('\n=== TEST 3: Modulo 6 - Proveedores & Compras ===');
  const newSupplierRes = await post('api/suppliers/guardar_proveedor.php', {
    nombre_empresa: 'Molinos del Centro C.A.',
    rif: 'J-30987654-1',
    contacto: 'Sr. Roberto Méndez',
    telefono: '0251-4445566',
    email: 'contacto@molinoscentro.com',
    categoria: 'Harinas y Granos'
  });
  const provId = newSupplierRes.supplier ? newSupplierRes.supplier.id : (newSupplierRes.proveedor_id || 'sup_01');
  console.log('Guardar Proveedor Result:', newSupplierRes.success ? `PASS (Supplier ID: ${provId})` : newSupplierRes);

  const newOrderRes = await post('api/suppliers/crear_orden.php', {
    proveedor_id: provId,
    proveedor_nombre: 'Molinos del Centro C.A.',
    total: 350.00,
    condicion_pago: 'Contado',
    items: [
      { id: 'inv_001', name: 'Harina de Trigo Panadera', quantity: 20, unit: 'kg', unitPrice: 1.20, subtotal: 24.00 }
    ]
  });
  const orderId = newOrderRes.order ? newOrderRes.order.id : newOrderRes.order_id;
  console.log('Crear Orden de Compra Result:', newOrderRes.success ? `PASS (Order ID: ${orderId})` : newOrderRes);

  if (orderId) {
    const receiveOrderRes = await post('api/suppliers/recibir_orden.php', {
      order_id: orderId
    });
    console.log('Recibir Orden Result:', receiveOrderRes.success ? `PASS (${receiveOrderRes.message})` : receiveOrderRes);
  }

  console.log('\n=== TEST 4: Modulo 5 - Inventario & Stock (Ajustes y Mermas) ===');
  const adjustStockRes = await post('api/inventory/adjust_stock.php', {
    productId: 'mat_harina_trigo',
    quantity: 5,
    type: 'add',
    reason: 'Prueba de ajuste automatizado'
  });
  console.log('Ajustar Stock Materia Prima Result:', adjustStockRes.success ? `PASS (Nuevo stock: ${adjustStockRes.newStock})` : adjustStockRes);

  const invListRes = await get('api/inventory/get_inventory.php');
  console.log('Consultar Inventario General Result:', invListRes.success ? `PASS (${invListRes.inventory.length} items encontrados)` : invListRes);

  console.log('\n=== TEST 5: Modulo 3 - POS (Venta y Descuento de Stock en Cascada) ===');
  const saleCode = 'FAC-TEST-' + Date.now().toString().slice(-5);
  const posSaleRes = await post('api/pos/procesar_venta.php', {
    orderNumber: saleCode,
    userId: 'usr_ana',
    subtotal: 5.00,
    tax: 0.80,
    discount: 0.00,
    total: 5.80,
    paymentMethod: 'Efectivo',
    tenderAmount: 10.00,
    changeDue: 4.20,
    bcv_rate: 790.50,
    items: [
      { id: 'prod_baguette_tradicional', name: 'Baguette Tradicional Parisienne', quantity: 2, price: 1.50, subtotal: 3.00 },
      { id: 'prod_croissant_mantequilla', name: 'Croissant Francés de Mantequilla', quantity: 1, price: 2.00, subtotal: 2.00 }
    ]
  });
  console.log('Procesar Venta POS Result:', posSaleRes.success ? `PASS (Venta registrada: ${posSaleRes.sale_id})` : posSaleRes);

  console.log('\n=== TEST 6: Reportes de Ventas & Cierre Z (Arqueo de Caja) ===');
  const todayStr = new Date().toISOString().slice(0, 10);
  const reportSalesRes = await get(`api/reports/ventas_cobros.php?context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=${todayStr}&fecha_hasta=${todayStr}`);
  const totals = reportSalesRes.totals || {};
  console.log('Reporte Ventas & Cobros Result:', reportSalesRes.success ? `PASS (${totals.transacciones || 0} transacciones, Total USD: $${totals.total || 0})` : reportSalesRes);

  const cierreZRes = await post('api/reports/cierre_caja.php', {
    context: 'caja',
    action: 'generate',
    date: todayStr,
    user_id: 'usr_superadmin',
    user_name: 'Super Administrador',
    role_code: 'SUPERADMIN',
    turno: 'Turno Mañana',
    tasa_bcv: 790.50,
    monto_efectivo_real: Number(totals.total || 5.80),
    observaciones: 'Cierre Z verificado por suite de pruebas',
    force: true,
    confirm_empty: true
  });
  console.log('Generar Cierre Z Result:', cierreZRes.success ? `PASS (Codigo: ${cierreZRes.closure?.codigo_reporte}, Netas USD: $${cierreZRes.closure?.ventas_netas})` : cierreZRes);

  console.log('\n=========================================');
  console.log('TODAS LAS PRUEBAS DE INTEGRACIÓN COMPLETADAS');
  console.log('=========================================');
}

runTests().catch(err => {
  console.error('Test suite error:', err);
});
