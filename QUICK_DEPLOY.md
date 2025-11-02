# 🚀 Despliegue Rápido - DeFi Hedge Fund App

## ✅ Lo que ya está listo
- ✅ Build completado exitosamente
- ✅ Configuración de Arbitrum Sepolia implementada
- ✅ Archivos optimizados en `/build`

## 📦 Tu VPS
- **IP:** `45.137.192.146`
- **Puerto:** `3001`
- **URL:** http://45.137.192.146:3001/

## ⚡ Método Rápido (3 pasos)

### Si ya tienes SSH configurado:

```bash
# 1. Sube los archivos
cd "/Users/cesargarcia/Desktop/DeFi Hedge Fund App"
scp -r build/* root@45.137.192.146:/var/www/html/

# 2. En el VPS, ajusta permisos (si es necesario)
ssh root@45.137.192.146
sudo chown -R www-data:www-data /var/www/html
sudo chmod -R 755 /var/www/html
exit

# 3. Listo! Visita la URL
```

### Si usas panel de Contabo:

```bash
# 1. Crea un archivo tar
cd "/Users/cesargarcia/Desktop/DeFi Hedge Fund App"
tar -czf deploy.tar.gz -C build .

# 2. Sube deploy.tar.gz usando el File Manager de Contabo

# 3. En el VPS, extrae el archivo
ssh root@45.137.192.146
cd /ruta/de/tu/proyecto
tar -xzf /tmp/deploy.tar.gz
```

## 🎯 Método Interactivo

Ejecuta el script automático:

```bash
cd "/Users/cesargarcia/Desktop/DeFi Hedge Fund App"
./deploy-auto.sh
```

## 🔍 Determinar la ruta del proyecto en tu VPS

Necesitas saber dónde están tus archivos actuales en el VPS:

```bash
ssh root@45.137.192.146
pwd  # Verás la ruta actual
find / -name "index.html" 2>/dev/null | grep -v node_modules
```

## 📁 Ubicaciones comunes en VPS Linux

- `/var/www/html/` - Nginx default
- `/var/www/` - Apache default  
- `/home/usuario/www/` - Usuario específico
- `~/proyecto/` - Directorio home del usuario
- `/srv/www/` - Otros servidores

## ✅ Verificación post-despliegue

1. Visita: http://45.137.192.146:3001/
2. Debe cargar el dashboard de DeFi Hedge Fund
3. Clic en "Connect Wallet"
4. MetaMask debe agregar Arbitrum Sepolia automáticamente
5. Revisa la consola del navegador (F12) para errores

## 🆘 Problemas comunes

### Error 403 o no carga
```bash
# Ajustar permisos
sudo chown -R www-data:www-data /var/www/html
sudo chmod -R 755 /var/www/html
```

### MetaMask no conecta
- Abre consola del navegador (F12)
- Revisa errores
- Asegúrate de que MetaMask esté instalado
- Verifica que el VPS tenga HTTPS configurado (Algunas wallets requieren HTTPS)

### SSH no funciona
- Revisa credenciales en panel de Contabo
- Genera nueva clave SSH si es necesario
- Verifica que el puerto 22 esté abierto

## 📊 Estructura de archivos final

Una vez desplegado, tu VPS debe tener:
```
/ruta/en/vps/
├── index.html
└── assets/
    ├── index-KVt2YE7t.js
    └── index-_6rYgRJU.css
```

## 🎉 Listo!

Tu app DeFi Hedge Fund con soporte para Arbitrum Sepolia estará en:
**http://45.137.192.146:3001/**

¡Disfruta tu aplicación!

