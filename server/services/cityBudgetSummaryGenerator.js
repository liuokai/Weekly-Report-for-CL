const NodeCache = require('node-cache');
const crypto = require('crypto');
const cacheConfig = require('../config/analysisCacheConfig');

// Initialize cache with 1 day TTL as requested (86400 seconds)
const summaryCache = new NodeCache({ 
  stdTTL: 86400, 
  checkperiod: 3600 
});

/**
 * Generate city budget execution summary using DeepSeek
 * @param {Object} deepseekClient - The initialized OpenAI/DeepSeek client
 * @param {Object} data - The aggregated data for the summary
 * @returns {Promise<string>} - The generated summary text
 */
async function generateCityBudgetSummary(deepseekClient, data) {
  // Generate Cache Key based on data content
  try {
    const dataStr = JSON.stringify(data);
    const hash = crypto.createHash('md5').update(dataStr).digest('hex');
    const cacheKey = `city_budget_summary_${hash}`;

    if (cacheConfig.ENABLED) {
      const cachedResult = summaryCache.get(cacheKey);
      if (cachedResult) {
        console.log('[CityBudgetSummary] Cache hit');
        return cachedResult;
      }
    }

    const {
      currentMonth,
      cumulativeCashFlowActual, // a
      annualCashFlowBudget,     // b
      cumulativeInvestment,     // c
      investmentStoreCount,     // d
      avgInvestmentPerStore,    // e
      achievedCities            // List of cities
    } = data;

    const prompt = `
你是一个智能运营助手。请根据提供的统计数据，直接填充并生成一段简练的分析总结。

统计数据：
- 当前月份 (Y)：${currentMonth}
- 截止当月累计经营现金流 (a)：${cumulativeCashFlowActual}
- 预计当年累计经营现金流 (b)：${annualCashFlowBudget}
- 截止当月累计新店投资金额 (c)：${cumulativeInvestment}
- 投资门店数量 (d)：${investmentStoreCount}
- 店均投资金额 (e)：${avgInvestmentPerStore}
- 现金流达成率已完成城市列表：${achievedCities.length > 0 ? achievedCities.join('、') : '无'}

请严格按照以下格式输出（不要包含Markdown标题）：

截止当前（${currentMonth}），累计经营现金流为 ${cumulativeCashFlowActual}，预计当年的累计经营现金流为 ${annualCashFlowBudget}。其中，${achievedCities.length > 0 ? achievedCities.join('、') + '等城市' : '无城市'}截止当前月份已完成现金流目标；

截止当前（${currentMonth}），累计的新店投资金额为 ${cumulativeInvestment}，投资门店数量为 ${investmentStoreCount}，店均投资金额为 ${avgInvestmentPerStore}。

要求：
1. 保持段落格式。
2. 如果没有达成目标的城市，请调整措辞（例如“暂无城市...”）。
3. 数字和单位之间不需要空格。
`;

    // Call DeepSeek API
    const completion = await deepseekClient.chat.completions.create({
      messages: [
        { role: "system", content: "你是一个智能运营助手，请严格遵守用户的格式要求进行输出。" },
        { role: "user", content: prompt }
      ],
      model: "deepseek-reasoner",
      temperature: 0.1,
    });

    const result = completion.choices[0].message.content;

    // Save to cache
    if (cacheConfig.ENABLED) {
      summaryCache.set(cacheKey, result);
    }

    return result;

  } catch (error) {
    console.error('Error generating city budget summary:', error);
    throw new Error('Failed to generate summary');
  }
}

module.exports = { generateCityBudgetSummary };
