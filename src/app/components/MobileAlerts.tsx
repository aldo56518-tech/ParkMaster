import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';

interface MobileAlertsProps {
  distance: number;
  isActive: boolean;
  impactDetected: boolean;
  audioContext: AudioContext | null;
}

type AlertLevel = 'safe' | 'caution' | 'warning' | 'danger' | 'critical';

export function MobileAlerts({ distance, isActive, impactDetected, audioContext }: MobileAlertsProps) {
  const lastBeepTimeRef = useRef<number>(0);

  // Determinar nivel de alerta
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
      color: 'bg-green-600',
      beepInterval: 0,
      frequency: 0,
      icon: '✓',
    },
    caution: {
      color: 'bg-blue-600',
      beepInterval: 2000,
      frequency: 400,
      icon: 'ℹ',
    },
    warning: {
      color: 'bg-yellow-600',
      beepInterval: 1000,
      frequency: 600,
      icon: '⚠',
    },
    danger: {
      color: 'bg-orange-600',
      beepInterval: 500,
      frequency: 800,
      icon: '⚠',
    },
    critical: {
      color: 'bg-red-600',
      beepInterval: 200,
      frequency: 1000,
      icon: '🚨',
    },
  };

  const config = alertConfig[alertLevel];

  // Sistema de beeps
  useEffect(() => {
    if (!isActive || !audioContext || config.beepInterval === 0) return;

    const playBeep = () => {
      const now = Date.now();
      if (now - lastBeepTimeRef.current < config.beepInterval) return;

      lastBeepTimeRef.current = now;

      try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = config.frequency;
        oscillator.type = 'sine';

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

  if (!isActive) return null;

  return (
    <>
      {/* Indicador de distancia grande en el centro superior */}
      <motion.div
        animate={
          alertLevel === 'critical'
            ? { scale: [1, 1.1, 1] }
            : alertLevel === 'danger'
            ? { scale: [1, 1.05, 1] }
            : {}
        }
        transition={{ duration: 0.5, repeat: Infinity }}
        className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${config.color} rounded-2xl px-8 py-6 shadow-2xl z-30 pointer-events-none`}
      >
        <div className="text-center">
          <div className="text-6xl font-bold text-white mb-1">{Math.round(distance)}</div>
          <div className="text-xl text-white opacity-90">cm</div>
        </div>
      </motion.div>

      {/* Barra de progreso inferior */}
      <div className="fixed bottom-0 left-0 right-0 h-20 bg-black bg-opacity-50 backdrop-blur-sm z-30 pointer-events-none">
        <div className="h-full flex items-center px-4">
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs text-white mb-2">
              <span className="font-semibold">{config.icon} {alertLevel.toUpperCase()}</span>
              <span>{config.beepInterval > 0 ? `${config.frequency} Hz` : 'Silencio'}</span>
            </div>
            <div className="h-3 bg-gray-900 rounded-full overflow-hidden">
              <motion.div
                className={`h-full ${config.color}`}
                animate={{ width: `${Math.min((distance / 200) * 100, 100)}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Alertas laterales para crítico */}
      {alertLevel === 'critical' && (
        <>
          <motion.div
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            className="fixed left-0 top-0 bottom-0 w-8 bg-red-600 z-20 pointer-events-none"
          />
          <motion.div
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            className="fixed right-0 top-0 bottom-0 w-8 bg-red-600 z-20 pointer-events-none"
          />
        </>
      )}

      {/* Indicador de beep */}
      {config.beepInterval > 0 && (
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: config.beepInterval / 1000, repeat: Infinity }}
          className={`fixed top-6 left-1/2 transform -translate-x-1/2 w-4 h-4 ${config.color} rounded-full z-30 pointer-events-none shadow-lg`}
        />
      )}
    </>
  );
}
