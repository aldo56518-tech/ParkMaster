import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';

interface AlertSystemProps {
  distance: number;
  isActive: boolean;
  audioContext: AudioContext | null;
}

type AlertLevel = 'safe' | 'caution' | 'warning' | 'danger' | 'critical';

export function AlertSystem({ distance, isActive, audioContext }: AlertSystemProps) {
  const lastBeepTimeRef = useRef<number>(0);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Determinar nivel de alerta según distancia
  const getAlertLevel = (dist: number): AlertLevel => {
    if (dist > 100) return 'safe';
    if (dist > 50) return 'caution';
    if (dist > 30) return 'warning';
    if (dist > 15) return 'danger';
    return 'critical';
  };

  const alertLevel = getAlertLevel(distance);

  // Configuración de alertas
  const alertConfig = {
    safe: {
      label: 'Seguro',
      color: 'bg-green-600',
      textColor: 'text-green-400',
      borderColor: 'border-green-600',
      icon: '✓',
      beepInterval: 0, // Sin beep
      frequency: 0,
    },
    caution: {
      label: 'Precaución',
      color: 'bg-blue-600',
      textColor: 'text-blue-400',
      borderColor: 'border-blue-600',
      icon: 'ℹ',
      beepInterval: 2000,
      frequency: 400,
    },
    warning: {
      label: 'Advertencia',
      color: 'bg-yellow-600',
      textColor: 'text-yellow-400',
      borderColor: 'border-yellow-600',
      icon: '⚠',
      beepInterval: 1000,
      frequency: 600,
    },
    danger: {
      label: 'Peligro',
      color: 'bg-orange-600',
      textColor: 'text-orange-400',
      borderColor: 'border-orange-600',
      icon: '⚠',
      beepInterval: 500,
      frequency: 800,
    },
    critical: {
      label: 'Crítico',
      color: 'bg-red-600',
      textColor: 'text-red-400',
      borderColor: 'border-red-600',
      icon: '🚨',
      beepInterval: 200,
      frequency: 1000,
    },
  };

  const config = alertConfig[alertLevel];

  // Sistema de beeps acústicos
  useEffect(() => {
    if (!isActive || !audioContext || config.beepInterval === 0) {
      // Detener cualquier sonido activo
      if (oscillatorRef.current) {
        try {
          oscillatorRef.current.stop();
          oscillatorRef.current.disconnect();
        } catch (e) {
          // Ignorar errores si ya está detenido
        }
        oscillatorRef.current = null;
      }
      return;
    }

    const playBeep = () => {
      const now = Date.now();
      if (now - lastBeepTimeRef.current < config.beepInterval) return;

      lastBeepTimeRef.current = now;

      try {
        // Crear oscillator y gain node
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = config.frequency;
        oscillator.type = 'sine';

        // Envelope para el beep
        const now = audioContext.currentTime;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.1);

        oscillator.start(now);
        oscillator.stop(now + 0.1);
      } catch (e) {
        console.error('Error al reproducir beep:', e);
      }
    };

    const interval = setInterval(playBeep, 50);
    return () => clearInterval(interval);
  }, [isActive, alertLevel, audioContext, config.beepInterval, config.frequency]);

  if (!isActive) {
    return (
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="text-xl">🔊</span>
          Sistema de Alertas
        </h2>
        <div className="text-center py-8 text-gray-500">
          <p>Sistema inactivo</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <span className="text-xl">🔊</span>
        Sistema de Alertas
      </h2>

      {/* Indicador visual principal */}
      <motion.div
        animate={
          alertLevel === 'critical'
            ? { scale: [1, 1.05, 1] }
            : alertLevel === 'danger'
            ? { scale: [1, 1.02, 1] }
            : {}
        }
        transition={{ duration: 0.5, repeat: Infinity }}
        className={`${config.color} rounded-lg p-4 mb-4 border-2 ${config.borderColor}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{config.icon}</span>
            <div>
              <p className="text-white font-bold text-lg">{config.label}</p>
              <p className="text-white text-sm opacity-90">
                {distance < 15 ? '¡DETENGA EL VEHÍCULO!' : 'Continúe con precaución'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-white text-2xl font-bold">{Math.round(distance)}</p>
            <p className="text-white text-xs opacity-75">cm</p>
          </div>
        </div>
      </motion.div>

      {/* Barra de progreso */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
          <span>0 cm</span>
          <span>200 cm</span>
        </div>
        <div className="h-3 bg-gray-950 rounded-full overflow-hidden">
          <div
            className={`h-full ${config.color} transition-all duration-300`}
            style={{ width: `${Math.min((distance / 200) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Niveles de alerta */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-gray-400 mb-2">ZONAS DE ALERTA</div>
        <div className="grid grid-cols-5 gap-1 text-xs">
          <div className="bg-green-600 bg-opacity-20 border border-green-600 rounded p-1 text-center">
            <div className="text-green-400 font-bold">100+</div>
          </div>
          <div className="bg-blue-600 bg-opacity-20 border border-blue-600 rounded p-1 text-center">
            <div className="text-blue-400 font-bold">50-100</div>
          </div>
          <div className="bg-yellow-600 bg-opacity-20 border border-yellow-600 rounded p-1 text-center">
            <div className="text-yellow-400 font-bold">30-50</div>
          </div>
          <div className="bg-orange-600 bg-opacity-20 border border-orange-600 rounded p-1 text-center">
            <div className="text-orange-400 font-bold">15-30</div>
          </div>
          <div className="bg-red-600 bg-opacity-20 border border-red-600 rounded p-1 text-center">
            <div className="text-red-400 font-bold">&lt;15</div>
          </div>
        </div>
      </div>

      {/* Indicador de beep */}
      <div className="mt-4 pt-4 border-t border-gray-800">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Alertas acústicas:</span>
          {config.beepInterval > 0 ? (
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: config.beepInterval / 1000, repeat: Infinity }}
                className={`w-2 h-2 rounded-full ${config.color}`}
              />
              <span className={config.textColor}>
                {config.frequency} Hz / {config.beepInterval}ms
              </span>
            </div>
          ) : (
            <span className="text-gray-600">Desactivadas</span>
          )}
        </div>
      </div>
    </div>
  );
}
