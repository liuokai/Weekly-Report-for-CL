const fs = require('fs');
const path = require('path');

/**
 * Generate position reminder to-do list using DeepSeek
 * @param {Object} deepseekClient - The initialized OpenAI/DeepSeek client
 * @param {Object} metricsData - The metrics data from the frontend
 * @returns {Promise<string>} - The generated to-do list text
 */
async function generateReminder(deepseekClient, metricsData) {
  try {
    // 1. Read the knowledge base file
    const knowledgePath = path.join(__dirname, '../../src/config/关于常乐的基础业务知识介绍.md');
    let knowledgeContent = '';
    try {
      knowledgeContent = fs.readFileSync(knowledgePath, 'utf8');
    } catch (err) {
      console.error('Failed to read knowledge file:', err);
      knowledgeContent = '暂无业务知识库信息。';
    }

    // 2. Prepare the prompt
    const prompt = `
      你是一个严格遵循格式的智能运营助手。请结合以下信息，为“客单价拆解”模块生成一份**岗位提醒报告**。
      
      【重要排版指令 - 必须严格执行】
      请**不要**生成一个连续的数字列表。
      请**务必**按照以下三个章节标题进行分段输出：
      ### 🏢 公司整体
      ### 🏙️ 城市维度
      ### 🏪 门店维度
      
      【业务背景与指标负责人】
      ${knowledgeContent}
      
      【当前各项指标数据】
      ${JSON.stringify(metricsData, null, 2)}
      
      【任务要求】
      1. 分析指标数据，找出未达标或表现较差的指标。
      2. 根据业务背景文档，找到这些指标对应的具体负责人。
      3. **门店维度**：针对表现不佳的城市，给出建议让相关负责人去关注其下属门店。
      
      【格式细节】
      - 使用 Markdown 格式。
      - **章节之间空一行**。
      - **每一条建议单独占一段，且建议之间空一行**。
      - **不要全文加粗**。仅对 **关键数值**（如 **5%**）、**地名**（如 **成都市**）和 **人名**（如 **@熊生兵**）加粗。
      - 针对严重程度使用 emoji：🔴 (严重)、🟡 (警告)、🟢 (保持)。
      - 语言简练，直击要点，不要寒暄。
      
      【输出示例】
      ### 🏢 公司整体

      🔴 整体客单价同比下降 **3%**，需关注定价策略。 **@熊生兵**（推拿之家总监）

      ### 🏙️ 城市维度

      🟡 **成都市**客单价微降 **1%**，需复盘促销效果。 **@陈雪晴**（技术副总）

      ### 🏪 门店维度

      🔴 请 **成都市** 团队重点排查低客单价门店，优化服务流程。 **@陈雪晴**、**@龚建梅**
    `;

    // 3. Call DeepSeek API
    const completion = await deepseekClient.chat.completions.create({
      messages: [
        { role: "system", content: "你是一个智能运营助手，请严格遵守用户的格式要求进行输出。" },
        { role: "user", content: prompt }
      ],
      model: "deepseek-reasoner",
      temperature: 0.2,
    });

    return completion.choices[0].message.content;

  } catch (error) {
    console.error('Error generating reminder:', error);
    throw new Error('Failed to generate reminder');
  }
}

module.exports = { generateReminder };
