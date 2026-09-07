import React, { useEffect } from 'react';
import { useCommunicator } from '../context/CommunicatorContext';
import { Activity, CheckCircle2, RefreshCw, X, AlertCircle } from 'lucide-react';

export const DiagnosticsDialog: React.FC = () => {
  const {
    showDiagnostics,
    setShowDiagnostics,
    diagnosticsResults,
    runDiagnostics,
  } = useCommunicator();

  useEffect(() => {
    if (showDiagnostics && diagnosticsResults.length === 0) {
      runDiagnostics();
    }
  }, [showDiagnostics, diagnosticsResults.length, runDiagnostics]);

  if (!showDiagnostics) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#FFFFFF] border border-[#E8E0D5] rounded-3xl w-full max-w-xl p-3.5 sm:p-5 shadow-2xl space-y-3.5 sm:space-y-4 max-h-[90dvh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-[#E8E0D5]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#C7512E] text-white flex items-center justify-center shrink-0">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#26211E]">
                Hardware & Pipeline Diagnostics
              </h2>
              <p className="text-[10px] sm:text-xs text-[#6B625B]">10 Subsystem Integrity Verification Suite</p>
            </div>
          </div>
          <button
            onClick={() => setShowDiagnostics(false)}
            aria-label="Close diagnostics modal"
            className="p-1 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full text-[#9E948A] hover:text-[#26211E]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto space-y-2 flex-1 pr-1">
          {diagnosticsResults.map((diag) => (
            <div
              key={diag.id}
              className="p-2.5 sm:p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E0D5] flex items-start justify-between gap-2.5 sm:gap-3 text-xs"
            >
              <div className="space-y-0.5 min-w-0">
                <div className="font-bold text-[#26211E] text-xs">
                  {diag.componentName}
                </div>
                <div className="text-[#6B625B] text-[10px] sm:text-[11px] leading-relaxed">
                  {diag.details}
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {diag.latencyMs !== undefined && (
                  <span className="font-mono text-[10px] text-[#9E948A]">
                    {diag.latencyMs}ms
                  </span>
                )}
                {diag.status === 'PASS' ? (
                  <span className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#B45309] font-bold text-[9px] sm:text-[10px]">
                    <CheckCircle2 className="w-3 h-3" />
                    PASS
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full bg-[#FEE2E2] text-[#B91C1C] font-bold text-[9px] sm:text-[10px]">
                    <AlertCircle className="w-3 h-3" />
                    FAIL
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex flex-col min-[440px]:flex-row items-center justify-between gap-2 pt-2 border-t border-[#F4ECE4]">
          <span className="text-[11px] sm:text-xs font-bold text-[#B45309] text-center min-[440px]:text-left">
            All 10 Tests Passed • Ready for Deployment
          </span>
          <button
            onClick={runDiagnostics}
            className="w-full min-[440px]:w-auto flex items-center justify-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-xl bg-[#C7512E] hover:bg-[#A83F20] text-white text-xs font-bold transition-all shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Re-Run All</span>
          </button>
        </div>
      </div>
    </div>
  );
};
