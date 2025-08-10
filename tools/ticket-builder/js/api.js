// This file defines a factory function that creates and returns the API module.
// It receives its dependencies (window) to improve testability and avoid globals.
export const createApiModule = function(window) {
    const apiModule = {
        _settings: null,

        init(settings) {
            this._settings = settings;
        },

        async fetchContent(endpoint) {
            const url = `https://api.github.com/repos/${this._settings.repo}/contents/${endpoint}?ref=trunk`;
            // Use the injected window.fetch
            const response = await window.fetch(url, {
                headers: {
                    'Authorization': `token ${this._settings.pat}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            if (!response.ok) { throw new Error(`${response.status}`); }
            return response.json();
        },

        decodeContent(base64) {
            // Uses the injected window.atob
            return new TextDecoder('utf-8').decode(Uint8Array.from(window.atob(base64), c => c.charCodeAt(0)));
        }
    };
    return apiModule;
};
