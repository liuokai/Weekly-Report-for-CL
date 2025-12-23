const OpenAI = require('openai');

// Initialize OpenAI client with DeepSeek configuration
const openai = new OpenAI({
  baseURL: process.env.AI_ENDPOINT || 'https://api.deepseek.com',
  apiKey: process.env.AI_API_KEY,
});

/**
 * Generate analysis using AI
 * @param {Array|Object} data - The data to analyze
 * @param {string} promptTemplate - The prompt template
 * @returns {Promise<string>} - The analysis result
 */
async function generateAnalysis(data, promptTemplate) {
  if (!process.env.AI_API_KEY) {
    console.warn('AI_API_KEY is not set, skipping AI analysis');
    return 'AI Analysis unavailable: API Key not configured.';
  }

  try {
    // Convert data to string format for the prompt
    const dataStr = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    
    // Construct the final prompt
    const content = `${promptTemplate}\n\nData:\n${dataStr}`;

    console.log('Sending request to AI provider...');
    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: "You are a professional business data analyst." },
        { role: "user", content: content }
      ],
      model: "deepseek-chat",
      temperature: 0.7,
      max_tokens: 2000
    }, { timeout: 30000 }); // 30s timeout

    console.log('AI response received.');
    return completion.choices[0].message.content;
  } catch (error) {
    console.error('AI Service Error:', error.message);
    if (error.code === 'ETIMEDOUT') {
       return 'AI Analysis timed out. Please try again later.';
    }
    // Return a friendly error message instead of throwing, so we don't block the main response
    return `AI Analysis failed: ${error.message}`;
  }
}

module.exports = {
  generateAnalysis
};
