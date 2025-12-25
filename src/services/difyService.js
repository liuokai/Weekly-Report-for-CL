
import { AI_CONFIG } from '../config/aiConfig';

class DifyService {
  /**
   * Check if AI service is enabled globally
   */
  get isEnabled() {
    return AI_CONFIG.ENABLE_AI;
  }

  /**
   * Generate a unique cache key based on workflow key and inputs
   */
  _generateCacheKey(workflowKey, inputs) {
    // Sort keys to ensure consistent order
    const sortedInputs = Object.keys(inputs || {}).sort().reduce((obj, key) => {
      obj[key] = inputs[key];
      return obj;
    }, {});
    
    // Create a simple hash or string representation
    // Using simple string concatenation for now as inputs are expected to be small JSON
    const inputStr = JSON.stringify(sortedInputs);
    const prefix = AI_CONFIG.CACHE?.STORAGE_KEY_PREFIX || 'dify_cache_';
    return `${prefix}${workflowKey}_${inputStr}`;
  }

  /**
   * Try to get data from localStorage cache
   */
  _getFromCache(key) {
    if (!AI_CONFIG.CACHE?.ENABLED) return null;

    try {
      const cachedItem = localStorage.getItem(key);
      if (!cachedItem) return null;

      const { timestamp, data } = JSON.parse(cachedItem);
      // Use nullish coalescing (??) to allow 0 as a valid duration, fallback only if undefined/null
      const duration = AI_CONFIG.CACHE?.DURATION ?? (24 * 60 * 60 * 1000);

      if (Date.now() - timestamp < duration) {
        console.log(`[DifyService] Cache hit for key: ${key}`);
        return data;
      } else {
        console.log(`[DifyService] Cache expired for key: ${key}`);
        localStorage.removeItem(key);
        return null;
      }
    } catch (e) {
      console.warn('[DifyService] Failed to read from cache', e);
      return null;
    }
  }

  /**
   * Save data to localStorage cache
   */
  _saveToCache(key, data) {
    if (!AI_CONFIG.CACHE?.ENABLED) return;

    try {
      const cacheItem = {
        timestamp: Date.now(),
        data
      };
      localStorage.setItem(key, JSON.stringify(cacheItem));
    } catch (e) {
      console.warn('[DifyService] Failed to save to cache', e);
    }
  }

  /**
   * Run a Dify workflow via the backend proxy
   * @param {string} workflowKey - Identifies the workflow (currently ignored by backend as it uses env, but good for future)
   * @param {Object} inputs - Inputs for the workflow
   */
  async runWorkflow(workflowKey, inputs = {}) {
    // 1. Check global switch
    if (!this.isEnabled) {
      console.log('DifyService: AI is disabled by config. Skipping workflow run.');
      return null;
    }

    // 2. Check Cache
    const cacheKey = this._generateCacheKey(workflowKey, inputs);
    const cachedResult = this._getFromCache(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    try {
      const response = await fetch('/api/dify/run-workflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Dify 'blocking' mode response structure:
      // { data: { outputs: { text: "..." }, status: "succeeded" } }
      
      if (result.data && result.data.status === 'succeeded') {
        const outputs = result.data.outputs;
        // 1. Try common keys
        let finalOutput = outputs.text || outputs.answer || outputs.content || outputs.result;

        // 2. If valid output found, check if it is a JSON string (double-encoded)
        if (typeof finalOutput === 'string') {
           try {
             const parsed = JSON.parse(finalOutput);
             if (parsed && typeof parsed === 'object') {
                // If the parsed object has a 'content' or 'text' field, use that
                if (parsed.content) finalOutput = parsed.content;
                else if (parsed.text) finalOutput = parsed.text;
             }
           } catch (e) {
             // Not a JSON string, keep as is
           }
        }
        
        // 3. Fallback: if no specific key found, or still empty, stringify the whole outputs
        if (!finalOutput) {
          finalOutput = JSON.stringify(outputs);
        }

        // 4. Save to Cache
        this._saveToCache(cacheKey, finalOutput);

        return finalOutput;
      } else {
         throw new Error(result.message || 'Workflow execution failed');
      }

    } catch (error) {
      console.error('Dify Service Error:', error);
      throw error;
    }
  }
}

export default new DifyService();
