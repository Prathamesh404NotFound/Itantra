import React from 'react';
import { CommunicatorProvider, useCommunicator } from './context/CommunicatorContext';
import { AppTopBar } from './components/AppTopBar';
import { EmergencyAlertBanner } from './components/EmergencyAlertBanner';
import { CommunicationScreen } from './screens/CommunicationScreen';
import { DevicesScreen } from './screens/DevicesScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { PerformanceScreen } from './screens/PerformanceScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { EmergencyDialog } from './dialogs/EmergencyDialog';
import { InteractiveDemoDialog } from './dialogs/InteractiveDemoDialog';
import { DiagnosticsDialog } from './dialogs/DiagnosticsDialog';
import { ModelManagerDialog } from './dialogs/ModelManagerDialog';
import { AccuracyTestingDialog } from './dialogs/AccuracyTestingDialog';
import { TtsTestingDialog } from './dialogs/TtsTestingDialog';
import { ArchitectureDiagramDialog } from './dialogs/ArchitectureDiagramDialog';
import { TwoPhonesSetupDialog } from './dialogs/TwoPhonesSetupDialog';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastContainer } from './components/ToastContainer';
import { AppTab } from './types';
import { Radio, Smartphone, History, Zap, Settings2 } from 'lucide-react';

const MainLayout: React.FC = () => {
  const {
    activeTab,
    selectTab,
    activeEmergencyAlert,
    dismissEmergencyAlert,
    toasts,
    dismissToast,
    resetFsmToIdle,
  } = useCommunicator();

  const tabs: { id: AppTab; label: string; icon: React.ReactNode }[] = [
    { id: 'COMMUNICATE', label: 'Communicate', icon: <Radio className="w-5 h-5" /> },
    { id: 'DEVICES', label: 'Devices', icon: <Smartphone className="w-5 h-5" /> },
    { id: 'HISTORY', label: 'History', icon: <History className="w-5 h-5" /> },
    { id: 'PERFORMANCE', label: 'Metrics', icon: <Zap className="w-5 h-5" /> },
    { id: 'SETTINGS', label: 'Settings', icon: <Settings2 className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#26211E] flex flex-col font-sans selection:bg-[#FCEEE8] selection:text-[#C7512E]">
      {/* Top Application Bar */}
      <AppTopBar />

      {/* Emergency Alert Banner (when critical SOS is received) */}
      <EmergencyAlertBanner
        alertPacket={activeEmergencyAlert}
        onDismiss={dismissEmergencyAlert}
      />

      {/* Primary Scrollable Content Area with Error Boundary Containment */}
      <main className="flex-1 max-w-4xl lg:max-w-6xl w-full mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4 pb-28 sm:pb-24">
        <ErrorBoundary onReset={() => resetFsmToIdle('ErrorBoundary recovery')}>
          {activeTab === 'COMMUNICATE' && <CommunicationScreen />}
          {activeTab === 'DEVICES' && <DevicesScreen />}
          {activeTab === 'HISTORY' && <HistoryScreen />}
          {activeTab === 'PERFORMANCE' && <PerformanceScreen />}
          {activeTab === 'SETTINGS' && <SettingsScreen />}
        </ErrorBoundary>
      </main>

      {/* Toast Notification Layer */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Fixed Tactical Navigation: Bottom docked on mobile, floating dock on tablet/desktop */}
      <nav
        id="app_bottom_nav"
        role="navigation"
        aria-label="Main Navigation"
        className="fixed bottom-0 md:bottom-4 left-0 right-0 md:left-1/2 md:-translate-x-1/2 md:w-auto md:min-w-[420px] md:max-w-lg z-40 bg-[#FFFFFF]/95 backdrop-blur-md border-t md:border border-[#E8E0D5] md:rounded-2xl pt-1 pb-[max(0.375rem,env(safe-area-inset-bottom,0px))] md:py-1.5 px-1 sm:px-3 md:px-4 shadow-lg md:shadow-xl transition-all"
      >
        <div className="max-w-md mx-auto flex items-center justify-around md:gap-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`nav_tab_${tab.id.toLowerCase()}`}
                onClick={() => selectTab(tab.id)}
                aria-label={tab.label}
                aria-current={isActive ? 'page' : undefined}
                className={`flex flex-col items-center justify-center min-h-[44px] min-w-[48px] py-1 px-1 sm:px-2.5 rounded-xl transition-all relative ${
                  isActive
                    ? 'text-[#C7512E] font-bold'
                    : 'text-[#6B625B] hover:text-[#26211E] font-medium'
                }`}
              >
                <div
                  className={`p-1 rounded-xl transition-all ${
                    isActive ? 'bg-[#FCEEE8]' : 'bg-transparent'
                  }`}
                >
                  {tab.icon}
                </div>
                <span className="text-[10px] sm:text-[11px] tracking-tight leading-none mt-0.5 whitespace-nowrap">
                  {tab.label}
                </span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C7512E] mt-0.5"></span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Modals and Dialog Overlays */}
      <EmergencyDialog />
      <InteractiveDemoDialog />
      <DiagnosticsDialog />
      <ModelManagerDialog />
      <AccuracyTestingDialog />
      <TtsTestingDialog />
      <ArchitectureDiagramDialog />
      <TwoPhonesSetupDialog />
    </div>
  );
};

export default function App() {
  return (
    <CommunicatorProvider>
      <MainLayout />
    </CommunicatorProvider>
  );
}
