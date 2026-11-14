import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle, ArrowRight, ShieldAlert, X } from 'lucide-react';
import { HealthAlert } from '../types/astra';

interface AlertToastProps {
  alert: HealthAlert | null;
  onDismiss: () => void;
  onInspect: () => void;
}

export const AlertToast: React.FC<AlertToastProps> = ({ alert, onDismiss, onInspect }) => {
  return (
    <div
      className="fixed bottom-5 right-5 z-50 w-[min(390px,calc(100vw-2.5rem))] pointer-events-none no-print"
      aria-live="polite"
    >
      <AnimatePresence>
        {alert && (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, x: 48, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 36, scale: 0.96 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className={`pointer-events-auto rounded-xl border bg-white p-4 shadow-lg ${
              alert.severity === 'WARNING' ? 'border-[#E8B8B8]' : 'border-[#EED1A2]'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-lg shrink-0 ${
                  alert.severity === 'WARNING'
                    ? 'bg-[#FDF4F4] text-[#C53B3B]'
                    : 'bg-[#FEF8EE] text-[#C97B18]'
                }`}
              >
                {alert.severity === 'WARNING' ? (
                  <ShieldAlert className="w-4 h-4" />
                ) : (
                  <AlertTriangle className="w-4 h-4" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-xs font-semibold ${
                      alert.severity === 'WARNING' ? 'text-[#B83232]' : 'text-[#A86211]'
                    }`}
                  >
                    {alert.severity === 'WARNING' ? 'Warning Alert' : 'Attention Alert'} ·{' '}
                    {alert.astronautName}
                  </span>
                  <button
                    type="button"
                    onClick={onDismiss}
                    className="p-1 text-[#718096] hover:text-[#172B45] rounded-md"
                    aria-label="Dismiss alert notification"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-xs font-medium text-[#172B45] mt-0.5">
                  {alert.parameter}:{' '}
                  <span className="font-mono tabular-nums font-semibold">{alert.currentValue}</span>
                </div>
                <p className="text-xs text-[#718096] mt-1 line-clamp-2 leading-relaxed">
                  {alert.explanation}
                </p>

                <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-mono tabular-nums text-[#718096]">
                    {new Date(alert.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <button
                    type="button"
                    onClick={onInspect}
                    className="astra-btn inline-flex items-center gap-1 text-xs font-semibold text-[#2878C7] hover:text-[#2065A9]"
                  >
                    <span>Open Alert Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
