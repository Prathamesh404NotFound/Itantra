import React, { useMemo } from 'react';
import { useCommunicator } from '../context/CommunicatorContext';
import { MessageCard } from '../components/MessageCard';
import {
  Search,
  Trash2,
  AlertTriangle,
  FileDown,
  Layers,
  HardDriveDownload,
  Filter,
} from 'lucide-react';

export const HistoryScreen: React.FC = () => {
  const {
    messages,
    playVoicePacket,
    clearHistory,
    historySearchQuery,
    setHistorySearchQuery,
    historyFilterCriticalOnly,
    setHistoryFilterCritical,
  } = useCommunicator();

  const filteredMessages = useMemo(() => {
    return messages.filter((msg) => {
      if (historyFilterCriticalOnly && msg.priority !== 'CRITICAL') {
        return false;
      }
      if (!historySearchQuery.trim()) return true;
      const q = historySearchQuery.toLowerCase();
      const inText = msg.textPayload.toLowerCase().includes(q);
      const inTrans = msg.translatedText?.toLowerCase().includes(q) || false;
      const inLang =
        msg.sourceLanguage.toLowerCase().includes(q) || msg.targetLanguage.toLowerCase().includes(q);
      return inText || inTrans || inLang;
    });
  }, [messages, historySearchQuery, historyFilterCriticalOnly]);

  const totalBytes = messages.reduce((acc, m) => acc + m.packetSizeBytes, 0);
  const totalRawEst = messages.reduce((acc, m) => acc + m.audioSizeEstimateBytes, 0);
  const overallSavedPercent =
    totalRawEst > 0 ? Math.round(((totalRawEst - totalBytes) / totalRawEst) * 100) : 99;

  const handleExportJson = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(messages, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `itantra_history_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div id="screen_history" className="space-y-3.5 sm:space-y-4">
      {/* Search & Filter Bar */}
      <div className="rounded-2xl p-3 sm:p-4 bg-[#FFFFFF] border border-[#E8E0D5] shadow-xs space-y-3">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 text-[#9E948A] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={historySearchQuery}
              onChange={(e) => setHistorySearchQuery(e.target.value)}
              placeholder="Search by keywords, language..."
              className="w-full pl-8 sm:pl-9 pr-3 py-2 min-h-[38px] rounded-xl bg-[#FAF7F2] border border-[#E8E0D5] text-xs sm:text-sm text-[#26211E] placeholder:text-[#9E948A] focus:outline-none focus:border-[#C7512E]"
            />
          </div>

          <button
            onClick={handleExportJson}
            title="Export Transmissions (JSON)"
            aria-label="Export transmissions as JSON"
            className="p-2 min-w-[38px] min-h-[38px] flex items-center justify-center rounded-xl bg-[#FAF7F2] hover:bg-[#F4ECE4] border border-[#E8E0D5] text-[#6B625B] hover:text-[#26211E] transition-colors shrink-0"
          >
            <FileDown className="w-4 h-4" />
          </button>

          <button
            onClick={clearHistory}
            title="Clear All History"
            aria-label="Clear all transmission history"
            className="p-2 min-w-[38px] min-h-[38px] flex items-center justify-center rounded-xl bg-[#FAF7F2] hover:bg-[#FEE2E2] hover:text-[#B91C1C] border border-[#E8E0D5] text-[#6B625B] transition-colors shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setHistoryFilterCritical(false)}
            className={`px-2.5 sm:px-3 py-1.5 min-h-[34px] rounded-xl text-xs font-bold transition-all border ${
              !historyFilterCriticalOnly
                ? 'bg-[#C7512E] text-white border-[#C7512E]'
                : 'bg-[#FAF7F2] text-[#6B625B] border-[#E8E0D5] hover:bg-[#F4ECE4]'
            }`}
          >
            All Messages ({messages.length})
          </button>

          <button
            onClick={() => setHistoryFilterCritical(true)}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 min-h-[34px] rounded-xl text-xs font-bold transition-all border ${
              historyFilterCriticalOnly
                ? 'bg-[#B91C1C] text-white border-[#B91C1C]'
                : 'bg-[#FAF7F2] text-[#B91C1C] border-[#E8E0D5] hover:bg-[#FEE2E2]'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>Critical SOS Only</span>
          </button>
        </div>
      </div>

      {/* Aggregate Network Savings Stats */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5">
        <div className="p-2.5 sm:p-3 rounded-2xl bg-[#FFFFFF] border border-[#E8E0D5] text-center shadow-2xs">
          <span className="text-[9px] sm:text-[10px] uppercase font-bold text-[#9E948A] block truncate">Packets</span>
          <span className="text-base sm:text-lg font-bold text-[#26211E] mt-0.5 block">{messages.length}</span>
        </div>
        <div className="p-2.5 sm:p-3 rounded-2xl bg-[#FFFFFF] border border-[#E8E0D5] text-center shadow-2xs">
          <span className="text-[9px] sm:text-[10px] uppercase font-bold text-[#9E948A] block truncate">Transmitted</span>
          <span className="text-base sm:text-lg font-bold text-[#C7512E] font-mono mt-0.5 block">
            {totalBytes < 1024 ? `${totalBytes} B` : `${(totalBytes / 1024).toFixed(1)} KB`}
          </span>
        </div>
        <div className="p-2.5 sm:p-3 rounded-2xl bg-[#FFFFFF] border border-[#E8E0D5] text-center shadow-2xs">
          <span className="text-[9px] sm:text-[10px] uppercase font-bold text-[#9E948A] block truncate">Bandwidth Saved</span>
          <span className="text-base sm:text-lg font-bold text-[#B45309] mt-0.5 block">{overallSavedPercent}%</span>
        </div>
      </div>

      {/* Message List */}
      <div className="space-y-2.5">
        {filteredMessages.length === 0 ? (
          <div className="p-10 text-center rounded-2xl bg-[#FFFFFF] border border-dashed border-[#E8E0D5]">
            <Layers className="w-8 h-8 text-[#9E948A] mx-auto mb-2" />
            <p className="text-sm font-semibold text-[#6B625B]">No matching transmissions found</p>
            <p className="text-xs text-[#9E948A] mt-0.5">Try adjusting your search terms or filters</p>
          </div>
        ) : (
          filteredMessages.map((msg) => (
            <MessageCard
              key={msg.messageId}
              packet={msg}
              onReplay={() => playVoicePacket(msg)}
            />
          ))
        )}
      </div>
    </div>
  );
};
