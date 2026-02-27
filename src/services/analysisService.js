import axios from 'axios';

// The base URL should match your backend server
const API_BASE_URL = '/api';

/**
 * Generate new store analysis based on data
 * @param {Array} newStoreData - The data to analyze
 * @returns {Promise<string>} - The generated analysis text
 */
export const generateNewStoreAnalysis = async (newStoreData, currentTotalStores) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/generate-new-store-analysis`, {
      newStoreData,
      currentTotalStores
    });
    if (response.data.status === 'success') {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Failed to generate analysis');
    }
  } catch (error) {
    console.error('Error in generateNewStoreAnalysis:', error);
    return '无法生成分析总结，请稍后重试。';
  }
};
