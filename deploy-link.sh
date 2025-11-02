#!/bin/bash

# Script para desplegar la app con soporte LINK token
echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     DeFi Hedge Fund App - Deploy LINK Token Support          ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -d "build" ]; then
    echo "❌ Error: No se encontró el directorio 'build'"
    echo "   Ejecuta primero: npm run build"
    exit 1
fi

echo "✅ Build encontrado"
echo ""
echo "📤 Subiendo archivos al VPS..."
echo "   Destino: root@45.137.192.146:/var/www/html/"
echo ""

# Subir archivos
scp -r build/* root@45.137.192.146:/var/www/html/

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Archivos subidos exitosamente!"
    echo ""
    echo "🌐 Tu app está disponible en:"
    echo "   http://45.137.192.146:3001/"
    echo ""
    echo "✨ Funcionalidades desplegadas:"
    echo "   • Soporte para token LINK (ERC20)"
    echo "   • Aprobación automática de tokens"
    echo "   • Depósitos con LINK al Vault"
    echo ""
else
    echo ""
    echo "❌ Error al subir archivos"
    echo "   Verifica tu conexión SSH y permisos"
    exit 1
fi

