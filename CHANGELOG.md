# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Cleanup
- Removed unused legacy component folders:
  - `src/components/InvestmentFinancing` (Placeholder, unused)
  - `src/components/SupplyChain` (Placeholder, unused)
  - `src/components/UserCenter` (Placeholder, unused)
- Removed unused individual component files:
  - `src/components/CoreMetricsBar.jsx` (Replaced by internal implementation in WeeklyReport or unused)
  - `src/components/TurnoverReportTab.jsx` (Legacy file, replaced by src/pages/Turnover)
  - `src/components/UserCenterTab.jsx` (Legacy placeholder, unused)
  - `src/components/Common/CoreMetricCard.jsx` (Unused)
  - `src/components/Common/CoreMetricsSection.jsx` (Unused)
  - `src/components/Common/FilterDropdown.jsx` (Unused)

### Refactor
- Renamed `src/components/TuiNaHome` to `src/components/TurnoverReport` to align with business domain (Turnover Report / 营业额).
- Renamed internal components and exports from `TuiNaHomeTab` to `TurnoverReport` in `src/components/TurnoverReport/index.jsx`.
- Updated import and usage in `src/components/WeeklyReport.jsx` to use `TurnoverReport`.
- Renamed `src/components/TuiNaHomeTab.jsx` to `src/components/TurnoverReportTab.jsx` for consistency.
- Renamed `src/components/ProfitTab.jsx` to `src/components/CostAndProfitTab.jsx` and updated labels to "成本与利润" (Cost & Profit).
- Renamed `src/components/SurplusFundsTab.jsx` to `src/components/CashFlowTab.jsx` and updated labels to "现金流" (Cash Flow).
- Updated `src/components/WeeklyReport.jsx` to reflect new tab names and component imports.
