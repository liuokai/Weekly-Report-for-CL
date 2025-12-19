# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Refactor
- Renamed `src/components/TuiNaHome` to `src/components/TurnoverReport` to align with business domain (Turnover Report / 营业额).
- Renamed internal components and exports from `TuiNaHomeTab` to `TurnoverReport` in `src/components/TurnoverReport/index.jsx`.
- Updated import and usage in `src/components/WeeklyReport.jsx` to use `TurnoverReport`.
- Renamed `src/components/TuiNaHomeTab.jsx` to `src/components/TurnoverReportTab.jsx` for consistency.
