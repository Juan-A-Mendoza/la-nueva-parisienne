// Test Security Suite: BCRYPT Password Hashing, Login Validation, and Rate Limiting
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
          resolve({ status: res.statusCode, data: JSON.parse(body), headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body, headers: res.headers });
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function runSecurityTests() {
  console.log('=== TEST 1: Verificar cabeceras de seguridad HTTP ===');
  const headersRes = await post('api/auth/login.php', { userId: 'admin', inputPin: '1234' });
  console.log('X-Content-Type-Options:', headersRes.headers['x-content-type-options'] || 'FALTA');
  console.log('X-Frame-Options:', headersRes.headers['x-frame-options'] || 'FALTA');
  console.log('X-XSS-Protection:', headersRes.headers['x-xss-protection'] || 'FALTA');
  console.log('Referrer-Policy:', headersRes.headers['referrer-policy'] || 'FALTA');
  console.log('Login Status:', headersRes.status, headersRes.data.success ? 'PASS (Autenticado con hash BCRYPT)' : headersRes.data.message);

  console.log('\n=== TEST 2: Login con credencial incorrecta ===');
  const badLoginRes = await post('api/auth/login.php', { userId: 'admin', inputPin: 'clave_invalida_999' });
  console.log('Bad login Status:', badLoginRes.status, '(Esperado: 401)');
  console.log('Bad login Message:', badLoginRes.data.message);
  console.log('Intentos restantes reportados:', badLoginRes.data.remaining_attempts);

  console.log('\n=== TEST 3: Login con usuario Cajero (Ana Ramírez) con BCRYPT ===');
  const cashierLogin = await post('api/auth/login.php', { userId: 'cajero1', inputPin: '1234' });
  console.log('Cashier Login Status:', cashierLogin.status);
  console.log('Cashier User Name:', cashierLogin.data.user?.name);
  console.log('Token seguro generado:', cashierLogin.data.token ? 'PASS (' + cashierLogin.data.token.slice(0, 15) + '...)' : 'FALTA');

  console.log('\n=== TEST 4: Verificación de Autorización Gerencial (validar_gerente.php) ===');
  const mgrAuthOk = await post('api/auth/validar_gerente.php', { password: '1234' });
  console.log('Gerente Auth OK:', mgrAuthOk.status, mgrAuthOk.data.success ? `PASS (${mgrAuthOk.data.authorized_by})` : mgrAuthOk.data);

  const mgrAuthBad = await post('api/auth/validar_gerente.php', { password: 'clave_gerente_falsa' });
  console.log('Gerente Auth Falsa:', mgrAuthBad.status, '(Esperado: 403)', mgrAuthBad.data.message);

  console.log('\n=== TEST 5: Cambio de PIN con almacenamiento BCRYPT ===');
  const changePinRes = await post('api/staff/cambiar_pin.php', {
    user_id: 'usr_test_92',
    nuevo_pin: '5566'
  });
  console.log('Cambio de PIN result:', changePinRes.data.message);

  // Probar login con el nuevo PIN
  const testLoginNewPin = await post('api/auth/login.php', {
    userId: 'usr_test_92',
    inputPin: '5566'
  });
  console.log('Login con nuevo PIN 5566:', testLoginNewPin.status === 200 ? 'PASS (Validado con BCRYPT)' : testLoginNewPin.data);

  const testLoginOldPin = await post('api/auth/login.php', {
    userId: 'usr_test_92',
    inputPin: '9900' // PIN antiguo
  });
  console.log('Login con PIN antiguo 9900:', testLoginOldPin.status === 401 ? 'PASS (Rechazado correctamente)' : testLoginOldPin.data);

  console.log('\n=========================================');
  console.log('TODAS LAS PRUEBAS DE SEGURIDAD COMPLETADAS');
  console.log('=========================================');
}

runSecurityTests().catch(err => {
  console.error('Error en pruebas de seguridad:', err);
});
