import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  Dumbbell,
  FileText,
  HeartPulse,
  LayoutDashboard,
  Menu,
  Moon,
  Orbit,
  Play,
  RotateCcw,
  Settings as SettingsIcon,
  Square,
  ThermometerSun,
  Users,
  X,
} from 'lucide-react';
import { useAstra } from '../context/AstraContext';
import { NavSection, ScenarioMode } from '../types/astra';
import { AlertToast } from './AlertToast';

interface LayoutProps {
  activeSection: NavSection;
  onNavigate: (section: NavSection) => void;
  children: React.ReactNode;
}

const NAV_ITEMS: { id: NavSection; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'overview', label: 'Mission Overview', icon: LayoutDashboard },
  { id: 'profiles', label: 'Astronaut Profiles', icon: Users },
  { id: 'live', label: 'Live Health Monitoring', icon: Activity },
  { id: 'analytics', label: 'Health Analytics', icon: BarChart3 },
  { id: 'sleep', label: 'Sleep & Wellness', icon: Moon },
  { id: 'activity', label: 'Physical Activity', icon: Dumbbell },
  { id: 'environment', label: 'Environmental Monitoring', icon: ThermometerSun },
  { id: 'alerts', label: 'Alerts & Notifications', icon: Bell },
  { id: 'reports', label: 'Mission Reports', icon: FileText },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

