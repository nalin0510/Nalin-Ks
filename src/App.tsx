import React, { useEffect, useState } from 'react';
import {
  Activity,
  BarChart3,
  BookOpen,
  Bot,
  HeartPulse,
  LayoutDashboard,
  Menu,
  PersonStanding,
  Settings,
  ShieldAlert,
  Waves,
  GitBranch,
  X,
} from 'lucide-react';
import { BloodFlowVisualizer } from './components/BloodFlowVisualizer';
import { CardiovascularMetrics } from './components/CardiovascularMetrics';
import { DiseaseSimulator } from './components/DiseaseSimulator';
import { ECGMonitor } from './components/ECGMonitor';
import { EducationalResources } from './components/EducationalResources';
import { HeartLabView } from './components/HeartLabView';
import { HumanExerciseSimulator } from './components/HumanExerciseSimulator';
import { LearningAssistant } from './components/LearningAssistant';
import { OverviewLanding } from './components/OverviewLanding';
import { ResearchCharts } from './components/ResearchCharts';
import { SettingsPanel } from './components/SettingsPanel';
import { SimulationControls } from './components/SimulationControls';
import { useSimulationStore } from './store/useSimulationStore';
import { NavSectionId } from './types/cardio';

const NAV_ITEMS: Array<{
  id: NavSectionId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'heart-lab', label: '3D Heart Laboratory', icon: HeartPulse },
  { id: 'exercise-sim', label: 'Human Exercise Simulator', icon: PersonStanding },
  { id: 'circulation', label: 'Blood Circulation', icon: GitBranch },
  { id: 'ecg-monitor', label: 'ECG Monitoring', icon: Waves },
  { id: 'analysis', label: 'Cardiovascular Analysis', icon: Activity },
  { id: 'disease-sim', label: 'Disease Simulation', icon: ShieldAlert },
  { id: 'analytics', label: 'Research Analytics', icon: BarChart3 },
  { id: 'ai-assistant', label: 'AI Medical Learning Assistant', icon: Bot },
  { id: 'education', label: 'Educational Resources', icon: BookOpen },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function App() {
  const { activeSection, setActiveSection } = useSimulationStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Shared global simulation clock loop synchronizing all views & telemetry
  useEffect(() => {
    let raf = 0;
    let last = performance.now();

    const loop = () => {
      const now = performance.now();
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      useSimulationStore.getState().stepSimulation(dt);
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const renderSection = () => {
    switch (activeSection) {
      case 'overview':
        return <OverviewLanding />;
      case 'heart-lab':
        return <HeartLabView />;
      case 'exercise-sim':
        return <HumanExerciseSimulator />;
      case 'circulation':
        return <BloodFlowVisualizer />;
      case 'ecg-monitor':
        return <ECGMonitor />;
      case 'analysis':
        return <CardiovascularMetrics />;
      case 'disease-sim':
        return <DiseaseSimulator />;
      case 'analytics':
        return <ResearchCharts />;
      case 'ai-assistant':
        return <LearningAssistant />;
      case 'education':
        return <EducationalResources />;
      case 'settings':
        return <SettingsPanel />;
      default:
        return <OverviewLanding />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#060A13] text-slate-100">
      {/* Desktop Sidebar Navigation */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-800/90 bg-[#080D18] lg:flex">
        <div className="border-b border-slate-800/80 px-5 py-4">
          <div className="text-sm font-bold tracking-tight text-white">
            CardioTwin Lab
          </div>
          <div className="mt-0.5 text-[11px] text-slate-400">
            3D Cardiovascular Simulation
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Primary Navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSection(item.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs font-medium transition-colors ${
                  active
                    ? 'bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-500/40'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-cyan-300' : 'text-slate-500'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="border-t border-slate-800/80 p-4 text-[11px] leading-relaxed text-slate-500">
          Educational &amp; research prototype. Outputs are illustrative only.
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/70"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative z-10 flex w-72 flex-col border-r border-slate-800 bg-[#080D18]">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
              <span className="text-sm font-bold text-white">CardioTwin Lab</span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded p-1 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto p-3">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveSection(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs font-medium ${
                      active
                        ? 'bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-500/40'
                        : 'text-slate-300 hover:bg-slate-800/70'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content Shell */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile Header Bar */}
        <header className="flex items-center justify-between border-b border-slate-800 bg-[#080D18] px-4 py-3 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open navigation menu"
            className="flex items-center gap-2 text-sm font-semibold text-white"
          >
            <Menu className="h-5 w-5 text-cyan-400" />
            <span>Digital Twin of the Human Heart</span>
          </button>
        </header>

        {/* Centralized Simulation Control Center */}
        <SimulationControls />

        {/* Active Section Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{renderSection()}</main>

        {/* Mandatory Scientific Integrity Disclaimer Footer */}
        <footer className="border-t border-slate-800/80 bg-[#070B14] px-6 py-4 text-center text-xs text-slate-400">
          This platform is an educational and research prototype. Simulated outputs are illustrative and must not be used for medical diagnosis or treatment.
        </footer>
      </div>
    </div>
  );
}
