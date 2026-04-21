# RG7 Admin VPS Deployment Script
# Usage: .\scripts\deploy.ps1

$VPS_IP = "161.97.145.16"
$VPS_USER = "root"
$REMOTE_PATH = "/var/www/rg7-admin"
$IDENTITY_FILE = "$HOME\.ssh\id_rsa"
$SSH_ID_OPT = if (Test-Path $IDENTITY_FILE) { "-i ""$IDENTITY_FILE""" } else { "" }

Write-Host "`n🚀 Iniciando despliegue para admin.rg7.com.ve...`n" -ForegroundColor Cyan

# 1. Build Local (Frontend)
Write-Host "--- Compilando Frontend (pnpm) ---" -ForegroundColor Cyan
pnpm run build
if ($LASTEXITCODE -ne 0) { 
    Write-Host "Build failed, aborting deployment." -ForegroundColor Red
    exit $LASTEXITCODE 
}

# 2. Bundling
Write-Host "--- Creando paquetes de distribución ---" -ForegroundColor Cyan

# 2.1 Frontend Bundle
Write-Host "  > Empaquetando dist..."
if (Test-Path "frontend-bundle.tar.gz") { Remove-Item "frontend-bundle.tar.gz" }
tar -czf "frontend-bundle.tar.gz" -C "dist" .

# 2.2 Backend Bundle
Write-Host "  > Empaquetando backend..."
if (Test-Path "backend-bundle.tar.gz") { Remove-Item "backend-bundle.tar.gz" }
$staging = New-Item -ItemType Directory -Path "$env:TEMP\rg7-staging" -Force
# Copy-Item -Path "c:\Motocadena\backend\server.js" -Destination $staging # Excluded by user request
Copy-Item -Path "c:\Motocadena\backend\package.json" -Destination $staging
Copy-Item -Path "c:\Motocadena\backend\package-lock.json" -Destination $staging
Copy-Item -Path "c:\Motocadena\backend\src" -Destination $staging -Recurse
if (Test-Path "c:\Motocadena\backend\.env") { Copy-Item -Path "c:\Motocadena\backend\.env" -Destination "$staging\.env" }
tar -czf "backend-bundle.tar.gz" -C $staging .
Remove-Item -Path $staging -Recurse -Force

# 3. Upload
Write-Host "--- Subiendo archivos al VPS ($VPS_IP) ---" -ForegroundColor Cyan
scp $SSH_ID_OPT .\frontend-bundle.tar.gz .\backend-bundle.tar.gz .\deployment\rg7-admin.yaml .\deployment\rg7-admin-nginx.conf "${VPS_USER}@${VPS_IP}:/tmp/"
if ($LASTEXITCODE -ne 0) { Write-Host "Failed to upload files" -ForegroundColor Red; exit 1 }

# 4. Remote commands
Write-Host "--- Ejecutando comandos en el servidor remoto ---" -ForegroundColor Cyan

$bashCmd = @"
set -ex
mkdir -p ${REMOTE_PATH}/dist
mkdir -p ${REMOTE_PATH}/backend

echo "--- Extrayendo Frontend ---"
rm -rf ${REMOTE_PATH}/dist/*
tar -xzf /tmp/frontend-bundle.tar.gz -C ${REMOTE_PATH}/dist

echo "--- Extrayendo Backend ---"
find ${REMOTE_PATH}/backend -maxdepth 1 -not -name "node_modules" -not -name "backend" -not -name "server.js" -exec rm -rf {} + || true
tar -xzf /tmp/backend-bundle.tar.gz -C ${REMOTE_PATH}/backend

echo "--- Actualizando archivos de configuración ---"
cp /tmp/rg7-admin.yaml /root/rg7-admin.yaml
cp /tmp/rg7-admin-nginx.conf /root/rg7-admin-nginx.conf

echo "--- Desplegando Docker Stack ---"
cd /root
docker stack deploy -c rg7-admin.yaml rg7-admin --with-registry-auth

echo "--- Estado del despliegue ---"
docker stack ps rg7-admin --no-trunc

echo "--- Limpieza ---"
rm /tmp/frontend-bundle.tar.gz /tmp/backend-bundle.tar.gz /tmp/rg7-admin.yaml /tmp/rg7-admin-nginx.conf
"@

# Eliminar retornos de carro
$bashCmd = $bashCmd -replace "`r", ""

# Ejecución forzada con salida visible
ssh $SSH_ID_OPT "${VPS_USER}@${VPS_IP}" "bash -c '$bashCmd'"

Write-Host "`n✅ ¡Proceso completado con éxito!" -ForegroundColor Green
Write-Host "URL: https://admin.rg7.com.ve" -ForegroundColor White
Write-Host "API: https://admin.rg7.com.ve/api/agent/stock_snapshot" -ForegroundColor White