export const Layout: React.FC<LayoutProps> = ({ activeSection, onNavigate, children }) => {
  const {
    state,
    isMonitoring,
    isOnline,
    startMonitoring,
    stopMonitoring,
    setScenarioMode,
    resetDemo,
    toastAlert,
    dismissToast,
  } = useAstra();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeAlertsCount = state.alerts.filter((a) => a.status !== 'RESOLVED').length;
  const activeSectionMeta = NAV_ITEMS.find((item) => item.id === activeSection);

  const handleNavClick = (section: NavSection) => {
    onNavigate(section);
    setMobileMenuOpen(false);
  };

  const scenarioOptions: { id: ScenarioMode; label: string }[] = [
    { id: 'NORMAL', label: 'Normal' },
    { id: 'ATTENTION', label: 'Attention' },
    { id: 'WARNING', label: 'Warning' },
  ];

  return (
    <div className="min-h-screen flex bg-[#F5F7FA] text-[#172B45]">
      {/* Mobile Sidebar Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-[#101D32]/60 z-40 lg:hidden no-print"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Deep Navy Sidebar (#101D32) with Refined Active Highlight */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#101D32] text-slate-100 flex flex-col border-r border-[#1C2D4A] transition-transform duration-200 lg:translate-x-0 lg:static lg:shrink-0 no-print ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-[#1C2D4A] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1A2D4D] border border-[#2878C7]/45 flex items-center justify-center shrink-0">
              <Orbit className="w-4.5 h-4.5 text-[#55B9E8]" />
            </div>
            <div className="leading-tight">
              <span className="font-semibold text-base tracking-tight text-white block">ASTRA</span>
              <span className="text-[11px] text-slate-400 block">Health Monitor Prototype</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-2 rounded-md text-slate-400 hover:text-white hover:bg-[#192B47]"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links with Refined Subtle Active Highlight */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`astra-btn group relative w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-left ${
                  isActive
                    ? 'text-white'
                    : 'text-slate-300/90 hover:text-white hover:bg-[#162742]'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active-highlight"
                    transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                    className="absolute inset-0 rounded-lg bg-[#1A2E4C] border border-[#2878C7]/35"
                    aria-hidden="true"
                  />
                )}
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active-bar"
                    transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                    className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-[#55B9E8]"
                    aria-hidden="true"
                  />
                )}

                <span className="relative z-10 flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-transform duration-150 group-hover:translate-x-0.5 ${
                      isActive ? 'text-[#55B9E8]' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </span>

                {item.id === 'alerts' && activeAlertsCount > 0 && (
                  <span
                    className={`relative z-10 ml-2 px-1.5 py-0.5 text-[11px] font-mono tabular-nums rounded ${
                      isActive
                        ? 'bg-[#2878C7]/30 text-[#BCE6FA] border border-[#55B9E8]/35'
                        : 'bg-[#C53B3B]/20 text-[#F5B5B5] border border-[#C53B3B]/35'
                    }`}
                  >
                    {activeAlertsCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Mission Footer */}
        <div className="p-4 border-t border-[#1C2D4A] space-y-2 shrink-0 bg-[#0C1729]">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span>Mission: {state.settings.mission.name}</span>
            <span className="font-mono tabular-nums text-[#55B9E8]">
              Day {state.settings.mission.currentDay}/{state.settings.mission.durationDays}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 leading-relaxed">
            Fictional demonstration prototype. Local storage active ({isOnline ? 'Online' : 'Offline Mode'}).
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between gap-3 shrink-0 sticky top-0 z-30 no-print">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-[#718096] hover:text-[#172B45] hover:bg-slate-100 min-w-[40px] min-h-[40px] flex items-center justify-center"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-semibold text-[#172B45] truncate">
                {activeSectionMeta?.label}
              </h1>
            </div>
          </div>

          {/* Right Controls: Live Telemetry Heartbeat + Scenario Selector + Reset + Monitoring */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('live')}
              className={`hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-mono font-medium transition-colors whitespace-nowrap shrink-0 ${
                isMonitoring
                  ? 'bg-[#EEF8FD] border-[#B6E2F7] text-[#172B45] astra-live-glow'
                  : 'bg-[#F5F7FA] border-slate-200 text-[#718096] hover:text-[#172B45]'
              }`}
              title="Open Live Health Monitoring"
            >
              <HeartPulse
                className={`w-3.5 h-3.5 ${
                  isMonitoring ? 'text-[#2878C7] astra-heartbeat-active' : 'text-[#718096]'
                }`}
              />
              <span>LIVE MONITORING</span>
              <span className="text-slate-300">·</span>
              <span className={isMonitoring ? 'text-[#2878C7]' : ''}>
                {isMonitoring ? 'ACTIVE' : 'STANDBY'}
              </span>
            </button>

            {/* Scenario Mode Segmented Selector (Restrained neutral active framing) */}
            <div
              className="hidden md:flex items-center bg-[#F5F7FA] p-1 rounded-lg border border-slate-200"
              role="group"
              aria-label="Demonstration scenario selector"
            >
              <span className="text-[11px] font-medium text-[#718096] px-2 whitespace-nowrap">
                Demo Scenario
              </span>
              {scenarioOptions.map((opt) => {
                const active = state.scenarioMode === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setScenarioMode(opt.id)}
                    className={`astra-btn px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
                      active
                        ? opt.id === 'WARNING'
                          ? 'bg-[#C53B3B] text-white shadow-xs'
                          : opt.id === 'ATTENTION'
                            ? 'bg-[#C97B18] text-white shadow-xs'
                            : 'bg-[#2878C7] text-white shadow-xs'
                        : 'text-[#718096] hover:text-[#172B45]'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {/* Reset Demo Button */}
            <button
              type="button"
              onClick={resetDemo}
              title="Reset Demo Data"
              className="astra-btn hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] text-xs font-medium text-[#172B45] bg-white border border-slate-200 rounded-lg hover:bg-[#F5F7FA] whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#718096]" />
              <span>Reset Demo</span>
            </button>

            {/* Start / Stop Monitoring Toggle */}
            {isMonitoring ? (
              <button
                type="button"
                onClick={stopMonitoring}
                className="astra-btn inline-flex items-center gap-1.5 px-3.5 py-1.5 min-h-[36px] text-xs font-medium text-white bg-[#C53B3B] hover:bg-[#AE3131] rounded-lg whitespace-nowrap shrink-0 shadow-xs"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop Monitoring</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={startMonitoring}
                className="astra-btn inline-flex items-center gap-1.5 px-3.5 py-1.5 min-h-[36px] text-xs font-medium text-white bg-[#2878C7] hover:bg-[#2065A9] rounded-lg whitespace-nowrap shrink-0 shadow-xs"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start Monitoring</span>
              </button>
            )}
          </div>
        </header>

        {/* Mobile Scenario Switcher Strip */}
        <div className="md:hidden bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between gap-2 no-print">
          <div className="flex items-center gap-1.5 text-xs text-[#718096]">
            <AlertTriangle className="w-3.5 h-3.5 text-[#718096]" />
            <span>Scenario:</span>
          </div>
          <div className="flex items-center gap-1 bg-[#F5F7FA] p-0.5 rounded-md border border-slate-200">
            {scenarioOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setScenarioMode(opt.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded ${
                  state.scenarioMode === opt.id
                    ? 'bg-[#2878C7] text-white'
                    : 'text-[#718096]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto print-full">
          {children}
        </main>
      </div>

      {/* Smooth Slide-in Alert Toast */}
      <AlertToast
        alert={toastAlert}
        onDismiss={dismissToast}
        onInspect={() => {
          dismissToast();
          onNavigate('alerts');
        }}
      />
    </div>
  );
};
