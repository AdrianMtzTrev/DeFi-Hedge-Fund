#!/bin/bash

# Script de despliegue automatizado para VPS
# DeFi Hedge Fund App con Arbitrum Sepolia

set -e

# Configuración
VPS_HOST="45.137.192.146"
VPS_USER="root"
VPS_PORT="3001"
REMOTE_DIR="/var/www/html"

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     DeFi Hedge Fund App - Deployment Script                   ║"
echo "║     Arbitrum Sepolia Integration                               ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Verificar que estamos en el directorio correcto
if [ ! -d "build" ]; then
    echo -e "${RED}❌ No se encontró el directorio 'build'${NC}"
    echo -e "${YELLOW}Ejecutando build...${NC}"
    npm run build
fi

echo -e "${GREEN}✅ Build directory encontrado${NC}"
echo ""

# Crear archivo tar
echo -e "${YELLOW}📦 Creando archivo de despliegue...${NC}"
tar -czf deploy.tar.gz -C build . 2>/dev/null || {
    echo -e "${RED}❌ Error creando archivo tar${NC}"
    exit 1
}
echo -e "${GREEN}✅ Archivo 'deploy.tar.gz' creado${NC}"
echo ""

# Mostrar instrucciones
echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                 INSTRUCCIONES DE DESPLIEGUE                    ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Opción 1: Subir automáticamente (recomendado)${NC}"
echo ""
echo "Ejecuta este comando desde tu Mac:"
echo -e "${GREEN}scp deploy.tar.gz ${VPS_USER}@${VPS_HOST}:/tmp/ && ssh ${VPS_USER}@${VPS_HOST} 'cd ${REMOTE_DIR} && sudo tar -xzf /tmp/deploy.tar.gz && sudo chown -R www-data:www-data ${REMOTE_DIR} && sudo chmod -R 755 ${REMOTE_DIR}'${NC}"
echo ""
echo -e "${BLUE}Opción 2: Pasos manuales${NC}"
echo ""
echo "1. Conecta a tu VPS:"
echo -e "   ${GREEN}ssh ${VPS_USER}@${VPS_HOST}${NC}"
echo ""
echo "2. Detén el servidor antiguo:"
echo -e "   ${GREEN}pm2 stop all${NC}"
echo "   ${GREEN}# O el comando que uses para detener tu servidor actual${NC}"
echo ""
echo "3. Desde otra terminal en tu Mac, sube el archivo:"
echo -e "   ${GREEN}cd \"/Users/cesargarcia/Desktop/DeFi Hedge Fund App\"${NC}"
echo -e "   ${GREEN}scp deploy.tar.gz ${VPS_USER}@${VPS_HOST}:/tmp/${NC}"
echo ""
echo "4. De vuelta en el VPS, extrae y configura:"
echo -e "   ${GREEN}cd ${REMOTE_DIR}${NC}"
echo -e "   ${GREEN}sudo tar -xzf /tmp/deploy.tar.gz${NC}"
echo -e "   ${GREEN}sudo chown -R www-data:www-data ${REMOTE_DIR}${NC}"
echo -e "   ${GREEN}sudo chmod -R 755 ${REMOTE_DIR}${NC}"
echo ""
echo "5. Configura Nginx (ver DEPLOY_COMPLETE.md para detalles):"
echo ""
echo -e "   ${GREEN}sudo nano /etc/nginx/sites-available/default${NC}"
echo ""
echo "   Copia esta configuración:"
echo ""
cat << 'NGINX_CONFIG'

server {
    listen 3001;
    server_name 45.137.192.146;
    
    root /var/www/html;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    access_log off;
    error_log off;
}

NGINX_CONFIG
echo ""
echo -e "   Luego ejecuta: ${GREEN}sudo nginx -t && sudo systemctl reload nginx${NC}"
echo ""
echo "6. Verifica: http://${VPS_HOST}:${VPS_PORT}/"
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}📋 Información del despliegue:${NC}"
echo ""
echo "   Tamaño del archivo: $(du -h deploy.tar.gz | cut -f1)"
echo "   Destino: ${REMOTE_DIR}"
echo "   URL final: http://${VPS_HOST}:${VPS_PORT}/"
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}¿Necesitas más ayuda? Lee DEPLOY_COMPLETE.md para instrucciones detalladas.${NC}"
echo ""

