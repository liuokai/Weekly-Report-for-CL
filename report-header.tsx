import { useState, useEffect, useRef } from "react";
import type { WeekPeriodOption } from "../../utils/week-period";

type ReportHeaderProps = {
  periodOptions: WeekPeriodOption[];
  currentIndex: number;
  onSelectPeriod: (index: number) => void;
  summary: string;
  title?: string;
};

export function ReportHeader({
  periodOptions,
  currentIndex,
  onSelectPeriod,
  summary,
  title = "常乐经营管理周报",
}: ReportHeaderProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const currentPeriod = periodOptions[currentIndex] ?? periodOptions[0];
  const pickerRef = useRef<HTMLDivElement>(null);
  
  // 判断当前选项是否为当周
  const isCurrentWeek = currentIndex === 0;
  
  // 点击外部区域关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setPickerOpen(false);
      }
    };
    
    if (pickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [pickerOpen]);

  const togglePicker = () => {
    if (periodOptions.length <= 1) return;
    setPickerOpen((prev) => !prev);
  };

  const handleSelect = (index: number) => {
    onSelectPeriod(index);
    setPickerOpen(false);
  };

  return (
    <header className="brand-gradient text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-6 py-10 sm:px-10">
        <p className="text-xs uppercase tracking-widest text-white/80">AI数字化经营洞察</p>
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold sm:text-4xl">{title}</h1>
          <div className="relative w-full max-w-sm" ref={pickerRef}>
            <button
              type="button"
              onClick={togglePicker}
              className="flex w-full items-center justify-between rounded-full border border-white/50 bg-white/15 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
              aria-haspopup="listbox"
              aria-expanded={pickerOpen}
            >
              <span>数据周期：{currentPeriod?.label ?? "本周"}</span>
              {isCurrentWeek && (
                <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium">当周</span>
              )}
              <svg
                aria-hidden="true"
                viewBox="0 0 14 14"
                className={`h-3.5 w-3.5 transition-transform ${
                  pickerOpen ? "rotate-90" : "rotate-0"
                }`}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5.25 3.5 8.75 7l-3.5 3.5" />
              </svg>
            </button>
            {pickerOpen ? (
              <ul
                className="brand-border absolute z-10 mt-2 w-full rounded-xl border bg-white/95 p-1 text-sm text-slate-700 shadow-lg backdrop-blur"
                role="listbox"
              >
                {periodOptions.map((option, index) => (
                  <li key={option.label}>
                    <button
                      type="button"
                      onClick={() => handleSelect(index)}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition ${
                        index === currentIndex
                          ? "bg-[rgba(164,0,53,0.08)] font-semibold text-[var(--color-brand-primary)]"
                          : "hover:bg-[rgba(164,0,53,0.06)]"
                      }`}
                      role="option"
                      aria-selected={index === currentIndex}
                    >
                      <span>{option.label}</span>
                      {index === 0 && (
                        <span className="ml-2 rounded-full bg-[rgba(164,0,53,0.1)] px-2 py-0.5 text-xs font-medium text-[var(--color-brand-primary)]">当周</span>
                      )}
                      {index === currentIndex ? (
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 14 14"
                          className="h-3.5 w-3.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="m3.5 7 2.5 2.5 4.5-5" />
                        </svg>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
        <p className="text-sm text-white/90">{summary}</p>
      </div>
    </header>
  );
}
