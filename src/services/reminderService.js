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
    const response = await axios.post(`${API_BASE_URL}/generate-reminder`, {
      metricsData
    });

    if (response.data.status === 'success') {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Failed to generate reminder');
    }
  } catch (error) {
    console.error('Error in generatePositionReminder:', error);
    // Return a fallback message if the API fails
    return '无法生成岗位提醒，请稍后重试。';
  }
};
