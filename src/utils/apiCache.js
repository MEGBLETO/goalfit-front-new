/**
 * Simple in-memory API response cache
 * Caches API responses to reduce redundant network requests
 */

class APICache {
  constructor() {
    this.cache = new Map()
    this.timestamps = new Map()
  }

  /**
   * Get cached data if it exists and is not expired
   * @param {string} key - Cache key (usually the API endpoint)
   * @param {number} maxAge - Max age in milliseconds (default: 5 minutes)
   * @returns {any|null} Cached data or null if expired/not found
   */
  get(key, maxAge = 5 * 60 * 1000) {
    if (!this.cache.has(key)) {
      return null
    }

    const timestamp = this.timestamps.get(key)
    const now = Date.now()

    // Check if cache is expired
    if (now - timestamp > maxAge) {
      this.delete(key)
      return null
    }

    return this.cache.get(key)
  }

  /**
   * Set data in cache with current timestamp
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   */
  set(key, data) {
    this.cache.set(key, data)
    this.timestamps.set(key, Date.now())
  }

  /**
   * Delete a specific cache entry
   * @param {string} key - Cache key to delete
   */
  delete(key) {
    this.cache.delete(key)
    this.timestamps.delete(key)
  }

  /**
   * Clear all cache entries
   */
  clear() {
    this.cache.clear()
    this.timestamps.clear()
  }

  /**
   * Get cache size
   * @returns {number} Number of cached entries
   */
  size() {
    return this.cache.size
  }

  /**
   * Check if key exists in cache (regardless of expiration)
   * @param {string} key - Cache key
   * @returns {boolean}
   */
  has(key) {
    return this.cache.has(key)
  }
}

// Export singleton instance
export const apiCache = new APICache()

/**
 * Wrapper function for fetch with caching
 * @param {string} url - API endpoint URL
 * @param {object} options - Fetch options
 * @param {number} cacheTime - Cache duration in milliseconds (default: 5 minutes)
 * @returns {Promise<any>} API response data
 */
export async function cachedFetch(url, options = {}, cacheTime = 5 * 60 * 1000) {
  // Only cache GET requests
  const method = options.method || 'GET'
  if (method !== 'GET') {
    return fetch(url, options).then(res => res.json())
  }

  // Create cache key from URL and headers
  const cacheKey = `${url}_${JSON.stringify(options.headers || {})}`

  // Check cache first
  const cached = apiCache.get(cacheKey, cacheTime)
  if (cached !== null) {
    console.log(`[Cache HIT] ${url}`)
    return Promise.resolve(cached)
  }

  // Fetch from API if not cached
  console.log(`[Cache MISS] ${url}`)
  try {
    const response = await fetch(url, options)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()

    // Store in cache
    apiCache.set(cacheKey, data)

    return data
  } catch (error) {
    console.error(`[Cache ERROR] ${url}:`, error)
    throw error
  }
}

/**
 * Invalidate cache for specific pattern
 * Useful when you update data and need to refresh related caches
 * @param {string} pattern - Pattern to match cache keys (e.g., '/user/')
 */
export function invalidateCache(pattern) {
  const keys = Array.from(apiCache.cache.keys())
  keys.forEach(key => {
    if (key.includes(pattern)) {
      apiCache.delete(key)
      console.log(`[Cache INVALIDATE] ${key}`)
    }
  })
}

export default apiCache
