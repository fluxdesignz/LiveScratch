import axios from 'axios';

export class Filter {
    constructor() {
        this.apiUserId = process.env.NEUTRINOAPI_USERID; // Your NeutrinoAPI user ID
        this.apiKey = process.env.NEUTRINOAPI_KEY; // Your NeutrinoAPI key
        this.catalog = 'strict'; // Use the "strict" catalog for filtering
    }

    /**
     * Check if the given content contains bad words.
     * @param {string} content - The input string to check for profanity.
     * @returns {Promise<{ isBad: boolean, badWordsTotal: number, badWordsList: string[], censoredContent: string }>}
     */
    async checkContent(content) {
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

            return {
                isBad: data['is-bad'], // Does the content contain bad words?
                badWordsTotal: data['bad-words-total'], // Total number of bad words found
                badWordsList: data['bad-words-list'], // Array of detected bad words
                censoredContent: data['censored-content'] // The censored content
            };
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
