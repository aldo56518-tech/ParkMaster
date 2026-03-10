import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';

interface MobileCameraViewProps {
  isActive: boolean;
  distance: number;
  gyroscope: { alpha: number; beta: number; gamma: number };
  cameraPosition: 'user' | 'environment';
  impactDetected: boolean;
  onToggleControls: () => void;
}

export function MobileCameraView({
  isActive,
  distance,
  gyroscope,
  cameraPosition,
  impactDetected,
  onToggleControls,
}: MobileCameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string>('');

  // Activar cámara automáticamente al iniciar o cambiar posición
  useEffect(() => {
    if (isActive) {
      enableCamera();
    } else {
      disableCamera();
    }
  }, [isActive, cameraPosition]);

  // Función para activar cámara
  const enableCamera = async () => {
    try {
      // Detener stream anterior si existe
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Cámara no disponible en este dispositivo');
        setCameraActive(false);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: cameraPosition,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
        setCameraError('');
      }
    } catch (error: any) {
      console.log('Cámara no activada:', error.name);
      setCameraError(error.name === 'NotAllowedError' ? 'Permiso de cámara denegado' : 'Error al activar cámara');
      setCameraActive(false);
    }
  };

  // Desactivar cámara
  const disableCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // Cleanup
  useEffect(() => {
    return () => {
      disableCamera();
    };
  }, []);

  // Dibujar guías de estacionamiento
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isActive) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      if (!isActive) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Calcular inclinación del vehículo basado en giroscopio
      const vehicleAngle = gyroscope.gamma; // -90 a 90 grados (inclinación lateral)
      const vehiclePitch = gyroscope.beta; // -180 a 180 grados (inclinación frontal)

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const baseY = canvas.height;

      // Ajustar offset según inclinación
      const angleOffsetX = vehicleAngle * 3;
      const angleOffsetY = vehiclePitch * 0.5;

      // Color según distancia
      let guideColor = 'rgba(34, 197, 94, 0.9)'; // Verde - seguro
      let statusText = 'SEGURO';
      if (distance < 100) {
        guideColor = 'rgba(59, 130, 246, 0.9)'; // Azul - acercándose
        statusText = 'ACERCÁNDOSE';
      }
      if (distance < 50) {
        guideColor = 'rgba(234, 179, 8, 0.9)'; // Amarillo - precaución
        statusText = 'PRECAUCIÓN';
      }
      if (distance < 30) {
        guideColor = 'rgba(249, 115, 22, 0.9)'; // Naranja - peligro
        statusText = 'PELIGRO';
      }
      if (distance < 15) {
        guideColor = 'rgba(239, 68, 68, 0.9)'; // Rojo - crítico
        statusText = '¡DETENER!';
      }

      // Ancho del vehículo simulado
      const vehicleWidth = canvas.width * 0.25;

      // Dibujar rectángulo representando el vehículo (vista superior)
      ctx.save();
      ctx.translate(centerX, baseY - 100);
      ctx.rotate((vehicleAngle * Math.PI) / 180);

      // Sombra del vehículo
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(-vehicleWidth / 2 + 3, -60 + 3, vehicleWidth, 80);

      // Vehículo
      ctx.fillStyle = 'rgba(59, 130, 246, 0.5)';
      ctx.strokeStyle = 'rgba(59, 130, 246, 1)';
      ctx.lineWidth = 3;
      ctx.fillRect(-vehicleWidth / 2, -60, vehicleWidth, 80);
      ctx.strokeRect(-vehicleWidth / 2, -60, vehicleWidth, 80);

      // Indicador de frente del vehículo
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillRect(-vehicleWidth / 2, -60, vehicleWidth, 10);

      ctx.restore();

      // Dibujar líneas de trayectoria
      ctx.strokeStyle = guideColor;
      ctx.lineWidth = 5;
      ctx.shadowBlur = 15;
      ctx.shadowColor = guideColor;

      const adjustedCenterX = centerX + angleOffsetX;

      // Línea izquierda
      ctx.beginPath();
      ctx.moveTo(adjustedCenterX - vehicleWidth / 2, baseY);
      ctx.lineTo(adjustedCenterX - vehicleWidth * 0.3, baseY * 0.3 + angleOffsetY);
      ctx.stroke();

      // Línea derecha
      ctx.beginPath();
      ctx.moveTo(adjustedCenterX + vehicleWidth / 2, baseY);
      ctx.lineTo(adjustedCenterX + vehicleWidth * 0.3, baseY * 0.3 + angleOffsetY);
      ctx.stroke();

      // Línea central
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.setLineDash([15, 15]);
      ctx.beginPath();
      ctx.moveTo(adjustedCenterX, baseY);
      ctx.lineTo(adjustedCenterX, baseY * 0.3 + angleOffsetY);
      ctx.stroke();

      ctx.shadowBlur = 0;
      ctx.setLineDash([]);

      // Líneas de distancia horizontales
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 10]);

      const distanceMarkers = [
        { ratio: 0.7, cm: 150 },
        { ratio: 0.5, cm: 100 },
        { ratio: 0.3, cm: 50 },
      ];

      distanceMarkers.forEach(({ ratio, cm }) => {
        const y = baseY * ratio;
        const width = vehicleWidth * (1.5 - ratio * 0.5);
        
        ctx.beginPath();
        ctx.moveTo(adjustedCenterX - width, y + angleOffsetY * ratio);
        ctx.lineTo(adjustedCenterX + width, y + angleOffsetY * ratio);
        ctx.stroke();

        // Etiquetas
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`${cm} cm`, adjustedCenterX + width + 10, y + angleOffsetY * ratio + 5);
        ctx.setLineDash([10, 10]);
      });

      ctx.setLineDash([]);

      // Indicador de ángulo del vehículo
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(20, canvas.height - 120, 180, 100);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('ÁNGULO VEHÍCULO', 30, canvas.height - 100);

      // Mostrar ángulo lateral (más importante para estacionamiento)
      const angleColor = Math.abs(vehicleAngle) < 5 ? 'rgba(34, 197, 94, 1)' : 'rgba(234, 179, 8, 1)';
      ctx.fillStyle = angleColor;
      ctx.font = 'bold 24px monospace';
      ctx.fillText(`${vehicleAngle.toFixed(1)}°`, 30, canvas.height - 70);

      // Indicador visual de alineación
      ctx.strokeStyle = angleColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(150, canvas.height - 75, 25, 0, Math.PI * 2);
      ctx.stroke();

      ctx.save();
      ctx.translate(150, canvas.height - 75);
      ctx.rotate((vehicleAngle * Math.PI) / 180);
      ctx.fillStyle = angleColor;
      ctx.fillRect(-3, -20, 6, 20);
      ctx.restore();

      // Estado de alineación
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '10px sans-serif';
      const alignmentText = Math.abs(vehicleAngle) < 5 ? 'ALINEADO ✓' : 'AJUSTAR DIRECCIÓN';
      ctx.fillText(alignmentText, 30, canvas.height - 45);

      // Zona de peligro roja
      if (distance < 30) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
        ctx.fillRect(0, 0, canvas.width, canvas.height * 0.4);

        // Mensaje de alerta parpadeante
        const pulseOpacity = (Math.sin(Date.now() / 200) + 1) / 2;
        ctx.fillStyle = `rgba(239, 68, 68, ${pulseOpacity})`;
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⚠️ ZONA DE PELIGRO ⚠️', canvas.width / 2, 60);
      }

      // Indicador de status en la parte superior
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(canvas.width / 2 - 100, 10, 200, 40);

      ctx.fillStyle = guideColor;
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(statusText, canvas.width / 2, 35);

      requestAnimationFrame(draw);
    };

    const animationId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, [isActive, distance, gyroscope]);

  return (
    <div className="absolute inset-0 bg-black">
      {/* Video de cámara */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
        style={{ display: cameraActive ? 'block' : 'none' }}
      />

      {/* Fondo cuando no hay cámara */}
      {!cameraActive && isActive && (
        <div className="absolute inset-0 bg-gradient-to-b from-gray-800 to-gray-900 flex items-center justify-center">
          <div className="text-center opacity-20">
            <div className="text-9xl mb-4">🚗</div>
            <p className="text-gray-600 text-xl">Permite acceso a la cámara</p>
            <p className="text-gray-700 text-sm mt-2">para ver video en tiempo real</p>
          </div>
        </div>
      )}

      {/* Canvas de guías */}
      {isActive && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />
      )}

      {/* Overlay de impacto */}
      {impactDetected && isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.8, 0] }}
          transition={{ duration: 0.3, repeat: 5 }}
          className="absolute inset-0 bg-red-600 pointer-events-none"
        />
      )}

      {/* Badge de estado de cámara */}
      {isActive && (
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          <div className={`px-3 py-2 rounded-full text-sm text-white flex items-center gap-2 ${
            cameraActive ? 'bg-green-600 bg-opacity-90' : 'bg-red-600 bg-opacity-90'
          }`}>
            <div className={`w-2 h-2 rounded-full ${cameraActive ? 'bg-white animate-pulse' : 'bg-white'}`}></div>
            {cameraActive ? (
              <>📹 Cámara {cameraPosition === 'environment' ? 'Trasera' : 'Frontal'}</>
            ) : (
              <>📹 Sin Cámara</>
            )}
          </div>
          {cameraError && (
            <div className="px-3 py-2 rounded-full text-sm text-white bg-red-600 bg-opacity-90">
              {cameraError}
            </div>
          )}
        </div>
      )}

      {/* Botón de controles */}
      {isActive && (
        <button
          onClick={onToggleControls}
          className="absolute top-4 right-4 bg-black bg-opacity-70 p-3 rounded-full text-white hover:bg-opacity-90 transition-all"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
      )}

      {/* Alerta de impacto */}
      {impactDetected && isActive && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: -20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-red-600 px-8 py-6 rounded-2xl font-bold text-white text-2xl shadow-2xl flex items-center gap-4 z-40 border-4 border-white"
        >
          <span className="text-5xl">⚠️</span>
          <div>
            <div className="text-3xl">¡IMPACTO!</div>
            <div className="text-lg font-normal opacity-90 mt-1">DETENER INMEDIATAMENTE</div>
          </div>
        </motion.div>
      )}

      {/* Sistema inactivo */}
      {!isActive && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="text-center">
            <div className="text-8xl mb-4 opacity-30">🚗</div>
            <p className="text-gray-400 text-2xl font-bold">ParkMaster</p>
            <p className="text-gray-600 text-lg mt-3">Sistema de Asistencia Inactivo</p>
            <p className="text-gray-700 text-sm mt-2">Presiona "Iniciar Asistencia" para comenzar</p>
          </div>
        </div>
      )}
    </div>
  );
}