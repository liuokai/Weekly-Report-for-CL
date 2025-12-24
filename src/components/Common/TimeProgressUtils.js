/**
 * Time Progress Calculation Utility
 * 
 * Calculates the percentage of time passed in the current year.
 * Used across multiple modules (Turnover, Cost & Profit, Store) to ensure consistent progress tracking.
 */

export const getTimeProgress = (date = new Date()) => {
  const currentYear = date.getFullYear();
  const startOfYear = new Date(currentYear, 0, 1);
  // Use start of next year as the reference for 100% completion
  const endOfYear = new Date(currentYear + 1, 0, 1);
  
  const totalDuration = endOfYear - startOfYear;
  const elapsed = date - startOfYear;
  
  let progress = (elapsed / totalDuration) * 100;
  
  // Clamp between 0 and 100
  progress = Math.min(100, Math.max(0, progress));
  
  // Return as a string with 1 decimal place
  return progress.toFixed(1);
};
