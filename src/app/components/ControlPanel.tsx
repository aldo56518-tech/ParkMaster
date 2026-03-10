interface ControlPanelProps {
  isActive: boolean;
  onToggleActive: () => void;
  cameraPosition: 'rear' | 'front';
  onCameraPositionChange: (position: 'rear' | 'front') => void;
  simulationMode: 'auto' | 'manual';
  onSimulationModeChange: (mode: 'auto' | 'manual') => void;
  onManualDistanceChange: (distance: number) => void;
  onManualImpact: () => void;
  currentDistance: number;
}

export function ControlPanel({
  isActive,
  onToggleActive,
  cameraPosition,
  onCameraPositionChange,
  simulationMode,
  onSimulationModeChange,
  onManualDistanceChange,
  onManualImpact,
  currentDistance,
}: ControlPanelProps) {
  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <span className="text-xl">⚙️</span>
        Panel de Control
      </h2>

      <div className="space-y-4">
        {/* Botón principal */}
        <button
          onClick={onToggleActive}
          className={`w-full py-3 rounded-lg font-semibold text-lg transition-all ${
            isActive
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {isActive ? '⏹ Detener Sistema' : '▶ Iniciar Sistema'}
        </button>

        {/* Posición de cámara */}
        <div className="bg-gray-950 rounded-lg p-3">
          <label className="text-sm font-medium text-gray-400 block mb-2">
            Posición de Cámara
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onCameraPositionChange('rear')}
              className={`py-2 rounded-lg font-medium transition-all ${
                cameraPosition === 'rear'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              🔙 Trasera
            </button>
            <button
              onClick={() => onCameraPositionChange('front')}
              className={`py-2 rounded-lg font-medium transition-all ${
                cameraPosition === 'front'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              ⏩ Delantera
            </button>
          </div>
        </div>

        {/* Modo de simulación */}
        <div className="bg-gray-950 rounded-lg p-3">
          <label className="text-sm font-medium text-gray-400 block mb-2">
            Modo de Simulación
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onSimulationModeChange('auto')}
              className={`py-2 rounded-lg font-medium transition-all ${
                simulationMode === 'auto'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              🤖 Auto
            </button>
            <button
              onClick={() => onSimulationModeChange('manual')}
              className={`py-2 rounded-lg font-medium transition-all ${
                simulationMode === 'manual'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              🎮 Manual
            </button>
          </div>
        </div>

        {/* Controles manuales */}
        {simulationMode === 'manual' && isActive && (
          <div className="bg-gray-950 rounded-lg p-3 space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-400 block mb-2">
                Distancia Manual: {Math.round(currentDistance)} cm
              </label>
              <input
                type="range"
                min="5"
                max="200"
                value={currentDistance}
                onChange={e => onManualDistanceChange(Number(e.target.value))}
                className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${
                    (currentDistance / 200) * 100
                  }%, #1f2937 ${(currentDistance / 200) * 100}%, #1f2937 100%)`,
                }}
              />
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>5 cm</span>
                <span>200 cm</span>
              </div>
            </div>

            <button
              onClick={onManualImpact}
              className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all"
            >
              ⚡ Simular Impacto
            </button>
          </div>
        )}

        {/* Estado del sistema */}
        <div className="bg-gray-950 rounded-lg p-3">
          <div className="text-xs text-gray-500 space-y-2">
            <div className="flex items-center justify-between">
              <span>Estado:</span>
              <span className={isActive ? 'text-green-400' : 'text-gray-400'}>
                {isActive ? '● Operacional' : '○ En espera'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Cámara:</span>
              <span className="text-gray-400">
                {cameraPosition === 'rear' ? 'Trasera' : 'Delantera'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Modo:</span>
              <span className="text-gray-400">
                {simulationMode === 'auto' ? 'Automático' : 'Manual'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>FPS:</span>
              <span className="text-gray-400">30 fps</span>
            </div>
          </div>
        </div>

        {/* Calibración */}
        <div className="bg-gray-950 rounded-lg p-3">
          <div className="text-xs text-gray-500 mb-2">CALIBRACIÓN</div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Ultrasonido:</span>
              <span className="text-green-400">✓ Calibrado</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">IMU:</span>
              <span className="text-green-400">✓ Calibrado</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Cámara:</span>
              <span className="text-green-400">✓ Calibrado</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
