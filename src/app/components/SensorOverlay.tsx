import { motion } from 'motion/react';
import { SensorData } from '../App';

interface SensorOverlayProps {
  sensorData: SensorData;
  impactDetected: boolean;
}

export function SensorOverlay({ sensorData, impactDetected }: SensorOverlayProps) {
  const { accelerometer, gyroscope, ultrasonicFrequency } = sensorData;

  // Calcular magnitud de aceleración
  const accelMagnitude = Math.sqrt(
    accelerometer.x ** 2 + accelerometer.y ** 2 + accelerometer.z ** 2
  );

  // Calcular G-Force
  const gForce = accelMagnitude / 9.81;

  // Calcular delta para detectar movimiento
  const movementDelta = Math.sqrt(
    Math.abs(accelerometer.x) ** 2 + 
    Math.abs(accelerometer.y) ** 2
  );
  const isMoving = movementDelta > 1.5; // Si hay movimiento significativo

  return (
    <div className="fixed top-20 left-0 right-0 px-4 z-30 pointer-events-none">
      {/* Panel compacto de sensores */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-black bg-opacity-70 backdrop-blur-md rounded-xl p-3 text-white text-xs"
      >
        {/* Indicador de movimiento */}
        <div className="mb-2 flex items-center justify-center gap-2">
          <motion.div
            animate={isMoving ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 0.5, repeat: isMoving ? Infinity : 0 }}
            className={`w-3 h-3 rounded-full ${isMoving ? 'bg-green-500' : 'bg-gray-600'}`}
          />
          <span className={`font-semibold ${isMoving ? 'text-green-400' : 'text-gray-500'}`}>
            {isMoving ? '🚗 VEHÍCULO EN MOVIMIENTO' : '🅿️ VEHÍCULO DETENIDO'}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {/* Acelerómetro */}
          <div>
            <div className="text-gray-400 mb-1 font-semibold">ACCEL</div>
            <div className="space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">X:</span>
                <span className="font-mono text-green-400">{accelerometer.x.toFixed(1)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Y:</span>
                <span className="font-mono text-green-400">{accelerometer.y.toFixed(1)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Z:</span>
                <span className="font-mono text-green-400">{accelerometer.z.toFixed(1)}</span>
              </div>
            </div>
          </div>

          {/* Giroscopio */}
          <div>
            <div className="text-gray-400 mb-1 font-semibold">GYRO</div>
            <div className="space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">α:</span>
                <span className="font-mono text-purple-400">{Math.round(gyroscope.alpha)}°</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">β:</span>
                <span className="font-mono text-purple-400">{Math.round(gyroscope.beta)}°</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">γ:</span>
                <span className="font-mono text-purple-400">{Math.round(gyroscope.gamma)}°</span>
              </div>
            </div>
          </div>

          {/* Estado */}
          <div>
            <div className="text-gray-400 mb-1 font-semibold">ESTADO</div>
            <div className="space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">G:</span>
                <span className={`font-mono ${gForce > 1.5 ? 'text-red-400' : 'text-blue-400'}`}>
                  {gForce.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">US:</span>
                <span className="font-mono text-blue-400">{ultrasonicFrequency.toFixed(1)} kHz</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">FPS:</span>
                <span className="font-mono text-blue-400">30</span>
              </div>
            </div>
          </div>
        </div>

        {/* Indicador de impacto */}
        {impactDetected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-2 pt-2 border-t border-red-600"
          >
            <div className="flex items-center justify-center gap-2 text-red-400 font-bold">
              <span className="text-lg">⚠️</span>
              <span>IMPACTO DETECTADO</span>
              <span className="text-lg">⚠️</span>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Indicador de inclinación visual */}
      <motion.div
        className="mt-3 bg-black bg-opacity-70 backdrop-blur-md rounded-xl p-3"
      >
        <div className="text-gray-400 text-xs font-semibold mb-2 text-center">INCLINACIÓN</div>
        <div className="relative w-full h-20 bg-gray-800 rounded-lg overflow-hidden">
          {/* Horizonte artificial */}
          <motion.div
            animate={{
              rotate: -gyroscope.gamma, // Roll
              y: gyroscope.beta * 0.5, // Pitch
            }}
            transition={{ duration: 0.1 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="w-full h-0.5 bg-yellow-400 shadow-lg"></div>
            <div className="absolute w-0.5 h-full bg-yellow-400 shadow-lg"></div>
          </motion.div>

          {/* Indicador central */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
          </div>

          {/* Valores de inclinación */}
          <div className="absolute top-1 left-2 text-xs text-white bg-black bg-opacity-50 px-1 rounded">
            Roll: {Math.round(gyroscope.gamma)}°
          </div>
          <div className="absolute top-1 right-2 text-xs text-white bg-black bg-opacity-50 px-1 rounded">
            Pitch: {Math.round(gyroscope.beta)}°
          </div>
        </div>
      </motion.div>
    </div>
  );
}