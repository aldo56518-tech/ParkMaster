import { SensorData } from '../App';

interface SensorPanelProps {
  sensorData: SensorData;
}

export function SensorPanel({ sensorData }: SensorPanelProps) {
  const { distance, accelerometer, gyroscope, ultrasonicFrequency } = sensorData;

  // Calcular magnitud de aceleración
  const accelMagnitude = Math.sqrt(
    accelerometer.x ** 2 + accelerometer.y ** 2 + accelerometer.z ** 2
  );

  // Calcular magnitud de rotación
  const gyroMagnitude = Math.sqrt(
    gyroscope.x ** 2 + gyroscope.y ** 2 + gyroscope.z ** 2
  );

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <span className="text-xl">📊</span>
        Datos de Sensores
      </h2>

      <div className="space-y-4">
        {/* Ultrasonido */}
        <div className="bg-gray-950 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-400">Ultrasonido (ToF)</span>
            <span className="text-xs bg-blue-600 px-2 py-1 rounded">ACTIVO</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-blue-400">{Math.round(distance)}</span>
            <span className="text-gray-500">cm</span>
          </div>
          <div className="mt-2 h-1 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all"
              style={{ width: `${Math.min((distance / 200) * 100, 100)}%` }}
            />
          </div>
          <div className="mt-1 text-xs text-gray-500">
            Frecuencia: {ultrasonicFrequency.toFixed(1)} kHz
          </div>
        </div>

        {/* Acelerómetro */}
        <div className="bg-gray-950 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-400">Acelerómetro (6 ejes)</span>
            <span className="text-xs bg-green-600 px-2 py-1 rounded">IMU</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">X (Lateral):</span>
              <span className="font-mono text-green-400">{accelerometer.x.toFixed(2)} m/s²</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Y (Frontal):</span>
              <span className="font-mono text-green-400">{accelerometer.y.toFixed(2)} m/s²</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Z (Vertical):</span>
              <span className="font-mono text-green-400">{accelerometer.z.toFixed(2)} m/s²</span>
            </div>
            <div className="pt-2 border-t border-gray-800">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Magnitud:</span>
                <span className="font-mono font-semibold text-green-300">
                  {accelMagnitude.toFixed(2)} m/s²
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Giroscopio */}
        <div className="bg-gray-950 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-400">Giroscopio</span>
            <span className="text-xs bg-purple-600 px-2 py-1 rounded">6-DOF</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Pitch (X):</span>
              <span className="font-mono text-purple-400">{gyroscope.x.toFixed(2)}°/s</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Roll (Y):</span>
              <span className="font-mono text-purple-400">{gyroscope.y.toFixed(2)}°/s</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Yaw (Z):</span>
              <span className="font-mono text-purple-400">{gyroscope.z.toFixed(2)}°/s</span>
            </div>
            <div className="pt-2 border-t border-gray-800">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Rotación:</span>
                <span className="font-mono font-semibold text-purple-300">
                  {gyroMagnitude.toFixed(2)}°/s
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Información del procesador */}
        <div className="bg-gray-950 rounded-lg p-3">
          <div className="text-xs text-gray-500 space-y-1">
            <div className="flex items-center justify-between">
              <span>Tasa de muestreo:</span>
              <span className="text-gray-400">100 Hz</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Filtrado de ruido:</span>
              <span className="text-green-400">Kalman</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Latencia:</span>
              <span className="text-gray-400">~10ms</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
