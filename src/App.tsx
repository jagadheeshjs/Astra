/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { IntroSplash } from './components/IntroSplash';
import { Layout } from './components/Layout';
import { AstraProvider } from './context/AstraContext';
import { AlertsNotifications } from './pages/AlertsNotifications';
import { AstronautProfiles } from './pages/AstronautProfiles';
import { EnvironmentalMonitoring } from './pages/EnvironmentalMonitoring';
import { HealthAnalytics } from './pages/HealthAnalytics';
import { LiveHealthMonitoring } from './pages/LiveHealthMonitoring';
import { MissionOverview } from './pages/MissionOverview';
import { MissionReports } from './pages/MissionReports';
import { PhysicalActivity } from './pages/PhysicalActivity';
import { Settings } from './pages/Settings';
import { SleepWellness } from './pages/SleepWellness';
import { NavSection } from './types/astra';

const INTRO_SESSION_KEY = 'astra_intro_seen_v1';

function shouldShowIntroInitially(): boolean {
  try {
    return window.sessionStorage.getItem(INTRO_SESSION_KEY) !== 'true';
  } catch {
    return true;
  }
}

function AstraWorkspace() {
  const [activeSection, setActiveSection] = useState<NavSection>('overview');
  const [showIntro, setShowIntro] = useState<boolean>(shouldShowIntroInitially);
  const [introRunId, setIntroRunId] = useState<number>(0);

  const handleIntroComplete = useCallback(() => {
    try {
      window.sessionStorage.setItem(INTRO_SESSION_KEY, 'true');
    } catch {
      // Ignore storage access errors in restricted contexts
    }
    setShowIntro(false);
  }, []);

  const handleReplayIntro = useCallback(() => {
    setActiveSection('overview');
    setIntroRunId((prev) => prev + 1);
    setShowIntro(true);
  }, []);

  const renderSection = () => {
    switch (activeSection) {
      case 'overview':
        return <MissionOverview onNavigate={setActiveSection} />;
      case 'profiles':
        return <AstronautProfiles onNavigate={setActiveSection} />;
      case 'live':
        return <LiveHealthMonitoring />;
      case 'analytics':
        return <HealthAnalytics />;
      case 'sleep':
        return <SleepWellness />;
      case 'activity':
        return <PhysicalActivity />;
      case 'environment':
        return <EnvironmentalMonitoring />;
      case 'alerts':
        return <AlertsNotifications />;
      case 'reports':
        return <MissionReports />;
      case 'settings':
        return <Settings onReplayIntro={handleReplayIntro} />;
      default:
        return <MissionOverview onNavigate={setActiveSection} />;
    }
  };

  return (
    <>
      <Layout activeSection={activeSection} onNavigate={setActiveSection}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.17, ease: [0.16, 1, 0.3, 1] }}
          >
            {renderSection()}
          </motion.div>
        </AnimatePresence>
      </Layout>

      {showIntro && <IntroSplash key={introRunId} onComplete={handleIntroComplete} />}
    </>
  );
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <AstraProvider>
        <AstraWorkspace />
      </AstraProvider>
    </MotionConfig>
  );
}
