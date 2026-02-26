const NodeCache = require('node-cache');
const crypto = require('crypto');
const cacheConfig = require('../config/analysisCacheConfig');
const axios = require('axios');
const difyWorkflows = require('../config/difyWorkflows');

// Initialize cache for new store analysis
const analysisCache = new NodeCache({ 
  stdTTL: cacheConfig.TTL, 
  checkperiod: cacheConfig.CHECK_PERIOD 
});

async function generateNewStoreAnalysis(newStoreData, currentTotalStores) {
  if (!newStoreData || newStoreData.length === 0) {
    return '暂无数据可供分析。';
  }

  // Generate Cache Key
  try {
    const dataStr = JSON.stringify({ newStoreData, currentTotalStores });
    const hash = crypto.createHash('md5').update(dataStr).digest('hex');
    const cacheKey = `new_store_analysis_${hash}`;

    if (cacheConfig.ENABLED) {
      const cachedResult = analysisCache.get(cacheKey);
      if (cachedResult) {
        console.log('[NewStoreAnalysis] Cache hit');
        return cachedResult;
      }
    }
    
    // Continue with generation if cache miss...
    // 1. Calculate Statistics
    // Determine the target month:
    // Logic: Use current system date's previous month.
    // e.g., if today is 2026-02-09, target month is 2026-01.
    const today = new Date();
    // Get last month
    const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const targetYear = lastMonthDate.getFullYear();
    const targetMonthStr = `${targetYear}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;
    
    // Validate if data exists for this month, otherwise fallback to data's latest month
    const monthsInData = [...new Set(newStoreData.map(d => d.month))].sort();
    if (monthsInData.length === 0) return '暂无数据可供分析。';

    // Ideally use targetMonthStr, but ensure it doesn't exceed data range if data is old
    // However, user requirement is "Current month is 2026-02", so "Last month" is 2026-01.
    // If data contains 2026-12 (future data?), we should strictly filter up to targetMonthStr.
    
    const latestMonth = targetMonthStr; 
    const currentYear = String(targetYear);

    // Filter for YTD (Year-to-Date) data
    // Data range: currentYear-01 to latestMonth (inclusive)
    const ytdData = newStoreData.filter(d => d.month <= latestMonth && d.month.startsWith(currentYear));

    // Calculate Global Metrics (from '月度合计' rows)
    // NOTE: The SQL aliases are now snake_case: "month", "city_name", "new_store_target", "new_store_count", "reinstall_target", "reinstall_count", "total_store_count"
    const monthlyTotals = ytdData.filter(d => d.city_name === '月度合计');
    
    // A: Total stores currently (Passed from frontend to ensure consistency)
    const totalStores = currentTotalStores !== undefined ? currentTotalStores : 0;

    // B & C: New Store Target & Actual (Cumulative)
    const totalNewTarget = monthlyTotals.reduce((sum, d) => sum + (Number(d['new_store_target']) || 0), 0);
    const totalNewActual = monthlyTotals.reduce((sum, d) => sum + (Number(d['new_store_count']) || 0), 0);

    // I & J: Reinstall Target & Actual (Cumulative)
    const totalReinstallTarget = monthlyTotals.reduce((sum, d) => sum + (Number(d['reinstall_target']) || 0), 0);
    const totalReinstallActual = monthlyTotals.reduce((sum, d) => sum + (Number(d['reinstall_count']) || 0), 0);

    // City Details
    // Filter detail rows (exclude summary rows: '月度合计' and '月度累计汇总')
    const detailRows = ytdData.filter(d => d.city_name !== '月度合计' && d.city_name !== '月度累计汇总');
    const uniqueCities = [...new Set(detailRows.map(d => d.city_name))];
    
    const cityStats = uniqueCities.map(city => {
      const cityRows = detailRows.filter(d => d.city_name === city);
      return {
        name: city,
        newTarget: cityRows.reduce((sum, d) => sum + (Number(d['new_store_target']) || 0), 0),
        newActual: cityRows.reduce((sum, d) => sum + (Number(d['new_store_count']) || 0), 0),
        reinstallTarget: cityRows.reduce((sum, d) => sum + (Number(d['reinstall_target']) || 0), 0),
        reinstallActual: cityRows.reduce((sum, d) => sum + (Number(d['reinstall_count']) || 0), 0)
      };
    });

    // Sort cities: prioritize those with actual openings, then by target
    cityStats.sort((a, b) => {
        if (b.newActual !== a.newActual) return b.newActual - a.newActual;
        return b.newTarget - a.newTarget;
    });

    // Filter cities that have ANY activity
    const activeNewStoreCities = cityStats.filter(c => c.newTarget > 0 || c.newActual > 0);
    const activeReinstallCities = cityStats.filter(c => c.reinstallTarget > 0 || c.reinstallActual > 0);

    const payload = {
      latest_month: latestMonth,
      total_stores: totalStores,
      new_store: {
        target: totalNewTarget,
        actual: totalNewActual
      },
      reinstall: {
        target: totalReinstallTarget,
        actual: totalReinstallActual
      },
      new_store_cities: activeNewStoreCities.map(c => ({
        name: c.name,
        new_target: c.newTarget,
        new_actual: c.newActual,
        reinstall_target: c.reinstallTarget,
        reinstall_actual: c.reinstallActual
      })),
      reinstall_cities: activeReinstallCities.map(c => ({
        name: c.name,
        new_target: c.newTarget,
        new_actual: c.newActual,
        reinstall_target: c.reinstallTarget,
        reinstall_actual: c.reinstallActual
      }))
    };

    const workflow = difyWorkflows.find(wf => wf.id === 'new_store_summary');
    if (!workflow) {
      throw new Error('Dify workflow config for new_store_summary not found');
    }

    let baseUrl = process.env.DIFY_BASE_URL || 'https://api.dify.ai/v1';
    if (!baseUrl.endsWith('/')) baseUrl += '/';
    const fullUrl = baseUrl.endsWith('workflows/run') ? baseUrl : `${baseUrl}workflows/run`;

    const currentDate = new Date();
    const currentDateStr = currentDate.toISOString().slice(0, 10);

    const defaultUser = workflow.user || process.env.DIFY_USER || 'changle-user-newstore-analysis';

    const storeProcessCn = newStoreData.map(d => ({
      month: d.month,
      city_name: d.city_name,
      '新店目标': d.new_store_target,
      '新店数量': d.new_store_count,
      '新店目标完成情况': d.new_store_target_status,
      '重装目标': d.reinstall_target,
      '重装数量': d.reinstall_count,
      '重装目标完成情况': d.reinstall_target_status,
      '门店数量': d.total_store_count
    }));

    const requestBody = {
      inputs: {
        store_process: JSON.stringify(storeProcessCn),
        current_date: currentDateStr
      },
      response_mode: 'blocking',
      user: defaultUser
    };

    console.log('Dify new_store_summary request body:', JSON.stringify(requestBody));

    const response = await axios.post(
      fullUrl,
      requestBody,
      {
        headers: {
          Authorization: `Bearer ${workflow.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 120000
      }
    );

    const wfData = response.data;

    if (!wfData || !wfData.data || wfData.data.status !== 'succeeded') {
      throw new Error('Dify workflow did not succeed');
    }

    const outputs = wfData.data.outputs || {};
    let result = outputs.text || outputs.answer || outputs.content || outputs.result;

    if (!result) {
      result = JSON.stringify(outputs);
    }

    // Save to cache
    if (cacheConfig.ENABLED) {
      analysisCache.set(cacheKey, result);
    }

    return result;

  } catch (error) {
    console.error('Error generating new store analysis:', error);
    throw new Error('Failed to generate analysis');
  }
}

module.exports = { generateNewStoreAnalysis };
