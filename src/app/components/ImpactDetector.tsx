import { useEffect, useState } from 'react';
import { motion } from 'motion/react';

interface ImpactDetectorProps {
  accelerometer: { x: number; y: number; z: number };
  impactDetected: boolean;
}

export function ImpactDetector({ accelerometer, impactDetected }: ImpactDetectorProps) {
  const [impactHistory, setImpactHistory] = useState<
    Array<{ timestamp: Date; force: number }>
  >([]);

  // Calcular fuerza G total
  const gForce = Math.sqrt(
    accelerometer.x ** 2 + accelerometer.y ** 2 + accelerometer.z ** 2
  ) / 9.81;

  // Umbral de detección de impacto (más de 1.5 G de cambio repentino)
  const impactThreshold = 1.5;
  const isHighGForce = gForce > impactThreshold;

  // Registrar impactos en el historial
  useEffect(() => {
    if (impactDetected) {
      setImpactHistory(prev => [
        { timestamp: new Date(), force: gForce },
        ...prev.slice(0, 4), // Mantener últimos 5 impactos
      ]);
    }
  }, [impactDetected, gForce]);

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <span className="text-xl">🛡️</span>
        Monitor de Integridad
      </h2>

      {/* Indicador principal */}
      <motion.div
        animate={
          impactDetected
            ? {
                scale: [1, 1.05, 1],
                borderColor: ['#dc2626', '#ef4444', '#dc2626'],
              }
            : {}
        }
        transition={{ duration: 0.3, repeat: impactDetected ? 3 : 0 }}
        className={`rounded-lg p-4 mb-4 border-2 ${
          impactDetected
            ? 'bg-red-600 border-red-400'
            : isHighGForce
            ? 'bg-yellow-600 border-yellow-400'
            : 'bg-green-600 border-green-400'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-bold text-lg">
              {impactDetected ? '⚠️ IMPACTO' : isHighGForce ? '⚡ Alta Vibración' : '✓ Normal'}
            </p>
            <p className="text-white text-sm opacity-90">
              {impactDetected
                ? '¡Contacto detectado!'
                : isHighGForce
                ? 'Vibraciones elevadas'
                : 'Sin anomalías'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-white text-2xl font-bold">{gForce.toFixed(2)}</p>
            <p className="text-white text-xs opacity-75">G-Force</p>
          </div>
        </div>
      </motion.div>

      {/* Visualización de ejes */}
      <div className="bg-gray-950 rounded-lg p-3 mb-4">
        <div className="text-xs font-semibold text-gray-400 mb-3">ACELERACIÓN POR EJE</div>
        <div className="space-y-3">
          {/* Eje X */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-500">X (Lateral)</span>
              <span className="text-gray-400 font-mono">{accelerometer.x.toFixed(2)} m/s²</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-red-500"
                animate={{
                  width: `${Math.min(Math.abs(accelerometer.x) * 10, 100)}%`,
                }}
                transition={{ duration: 0.1 }}
              />
            </div>
          </div>

          {/* Eje Y */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-500">Y (Frontal)</span>
              <span className="text-gray-400 font-mono">{accelerometer.y.toFixed(2)} m/s²</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-blue-500"
                animate={{
                  width: `${Math.min(Math.abs(accelerometer.y) * 10, 100)}%`,
                }}
                transition={{ duration: 0.1 }}
              />
            </div>
          </div>

          {/* Eje Z */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-500">Z (Vertical)</span>
              <span className="text-gray-400 font-mono">{accelerometer.z.toFixed(2)} m/s²</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-green-500"
                animate={{
                  width: `${Math.min(Math.abs(accelerometer.z) * 2, 100)}%`,
                }}
                transition={{ duration: 0.1 }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Umbral de detección */}
      <div className="bg-gray-950 rounded-lg p-3 mb-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">Umbral de impacto:</span>
          <span className="text-gray-300 font-mono">{impactThreshold.toFixed(1)} G</span>
        </div>
        <div className="mt-2 h-1 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${
              gForce > impactThreshold ? 'bg-red-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.min((gForce / 3) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Historial de impactos */}
      {impactHistory.length > 0 && (
        <div className="bg-gray-950 rounded-lg p-3">
          <div className="text-xs font-semibold text-gray-400 mb-2">HISTORIAL DE IMPACTOS</div>
          <div className="space-y-2">
            {impactHistory.map((impact, index) => (
              <div
                key={index}
                className="flex items-center justify-between text-xs bg-gray-900 p-2 rounded"
              >
                <span className="text-gray-500">
                  {impact.timestamp.toLocaleTimeString()}
                </span>
                <span className="text-red-400 font-mono">{impact.force.toFixed(2)} G</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Información adicional */}
      <div className="mt-4 text-xs text-gray-500 space-y-1">
        <div className="flex items-center justify-between">
          <span>Algoritmo:</span>
          <span className="text-gray-400">Filtro Kalman</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Sensibilidad:</span>
          <span className="text-gray-400">Alta</span>
        </div>
      </div>
    </div>
  );
}
