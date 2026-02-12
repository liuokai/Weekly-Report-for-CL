const fs = require('fs');
const path = require('path');
const NodeCache = require('node-cache');
const crypto = require('crypto');
const cacheConfig = require('../config/analysisCacheConfig');

// Initialize cache for new store analysis
const analysisCache = new NodeCache({ 
  stdTTL: cacheConfig.TTL, 
  checkperiod: cacheConfig.CHECK_PERIOD 
});

/**
 * Generate new store analysis summary using DeepSeek
 * @param {Object} deepseekClient - The initialized OpenAI/DeepSeek client
 * @param {Array} newStoreData - The raw data from cash_flow_new_store_process.sql
 * @param {Number} currentTotalStores - The total number of stores calculated by frontend
 * @returns {Promise<string>} - The generated analysis text
 */
async function generateNewStoreAnalysis(deepseekClient, newStoreData, currentTotalStores) {
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
    // Filter detail rows (exclude '月度合计')
    const detailRows = ytdData.filter(d => d.city_name !== '月度合计');
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

    // Prepare context for prompt
    const contextData = {
        latestMonth,
        totalStores,
        newStore: {
            target: totalNewTarget,
            actual: totalNewActual
        },
        reinstall: {
            target: totalReinstallTarget,
            actual: totalReinstallActual
        },
        newStoreCities: activeNewStoreCities,
        reinstallCities: activeReinstallCities
    };

    const prompt = `
你是一个智能运营助手。我已为你计算好所有关键指标，请根据提供的统计数据，直接填充并生成一段简练的分析总结。

统计数据：
- 最新月份：${contextData.latestMonth}
- 截止当前经营中门店总数：${contextData.totalStores} 家
- 截止最新月份（年初累计）- 新店预计开设：${contextData.newStore.target} 家
- 截止最新月份（年初累计）- 新店实际开设：${contextData.newStore.actual} 家
- 截止最新月份（年初累计）- 重装预计：${contextData.reinstall.target} 家
- 截止最新月份（年初累计）- 重装实际：${contextData.reinstall.actual} 家

各城市新店数据（年初累计）：
${contextData.newStoreCities.length > 0 
  ? contextData.newStoreCities.map(c => `  * ${c.name}: 预计 ${c.newTarget} 家，实际 ${c.newActual} 家`).join('\n')
  : '  * 无'}

各城市重装数据（年初累计）：
${contextData.reinstallCities.length > 0 
  ? contextData.reinstallCities.map(c => `  * ${c.name}: 预计 ${c.reinstallTarget} 家，实际 ${c.reinstallActual} 家`).join('\n')
  : '  * 无'}

请严格按照以下三个段落的格式生成文本（不要包含 Markdown 标题或其他多余内容）：

截止当前共有经营中门店 {A} 家

截止上个月（{YYYY-MM}）预计开设新店数量为 {B} 家，实际开设新店数量为 {C} 家。其中，{列出所有有新店数据的城市及其数据}

截止上个月（{YYYY-MM}）预计重装门店数量为 {I} 家，实际重装门店数量为 {J} 家。其中，{列出所有有重装数据的城市及其数据}

要求：
1. 直接使用我提供的统计数据填充占位符。
2. {YYYY-MM} 替换为 "${contextData.latestMonth}"。
3. **非常重要**：在“其中...”部分，必须**完整列出**上方提供的“各城市数据”中所有城市及其对应的预计/实际数值，**不要遗漏任何一个城市**。
4. 城市数据的描述格式可参考：“X市预计开设Y家，实际开设Z家”。如果城市较多，请使用顿号或逗号自然连接。
5. 如果某项（新店或重装）下没有城市数据，则不显示“其中...”这句话。
6. 保持段落间空行。
7. 数字使用阿拉伯数字。
`;

    // Call DeepSeek API
    const completion = await deepseekClient.chat.completions.create({
      messages: [
        { role: "system", content: "你是一个智能运营助手，请严格遵守用户的格式要求进行输出。" },
        { role: "user", content: prompt }
      ],
      model: "deepseek-reasoner", // Using reasoner as per current project setup
      temperature: 0.1, // Low temperature for deterministic output
    });

    const result = completion.choices[0].message.content;

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
