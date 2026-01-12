const fs = require('fs');
const path = require('path');
const NodeCache = require('node-cache');
const reminderPromptTemplate = require('../config/reminderPromptTemplate');
const cacheConfig = require('../config/reminderCacheConfig');

// Initialize cache for position reminders
const reminderCache = new NodeCache({ 
  stdTTL: cacheConfig.TTL, 
  checkperiod: cacheConfig.CHECK_PERIOD 
});

/**
 * Generate position reminder to-do list using DeepSeek
 * @param {Object} deepseekClient - The initialized OpenAI/DeepSeek client
 * @param {Object} metricsData - The metrics data from the frontend
 * @returns {Promise<string>} - The generated to-do list text
 */
async function generateReminder(deepseekClient, metricsData) {
  // Generate a cache key based on metricsData
  const cacheKey = `reminder_${JSON.stringify(metricsData)}`;

  if (cacheConfig.ENABLED) {
    const cachedResult = reminderCache.get(cacheKey);
    if (cachedResult) {
      console.log('[ReminderGenerator] Cache hit');
      return cachedResult;
    }
  }

  try {
    // 1. Read the knowledge base file
    const knowledgePath = path.join(__dirname, '../../src/config/常乐业务知识与岗位指标说明书.md');
    let knowledgeContent = '';
    try {
      knowledgeContent = fs.readFileSync(knowledgePath, 'utf8');
    } catch (err) {
      console.error('Failed to read knowledge file:', err);
      knowledgeContent = '暂无业务知识库信息。';
    }

    // 2. Prepare the prompt using template
    const prompt = reminderPromptTemplate.getPrompt(knowledgeContent, metricsData);

    // 3. Call DeepSeek API
    const completion = await deepseekClient.chat.completions.create({
      messages: [
        { role: "system", content: "你是一个智能运营助手，请严格遵守用户的格式要求进行输出。" },
        { role: "user", content: prompt }
      ],
      model: "deepseek-reasoner",
      temperature: 0.2,
    });

    const result = completion.choices[0].message.content;

    // 4. Save to cache
    if (cacheConfig.ENABLED) {
      reminderCache.set(cacheKey, result);
    }

    return result;

  } catch (error) {
    console.error('Error generating reminder:', error);
    throw new Error('Failed to generate reminder');
  }
}

module.exports = { generateReminder };
