const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Colores para consola
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m"
};

console.log(`${colors.cyan}========================================`);
console.log(`🔎 AUTOAPPLY DIAGNOSTIC TOOL`);
console.log(`========================================${colors.reset}`);

async function runDiagnostics() {
  // 1. Verificar Estructura de Archivos
  console.log(`\n${colors.yellow}[1] Verificando Sistema de Archivos...${colors.reset}`);
  const requiredFiles = [
    'backend/server.js',
    'backend/database/db.js',
    'backend/routes/upload.js',
    'backend/routes/profile.js',
    'web-dashboard/index.html',
    'web-dashboard/js/app.js'
  ];

  let missingFiles = 0;
  for (const file of requiredFiles) {
    if (fs.existsSync(file)) {
      console.log(`  ✅ ${file} existe`);
    } else {
      console.log(`  ❌ ${file} NO EXISTE`);
      missingFiles++;
    }
  }

  if (missingFiles > 0) {
    console.error(`${colors.red}FATAL: Faltan archivos críticos. Abortando.${colors.reset}`);
    return;
  }

  // 2. Iniciar Servidor Backend en Segundo Plano
  console.log(`\n${colors.yellow}[2] Iniciando Servidor Backend de Prueba...${colors.reset}`);
  const env = { ...process.env, PORT: 3001, GCS_BUCKET_NAME: '' }; // Puerto 3001 para no chocar, sin GCS para ir ràpido
  
  const server = spawn('node', ['backend/server.js'], { env });
  
  let serverReady = false;
  
  server.stdout.on('data', (data) => {
    // console.log(`Config server: ${data}`);
    if (data.toString().includes('running on')) {
      serverReady = true;
    }
  });

  server.stderr.on('data', (data) => {
    console.error(`Server Error: ${data}`);
  });

  // Esperar a que el servidor arranque
  console.log("  ⏳ Esperando arranque del servidor...");
  await new Promise(r => setTimeout(r, 5000));

  if (!serverReady) {
     console.log(`${colors.red}  ⚠️  El servidor parece no haber reportado "running" en stdout, pero seguiremos intentando conectar.${colors.reset}`);
  } else {
     console.log(`${colors.green}  ✅ Servidor iniciado en puerto 3001${colors.reset}`);
  }

  const API = 'http://localhost:3001/api';

  try {
    // 3. Test Health Check
    console.log(`\n${colors.yellow}[3] Testing Health Check (/api/health)...${colors.reset}`);
    const health = await fetch(`${API}/health`).then(r => r.json());
    if (health.status === 'ok') {
        console.log(`${colors.green}  ✅ Health Check OK${colors.reset}`);
    } else {
        throw new Error('Health Check failed');
    }

    // 4. Test Profile Save (Mock)
    console.log(`\n${colors.yellow}[4] Testing Profile Save (/api/profile)...${colors.reset}`);
    const mockProfile = {
        personalInfo: { firstName: "Test", lastName: "User", email: "test@test.com" },
        experience: [],
        education: []
    };
    
    const saveRes = await fetch(`${API}/profile`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(mockProfile)
    });
    
    const saveJson = await saveRes.json();
    if (saveJson.success) {
        console.log(`${colors.green}  ✅ Guardado de Perfil OK${colors.reset}`);
    } else {
        console.error(`${colors.red}  ❌ Falló Guardado de Perfil: ${JSON.stringify(saveJson)}${colors.reset}`);
    }
    
    // 5. Test Profile Get
    console.log(`\n${colors.yellow}[5] Testing Profile Retrieval (/api/profile)...${colors.reset}`);
    const getRes = await fetch(`${API}/profile`);
    const getJson = await getRes.json();
    
    if (getJson.personalInfo && getJson.personalInfo.email === "test@test.com") {
        console.log(`${colors.green}  ✅ Recuperación de Perfil OK${colors.reset}`);
    } else {
        console.error(`${colors.red}  ❌ Datos incorrectos o no encontrados${colors.reset}`);
    }

  } catch (error) {
      console.error(`${colors.red}❌ ERROR FATAL DURANTE TESTS:${colors.reset}`, error.message);
  } finally {
      // Limpiar
      console.log(`\n${colors.yellow}[6] Cerrando servidor...${colors.reset}`);
      server.kill();
  }
}

runDiagnostics();
