const TicketBuilderApp = {
    // --- CONSTANTS ---
    CORE_PROTOCOL_PATH: 'protocols/CORE_PROTOCOL.md',

    // --- State & Config ---
    settings: { repo: '', pat: '' },

    // --- MODULES ---

    // The UI module is responsible for all DOM interactions.
    ui: {
        elements: {},

        // 1. Caches all DOM elements for easy access.
        init() {
            this.elements = {
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

        // 2. Methods to GET values from inputs
        getRepoInput: function() { return this.elements.repoPathInput.value.trim(); },
        getPatInput: function() { return this.elements.patInput.value.trim(); },
        getTaskInput: function() { return this.elements.taskInput.value; },
        getContextInput: function() { return this.elements.contextInput.value; },
        getModalityPath: function() { return this.elements.modalitySelect.value; },
        getKnowledgePath: function() { return this.elements.knowledgePathInput.value.trim(); },
        getSelectedPersonaPaths: function() {
            return Array.from(this.elements.personasContainer.querySelectorAll('input:checked')).map(cb => cb.value);
        },

        // 3. Methods to UPDATE the UI
        updateStatus(message, isError = false) {
            this.elements.statusArea.innerHTML = `<p style="color: ${isError ? '#dc3545' : 'inherit'}">${message}</p>`;
        },

        setLoadingState(button, isLoading, originalText) {
            button.disabled = isLoading;
            button.textContent = isLoading ? 'Loading...' : originalText;
        },

        showMainApp() {
            this.elements.configSection.style.display = 'none';
            this.elements.configHr.style.display = 'none';
            this.elements.mainAppContainer.style.display = 'block';
        },

        populateReadme(content) {
            this.elements.readmeContent.innerHTML = marked.parse(atob(content));
        },

        populateDropdown(files) {
            const select = this.elements.modalitySelect;
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
            const container = this.elements.personasContainer;
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

        displayTicket(ticketText) {
            this.elements.outputCode.textContent = ticketText;
            this.elements.copyButton.style.display = 'inline-block';
        },

        displayError(errorMessage) {
            this.elements.outputCode.textContent = errorMessage;
        },

        resetCopyButton() {
            this.elements.copyButton.textContent = 'Copy to Clipboard';
        },

        setCopiedState() {
            this.elements.copyButton.textContent = 'Copied!';
            setTimeout(() => this.resetCopyButton(), 2000);
        },
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
            this.ui.elements.repoPathInput.value = savedRepo;
            this.ui.elements.patInput.value = savedPat;
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

    // --- GITHUB API ---
    async githubApiFetch(endpoint) {
        const url = `https://api.github.com/repos/${this.settings.repo}/contents/${endpoint}?ref=trunk`;
        const response = await fetch(url, {
            headers: { 'Authorization': `token ${this.settings.pat}`, 'Accept': 'application/vnd.github.v3+json' }
        });
        if (!response.ok) {
            throw new Error(`${response.status}`);
        }
        return response.json();
    },

    // --- MAIN APP LOGIC / CONTROLLER ---
    async loadAppData() {
        this.ui.setLoadingState(this.ui.elements.saveButton, true, 'Save Settings & Load');
        try {
            const [readmeData, modalitiesData, personasData] = await Promise.all([
                this.githubApiFetch('tools/ticket-builder/README.md'),
                this.githubApiFetch('modalities'),
                this.githubApiFetch('personas')
            ]);
            this.ui.populateReadme(readmeData.content);
            this.ui.populateDropdown(modalitiesData);
            this.ui.populateCheckboxes(personasData);
            this.ui.elements.generateButton.disabled = false;
            this.ui.updateStatus('Application ready. All components loaded successfully.');
            this.ui.showMainApp();
        } catch (error) {
            this.ui.updateStatus(this.getErrorMessage(error), true);
            this.ui.elements.generateButton.disabled = true;
        } finally {
            this.ui.setLoadingState(this.ui.elements.saveButton, false, 'Save Settings & Load');
        }
    },

    async handleGenerateTicket() {
        const originalButtonText = 'Generate Ticket';
        this.ui.setLoadingState(this.ui.elements.generateButton, true, originalButtonText);
        this.ui.elements.outputCode.textContent = 'Fetching components...';
        this.ui.elements.copyButton.style.display = 'none';

        try {
            const decode = (base64) => new TextDecoder('utf-8').decode(Uint8Array.from(atob(base64), c => c.charCodeAt(0)));

            const task = this.ui.getTaskInput();
            const context = this.ui.getContextInput();
            const modalityPath = this.ui.getModalityPath();
            const personaPaths = this.ui.getSelectedPersonaPaths();
            const knowledgePath = this.ui.getKnowledgePath();

            if (!knowledgePath) throw new Error("Ticket Context Path is required.");

            const fetchPromises = {
                protocol: this.githubApiFetch(this.CORE_PROTOCOL_PATH),
                modality: this.githubApiFetch(modalityPath),
                personas: Promise.all(personaPaths.map(p => this.githubApiFetch(p))),
            };

            const knowledgeFileHeaders = await this.githubApiFetch(knowledgePath);
            const filteredKnowledgeFiles = knowledgeFileHeaders.filter(f => f.name.toLowerCase() !== 'readme.md');
            if(filteredKnowledgeFiles.length === 0) {
                this.ui.updateStatus('Warning: No knowledge files found. Ticket generated without them.', false);
            }
            fetchPromises.knowledge = Promise.all(filteredKnowledgeFiles.map(f => this.githubApiFetch(f.path)));

            const results = await Promise.all(Object.values(fetchPromises));
            const [protocolData, modalityData, personasData, knowledgeData] = results;

            const protocolContent = decode(protocolData.content);
            const modalityContent = decode(modalityData.content);
            const personasContent = personasData.map(p => `--- PERSONA: ${p.name.replace('.md','')} ---\n${decode(p.content)}`).join('\n\n');
            const knowledgeContent = knowledgeData.length > 0 ? knowledgeData.map((k, i) => `--- KNOWLEDGE: ${filteredKnowledgeFiles[i].name} ---\n${decode(k.content)}`).join('\n\n') : 'No knowledge files were provided for this ticket.';
            const modalityName = this.ui.elements.modalitySelect.options[this.ui.elements.modalitySelect.selectedIndex].text;

            const finalTicket = `### TASK DEFINITION\n---\n**TASK:** ${task}\n**ADDITIONAL CONTEXT:** ${context}\n\n\n### CORE PROTOCOL\n---\n${protocolContent}\n\n\n### MODALITY: ${modalityName}\n---\n${modalityContent}\n\n\n### SELECTED PERSONAS\n---\n${personasContent}\n\n\n### CURATED KNOWLEDGE\n---\n${knowledgeContent}`.trim();

            this.ui.displayTicket(finalTicket);
            this.ui.updateStatus('Ticket generated successfully!');
        } catch (error) {
            const errorMessage = this.getErrorMessage(error);
            this.ui.updateStatus(errorMessage, true);
            this.ui.displayError(errorMessage);
        } finally {
            this.ui.setLoadingState(this.ui.elements.generateButton, false, originalButtonText);
        }
    },

    handleCopy() {
        navigator.clipboard.writeText(this.ui.elements.outputCode.textContent)
            .then(() => {
                this.ui.setCopiedState();
            })
            .catch(err => this.ui.updateStatus('Failed to copy text.', true));
    },

    // --- App Initialization ---
    init() {
        this.ui.init(); // Initialize the UI module first to cache elements

        // Bind 'this' for event handlers to ensure they refer to TicketBuilderApp
        this.saveSettings = this.saveSettings.bind(this);
        this.handleGenerateTicket = this.handleGenerateTicket.bind(this);
        this.handleCopy = this.handleCopy.bind(this);

        // Add event listeners using elements from the UI module
        this.ui.elements.saveButton.addEventListener('click', this.saveSettings);
        this.ui.elements.generateButton.addEventListener('click', this.handleGenerateTicket);
        this.ui.elements.copyButton.addEventListener('click', this.handleCopy);

        // Initial Load
        this.loadSettings();
    }
};

// Start the application
TicketBuilderApp.init();
