# 🚀 GUÍA COMPLETA DE DESPLIEGUE - PASO A PASO

## Problema Actual
Tu VPS tiene un proyecto Next.js antiguo corriendo en `http://45.137.192.146:3001/`.
Necesitas reemplazarlo con tu nuevo proyecto DeFi Hedge Fund con Arbitrum Sepolia.

---

## ✅ PREPARACIÓN COMPLETADA
- ✅ Build de producción listo (680 KB)
- ✅ Arbitrum Sepolia configurado
- ✅ Archivos optimizados en `/build`

---

## 🔧 PASO 1: Conectar a tu VPS

### Abre una terminal en tu Mac y ejecuta:

```bash
ssh root@45.137.192.146
```

**Si no tienes acceso SSH:**
1. Genera una clave SSH:
   ```bash
   ssh-keygen -t rsa -b 4096 -C "tu_email@ejemplo.com"
   ```

2. Copia tu clave pública al VPS (desde Contabo):
   - Ve al panel de Contabo
   - Busca la sección de SSH keys
   - Agrega tu clave pública

**O usa las credenciales del panel de Contabo.**

---

## 🔍 PASO 2: Localizar el proyecto Next.js

Una vez conectado al VPS, ejecuta:

```bash
# Ver procesos corriendo
ps aux | grep node

# Ver qué está escuchando en el puerto 3001
sudo netstat -tlnp | grep 3001
# O
sudo ss -tlnp | grep 3001

# Buscar archivos Next.js
find / -name "next.config.js" 2>/dev/null
find / -name "_next" -type d 2>/dev/null | head -5
```

**Toma nota de:**
- La ruta donde está el proyecto actual
- Si está corriendo en PM2, systemd, o directamente con node

---

## 🛑 PASO 3: Detener el servidor antiguo

### Si está en PM2:
```bash
pm2 list
pm2 stop all
pm2 delete all
```

### Si está en systemd:
```bash
sudo systemctl list-units | grep node
# Y luego:
sudo systemctl stop nombre-del-servicio
```

### Si está corriendo directamente:
```bash
# Encuentra el PID del proceso
ps aux | grep node | grep -v grep
# Mata el proceso
kill -9 PID_NUMBER
```

---

## 📦 PASO 4: Hacer backup (opcional pero recomendado)

```bash
# Crea un directorio de backup
sudo mkdir -p /root/backups

# Si encontraste la ruta del proyecto, haz backup
# (Reemplaza /ruta/del/proyecto con la ruta que encontraste)
sudo mv /ruta/del/proyecto /root/backups/proyecto_antiguo_$(date +%Y%m%d)
```

---

## 🌐 PASO 5: Preparar el servidor web

Vamos a usar Nginx para servir tu nueva app. Verifica si Nginx está instalado:

```bash
# Verificar si Nginx está instalado
nginx -v

# Si no está instalado:
sudo apt update
sudo apt install nginx -y

# Iniciar Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

---

## 📤 PASO 6: Subir los archivos nuevos

### Opción A: Desde tu Mac (más fácil)

```bash
# 1. Abre una NUEVA terminal en tu Mac (deja el SSH abierto)
cd "/Users/cesargarcia/Desktop/DeFi Hedge Fund App"

# 2. Crea un archivo tar comprimido
tar -czf deploy.tar.gz -C build .

# 3. Súbelo al VPS
scp deploy.tar.gz root@45.137.192.146:/tmp/

