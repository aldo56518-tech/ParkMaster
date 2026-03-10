import { motion, AnimatePresence } from 'motion/react';

interface MobileControlsProps {
  isActive: boolean;
  showControls: boolean;
  cameraPosition: 'user' | 'environment';
  onStart: () => void;
  onStop: () => void;
  onCameraPositionChange: (position: 'user' | 'environment') => void;
  onToggleControls: () => void;
  permissionsGranted: boolean;
}

export function MobileControls({
  isActive,
  showControls,
  cameraPosition,
  onStart,
  onStop,
  onCameraPositionChange,
  onToggleControls,
  permissionsGranted,
}: MobileControlsProps) {
  return (
    <>
      {/* Botón flotante para mostrar controles cuando está activo */}
      {isActive && !showControls && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={onToggleControls}
          className="fixed bottom-6 right-6 w-16 h-16 bg-blue-600 rounded-full shadow-2xl flex items-center justify-center text-white z-50"
        >
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
        </motion.button>
      )}

      {/* Panel de controles */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 bg-gray-950 border-t border-gray-800 z-50 shadow-2xl"
          >
            {/* Header del panel */}
            <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="font-bold text-white">ParkMaster</h2>
                  <p className="text-xs text-gray-400">Sistema de Asistencia</p>
                </div>
              </div>
              {isActive && (
                <button
                  onClick={onToggleControls}
                  className="p-2 text-gray-400 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              )}
            </div>

            {/* Contenido del panel */}
            <div className="px-4 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Botón principal de inicio/parada */}
              <button
                onClick={isActive ? onStop : onStart}
                disabled={!permissionsGranted && !isActive}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg ${
                  isActive
                    ? 'bg-red-600 hover:bg-red-700 text-white active:scale-95'
                    : 'bg-green-600 hover:bg-green-700 text-white active:scale-95 disabled:bg-gray-700 disabled:text-gray-400'
                }`}
              >
                {isActive ? (
                  <div className="flex items-center justify-center gap-3">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <rect x="6" y="4" width="4" height="16" />
                      <rect x="14" y="4" width="4" height="16" />
                    </svg>
                    Detener Sistema
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    Iniciar Asistencia
                  </div>
                )}
              </button>

              {/* Selección de cámara */}
              <div className="bg-gray-900 rounded-xl p-4">
                <label className="text-sm font-semibold text-gray-400 block mb-3">
                  Posición de Cámara {isActive && <span className="text-yellow-400">• Cambio en tiempo real</span>}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => onCameraPositionChange('environment')}
                    className={`py-3 px-4 rounded-lg font-medium transition-all ${
                      cameraPosition === 'environment'
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    <div className="text-2xl mb-1">🚗</div>
                    <div className="text-sm">Trasera</div>
                  </button>
                  <button
                    onClick={() => onCameraPositionChange('user')}
                    className={`py-3 px-4 rounded-lg font-medium transition-all ${
                      cameraPosition === 'user'
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    <div className="text-2xl mb-1">🚙</div>
                    <div className="text-sm">Frontal</div>
                  </button>
                </div>
                {isActive && (
                  <p className="text-xs text-green-500 mt-2">
                    ✓ Puedes cambiar la cámara mientras el sistema está activo
                  </p>
                )}
              </div>

              {/* Instrucciones de uso */}
              <div className="bg-gradient-to-br from-blue-900 to-blue-950 rounded-xl p-4 border border-blue-800">
                <h3 className="font-semibold text-blue-300 mb-2 flex items-center gap-2">
                  <span>📋</span>
                  Instrucciones de Uso
                </h3>
                <ul className="text-sm text-blue-200 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400">1.</span>
                    Coloca el teléfono en un soporte en la parte trasera o delantera del vehículo
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400">2.</span>
                    Selecciona la cámara correspondiente (trasera o frontal)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400">3.</span>
                    Inicia el sistema y comienza la maniobra de estacionamiento
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400">4.</span>
                    Sigue las guías visuales y alertas acústicas de distancia
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400">5.</span>
                    El sistema detectará impactos automáticamente
                  </li>
                </ul>
              </div>

              {/* Especificaciones técnicas */}
              <div className="bg-gray-900 rounded-xl p-4">
                <h3 className="font-semibold text-gray-400 mb-3 text-sm">
                  Especificaciones Técnicas
                </h3>
                <div className="space-y-2 text-xs text-gray-500">
                  <div className="flex items-center justify-between">
                    <span>Sistema Operativo:</span>
                    <span className="text-gray-300">Android 10.0+</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Sensores Requeridos:</span>
                    <span className="text-gray-300">IMU 6 ejes</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Cámara:</span>
                    <span className="text-gray-300">Gran Angular</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Frecuencia Ultrasonido:</span>
                    <span className="text-gray-300">20 kHz</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Latencia:</span>
                    <span className="text-gray-300">&lt; 100ms</span>
                  </div>
                </div>
              </div>

              {/* Advertencias de seguridad */}
              <div className="bg-yellow-900 bg-opacity-30 border border-yellow-700 rounded-xl p-4">
                <h3 className="font-semibold text-yellow-400 mb-2 flex items-center gap-2">
                  <span>⚠️</span>
                  Advertencias de Seguridad
                </h3>
                <ul className="text-xs text-yellow-200 space-y-1">
                  <li>• Usa esta herramienta como asistencia, no como sustituto de tu atención</li>
                  <li>• Verifica siempre los espejos y alrededores del vehículo</li>
                  <li>• El sistema puede tener limitaciones en condiciones de poca luz</li>
                  <li>• Calibra los sensores antes de cada uso</li>
                </ul>
              </div>

              {/* Espacio inferior para evitar que el contenido quede detrás del notch */}
              <div className="h-6"></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}