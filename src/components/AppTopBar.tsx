import React from 'react';
import { useCommunicator } from '../context/CommunicatorContext';
import { Flame, RotateCcw, Wifi, Bluetooth, Radio, ShieldCheck } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

export const AppTopBar: React.FC = () => {
  const {
    connectedDevice,
    transportType,
    setShowEmergencyPanel,
    refreshAppState,
  } = useCommunicator();

  return (
    <header
      id="app_top_bar"
      role="banner"
      className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E8E0D5] px-2.5 sm:px-4 py-2 sm:py-3 pt-[max(0.5rem,env(safe-area-inset-top,0px))]"
    >
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
        {/* Brand identity */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#C7512E] flex items-center justify-center text-white shadow-sm shrink-0">
            <Radio className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-[#26211E] leading-none">
                iTantra
              </h1>
              <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#FEF3C7] text-[#B45309]">
                Offline
              </span>
            </div>
            <p className="hidden min-[380px]:block text-[10px] sm:text-[11px] text-[#6B625B] font-medium tracking-tight mt-0.5 truncate">
              Multilingual Voice Mesh
            </p>
          </div>
        </div>

        {/* Status Indicators & SOS Action */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Mobile Connection status badge */}
          <div
            className="flex md:hidden items-center gap-1 px-2 py-1 rounded-full bg-[#FFFFFF] border border-[#E8E0D5] text-[11px] font-semibold text-[#26211E] shadow-2xs"
            title={connectedDevice ? `Connected to ${connectedDevice.deviceName}` : 'Mesh Standby'}
          >
            {transportType === 'WIFI_DIRECT' ? (
              <Wifi className="w-3 h-3 text-[#C7512E]" />
            ) : (
              <Bluetooth className="w-3 h-3 text-[#C7512E]" />
            )}
            <span className="truncate max-w-[68px]">
              {connectedDevice ? connectedDevice.deviceName : 'Mesh'}
            </span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                connectedDevice ? 'bg-[#16A34A]' : 'bg-[#B45309]'
              }`}
            ></span>
          </div>

          {/* Desktop & Tablet Connection status pill */}
          <div
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FFFFFF] border border-[#E8E0D5] text-xs font-semibold text-[#26211E] shadow-2xs"
            title={connectedDevice ? `Active Peer: ${connectedDevice.deviceName} (${transportType})` : 'Mesh Standby'}
          >
            {transportType === 'WIFI_DIRECT' ? (
              <Wifi className="w-3.5 h-3.5 text-[#C7512E]" />
            ) : (
              <Bluetooth className="w-3.5 h-3.5 text-[#C7512E]" />
            )}
            <span className="truncate max-w-[110px] sm:max-w-[140px]">
              {connectedDevice ? connectedDevice.deviceName : 'Mesh Ready'}
            </span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                connectedDevice ? 'bg-[#16A34A] animate-pulse' : 'bg-[#B45309]'
              }`}
            ></span>
          </div>

          {/* Zero Internet guarantee pill */}
          <div className="hidden lg:flex items-center gap-1 px-2 py-1 rounded-full bg-[#FEF3C7] text-[11px] font-bold text-[#B45309]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>0 KB Cloud</span>
          </div>

          {/* Android Download / Install Button */}
          <PWAInstallButton />

          {/* Reset / Refresh */}
          <button
            id="btn_refresh_app"
            onClick={refreshAppState}
            title="Refresh Audio & Network Stack"
            aria-label="Refresh Audio and Network Stack"
            className="p-2 min-w-[38px] min-h-[38px] flex items-center justify-center rounded-xl text-[#6B625B] hover:text-[#26211E] hover:bg-[#F4ECE4] transition-colors border border-transparent hover:border-[#E8E0D5]"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* SOS Emergency Trigger */}
          <button
            id="btn_emergency_trigger"
            onClick={() => setShowEmergencyPanel(true)}
            aria-label="Trigger Emergency SOS Broadcast"
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 min-h-[38px] rounded-xl bg-[#B91C1C] hover:bg-[#991B1B] text-white text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            <Flame className="w-3.5 h-3.5 fill-white shrink-0" />
            <span className="hidden min-[420px]:inline">EMERGENCY </span>
            <span>SOS</span>
          </button>
        </div>
      </div>
    </header>
  );
};
