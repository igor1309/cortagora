const TicketBuilderApp = {
    // --- CONSTANTS ---
    CORE_PROTOCOL_PATH: 'protocols/CORE_PROTOCOL.md',

    // --- State & Config ---
    settings: { repo: '', pat: '' },

    // --- MODULES ---

    // The UI module is now properly encapsulated.
    ui: {
        // _elements is now "private" to the ui module.
        _elements: {},

        // 1. Caches all DOM elements for easy access.
        init() {
            this._elements = {
                configSection: document.getElementById('config-section'),
                repoPathInput: document.getElementById('repo-path'),
                patInput: document.getElementById('github-pat'),
                saveButton: document.getElementById('save-button'),
                statusArea: document.getElementById('status-area'),
                readmeContent: document.getElementById('readme-content'),
                modalitySelect: document.getElementById('modality-select'),
                personasContainer: document.getElementById('personas-container'),
                generateButton: document.getElementById('generate-button'),
                mainAppContainer: document.getElementById('main-app-container'),
                configHr: document.getElementById('config-hr'),
                taskInput: document.getElementById('task-input'),
                contextInput: document.getElementById('context-input'),
                knowledgePathInput: document.getElementById('knowledge-path'),
                outputCode: document.getElementById('output-code'),
                copyButton: document.getElementById('copy-button'),
            };
        },

        // NEW: This method attaches the event handlers passed from the main app.
        bindEvents(handlers) {
            this._elements.saveButton.addEventListener('click', handlers.onSave);
            this._elements.generateButton.addEventListener('click', handlers.onGenerate);
            this._elements.copyButton.addEventListener('click', handlers.onCopy);
        },

        // 2. Methods to GET values from inputs (Getters are ok)
        getRepoInput: function() { return this._elements.repoPathInput.value.trim(); },
        getPatInput: function() { return this._elements.patInput.value.trim(); },
        getTaskInput: function() { return this._elements.taskInput.value; },
        getContextInput: function() { return this._elements.contextInput.value; },
        getModalityPath: function() { return this._elements.modalitySelect.value; },
        getKnowledgePath: function() { return this._elements.knowledgePathInput.value.trim(); },
        getSelectedPersonaPaths: function() {
            return Array.from(this._elements.personasContainer.querySelectorAll('input:checked')).map(cb => cb.value);
        },
        getOutputText: function() { return this._elements.outputCode.textContent; },

        // 3. Methods to UPDATE the UI (Setters)
        updateStatus(message, isError = false) {
            this._elements.statusArea.innerHTML = `<p style="color: ${isError ? '#dc3545' : 'inherit'}">${message}</p>`;
        },
        setLoadingState(buttonName, isLoading, originalText) {
            const button = this._elements[buttonName];
            if (button) {
                button.disabled = isLoading;
                button.textContent = isLoading ? 'Loading...' : originalText;
            }
        },
        showMainApp() {
            this._elements.configSection.style.display = 'none';
            this._elements.configHr.style.display = 'none';
            this._elements.mainAppContainer.style.display = 'block';
        },
        populateReadme(content) {
            this._elements.readmeContent.innerHTML = marked.parse(atob(content));
        },
        populateDropdown(files) {
            const select = this._elements.modalitySelect;
            select.innerHTML = '';
            files.filter(f => f.name.endsWith('.md') && f.name.toLowerCase() !== 'readme.md')
                 .forEach(f => {
                    const opt = document.createElement('option');
                    opt.value = f.path;
                    opt.textContent = f.name.replace('.md', '').replace(/[\(\)\d]/g, '').trim();
                    select.appendChild(opt);
            });
        },
        populateCheckboxes(files) {
            const container = this._elements.personasContainer;
            container.innerHTML = '';
            files.filter(f => f.name.endsWith('.md') && f.name.toLowerCase() !== 'readme.md')
                 .forEach(f => {
                    const id = `cb-${f.sha}`;
                    const wrap = document.createElement('div');
                    const cb = document.createElement('input');
                    cb.type = 'checkbox'; cb.id = id; cb.value = f.path;
                    const lbl = document.createElement('label');
                    lbl.htmlFor = id;
                    lbl.textContent = f.name.replace('.md', '').replace('ПЕРСОНЫ', '').trim();
                    wrap.append(cb, lbl);
                    container.appendChild(wrap);
            });
        },
        displayTicket(ticketText, modalityName) {
            const modalityText = this._elements.modalitySelect.options[this._elements.modalitySelect.selectedIndex].text;
            const finalTicketText = ticketText.replace('MODALITY_PLACEHOLDER', modalityText);

            this._elements.outputCode.textContent = finalTicketText;
            this._elements.copyButton.style.display = 'inline-block';
        },
        displayInitialMessage(message) {
            this._elements.outputCode.textContent = message;
            this._elements.copyButton.style.display = 'none';
        },
        displayError(errorMessage) {
            this._elements.outputCode.textContent = errorMessage;
        },
        setCopiedState() {
            this._elements.copyButton.textContent = 'Copied!';
            setTimeout(() => {
                this._elements.copyButton.textContent = 'Copy to Clipboard';
            }, 2000);
        },
        // NEW setter methods
        setCredentials(repo, pat) {
            this._elements.repoPathInput.value = repo;
            this._elements.patInput.value = pat;
        },
        setGeneratorEnabled(isEnabled) {
            this._elements.generateButton.disabled = !isEnabled;
        }
    },

    // --- API module is unchanged ---
    api: {
        _settings: null,
        init(settings) { this._settings = settings; },
        async fetchContent(endpoint) {
            const url = `https://api.github.com/repos/${this._settings.repo}/contents/${endpoint}?ref=trunk`;
            const response = await fetch(url, {
                headers: { 'Authorization': `token ${this._settings.pat}`, 'Accept': 'application/vnd.github.v3+json' }
            });
            if (!response.ok) { throw new Error(`${response.status}`); }
            return response.json();
        },
        decodeContent(base64) {
            return new TextDecoder('utf-8').decode(Uint8Array.from(atob(base64), c => c.charCodeAt(0)));
        }
    },

    // --- UTILITY FUNCTIONS ---
    getErrorMessage(error) {
        const msg = error.message || '';
        if (msg.includes('401')) return 'Error 401: Invalid GitHub token. Please check your Personal Access Token and its permissions.';
        if (msg.includes('404')) return 'Error 404: A file or directory was not found. Please check your paths (e.g., repo path, context path).';
        if (msg.includes('Failed to fetch')) return 'Network Error: Failed to connect to GitHub. Please check your internet connection.';
        return `An unexpected error occurred: ${msg}`;
    },

    validateRepoPath(repo) {
        const pattern = /^[a-zA-Z0-9-._]+\/[a-zA-Z0-9-._]+$/;
        return pattern.test(repo);
    },

    // --- SETTINGS LOGIC ---
    loadSettings() {
        const savedRepo = localStorage.getItem('cortagora_repo');
        const savedPat = localStorage.getItem('cortagora_pat');
        if (savedRepo && savedPat) {
            // UPDATED: Now uses the new setter method.
            this.ui.setCredentials(savedRepo, savedPat);
            this.settings.repo = savedRepo;
            this.settings.pat = savedPat;
            this.ui.updateStatus('Saved settings loaded. Fetching data...');
            this.loadAppData();
        }
    },

    saveSettings() {
        const repo = this.ui.getRepoInput();
        const pat = this.ui.getPatInput();
        if (!this.validateRepoPath(repo)) {
            this.ui.updateStatus('Error: Invalid repository format. Please use "owner/repo".', true);
            return;
        }
        if (!pat) {
            this.ui.updateStatus('Error: Personal Access Token is required.', true);
            return;
        }
        this.settings.repo = repo;
        this.settings.pat = pat;
        localStorage.setItem('cortagora_repo', repo);
        localStorage.setItem('cortagora_pat', pat);
        this.ui.updateStatus('Settings saved. Loading data...');
        this.loadAppData();
    },

    // --- MAIN APP LOGIC / CONTROLLER ---
    async loadAppData() {
        // UPDATED: Now passes button name as a string.
        this.ui.setLoadingState('saveButton', true, 'Save Settings & Load');
        try {
            const [readmeData, modalitiesData, personasData] = await Promise.all([
                this.api.fetchContent('tools/ticket-builder/README.md'),
                this.api.fetchContent('modalities'),
                this.api.fetchContent('personas')
            ]);
            this.ui.populateReadme(readmeData.content);
            this.ui.populateDropdown(modalitiesData);
            this.ui.populateCheckboxes(personasData);
            // UPDATED: Uses new setter method.
            this.ui.setGeneratorEnabled(true);
            this.ui.updateStatus('Application ready. All components loaded successfully.');
            this.ui.showMainApp();
        } catch (error) {
            this.ui.updateStatus(this.getErrorMessage(error), true);
            // UPDATED: Uses new setter method.
            this.ui.setGeneratorEnabled(false);
        } finally {
            // UPDATED: Now passes button name as a string.
            this.ui.setLoadingState('saveButton', false, 'Save Settings & Load');
        }
    },

    async handleGenerateTicket() {
        const originalButtonText = 'Generate Ticket';
        this.ui.setLoadingState('generateButton', true, originalButtonText);
        this.ui.displayInitialMessage('Fetching components...');

        try {
            const task = this.ui.getTaskInput();
            const context = this.ui.getContextInput();
            const modalityPath = this.ui.getModalityPath();
            const personaPaths = this.ui.getSelectedPersonaPaths();
            const knowledgePath = this.ui.getKnowledgePath();

            if (!knowledgePath) throw new Error("Ticket Context Path is required.");

            const fetchPromises = {
                protocol: this.api.fetchContent(this.CORE_PROTOCOL_PATH),
                modality: this.api.fetchContent(modalityPath),
                personas: Promise.all(personaPaths.map(p => this.api.fetchContent(p))),
            };

            const knowledgeFileHeaders = await this.api.fetchContent(knowledgePath);
            const filteredKnowledgeFiles = knowledgeFileHeaders.filter(f => f.name.toLowerCase() !== 'readme.md');
            if(filteredKnowledgeFiles.length === 0) {
                this.ui.updateStatus('Warning: No knowledge files found. Ticket generated without them.', false);
            }
            fetchPromises.knowledge = Promise.all(filteredKnowledgeFiles.map(f => this.api.fetchContent(f.path)));

            const results = await Promise.all(Object.values(fetchPromises));
            const [protocolData, modalityData, personasData, knowledgeData] = results;

            const protocolContent = this.api.decodeContent(protocolData.content);
            const modalityContent = this.api.decodeContent(modalityData.content);
            const personasContent = personasData.map(p => `--- PERSONA: ${p.name.replace('.md','')} ---\n${this.api.decodeContent(p.content)}`).join('\n\n');
            const knowledgeContent = knowledgeData.length > 0 ? knowledgeData.map((k, i) => `--- KNOWLEDGE: ${filteredKnowledgeFiles[i].name} ---\n${this.api.decodeContent(k.content)}`).join('\n\n') : 'No knowledge files were provided for this ticket.';

            // UPDATED: The modality name is now resolved inside the ui module.
            const ticketTemplate = `### TASK DEFINITION\n---\n**TASK:** ${task}\n**ADDITIONAL CONTEXT:** ${context}\n\n\n### CORE PROTOCOL\n---\n${protocolContent}\n\n\n### MODALITY: MODALITY_PLACEHOLDER\n---\n${modalityContent}\n\n\n### SELECTED PERSONAS\n---\n${personasContent}\n\n\n### CURATED KNOWLEDGE\n---\n${knowledgeContent}`.trim();

            this.ui.displayTicket(ticketTemplate);
            this.ui.updateStatus('Ticket generated successfully!');
        } catch (error) {
            const errorMessage = this.getErrorMessage(error);
            this.ui.updateStatus(errorMessage, true);
            this.ui.displayError(errorMessage);
        } finally {
            this.ui.setLoadingState('generateButton', false, originalButtonText);
        }
    },

    handleCopy() {
        // UPDATED: Now gets the text from the UI module.
        const textToCopy = this.ui.getOutputText();
        navigator.clipboard.writeText(textToCopy)
            .then(() => {
                this.ui.setCopiedState();
            })
            .catch(err => this.ui.updateStatus('Failed to copy text.', true));
    },

    // --- App Initialization ---
    init() {
        this.ui.init();
        this.api.init(this.settings);

        // Bind 'this' for event handlers to ensure they refer to TicketBuilderApp
        this.saveSettings = this.saveSettings.bind(this);
        this.handleGenerateTicket = this.handleGenerateTicket.bind(this);
        this.handleCopy = this.handleCopy.bind(this);

        // UPDATED: The init function now passes the handlers to the ui.bindEvents method.
        // It no longer knows about buttons, only about the functions.
        this.ui.bindEvents({
            onSave: this.saveSettings,
            onGenerate: this.handleGenerateTicket,
            onCopy: this.handleCopy
        });

        // Initial Load
        this.loadSettings();
    }
};

// Start the application
TicketBuilderApp.init();