# 4. Vuelve al SSH del VPS y extrae
cd /var/www/html  # O donde quieras servir la app
sudo tar -xzf /tmp/deploy.tar.gz
sudo chown -R www-data:www-data /var/www/html
sudo chmod -R 755 /var/www/html
```

### Opción B: Copiar directamente con SCP

```bash
# Desde tu Mac
cd "/Users/cesargarcia/Desktop/DeFi Hedge Fund App"
scp -r build/* root@45.137.192.146:/var/www/html/
```

---

## ⚙️ PASO 7: Configurar Nginx

En el VPS, crea/edita la configuración de Nginx:

```bash
sudo nano /etc/nginx/sites-available/default
```

Reemplaza todo el contenido con:

```nginx
server {
    listen 3001;
    server_name 45.137.192.146;
    
    root /var/www/html;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache para assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Desactivar logs si no los necesitas
    access_log off;
    error_log off;
}
```

Guarda y cierra (Ctrl+X, luego Y, luego Enter)

```bash
# Verificar que la configuración es válida
sudo nginx -t

# Recargar Nginx
sudo systemctl reload nginx
```

---

## 🔥 PASO 8: Si tienes problemas con Nginx, usa un servidor simple

Si prefieres algo más simple, instala un servidor HTTP básico:

```bash
# Instalar http-server globalmente
sudo npm install -g serve

# Correr en el puerto 3001 (esto corre en background)
nohup serve -s /var/www/html -l 3001 > /var/log/vite-app.log 2>&1 &

# O si tienes PM2:
pm2 serve /var/www/html 3001 --spa
pm2 save
pm2 startup
```

---

## ✅ PASO 9: Verificar

Visita: http://45.137.192.146:3001/

Deberías ver:
- ✅ Dashboard de DeFi Hedge Fund
- ✅ Título "DeFi Hedge Fund"
- ✅ Botón "Connect Wallet"
- ✅ NO debería mostrar "Arbitrum One" (ese era del proyecto antiguo)

---

## 🧪 PASO 10: Probar la conexión con MetaMask

1. Haz clic en "Connect Wallet"
2. MetaMask debería:
   - Mostrar un popup pidiendo agregar Arbitrum Sepolia
   - O cambiar automáticamente a Arbitrum Sepolia
3. Verifica que la conexión funcione

---

## 🆘 TROUBLESHOOTING

### Error 502 Bad Gateway
```bash
# Verifica que Nginx está corriendo
sudo systemctl status nginx

# Ver logs de Nginx
sudo tail -f /var/log/nginx/error.log
```

### Página en blanco
```bash
# Verifica que los archivos están correctos
ls -la /var/www/html/

# Verifica permisos
sudo chown -R www-data:www-data /var/www/html
sudo chmod -R 755 /var/www/html
```

### Puerto 3001 no responde
```bash
# Verifica qué está escuchando en 3001
sudo ss -tlnp | grep 3001

# Verifica firewalls
sudo ufw status
sudo iptables -L -n
```

### Archivos no se suben
```bash
# Prueba con diferentes métodos
# Método 1: SFTP
sftp root@45.137.192.146

# Método 2: Panel de Contabo File Manager
# Ve al panel y usa el gestor de archivos

# Método 3: Usa rsync
rsync -avz build/ root@45.137.192.146:/var/www/html/
```

---

## 🎯 RESUMEN DE COMANDOS RÁPIDOS

```bash
# 1. Conectar
ssh root@45.137.192.146

# 2. Preparar directorio
sudo mkdir -p /var/www/html
cd /var/www/html

# 3. Desde Mac: subir archivos
cd "/Users/cesargarcia/Desktop/DeFi Hedge Fund App"
scp -r build/* root@45.137.192.146:/var/www/html/

# 4. En VPS: ajustar permisos
sudo chown -R www-data:www-data /var/www/html
sudo chmod -R 755 /var/www/html

# 5. Configurar Nginx (ver PASO 7 arriba)

# 6. Verificar
curl http://localhost:3001
```

---

## 📞 NECESITAS AYUDA?

Si algo falla, ejecuta en el VPS y comparte el resultado:

```bash
# Info del sistema
uname -a
nginx -v 2>&1
node -v 2>&1
npm -v 2>&1

# Procesos corriendo
ps aux | grep -E "nginx|node"

# Puerto 3001
sudo ss -tlnp | grep 3001

# Archivos en web root
ls -la /var/www/html/
```

---

## 🎉 RESULTADO FINAL

✅ Tu nueva app estará en: http://45.137.192.146:3001/
✅ Con Arbitrum Sepolia configurado
✅ Listo para conectar wallets
✅ Optimizada para producción

