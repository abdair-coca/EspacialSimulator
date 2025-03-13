# Simulador de Viaje Espacial a Marte 🚀

Un simulador interactivo 3D que permite experimentar un viaje espacial desde la Tierra hasta Marte, con física realista, efectos visuales y modo multijugador.

## Características Principales

- 🎮 Simulación 3D en tiempo real con Three.js
- 🌍 Sistema solar con planetas y órbitas realistas
- 🚀 Física de navegación espacial precisa
- 🎯 Sistema de puntuación basado en eficiencia
- 👥 Modo multijugador en tiempo real
- 🎵 Efectos de sonido inmersivos
- 📱 Interfaz responsive y optimizada para móviles
- 🌙 Efectos visuales avanzados (sombras, texturas, partículas)

## Requisitos Previos

- Node.js (versión 14 o superior)
- Navegador web moderno con soporte para WebGL
- Conexión a Internet para cargar las dependencias

## Instalación

1. Clona el repositorio:
```bash
git clone https://github.com/tu-usuario/simulador-espacial.git
cd simulador-espacial
```

2. Instala las dependencias:
```bash
npm install
```

3. Asegúrate de tener las siguientes carpetas en el proyecto:
```
assets/
  ├── sounds/     # Efectos de sonido
  └── textures/   # Texturas 3D
```

## Ejecución

1. Inicia el servidor WebSocket para el modo multijugador:
```bash
node server.js
```

2. Abre el archivo `index.html` en tu navegador o usa un servidor local:
```bash
python -m http.server 8000
```

3. Accede a la aplicación en tu navegador:
```
http://localhost:8000
```

## Fases del Juego

### 1. Preparación
- Revisa el estado de los sistemas de la nave
- Verifica el combustible disponible
- Ajusta el volumen del juego

### 2. Despegue
- La nave se eleva desde la superficie de la Tierra
- Debes mantener el control durante la fase de ascenso
- Los motores se activan con efectos visuales y sonoros

### 3. Viaje Espacial
- Navega por el espacio entre la Tierra y Marte
- Gestiona el combustible y los sistemas de la nave
- Evita obstáculos y mantén la trayectoria óptima

### 4. Aterrizaje en Marte
- Realiza un aterrizaje suave en la superficie marciana
- Mantén los sistemas funcionando durante el descenso
- Evita daños a la nave

### 5. Resultados
- Recibe tu puntuación basada en:
  - Combustible restante
  - Tiempo de viaje
  - Estado de los sistemas
  - Precisión de la trayectoria

## Modo Multijugador

1. Abre la aplicación en dos navegadores diferentes
2. Haz clic en "Conectar" en ambos navegadores
3. Los jugadores verán sus naves en tiempo real
4. Compite para llegar primero a Marte con la mejor puntuación

## Sistema de Puntuación

La puntuación máxima es de 3500 puntos, distribuidos así:
- 1000 puntos base por completar la misión
- 500 puntos por combustible restante
- 1000 puntos por tiempo de viaje
- 500 puntos por estado de los sistemas
- 500 puntos por precisión de trayectoria

## Controles

### Teclado
- Espacio: Activar/desactivar motores
- Flechas: Control de dirección
- R: Reiniciar simulación

### Ratón
- Clic izquierdo + arrastrar: Rotar cámara
- Rueda: Zoom
- Clic derecho + arrastrar: Pan

### Táctil
- Un dedo: Rotar cámara
- Dos dedos: Zoom
- Botones en pantalla para control de la nave

## Solución de Problemas

1. Si la simulación no carga:
   - Verifica la conexión a Internet
   - Limpia la caché del navegador
   - Asegúrate de que WebGL está habilitado

2. Si el modo multijugador no funciona:
   - Verifica que el servidor WebSocket está ejecutándose
   - Comprueba que los puertos no están bloqueados
   - Asegúrate de que ambos navegadores están conectados

## Contribuir

1. Haz fork del repositorio
2. Crea una rama para tu característica
3. Realiza tus cambios
4. Envía un pull request

## Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## Créditos

- Three.js para la renderización 3D
- WebSocket para la comunicación en tiempo real
- Efectos de sonido de [fuente]
- Texturas 3D de [fuente]