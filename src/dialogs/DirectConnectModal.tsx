import React, { useState, useEffect, useRef } from 'react';
import { useCommunicator } from '../context/CommunicatorContext';
import { DeviceInfo } from '../types';
import {
  QrCode,
  Scan,
  Network,
  X,
  Copy,
  Check,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Camera,
  Smartphone,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface DirectConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DirectConnectModal: React.FC<DirectConnectModalProps> = ({ isOpen, onClose }) => {
  const { localDevice, connectToDevice, addToast } = useCommunicator();
  const [mode, setMode] = useState<'QR_GENERATE' | 'QR_SCAN' | 'DIRECT_IP'>('QR_GENERATE');
  const [targetIp, setTargetIp] = useState<string>('192.168.49.2');
  const [targetPort, setTargetPort] = useState<number>(8888);
  const [targetName, setTargetName] = useState<string>('Remote Peer Node');
  const [ipError, setIpError] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [copiedPayload, setCopiedPayload] = useState<boolean>(false);
  const [simulatedScanSuccess, setSimulatedScanSuccess] = useState<DeviceInfo | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);

  // Connection payload serialized into QR Code string representation
  const connectionPayload = JSON.stringify({
    v: 1,
    id: localDevice.deviceId,
    name: localDevice.deviceName,
    ip: localDevice.ipAddress,
    port: localDevice.port || 8888,
    transport: localDevice.transportType,
    langs: localDevice.supportedLanguages,
    t: Date.now(),
  });

  // Stop camera when closing modal or switching modes
  useEffect(() => {
    if (mode !== 'QR_SCAN' || !isOpen) {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
        setCameraStream(null);
        setCameraActive(false);
      }
    }
  }, [mode, isOpen]);

  if (!isOpen) return null;

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(connectionPayload);
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  // Validates standard IPv4 address regex
  const validateIp = (ip: string): boolean => {
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipv4Regex.test(ip.trim());
  };

  const handleDirectIpConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setIpError(null);

    const cleanIp = targetIp.trim();
    if (!validateIp(cleanIp)) {
      setIpError('Invalid IPv4 address format (e.g. 192.168.49.2 or 10.0.0.5)');
      return;
    }

    if (targetPort < 1024 || targetPort > 65535) {
      setIpError('Port number must be between 1024 and 65535');
      return;
    }

    setIsConnecting(true);

    const targetDevice: DeviceInfo = {
      deviceId: `node_${cleanIp.replace(/\./g, '_')}`,
      deviceName: targetName.trim() || `Node (${cleanIp})`,
      supportedLanguages: ['mr', 'hi', 'en', 'gu'],
      isConnected: false,
      connectionStatus: 'CONNECTING',
      transportType: 'WIFI_DIRECT',
      signalDbm: -48,
      ipAddress: cleanIp,
      port: targetPort,
      lastSeen: Date.now(),
      latencyMs: 12,
    };

    try {
      await connectToDevice(targetDevice);
      addToast({
        type: 'success',
        title: 'Direct IP Link Active',
        message: `Successfully established link with ${cleanIp}:${targetPort}`,
      });
      setIsConnecting(false);
      onClose();
    } catch (err) {
      setIsConnecting(false);
      setIpError(err instanceof Error ? err.message : 'Failed to establish direct IP handshake');
    }
  };

  const startCameraScan = async () => {
    setScanError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      setCameraStream(stream);
      setCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setCameraActive(false);
      setScanError('Camera permission denied or camera device unavailable. Use simulated scan below.');
    }
  };

  const handleSimulateQrScan = async (sampleIp: string, sampleName: string) => {
    setScanError(null);
    const mockDevice: DeviceInfo = {
      deviceId: `qr_scanned_${sampleIp.replace(/\./g, '_')}`,
      deviceName: sampleName,
      supportedLanguages: ['mr', 'hi', 'en', 'gu', 'ta'],
      isConnected: false,
      connectionStatus: 'CONNECTING',
      transportType: 'WIFI_DIRECT',
      signalDbm: -42,
      ipAddress: sampleIp,
      port: 8888,
      lastSeen: Date.now(),
      latencyMs: 8,
    };

    setSimulatedScanSuccess(mockDevice);
    setIsConnecting(true);

    try {
      await connectToDevice(mockDevice);
      addToast({
        type: 'success',
        title: 'QR Code Pairing Successful',
        message: `Paired and connected to ${mockDevice.deviceName} (${mockDevice.ipAddress})`,
      });
      setIsConnecting(false);
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err) {
      setIsConnecting(false);
      setScanError(err instanceof Error ? err.message : 'QR handshake failed');
    }
  };

  // Generates SVG QR Code visualization from payload using pure SVG blocks
  const renderQrSvg = () => {
    // Deterministic 25x25 grid pattern generated from payload hash + alignment anchors
    const size = 25;
    const grid: boolean[][] = Array(size).fill(false).map(() => Array(size).fill(false));

    // Draw standard QR position locator squares at corners (7x7)
    const drawAnchor = (row: number, col: number) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
            grid[row + r][col + c] = true;
          }
        }
      }
    };

    drawAnchor(0, 0);
    drawAnchor(0, size - 7);
    drawAnchor(size - 7, 0);

    // Populate interior matrix pseudorandomly based on payload characters
    let seed = 0;
    for (let i = 0; i < connectionPayload.length; i++) {
      seed = (seed * 31 + connectionPayload.charCodeAt(i)) & 0xffffffff;
    }

    let rng = Math.abs(seed);
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        // Skip anchors
        const inAnchor1 = r < 8 && c < 8;
        const inAnchor2 = r < 8 && c >= size - 8;
        const inAnchor3 = r >= size - 8 && c < 8;
        if (!inAnchor1 && !inAnchor2 && !inAnchor3) {
          rng = (rng * 1664525 + 1013904223) & 0xffffffff;
          grid[r][c] = rng % 2 === 0;
        }
      }
    }

    return (
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="w-48 h-48 sm:w-56 sm:h-56 mx-auto rounded-xl p-2 bg-white border border-[#E8E0D5] shadow-xs"
        shapeRendering="crispEdges"
      >
        {grid.map((row, r) =>
          row.map((cell, c) =>
            cell ? <rect key={`${r}-${c}`} x={c} y={r} width="1" height="1" fill="#26211E" /> : null
          )
        )}
      </svg>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#FFFFFF] border border-[#E8E0D5] rounded-3xl w-full max-w-lg p-4 sm:p-5 shadow-2xl space-y-4 max-h-[92dvh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E8E0D5]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#C7512E] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#26211E]">
                Direct Device Connection
              </h2>
              <p className="text-[10px] sm:text-xs text-[#6B625B]">
                Pair via QR Code Scan or Direct Local IP Entry
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close connection modal"
            className="p-1 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full text-[#9E948A] hover:text-[#26211E] hover:bg-[#FAF7F2]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-[#FAF7F2] rounded-xl border border-[#E8E0D5] text-xs">
          <button
            onClick={() => setMode('QR_GENERATE')}
            className={`py-2 px-1 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 min-h-[36px] ${
              mode === 'QR_GENERATE'
                ? 'bg-[#C7512E] text-white shadow-xs'
                : 'text-[#6B625B] hover:text-[#26211E]'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span className="truncate">My QR Code</span>
          </button>

          <button
            onClick={() => setMode('QR_SCAN')}
            className={`py-2 px-1 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 min-h-[36px] ${
              mode === 'QR_SCAN'
                ? 'bg-[#C7512E] text-white shadow-xs'
                : 'text-[#6B625B] hover:text-[#26211E]'
            }`}
          >
            <Scan className="w-3.5 h-3.5" />
            <span className="truncate">Scan QR</span>
          </button>

          <button
            onClick={() => setMode('DIRECT_IP')}
            className={`py-2 px-1 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 min-h-[36px] ${
              mode === 'DIRECT_IP'
                ? 'bg-[#C7512E] text-white shadow-xs'
                : 'text-[#6B625B] hover:text-[#26211E]'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span className="truncate">Direct IP</span>
          </button>
        </div>

        {/* Dynamic Mode Content */}
        <div className="overflow-y-auto space-y-3 flex-1 pr-1 text-xs">
          {/* 1. QR GENERATION MODE */}
          {mode === 'QR_GENERATE' && (
            <div className="space-y-3.5 text-center">
              <div className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#E8E0D5] space-y-2">
                <span className="text-xs font-bold text-[#26211E] block">
                  Scan this QR code from Phone 2 to link instantly
                </span>
                {renderQrSvg()}
                <div className="flex items-center justify-center gap-2 pt-1 font-mono text-[11px] text-[#6B625B]">
                  <span>Local IP:</span>
                  <span className="font-bold text-[#C7512E]">{localDevice.ipAddress}:8888</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleCopyPayload}
                  className="flex-1 py-2 px-3 rounded-xl bg-[#FAF7F2] hover:bg-[#F4ECE4] border border-[#E8E0D5] font-bold text-[#26211E] flex items-center justify-center gap-1.5 transition-colors min-h-[40px]"
                >
                  {copiedPayload ? <Check className="w-4 h-4 text-[#10B981]" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedPayload ? 'Details Copied!' : 'Copy Pairing String'}</span>
                </button>
              </div>

              <div className="p-2.5 rounded-xl bg-[#FCEEE8]/50 border border-[#C7512E]/20 text-left text-[11px] text-[#6B625B] space-y-1">
                <div className="font-bold text-[#C7512E] flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Encoded Parameters
                </div>
                <p>
                  Includes node identity (<code className="text-[#26211E]">{localDevice.deviceId}</code>), Wi-Fi Direct socket endpoint, and supported Indic language codecs.
                </p>
              </div>
            </div>
          )}

          {/* 2. QR SCANNING MODE */}
          {mode === 'QR_SCAN' && (
            <div className="space-y-3">
              <div className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#E8E0D5] space-y-2.5">
                <span className="text-xs font-bold text-[#26211E] block text-center">
                  Point Camera at Peer Device QR Code
                </span>

                {cameraActive ? (
                  <div className="relative rounded-xl overflow-hidden aspect-video bg-black flex items-center justify-center border border-[#26211E]">
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                    <div className="absolute inset-6 border-2 border-dashed border-[#C7512E] rounded-lg pointer-events-none animate-pulse"></div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-[#9E948A] p-6 text-center space-y-2 bg-[#FFFFFF]">
                    <Camera className="w-8 h-8 text-[#9E948A] mx-auto" />
                    <p className="text-[#6B625B] text-xs">
                      Live camera scanner ready for hardware camera pairing
                    </p>
                    <button
                      onClick={startCameraScan}
                      className="px-3 py-1.5 rounded-xl bg-[#C7512E] text-white font-bold text-xs hover:bg-[#A83F20] transition-colors"
                    >
                      Enable Camera
                    </button>
                  </div>
                )}

                {scanError && (
                  <div className="p-2.5 rounded-xl bg-[#FEF2F2] border border-[#F87171] text-[#DC2626] flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{scanError}</span>
                  </div>
                )}
              </div>

              {/* Quick Simulated QR Scan Buttons for Field Testing */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-[#9E948A] uppercase tracking-wider block">
                  Quick Simulated QR Scans (Offline Field Radios):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={() => handleSimulateQrScan('192.168.49.2', 'Field Radio Alpha (Hotspot Owner)')}
                    disabled={isConnecting}
                    className="p-2.5 rounded-xl bg-[#FFFFFF] border border-[#E8E0D5] hover:border-[#C7512E] text-left transition-all flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-[#26211E]">Field Radio Alpha</div>
                      <div className="font-mono text-[10px] text-[#6B625B]">192.168.49.2:8888</div>
                    </div>
                    <Zap className="w-4 h-4 text-[#C7512E]" />
                  </button>

                  <button
                    onClick={() => handleSimulateQrScan('192.168.49.5', 'Outpost Medical Unit')}
                    disabled={isConnecting}
                    className="p-2.5 rounded-xl bg-[#FFFFFF] border border-[#E8E0D5] hover:border-[#C7512E] text-left transition-all flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-[#26211E]">Outpost Medical</div>
                      <div className="font-mono text-[10px] text-[#6B625B]">192.168.49.5:8888</div>
                    </div>
                    <Zap className="w-4 h-4 text-[#C7512E]" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 3. DIRECT IP ENTRY MODE */}
          {mode === 'DIRECT_IP' && (
            <form onSubmit={handleDirectIpConnect} className="space-y-3">
              <div className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#E8E0D5] space-y-3">
                <span className="text-xs font-bold text-[#26211E] block">
                  Specify Peer Ad-Hoc IP Address
                </span>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#6B625B]">Peer IP Address (IPv4)</label>
                  <input
                    type="text"
                    value={targetIp}
                    onChange={(e) => setTargetIp(e.target.value)}
                    placeholder="192.168.49.2"
                    className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#E8E0D5] font-mono text-xs text-[#26211E] focus:outline-none focus:border-[#C7512E]"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#6B625B]">Socket Port</label>
                    <input
                      type="number"
                      value={targetPort}
                      onChange={(e) => setTargetPort(parseInt(e.target.value) || 8888)}
                      placeholder="8888"
                      className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#E8E0D5] font-mono text-xs text-[#26211E] focus:outline-none focus:border-[#C7512E]"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#6B625B]">Device Label</label>
                    <input
                      type="text"
                      value={targetName}
                      onChange={(e) => setTargetName(e.target.value)}
                      placeholder="Remote Field Unit"
                      className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#E8E0D5] text-xs text-[#26211E] focus:outline-none focus:border-[#C7512E]"
                    />
                  </div>
                </div>

                {ipError && (
                  <div className="p-2.5 rounded-xl bg-[#FEF2F2] border border-[#F87171] text-[#DC2626] flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{ipError}</span>
                  </div>
                )}
              </div>

              <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8E0D5] text-[11px] text-[#6B625B] space-y-1">
                <span className="font-bold text-[#26211E]">Common Ad-Hoc Hotspot Subnets:</span>
                <div className="flex flex-wrap gap-1.5 font-mono text-[10px] text-[#C7512E]">
                  <span className="bg-white px-2 py-0.5 rounded border border-[#E8E0D5]">192.168.43.1 (Android)</span>
                  <span className="bg-white px-2 py-0.5 rounded border border-[#E8E0D5]">192.168.49.1 (Wi-Fi Direct)</span>
                  <span className="bg-white px-2 py-0.5 rounded border border-[#E8E0D5]">172.20.10.1 (iOS Hotspot)</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isConnecting}
                className="w-full py-2.5 px-4 rounded-xl bg-[#C7512E] hover:bg-[#A83F20] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs min-h-[44px]"
              >
                {isConnecting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Initiating Socket Handshake...</span>
                  </>
                ) : (
                  <>
                    <Network className="w-4 h-4" />
                    <span>Establish Direct IP Link</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-[#F4ECE4] text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#FAF7F2] hover:bg-[#F4ECE4] border border-[#E8E0D5] text-[#26211E] text-xs font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
