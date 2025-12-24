const axios = require('axios');

/**
 * Generate analysis using Dify Workflow API
 * @param {Array|Object} data - The data to analyze (Currently unused as per user request)
 * @param {string} promptTemplate - The prompt template (Currently unused as per user request)
 * @returns {Promise<string>} - The analysis result
 */
async function generateAnalysis(data, promptTemplate) {
  const API_KEY = process.env.DIFY_API_KEY;
  const BASE_URL = process.env.DIFY_BASE_URL;
  const USER = process.env.DIFY_USER;

  if (!API_KEY) {
    console.warn('DIFY_API_KEY is not set, skipping AI analysis');
    return 'AI Analysis unavailable: API Key not configured.';
  }

  console.log('Starting Dify Workflow analysis...');

  try {
    const response = await axios({
      method: 'post',
      url: BASE_URL,
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      data: {
        inputs: {}, // As per user request
        response_mode: 'streaming',
        user: USER
      },
      responseType: 'stream'
    });

    return new Promise((resolve, reject) => {
      let fullText = '';
      let workflowOutputs = null;
      let buffer = '';

      response.data.on('data', (chunk) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n\n');
        buffer = lines.pop(); // Keep the incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.substring(6);
            if (jsonStr === '[DONE]') continue;
            
            try {
              const eventData = JSON.parse(jsonStr);
              
              // Handle different event types
              if (eventData.event === 'text_chunk' && eventData.data && eventData.data.text) {
                fullText += eventData.data.text;
              } else if (eventData.event === 'workflow_finished' && eventData.data && eventData.data.outputs) {
                workflowOutputs = eventData.data.outputs;
              } else if (eventData.event === 'message' && eventData.answer) {
                 // Fallback for chat apps if needed
                 fullText += eventData.answer;
              }
            } catch (e) {
              console.warn('Error parsing Dify chunk:', e.message);
            }
          }
        }
      });

      response.data.on('end', () => {
        console.log('Dify stream ended.');
        
        // Prioritize text accumulated from chunks
        if (fullText.trim()) {
          resolve(fullText);
        } else if (workflowOutputs) {
          // If no text chunks, try to find a string output in workflow_finished
          const outputValues = Object.values(workflowOutputs);
          const stringOutput = outputValues.find(v => typeof v === 'string');
          if (stringOutput) {
            resolve(stringOutput);
          } else {
            resolve(JSON.stringify(workflowOutputs, null, 2));
          }
        } else {
          resolve('AI Analysis completed but no output was received.');
        }
      });

      response.data.on('error', (err) => {
        console.error('Dify stream error:', err);
        reject(err);
      });
    });

  } catch (error) {
    console.error('Dify Service Error:', error.message);
    if (error.response) {
      console.error('Dify Response Status:', error.response.status);
      console.error('Dify Response Data:', error.response.data);
    }
    return `AI Analysis failed: ${error.message}`;
  }
}

module.exports = {
  generateAnalysis
};