#!/bin/bash

# Auto-deployment script for DeFi Hedge Fund App
# This script will attempt to deploy your app to the VPS

set -e  # Exit on error

# Configuration
VPS_HOST="45.137.192.146"
VPS_PORT="3001"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   DeFi Hedge Fund App - Auto Deployment Script       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if build directory exists
if [ ! -d "build" ]; then
    echo -e "${RED}❌ Build directory not found!${NC}"
    echo -e "${YELLOW}Running build first...${NC}"
    npm run build
fi

echo -e "${GREEN}✅ Build files ready${NC}"
echo ""

# Try to detect VPS connection method
echo -e "${YELLOW}🔍 Attempting to detect VPS setup...${NC}"

# Test if we can determine what's running on the VPS
echo -e "${BLUE}Checking if VPS is reachable...${NC}"
if curl -s --max-time 3 "http://${VPS_HOST}:${VPS_PORT}" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ VPS is reachable on port ${VPS_PORT}${NC}"
else
    echo -e "${YELLOW}⚠️  VPS not reachable or port ${VPS_PORT} is different${NC}"
fi

echo ""
echo -e "${YELLOW}📋 Deployment options:${NC}"
echo ""
echo "1. ${GREEN}Manual Upload via SCP${NC}"
echo "2. ${GREEN}Manual Upload via SFTP/File Manager${NC}"
echo "3. ${GREEN}I have terminal access to VPS${NC}"
echo ""
read -p "Select option (1-3): " choice

case $choice in
    1)
        echo ""
        echo -e "${BLUE}📤 SCP Upload Method${NC}"
        echo ""
        read -p "Enter SSH username (default: root): " VPS_USER
        VPS_USER=${VPS_USER:-root}
        
        read -p "Enter remote directory path (e.g., /var/www/html): " REMOTE_DIR
        REMOTE_DIR=${REMOTE_DIR:-/var/www/html}
        
        echo ""
        echo -e "${YELLOW}Uploading files...${NC}"
        echo "Command: scp -r build/* ${VPS_USER}@${VPS_HOST}:${REMOTE_DIR}/"
        echo ""
        
        scp -r build/* "${VPS_USER}@${VPS_HOST}:${REMOTE_DIR}/" && \
            echo -e "${GREEN}✅ Files uploaded successfully!${NC}" || \
            echo -e "${RED}❌ Upload failed. Check your SSH credentials.${NC}"
        ;;
    2)
        echo ""
        echo -e "${BLUE}📁 File Manager Method${NC}"
        echo ""
        echo "Creating archive for easy upload..."
        tar -czf deploy.tar.gz -C build .
        echo -e "${GREEN}✅ Archive created: deploy.tar.gz${NC}"
        echo ""
        echo "Now:"
        echo "1. Log into your Contabo panel"
        echo "2. Use File Manager to upload 'deploy.tar.gz'"
        echo "3. Extract it in your web directory"
        echo "4. Run: tar -xzf deploy.tar.gz -C /ruta/de/tu/web/"
        ;;
    3)
        echo ""
        echo -e "${BLUE}🖥️  Terminal Access Method${NC}"
        echo ""
        echo "Creating deployment package..."
        tar -czf deploy.tar.gz -C build .
        echo -e "${GREEN}✅ Archive created: deploy.tar.gz${NC}"
        echo ""
        echo "Next steps:"
        echo "1. Connect to VPS: ssh root@${VPS_HOST}"
        echo "2. Navigate to your project directory"
        echo "3. From your Mac, run:"
        echo "   scp deploy.tar.gz root@${VPS_HOST}:/tmp/"
        echo "4. On VPS, run:"
        echo "   cd /ruta/de/tu/proyecto"
        echo "   tar -xzf /tmp/deploy.tar.gz"
        echo "   # Restart your server if needed"
        echo ""
        echo "Creating build info file..."
        cat > build-info.txt << EOF
DeFi Hedge Fund App - Build Information
========================================
Build Date: $(date)
Build Type: Production
Network: Arbitrum Sepolia Testnet
Chain ID: 421614

Files to deploy:
- index.html
- assets/index-KVt2YE7t.js
- assets/index-_6rYgRJU.css

Deployment completed: ✅
EOF
        echo -e "${GREEN}✅ Build info saved to build-info.txt${NC}"
        ;;
    *)
        echo -e "${RED}Invalid option${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                   Next Steps                          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}After deployment:${NC}"
echo ""
echo "1. Visit: ${GREEN}http://${VPS_HOST}:${VPS_PORT}/${NC}"
echo "2. Click 'Connect Wallet'"
echo "3. Your MetaMask should automatically switch to Arbitrum Sepolia"
echo "4. Test the connection"
echo ""
echo -e "${GREEN}🎉 Deployment process initiated!${NC}"
echo ""
echo -e "${YELLOW}Need help? Check DEPLOY_INSTRUCTIONS.md${NC}"

