import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';

interface CameraViewProps {
  isActive: boolean;
  distance: number;
  gyroscope: { x: number; y: number; z: number };
  cameraPosition: 'rear' | 'front';
  impactDetected: boolean;
}

export function CameraView({
  isActive,
  distance,
  gyroscope,
  cameraPosition,
  impactDetected,
}: CameraViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Dibujar guías de trayectoria
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!isActive) return;

      // Ajustar guías según giroscopio (inclinación)
      const tiltX = gyroscope.x * 10;
      const tiltY = gyroscope.y * 10;

      // Color según distancia
      let guideColor = 'rgba(34, 197, 94, 0.6)'; // Verde
      if (distance < 50) guideColor = 'rgba(234, 179, 8, 0.6)'; // Amarillo
      if (distance < 30) guideColor = 'rgba(239, 68, 68, 0.6)'; // Rojo

      ctx.strokeStyle = guideColor;
      ctx.lineWidth = 3;

      const centerX = canvas.width / 2 + tiltX;
      const baseY = canvas.height;

      // Líneas de trayectoria (simulando el ancho del vehículo)
      const vehicleWidth = 150;

      // Línea izquierda
      ctx.beginPath();
      ctx.moveTo(centerX - vehicleWidth, baseY);
      ctx.lineTo(centerX - vehicleWidth * 0.7 + tiltX, baseY * 0.3 + tiltY);
      ctx.stroke();

      // Línea derecha
      ctx.beginPath();
      ctx.moveTo(centerX + vehicleWidth, baseY);
      ctx.lineTo(centerX + vehicleWidth * 0.7 + tiltX, baseY * 0.3 + tiltY);
      ctx.stroke();

      // Líneas horizontales de distancia
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);

      const distances = [0.25, 0.5, 0.75];
      distances.forEach(d => {
        const y = baseY * (1 - d);
        const width = vehicleWidth * (2 - d);
        ctx.beginPath();
        ctx.moveTo(centerX - width + tiltX * d, y + tiltY * d);
        ctx.lineTo(centerX + width + tiltX * d, y + tiltY * d);
        ctx.stroke();
      });

      ctx.setLineDash([]);

      // Zona de peligro
      if (distance < 30) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
        ctx.fillRect(0, 0, canvas.width, canvas.height * 0.3);
      }

      // Indicador de distancia en el centro
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(centerX - 60, 20, 120, 40);
      ctx.fillStyle = guideColor;
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round(distance)} cm`, centerX, 48);
    };

    draw();
  }, [isActive, distance, gyroscope]);

  return (
    <div className="relative bg-gray-900 rounded-lg overflow-hidden border-2 border-gray-800">
      {/* Video simulado */}
      <div className="relative aspect-video bg-gradient-to-b from-gray-800 to-gray-900">
        {isActive ? (
          <>
            {/* Simulación de feed de cámara */}
            <div className="absolute inset-0 bg-gray-700 opacity-50">
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-6xl opacity-20">🚗</div>
              </div>
            </div>

            {/* Canvas para guías */}
            <canvas
              ref={canvasRef}
              width={800}
              height={450}
              className="absolute inset-0 w-full h-full"
            />

            {/* Overlay de impacto */}
            {impactDetected && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 0.5, repeat: 3 }}
                className="absolute inset-0 bg-red-600 mix-blend-multiply"
              />
            )}

            {/* Badge de posición de cámara */}
            <div className="absolute top-4 left-4 bg-black bg-opacity-70 px-3 py-1 rounded-full text-sm">
              📹 Cámara {cameraPosition === 'rear' ? 'Trasera' : 'Delantera'}
            </div>

            {/* Alerta de impacto */}
            {impactDetected && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute top-4 right-4 bg-red-600 px-4 py-2 rounded-lg font-bold flex items-center gap-2"
              >
                <span className="text-2xl">⚠️</span>
                ¡IMPACTO DETECTADO!
              </motion.div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4 opacity-30">📹</div>
              <p className="text-gray-500 text-lg">Sistema Inactivo</p>
              <p className="text-gray-600 text-sm mt-2">Presiona "Iniciar Sistema" para activar</p>
            </div>
          </div>
        )}
      </div>

      {/* Barra de estado inferior */}
      <div className="bg-gray-950 px-4 py-2 flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`}></div>
            <span className="text-gray-400">
              {isActive ? 'Sistema Activo' : 'Sistema Inactivo'}
            </span>
          </div>
          {isActive && (
            <div className="text-gray-500">
              Inclinación: X: {gyroscope.x.toFixed(2)}° Y: {gyroscope.y.toFixed(2)}°
            </div>
          )}
        </div>
        <div className="text-gray-500">
          {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}
