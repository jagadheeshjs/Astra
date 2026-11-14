import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Check, CheckCheck } from 'lucide-react';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { StatusIndicator } from '../components/StatusBadge';
import { useAstra } from '../context/AstraContext';

export const AlertsNotifications: React.FC = () => {
  const { state, acknowledgeAlert, resolveAlert } = useAstra();

  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'WARNING' | 'ATTENTION'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'UNRESOLVED' | 'RESOLVED' | 'ALL'>('UNRESOLVED');
  const [astronautFilter, setAstronautFilter] = useState<string>('ALL');

  const counts = useMemo(() => {
    const active = state.alerts.filter((a) => a.status !== 'RESOLVED').length;
    const resolved = state.alerts.filter((a) => a.status === 'RESOLVED').length;
    const warning = state.alerts.filter(
      (a) => a.status !== 'RESOLVED' && a.severity === 'WARNING'
    ).length;
    return { active, resolved, warning };
  }, [state.alerts]);

  const filteredAlerts = useMemo(() => {
    return state.alerts.filter((a) => {
      if (severityFilter !== 'ALL' && a.severity !== severityFilter) return false;
      if (statusFilter === 'UNRESOLVED' && a.status === 'RESOLVED') return false;
      if (statusFilter === 'RESOLVED' && a.status !== 'RESOLVED') return false;
      if (astronautFilter !== 'ALL' && a.astronautId !== astronautFilter) return false;
      return true;
    });
  }, [state.alerts, severityFilter, statusFilter, astronautFilter]);

  return (
    <div className="space-y-6">
      {/* Summary Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="astra-card astra-card-surface p-5">
          <div className="text-xs font-medium text-[#718096]">Active / Unresolved Alerts</div>
          <div className="text-2xl font-semibold font-mono tabular-nums text-[#172B45] mt-2">
            <AnimatedNumber value={counts.active} />
          </div>
          <div className="text-xs text-[#718096] mt-1.5">Includes active and acknowledged</div>
        </div>

        <div className="astra-card astra-card-surface p-5">
          <div className="text-xs font-medium text-[#718096]">Active Warning Level</div>
          <div
            className={`text-2xl font-semibold font-mono tabular-nums mt-2 ${
              counts.warning > 0 ? 'text-[#C53B3B]' : 'text-[#172B45]'
            }`}
          >
            <AnimatedNumber value={counts.warning} />
          </div>
          <div className="text-xs text-[#718096] mt-1.5">Crossed demonstration threshold</div>
        </div>

        <div className="astra-card astra-card-surface p-5">
          <div className="text-xs font-medium text-[#718096]">Resolved Alerts</div>
          <div className="text-2xl font-semibold font-mono tabular-nums text-[#172B45] mt-2">
            <AnimatedNumber value={counts.resolved} />
          </div>
          <div className="text-xs text-[#718096] mt-1.5">Logged in alert history</div>
        </div>
      </section>

      {/* Filter Bar */}
      <section className="astra-card p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Tab Group */}
          <div className="flex items-center bg-[#F5F7FA] border border-slate-200/70 p-1 rounded-lg">
            {[
              { id: 'UNRESOLVED', label: `Active (${counts.active})` },
              { id: 'RESOLVED', label: `Resolved (${counts.resolved})` },
              { id: 'ALL', label: 'All History' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id as 'UNRESOLVED' | 'RESOLVED' | 'ALL')}
                className={`astra-btn px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  statusFilter === tab.id
                    ? 'bg-white text-[#172B45] shadow-xs border border-slate-200/60'
                    : 'text-[#718096] hover:text-[#172B45]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Severity Tab Group */}
          <div className="flex items-center bg-[#F5F7FA] border border-slate-200/70 p-1 rounded-lg">
            {(['ALL', 'WARNING', 'ATTENTION'] as const).map((sev) => (
              <button
                key={sev}
                type="button"
                onClick={() => setSeverityFilter(sev)}
                className={`astra-btn px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  severityFilter === sev
                    ? 'bg-white text-[#172B45] shadow-xs border border-slate-200/60'
                    : 'text-[#718096] hover:text-[#172B45]'
                }`}
              >
                {sev === 'ALL' ? 'All Severities' : sev === 'WARNING' ? 'Warning' : 'Attention'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="alert-astro-filter" className="text-xs text-[#718096]">
            Filter Crew / Source:
          </label>
          <select
            id="alert-astro-filter"
            value={astronautFilter}
            onChange={(e) => setAstronautFilter(e.target.value)}
            className="text-xs font-medium text-[#172B45] bg-[#F5F7FA] border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#2878C7]/35 focus:border-[#2878C7]"
          >
            <option value="ALL">All Astronauts &amp; Cabin</option>
            {state.astronauts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.code})
              </option>
            ))}
            <option value="ENV-CABIN">ORBIT-01 Cabin</option>
          </select>
        </div>
      </section>

      {/* Alerts List */}
      <section className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="astra-card p-10 text-center space-y-1.5">
            <p className="text-sm font-medium text-[#172B45]">No matching alerts found</p>
            <p className="text-xs text-[#718096]">
              Switch demonstration scenario to Attention or Warning, or adjust your active filters.
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className={`astra-card astra-card-surface p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                alert.status !== 'RESOLVED' && alert.severity === 'WARNING'
                  ? 'border-[#E8B8B8]'
                  : alert.status !== 'RESOLVED' && alert.severity === 'ATTENTION'
                    ? 'border-[#EED1A2]'
                    : ''
              }`}
            >
              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <StatusIndicator status={alert.severity} />
                  <span className="font-semibold text-sm text-[#172B45]">{alert.astronautName}</span>
                  <span aria-hidden="true" className="text-slate-300">·</span>
                  <span className="font-medium text-[#172B45]">{alert.parameter}</span>
                  <span aria-hidden="true" className="text-slate-300">·</span>
                  <span className="font-mono tabular-nums font-medium text-[#172B45]">
                    Reading: {alert.currentValue}
                  </span>
                  <span aria-hidden="true" className="text-slate-300">·</span>
                  <span className="font-mono text-[#718096]">{alert.baselineOrThreshold}</span>
                </div>

                <p className="text-sm text-[#172B45] leading-relaxed">{alert.explanation}</p>

                <div className="flex flex-wrap items-center gap-2 text-xs text-[#718096]">
                  <span className="font-mono tabular-nums">
                    {new Date(alert.timestamp).toLocaleString()}
                  </span>
                  <span aria-hidden="true" className="text-slate-300">·</span>
                  <span>
                    Status:{' '}
                    <strong
                      className={
                        alert.status === 'RESOLVED'
                          ? 'text-[#1E7E53]'
                          : alert.status === 'ACKNOWLEDGED'
                            ? 'text-[#2878C7]'
                            : 'text-[#A86211]'
                      }
                    >
                      {alert.status}
                    </strong>
                  </span>
                </div>
              </div>

              {alert.status !== 'RESOLVED' && (
                <div className="flex items-center gap-2 shrink-0">
                  {alert.status === 'ACTIVE' && (
                    <button
                      type="button"
                      onClick={() => acknowledgeAlert(alert.id)}
                      className="astra-btn inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#172B45] bg-white border border-slate-200 rounded-lg hover:bg-[#F5F7FA] whitespace-nowrap"
                    >
                      <Check className="w-3.5 h-3.5 text-[#718096]" />
                      <span>Acknowledge</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => resolveAlert(alert.id)}
                    className="astra-btn inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#2878C7] hover:bg-[#2065A9] rounded-lg whitespace-nowrap"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Resolve</span>
                  </button>
                </div>
              )}
            </motion.div>
          ))
        )}
      </section>
    </div>
  );
};
