import axios from 'axios';

// The base URL should match your backend server
const API_BASE_URL = 'http://localhost:3001/api';

/**
 * Generate position reminder based on metrics data
 * @param {Object} metricsData - The data to analyze
 * @returns {Promise<string>} - The generated to-do list
 */
export const generatePositionReminder = async (metricsData) => {
  try {
    const requestBody = {
      workflowId: 'position_reminder',
      inputs: {
        reminder_positon: metricsData
      },
      user: 'changle-user-position-reminder'
    };
    console.log('Dify 工作流请求参数:', requestBody);
    const response = await axios.post(`${API_BASE_URL}/dify/run-workflow`, requestBody);

    const resp = response?.data || {};
    const text =
      resp?.data?.outputs?.text ??
      resp?.data?.text ??
      resp?.outputs?.text ??
      (typeof resp === 'string' ? resp : null);

    if (!text) {
      throw new Error('Dify 工作流未返回文本输出');
    }
    return text;
  } catch (error) {
    console.error('Error in generatePositionReminder:', error);
    // Return a fallback message if the API fails
    return '无法生成岗位提醒，请稍后重试。';
  }
};
