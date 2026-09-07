import React, { useState } from 'react';
import { useCommunicator } from '../context/CommunicatorContext';
import { EMERGENCY_CATEGORIES, EmergencyCategoryKey } from '../types';
import {
  Flame,
  HeartPulse,
  LifeBuoy,
  AlertTriangle,
  Megaphone,
  Radio,
  Send,
  X,
} from 'lucide-react';

export const EmergencyDialog: React.FC = () => {
  const { showEmergencyPanel, setShowEmergencyPanel, sendEmergencyAlert } = useCommunicator();
  const [selectedCategory, setSelectedCategory] = useState<EmergencyCategoryKey>('FIRE');
  const [customText, setCustomText] = useState('');

  if (!showEmergencyPanel) return null;

  const categories: EmergencyCategoryKey[] = ['FIRE', 'MEDICAL', 'HELP', 'DISTRESS', 'EVACUATION', 'CUSTOM'];

  const getIcon = (key: EmergencyCategoryKey) => {
    switch (key) {
      case 'FIRE':
        return <Flame className="w-5 h-5 text-[#B91C1C]" />;
      case 'MEDICAL':
        return <HeartPulse className="w-5 h-5 text-[#B91C1C]" />;
      case 'HELP':
        return <LifeBuoy className="w-5 h-5 text-[#B91C1C]" />;
      case 'DISTRESS':
        return <AlertTriangle className="w-5 h-5 text-[#B91C1C]" />;
      case 'EVACUATION':
        return <Megaphone className="w-5 h-5 text-[#B91C1C]" />;
      case 'CUSTOM':
        return <Radio className="w-5 h-5 text-[#B91C1C]" />;
    }
  };

  const handleBroadcast = () => {
    sendEmergencyAlert(selectedCategory, customText);
    setCustomText('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#FFFFFF] border-2 border-[#B91C1C] rounded-3xl w-full max-w-lg p-3.5 sm:p-5 shadow-2xl space-y-3.5 sm:space-y-4 max-h-[90dvh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#FEE2E2]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#B91C1C] text-white flex items-center justify-center shrink-0">
              <Flame className="w-4 h-4 sm:w-5 sm:h-5 fill-white" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#26211E]">Emergency SOS Broadcast</h2>
              <p className="text-[10px] sm:text-xs text-[#B91C1C] font-semibold">
                High Priority Preemption • All Mesh Nodes Will Alarm
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowEmergencyPanel(false)}
            aria-label="Close emergency SOS modal"
            className="p-1 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full text-[#9E948A] hover:text-[#26211E]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {categories.map((catKey) => {
            const cat = EMERGENCY_CATEGORIES[catKey];
            const isSelected = selectedCategory === catKey;

            return (
              <button
                key={catKey}
                onClick={() => {
                  setSelectedCategory(catKey);
                  setCustomText(cat.defaultText);
                }}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  isSelected
                    ? 'bg-[#FEE2E2] border-[#B91C1C] text-[#26211E]'
                    : 'bg-[#FAF7F2] border-[#E8E0D5] hover:bg-[#F4ECE4]'
                }`}
              >
                <div className="flex items-center justify-between">
                  {getIcon(catKey)}
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-[#B91C1C]"></span>
                  )}
                </div>
                <div className="font-bold text-xs mt-2 text-[#26211E]">{cat.title}</div>
              </button>
            );
          })}
        </div>

        {/* Message Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#6B625B]">Broadcast Message Text</label>
          <textarea
            rows={2}
            value={customText || EMERGENCY_CATEGORIES[selectedCategory].defaultText}
            onChange={(e) => setCustomText(e.target.value)}
            className="w-full p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E0D5] text-xs font-medium text-[#26211E] focus:outline-none focus:border-[#B91C1C]"
          />
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F4ECE4]">
          <button
            onClick={() => setShowEmergencyPanel(false)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-[#6B625B] hover:bg-[#F4ECE4] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleBroadcast}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#B91C1C] hover:bg-[#991B1B] text-white text-xs font-bold transition-all shadow-md active:scale-95"
          >
            <Send className="w-4 h-4" />
            <span>TRANSMIT SOS NOW</span>
          </button>
        </div>
      </div>
    </div>
  );
};
