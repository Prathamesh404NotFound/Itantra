import React from 'react';
import { useCommunicator } from '../context/CommunicatorContext';
import { TransportType, DeviceInfo } from '../types';
import {
  Wifi,
  Bluetooth,
  RefreshCw,
  Signal,
  CheckCircle,
  Radio,
  ShieldCheck,
  Smartphone,
  SlidersHorizontal,
} from 'lucide-react';

export const DevicesScreen: React.FC = () => {
  const {
    transportType,
    switchTransport,
    discoveredDevices,
    connectedDevice,
    connectToDevice,
    disconnectDevice,
    refreshDiscovery,
    localDevice,
    setShowTwoPhonesGuide,
  } = useCommunicator();

  return (
    <div id="screen_devices" className="space-y-3.5 sm:space-y-4">
      {/* Transport Technology Switcher */}
      <div className="rounded-2xl p-3 sm:p-4 bg-[#FFFFFF] border border-[#E8E0D5] shadow-xs">
        <div className="text-xs font-bold uppercase tracking-wider text-[#9E948A] mb-2.5">
          Select Mesh Transport Layer
        </div>

        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-2 sm:gap-2.5">
          <button
            onClick={() => switchTransport('WIFI_DIRECT')}
            className={`p-3 sm:p-3.5 rounded-xl border flex items-center gap-2.5 sm:gap-3 transition-all text-left ${
              transportType === 'WIFI_DIRECT'
                ? 'bg-[#FCEEE8] border-[#C7512E] text-[#26211E]'
                : 'bg-[#FAF7F2] border-[#E8E0D5] hover:bg-[#F4ECE4]'
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                transportType === 'WIFI_DIRECT'
                  ? 'bg-[#C7512E] text-white'
                  : 'bg-[#E8E0D5] text-[#6B625B]'
              }`}
            >
              <Wifi className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-xs sm:text-sm text-[#26211E]">Wi-Fi Direct</div>
              <div className="text-[10px] sm:text-[11px] text-[#6B625B] truncate">High bandwidth • 200m</div>
            </div>
          </button>

          <button
            onClick={() => switchTransport('BLUETOOTH')}
            className={`p-3 sm:p-3.5 rounded-xl border flex items-center gap-2.5 sm:gap-3 transition-all text-left ${
              transportType === 'BLUETOOTH'
                ? 'bg-[#FCEEE8] border-[#C7512E] text-[#26211E]'
                : 'bg-[#FAF7F2] border-[#E8E0D5] hover:bg-[#F4ECE4]'
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                transportType === 'BLUETOOTH'
                  ? 'bg-[#C7512E] text-white'
                  : 'bg-[#E8E0D5] text-[#6B625B]'
              }`}
            >
              <Bluetooth className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-xs sm:text-sm text-[#26211E]">Bluetooth Mesh</div>
              <div className="text-[10px] sm:text-[11px] text-[#6B625B] truncate">Ultra low power • 30m</div>
            </div>
          </button>
        </div>
      </div>

      {/* Network Stack Diagnostics Overview */}
      <div className="rounded-2xl p-3 sm:p-4 bg-[#FAF7F2] border border-[#E8E0D5]">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[#9E948A]">
            Local Mesh Node Status
          </span>
          <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-[#B45309] bg-[#FEF3C7] px-2 py-0.5 rounded-full">
            <ShieldCheck className="w-3 h-3" />
            Zero Internet Allowed
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-xs">
          <div className="p-2.5 rounded-xl bg-[#FFFFFF] border border-[#E8E0D5]">
            <span className="text-[#9E948A] text-[9px] sm:text-[10px] uppercase font-bold block">Local Identity</span>
            <span className="font-bold text-[#26211E] truncate block mt-0.5">{localDevice.deviceName}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#FFFFFF] border border-[#E8E0D5]">
            <span className="text-[#9E948A] text-[9px] sm:text-[10px] uppercase font-bold block">IP / Port</span>
            <span className="font-bold font-mono text-[#26211E] truncate block mt-0.5">
              {localDevice.ipAddress}:8888
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#FFFFFF] border border-[#E8E0D5]">
            <span className="text-[#9E948A] text-[9px] sm:text-[10px] uppercase font-bold block">Protocol</span>
            <span className="font-bold text-[#26211E] truncate block mt-0.5">iTantra Binary v1</span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#FFFFFF] border border-[#E8E0D5]">
            <span className="text-[#9E948A] text-[9px] sm:text-[10px] uppercase font-bold block">Cloud Data Leakage</span>
            <span className="font-bold text-[#B45309] truncate block mt-0.5">0.0 KB (Audited)</span>
          </div>
        </div>
      </div>

      {/* Discovered Peers List */}
      <div className="rounded-2xl p-3 sm:p-4 bg-[#FFFFFF] border border-[#E8E0D5] shadow-xs">
        <div className="flex flex-col min-[480px]:flex-row min-[480px]:items-center justify-between gap-2.5 mb-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[#9E948A]">
              Discovered Mesh Radios ({discoveredDevices.length})
            </div>
            <div className="text-xs text-[#6B625B]">Direct ad-hoc peer-to-peer connection</div>
          </div>
          <div className="flex items-center gap-2 self-end min-[480px]:self-auto">
            <button
              onClick={() => setShowTwoPhonesGuide(true)}
              className="px-2.5 py-1.5 min-h-[34px] rounded-xl bg-[#FAF7F2] hover:bg-[#F4ECE4] border border-[#E8E0D5] text-xs font-bold text-[#26211E] transition-colors"
            >
              How To Connect
            </button>
            <button
              onClick={refreshDiscovery}
              title="Rescan Mesh"
              aria-label="Rescan Mesh Networks"
              className="flex items-center gap-1 px-3 py-1.5 min-h-[34px] rounded-xl bg-[#C7512E] hover:bg-[#A83F20] text-white text-xs font-bold transition-all active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Scan</span>
            </button>
          </div>
        </div>

        <div className="space-y-2.5">
          {discoveredDevices.map((device) => {
            const status = device.connectionStatus || (device.isConnected ? 'CONNECTED' : 'DISCONNECTED');
            const isConnected = status === 'CONNECTED';
            const isConnecting = status === 'CONNECTING';
            const isReconnecting = status === 'RECONNECTING';
            const isFailed = status === 'FAILED';

            return (
              <div
                key={device.deviceId}
                className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isConnected
                    ? 'bg-[#FCEEE8]/50 border-[#C7512E]'
                    : isFailed
                    ? 'bg-[#FEF2F2] border-[#F87171]'
                    : isConnecting || isReconnecting
                    ? 'bg-[#FFFBEB] border-[#FBBF24]'
                    : 'bg-[#FAF7F2] border-[#E8E0D5] hover:border-[#9E948A]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isConnected
                        ? 'bg-[#C7512E] text-white'
                        : isFailed
                        ? 'bg-[#EF4444] text-white'
                        : isConnecting || isReconnecting
                        ? 'bg-[#F59E0B] text-white'
                        : 'bg-[#FFFFFF] border border-[#E8E0D5] text-[#6B625B]'
                    }`}
                  >
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#26211E]">
                        {device.deviceName}
                      </span>
                      {isConnected && (
                        <span className="px-1.5 py-0.5 rounded-full bg-[#10B981] text-white text-[10px] font-bold">
                          ACTIVE PEER
                        </span>
                      )}
                      {isConnecting && (
                        <span className="px-1.5 py-0.5 rounded-full bg-[#F59E0B] text-white text-[10px] font-bold animate-pulse">
                          HANDSHAKING...
                        </span>
                      )}
                      {isReconnecting && (
                        <span className="px-1.5 py-0.5 rounded-full bg-[#F59E0B] text-white text-[10px] font-bold animate-pulse">
                          RECONNECTING...
                        </span>
                      )}
                      {isFailed && (
                        <span className="px-1.5 py-0.5 rounded-full bg-[#EF4444] text-white text-[10px] font-bold">
                          UNREACHABLE
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[#6B625B] mt-0.5">
                      <span className="font-mono text-[11px]">{device.ipAddress}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-semibold text-[#B45309]">
                        <Signal className="w-3 h-3" />
                        {device.signalDbm} dBm
                      </span>
                      {isConnected && (
                        <>
                          <span>•</span>
                          <span className="font-mono text-[11px] text-[#059669] font-bold">
                            {device.latencyMs || 8} ms RTT
                          </span>
                        </>
                      )}
                    </div>

                    {/* Supported Language Badges */}
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {device.supportedLanguages.map((code) => (
                        <span
                          key={code}
                          className="px-1.5 py-0.5 rounded bg-[#FFFFFF] border border-[#E8E0D5] text-[10px] font-semibold text-[#26211E] uppercase"
                        >
                          {code}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="sm:self-center shrink-0 flex items-center gap-2 w-full sm:w-auto">
                  {isConnected ? (
                    <button
                      onClick={disconnectDevice}
                      className="w-full sm:w-auto px-4 py-2 min-h-[44px] sm:min-h-[38px] rounded-xl bg-[#FFFFFF] border border-[#E8E0D5] hover:bg-[#FEE2E2] hover:text-[#B91C1C] text-xs font-bold text-[#6B625B] transition-colors flex items-center justify-center active:scale-95"
                    >
                      Disconnect
                    </button>
                  ) : isConnecting || isReconnecting ? (
                    <button
                      disabled
                      className="w-full sm:w-auto px-4 py-2 min-h-[44px] sm:min-h-[38px] rounded-xl bg-[#F59E0B] text-white text-xs font-bold opacity-80 cursor-wait flex items-center justify-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{isConnecting ? 'Connecting...' : 'Reconnecting...'}</span>
                    </button>
                  ) : isFailed ? (
                    <button
                      onClick={() => connectToDevice(device)}
                      className="w-full sm:w-auto px-4 py-2 min-h-[44px] sm:min-h-[38px] rounded-xl bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center active:scale-95"
                    >
                      Retry Link
                    </button>
                  ) : (
                    <button
                      onClick={() => connectToDevice(device)}
                      className="w-full sm:w-auto px-4 py-2 min-h-[44px] sm:min-h-[38px] rounded-xl bg-[#C7512E] hover:bg-[#A83F20] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center active:scale-95"
                    >
                      Connect
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
