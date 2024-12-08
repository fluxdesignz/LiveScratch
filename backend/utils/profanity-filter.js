import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

export class Filter {
    constructor() {
        this.apiUserId = process.env.NEUTRINOAPI_USERID; // Your NeutrinoAPI user ID
        this.apiKey = process.env.NEUTRINOAPI_KEY; // Your NeutrinoAPI key
        this.catalog = 'strict'; // Use the "strict" catalog for filtering
        this.cacheFolder = path.resolve('filter_cache'); // Folder for caching results
    }

    /**
     * Initialize the cache folder if it doesn't exist.
     */
    async initCache() {
        try {
            await fs.mkdir(this.cacheFolder, { recursive: true });
        } catch (error) {
            console.error('Error initializing cache folder:', error.message);
            throw new Error('Failed to initialize cache folder');
        }
    }

    /**
     * Generate a cache key for the given content.
     * @param {string} content - The input string to hash for cache key.
     * @returns {string} - The cache file name.
     */
    getCacheFileName(content) {
        const sanitizedContent = content.replace(/[^a-zA-Z0-9]/g, '_'); // Simple sanitization
        return path.join(this.cacheFolder, `${sanitizedContent}.json`);
    }

    /**
     * Save the result to the cache.
     * @param {string} content - The input content.
     * @param {object} result - The result to cache.
     */
    async saveToCache(content, result) {
        const fileName = this.getCacheFileName(content);
        try {
            await fs.writeFile(fileName, JSON.stringify(result, null, 2), 'utf-8');
        } catch (error) {
            console.error('Error saving to cache:', error.message);
        }
    }

    /**
     * Load a cached result if it exists.
     * @param {string} content - The input content.
     * @returns {object|null} - The cached result or null if not found.
     */
    async loadFromCache(content) {
        const fileName = this.getCacheFileName(content);
        try {
            const data = await fs.readFile(fileName, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            if (error.code !== 'ENOENT') {
                console.error('Error loading from cache:', error.message);
            }
            return null;
        }
    }

    /**
     * Check if the given content contains bad words.
     * @param {string} content - The input string to check for profanity.
     * @returns {Promise<{ isBad: boolean, badWordsTotal: number, badWordsList: string[], censoredContent: string }>}
     */
    async checkContent(content) {
        await this.initCache();
        
        // Check cache first
        const cachedResult = await this.loadFromCache(content);
        if (cachedResult) {
            return cachedResult;
        }

        // If not in cache, make API request
        try {
            const response = await axios.post('https://neutrinoapi.net/bad-word-filter', null, {
                headers: {
                    'User-ID': this.apiUserId,
                    'API-Key': this.apiKey
                },
                params: {
                    'catalog': this.catalog, // The strict catalog
                    'censor-character': '*', // Character to replace bad words
                    'content': content // The input content to analyze
                }
            });

            const data = response.data;

            const result = {
                isBad: data['is-bad'], // Does the content contain bad words?
                badWordsTotal: data['bad-words-total'], // Total number of bad words found
                badWordsList: data['bad-words-list'], // Array of detected bad words
                censoredContent: data['censored-content'] // The censored content
            };

            // Save result to cache
            await this.saveToCache(content, result);

            return result;
        } catch (error) {
            console.error('Error checking content:', error.response?.data || error.message);
            throw new Error('Failed to process content with NeutrinoAPI');
        }
    }

    /**
     * Determines if the input text is vulgar.
     * @param {string} text - The input text.
     * @returns {Promise<boolean>} - Returns true if vulgar, otherwise false.
     */
    async isVulgar(text) {
        const result = await this.checkContent(text);
        return result.isBad;
    }

    /**
     * Gets the censored version of the input text.
     * @param {string} text - The input text.
     * @returns {Promise<string>} - Returns the censored text.
     */
    async getCensored(text) {
        const result = await this.checkContent(text);
        return result.censoredContent || text; // Return censored content if available
    }
}