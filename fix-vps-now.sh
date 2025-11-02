#!/bin/bash
# Script de reparación rápida para VPS

echo "🔧 Reparando configuración..."

# Este script se ejecutará EN EL VPS
cat > /tmp/fix_nginx.sh << 'FIXSCRIPT'
#!/bin/bash

# Verificar que los archivos estén
echo "1. Verificando archivos..."
ls -la /var/www/html/ | head -5

# Asegurar que Nginx esté configurado para puerto 3001
echo ""
echo "2. Configurando Nginx para puerto 3001..."

# Crear configuración específica para puerto 3001
cat > /etc/nginx/sites-available/defi-app << 'NGINXCONF'
server {
    listen 3001;
    listen [::]:3001;
    server_name 45.137.192.146 _;
    
    root /var/www/html;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

NGINXCONF

# Habilitar el sitio
ln -sf /etc/nginx/sites-available/defi-app /etc/nginx/sites-enabled/defi-app

# Deshabilitar default si interfiere
rm -f /etc/nginx/sites-enabled/default

# Verificar configuración
nginx -t

# Reiniciar Nginx
systemctl restart nginx

# Verificar que está escuchando
echo ""
echo "3. Verificando puerto 3001..."
ss -tlnp | grep 3001

# Probar localmente
echo ""
echo "4. Probando desde el servidor..."
curl -I http://localhost:3001 2>&1 | head -3

echo ""
echo "✅ Listo! Prueba en: http://45.137.192.146:3001/"
FIXSCRIPT

chmod +x /tmp/fix_nginx.sh
/tmp/fix_nginx.sh

