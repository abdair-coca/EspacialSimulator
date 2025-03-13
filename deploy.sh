#!/bin/bash

# Colores para mensajes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}Iniciando proceso de despliegue...${NC}"

# Verificar dependencias
command -v node >/dev/null 2>&1 || { echo -e "${RED}Node.js no está instalado. Por favor, instálalo primero.${NC}" >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo -e "${RED}npm no está instalado. Por favor, instálalo primero.${NC}" >&2; exit 1; }

# Instalar dependencias
echo -e "${YELLOW}Instalando dependencias...${NC}"
npm install

# Optimizar assets
echo -e "${YELLOW}Optimizando assets...${NC}"

# Optimizar imágenes
if command -v sharp-cli >/dev/null 2>&1; then
    for img in assets/textures/*.{jpg,png}; do
        if [ -f "$img" ]; then
            echo "Optimizando $img..."
            sharp -i "$img" -o "${img%.*}_optimized.${img##*.}" resize 1024 1024 fit inside
            mv "${img%.*}_optimized.${img##*.}" "$img"
        fi
    done
else
    echo -e "${YELLOW}sharp-cli no está instalado. Instalando...${NC}"
    npm install -g sharp-cli
    for img in assets/textures/*.{jpg,png}; do
        if [ -f "$img" ]; then
            echo "Optimizando $img..."
            sharp -i "$img" -o "${img%.*}_optimized.${img##*.}" resize 1024 1024 fit inside
            mv "${img%.*}_optimized.${img##*.}" "$img"
        fi
    done
fi

# Minificar JavaScript
if command -v terser >/dev/null 2>&1; then
    for js in js/*.js; do
        if [ -f "$js" ]; then
            echo "Minificando $js..."
            terser "$js" -o "${js%.*}.min.js" -c -m
        fi
    done
else
    echo -e "${YELLOW}terser no está instalado. Instalando...${NC}"
    npm install -g terser
    for js in js/*.js; do
        if [ -f "$js" ]; then
            echo "Minificando $js..."
            terser "$js" -o "${js%.*}.min.js" -c -m
        fi
    done
fi

# Crear archivo de caché para service worker
echo -e "${YELLOW}Generando archivo de caché...${NC}"
echo "CACHE_VERSION = '1.0';" > js/cache-version.js
echo "CACHE_NAME = 'simulador-espacial-v' + CACHE_VERSION;" >> js/cache-version.js

# Verificar si hay cambios sin commitear
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}Hay cambios sin commitear. ¿Deseas commitearlos? (s/n)${NC}"
    read -r response
    if [[ "$response" =~ ^[Ss]$ ]]; then
        git add .
        git commit -m "Optimización y preparación para despliegue"
    fi
fi

# Preguntar plataforma de despliegue
echo -e "${YELLOW}¿Dónde deseas desplegar?${NC}"
echo "1) GitHub Pages"
echo "2) Vercel"
read -r platform

case $platform in
    1)
        echo -e "${YELLOW}Desplegando a GitHub Pages...${NC}"
        git push origin main
        ;;
    2)
        echo -e "${YELLOW}Desplegando a Vercel...${NC}"
        if command -v vercel >/dev/null 2>&1; then
            vercel deploy --prod
        else
            echo -e "${YELLOW}Vercel CLI no está instalado. Instalando...${NC}"
            npm install -g vercel
            vercel deploy --prod
        fi
        ;;
    *)
        echo -e "${RED}Opción no válida${NC}"
        exit 1
        ;;
esac

echo -e "${GREEN}¡Despliegue completado!${NC}"

# Dar permisos de ejecución al script
chmod +x deploy.sh

# Ejecutar el script
./deploy.sh

# Seleccionar opción 1 para GitHub Pages 