import React from 'react';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Sparkles,
  AlertCircle,
  Trophy,
  CheckCircle2,
} from 'lucide-react';
import {
  toSriLankanInputString,
  fromSriLankanInputString,
  formatSriLankanTimePeriod,
  formatSriLankanTime,
} from '../utils/sriLankanTime.js';

export interface IScheduleSlot {
  startTime: string; // datetime-local string in SLST
  endTime: string;   // datetime-local string in SLST
  label?: string;
}

interface MultiDaySchedulePickerProps {
  scheduleType: 'continuous' | 'discrete';
  setScheduleType: (type: 'continuous' | 'discrete') => void;
  // Continuous props
  startTime: string;
  setStartTime: (val: string) => void;
  endTime: string;
  setEndTime: (val: string) => void;
  // Discrete multiple slots props
  slots: IScheduleSlot[];
  setSlots: React.Dispatch<React.SetStateAction<IScheduleSlot[]>>;
  // Student duration timer
  durationMinutes: number;
  setDurationMinutes: (mins: number) => void;
}

export const MultiDaySchedulePicker: React.FC<MultiDaySchedulePickerProps> = ({
  scheduleType,
  setScheduleType,
  startTime,
  setStartTime,
  endTime,
  setEndTime,
  slots,
  setSlots,
  durationMinutes,
  setDurationMinutes,
}) => {
  // Helpers for generating presets based on the upcoming days of the week
  const getUpcomingDayDate = (targetDayOfWeek: number, hour = 8, minute = 0) => {
    // 0=Sun, 1=Mon, ..., 6=Sat
    const d = new Date();
    const currentDay = d.getDay();
    let diff = targetDayOfWeek - currentDay;
    if (diff <= 0) diff += 7;
    const target = new Date(d.getTime() + diff * 86400000);
    target.setHours(hour, minute, 0, 0);
    return target;
  };

  const applySaturdayAndMondayPreset = () => {
    const satStart = getUpcomingDayDate(6, 8, 0); // Saturday 08:00 AM
    const satEnd = new Date(satStart.getTime() + 14 * 3600000); // Saturday 10:00 PM (22:00)

    const monStart = getUpcomingDayDate(1, 8, 0); // Monday 08:00 AM
    // Ensure Monday is after Saturday
    if (monStart <= satStart) {
      monStart.setTime(monStart.getTime() + 7 * 86400000);
    }
    const monEnd = new Date(monStart.getTime() + 14 * 3600000); // Monday 10:00 PM (22:00)

    setScheduleType('discrete');
    setSlots([
      {
        startTime: toSriLankanInputString(satStart),
        endTime: toSriLankanInputString(satEnd),
        label: 'Day 1 (Saturday)',
      },
      {
        startTime: toSriLankanInputString(monStart),
        endTime: toSriLankanInputString(monEnd),
        label: 'Day 2 (Monday)',
      },
    ]);
  };

  const applyFridayAndSundayPreset = () => {
    const friStart = getUpcomingDayDate(5, 8, 0); // Friday 08:00 AM
    const friEnd = new Date(friStart.getTime() + 14 * 3600000); // Friday 10:00 PM

    const sunStart = getUpcomingDayDate(0, 8, 0); // Sunday 08:00 AM
    if (sunStart <= friStart) {
      sunStart.setTime(sunStart.getTime() + 7 * 86400000);
    }
    const sunEnd = new Date(sunStart.getTime() + 14 * 3600000); // Sunday 10:00 PM

    setScheduleType('discrete');
    setSlots([
      {
        startTime: toSriLankanInputString(friStart),
        endTime: toSriLankanInputString(friEnd),
        label: 'Day 1 (Friday)',
      },
      {
        startTime: toSriLankanInputString(sunStart),
        endTime: toSriLankanInputString(sunEnd),
        label: 'Day 2 (Sunday)',
      },
    ]);
  };

  const handleAddSlot = () => {
    const lastSlot = slots[slots.length - 1];
    let newStart: Date;
    let newEnd: Date;

    if (lastSlot && lastSlot.endTime) {
      const lastEndDate = fromSriLankanInputString(lastSlot.endTime);
      // Next slot starting 24h later
      newStart = new Date(lastEndDate.getTime() + 24 * 3600000);
      newEnd = new Date(newStart.getTime() + 12 * 3600000);
    } else {
      const now = new Date();
      newStart = new Date(now.getTime() + 24 * 3600000);
      newEnd = new Date(newStart.getTime() + 12 * 3600000);
    }

    setSlots((prev) => [
      ...prev,
      {
        startTime: toSriLankanInputString(newStart),
        endTime: toSriLankanInputString(newEnd),
        label: `Day ${prev.length + 1}`,
      },
    ]);
  };

  const handleRemoveSlot = (index: number) => {
    if (slots.length <= 1) return;
    setSlots((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateSlot = (index: number, field: keyof IScheduleSlot, value: string) => {
    setSlots((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  return (
    <div className="space-y-5">
      {/* Schedule Mode Selector */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
          Examination Schedule Mode:
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => setScheduleType('discrete')}
            className={`p-3.5 rounded-2xl border text-left transition-all relative ${
              scheduleType === 'discrete'
                ? 'bg-blue-50 dark:bg-blue-600/20 border-blue-500 shadow-md shadow-blue-500/10'
                : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5 font-sinhala">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                Separate Days / Slots
              </span>
              {scheduleType === 'discrete' && <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-sinhala leading-relaxed">
              e.g. Saturday & Monday slots. Exam is closed during intermediate hours.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setScheduleType('continuous')}
            className={`p-3.5 rounded-2xl border text-left transition-all relative ${
              scheduleType === 'continuous'
                ? 'bg-blue-50 dark:bg-blue-600/20 border-blue-500 shadow-md shadow-blue-500/10'
                : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5 font-sinhala">
                <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                Continuous Time Window
              </span>
              {scheduleType === 'continuous' && <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-sinhala leading-relaxed">
              Exam remains open continuously from start date to end date.
            </p>
          </button>
        </div>
      </div>

      {/* DISCRETE SEPARATE DAYS MODE */}
      {scheduleType === 'discrete' ? (
        <div className="space-y-4 p-4 sm:p-5 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-2xl">
          {/* Quick Preset Buttons for Separate Days */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-600 dark:text-slate-400 font-bold">Quick Presets:</span>
            <button
              type="button"
              onClick={applySaturdayAndMondayPreset}
              className="text-xs font-bold px-3 py-1.5 rounded-xl border border-blue-300 dark:border-blue-500/50 bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-500/25 transition-all shadow-sm flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-300" />
              ⭐ Saturday & Monday
            </button>
            <button
              type="button"
              onClick={applyFridayAndSundayPreset}
              className="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
            >
              Friday & Sunday
            </button>
          </div>

          {/* Slots List */}
          <div className="space-y-3 pt-2">
            {slots.map((slot, index) => {
              const startObj = slot.startTime ? fromSriLankanInputString(slot.startTime) : null;
              const endObj = slot.endTime ? fromSriLankanInputString(slot.endTime) : null;

              return (
                <div
                  key={index}
                  className="p-3.5 sm:p-4 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3 transition-all hover:border-slate-300 dark:hover:border-slate-700"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-blue-600 text-white font-mono flex-shrink-0">
                        Slot #{index + 1}
                      </span>
                      <input
                        type="text"
                        value={slot.label || `Day ${index + 1}`}
                        onChange={(e) => handleUpdateSlot(index, 'label', e.target.value)}
                        placeholder={`Day ${index + 1} Label`}
                        className="flex-1 min-w-0 px-2.5 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white text-xs font-bold font-sinhala focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {slots.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSlot(index)}
                        className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                        title="Remove this day slot"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Slot Start Time (SLST) *
                      </label>
                      <input
                        type="datetime-local"
                        required
                        value={slot.startTime}
                        onChange={(e) => handleUpdateSlot(index, 'startTime', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Slot End Time (SLST) *
                      </label>
                      <input
                        type="datetime-local"
                        required
                        value={slot.endTime}
                        onChange={(e) => handleUpdateSlot(index, 'endTime', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {startObj && endObj && (
                    <div className="text-[11px] text-blue-600 dark:text-blue-300 font-mono flex items-center gap-1.5 pt-1">
                      <Clock className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                      <span>{formatSriLankanTimePeriod(startObj, endObj)}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add Slot Button */}
          <button
            type="button"
            onClick={handleAddSlot}
            className="w-full py-2.5 px-4 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-bold rounded-xl text-xs border border-dashed border-blue-300 dark:border-blue-500/40 hover:border-blue-400 dark:hover:border-blue-500/70 transition-all flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Another Day / Slot</span>
          </button>
        </div>
      ) : (
        /* CONTINUOUS MODE */
        <div className="space-y-4 p-4 sm:p-5 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Scheduled Start Date & Time (SLST) *
            </label>
            <input
              type="datetime-local"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Scheduled End Date & Time (SLST) *
            </label>
            <input
              type="datetime-local"
              required
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-blue-500"
            />

            {/* Presets */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mr-0.5">Presets:</span>
              <button
                type="button"
                onClick={() => {
                  const s = fromSriLankanInputString(startTime);
                  setEndTime(toSriLankanInputString(new Date(s.getTime() + 2 * 3600000)));
                }}
                className="text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              >
                2 Hours
              </button>
              <button
                type="button"
                onClick={() => {
                  const s = fromSriLankanInputString(startTime);
                  setEndTime(toSriLankanInputString(new Date(s.getTime() + 24 * 3600000)));
                }}
                className="text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              >
                1 Day (24 Hours)
              </button>
              <button
                type="button"
                onClick={() => {
                  const s = fromSriLankanInputString(startTime);
                  setEndTime(toSriLankanInputString(new Date(s.getTime() + 48 * 3600000)));
                }}
                className="text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-500/60 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60"
              >
                ⭐ 2 Days (48 Hours)
              </button>
              <button
                type="button"
                onClick={() => {
                  const s = fromSriLankanInputString(startTime);
                  setEndTime(toSriLankanInputString(new Date(s.getTime() + 72 * 3600000)));
                }}
                className="text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              >
                3 Days
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Duration Countdown Timer */}
      <div className="p-4 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
          Student Quiz Attempt Timer (Per Candidate Duration) *
        </label>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            min="1"
            max="1440"
            required
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(Math.max(1, Number(e.target.value)))}
            className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold whitespace-nowrap">mins / attempt</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {[15, 20, 30, 45, 60, 90, 120].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setDurationMinutes(m)}
              className={`text-[10px] font-bold px-2 py-0.5 rounded border transition-colors ${
                durationMinutes === m
                  ? 'bg-blue-600 text-white border-blue-500'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {m}m
            </button>
          ))}
        </div>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-sinhala leading-relaxed pt-1">
          Each candidate must submit answers within this duration once started.
        </p>
      </div>

      {/* Summary and Rank Notification Card */}
      <div className="p-3.5 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-2xl space-y-2 text-xs">
        <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-bold">
          <Trophy className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          <span>Official Ranking Calculation:</span>
        </div>
        <p className="text-[11px] text-slate-700 dark:text-white/90 font-sinhala leading-relaxed pl-6">
          🏆 For multi-day examinations, official National, Provincial, and District rankings are computed automatically after the final scheduled slot closes.
        </p>
      </div>
    </div>
  );
};
