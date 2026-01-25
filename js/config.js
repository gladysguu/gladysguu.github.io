// ========================
// Airtable Configuration
// ========================
// Replace these values with your Airtable credentials
// Get your API key from: https://airtable.com/create/tokens
// Get your Base ID from your Airtable base URL (starts with 'app')

const AIRTABLE_CONFIG = {
    // Your Airtable Personal Access Token
    API_KEY: 'patYV7w0ZmsdByegp.91495f80498a518f45622b3fec595133a2a84a4edd7294f1dd0ef293f24f78e9',

    // Your Airtable Base ID (found in the URL of your base, starts with 'app')
    BASE_ID: 'appMun1RH1QLeNZ1V',

    // Table names (must match exactly what you created in Airtable)
    TABLES: {
        APPLICATIONS: 'applications',
        COFFEE_STORIES: 'coffee_stories',
        STORY_SUBMISSIONS: 'story_submissions'
    }
};

// Airtable API base URL
const AIRTABLE_API_URL = `https://api.airtable.com/v0/${AIRTABLE_CONFIG.BASE_ID}`;

// Helper function to make Airtable API requests
async function airtableFetch(tableName, options = {}) {
    const url = `${AIRTABLE_API_URL}/${tableName}`;
    const defaultHeaders = {
        'Authorization': `Bearer ${AIRTABLE_CONFIG.API_KEY}`,
        'Content-Type': 'application/json'
    };

    const fetchOptions = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...(options.headers || {})
        }
    };

    return fetch(url, fetchOptions);
}

// Helper function to create a record in Airtable
async function airtableCreate(tableName, fields) {
    return airtableFetch(tableName, {
        method: 'POST',
        body: JSON.stringify({ fields })
    });
}

// Helper function to get records from Airtable
async function airtableGet(tableName, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${tableName}?${queryString}` : tableName;
    return airtableFetch(url);
}
