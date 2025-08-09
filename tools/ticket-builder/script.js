const TicketBuilderApp = {
    // --- CONSTANTS ---
    CORE_PROTOCOL_PATH: 'protocols/CORE_PROTOCOL.md',

    // --- 1. DOM Element References ---
    configSection: null,
    repoPathInput: null,
    patInput: null,
    // ... (all other element references)
    copyButton: null,

    // --- 2. Configuration & State ---
    settings: { repo: '', pat: '' },

    // --- UTILITY FUNCTIONS ---
    getErrorMessage(error) {
        // ... (implementation unchanged)
        const msg = error.message || '';
        if (msg.includes('401')) return 'Error 401: Invalid GitHub token. Please check your Personal Access Token and its permissions.';
        if (msg.includes('404')) return 'Error 404: A file or directory was not found. Please check your paths (e.g., repo path, context path).';
        if (msg.includes('Failed to fetch')) return 'Network Error: Failed to connect to GitHub. Please check your internet connection.';
        return `An unexpected error occurred: ${msg}`;
    },

    setLoadingState(button, isLoading, originalText) {
        // ... (implementation unchanged)
        button.disabled = isLoading;
        button.textContent = isLoading ? 'Loading...' : originalText;
    },

    validateRepoPath(repo) {
        // ... (implementation unchanged)
        const pattern = /^[a-zA-Z0-9-._]+\/[a-zA-Z0-9-._]+$/;
        return pattern.test(repo);
    },

    updateStatus(message, isError = false) {
        this.statusArea.innerHTML = `<p style="color: ${isError ? '#dc3545' : 'inherit'}">${message}</p>`;
    },

    showMainApp() {
        this.configSection.style.display = 'none';
        this.configHr.style.display = 'none';
        this.mainAppContainer.style.display = 'block';
    },

    loadSettings() {
        const savedRepo = localStorage.getItem('cortagora_repo');
        const savedPat = localStorage.getItem('cortagora_pat');
        if (savedRepo && savedPat) {
            this.repoPathInput.value = savedRepo;
            this.patInput.value = savedPat;
            this.settings.repo = savedRepo;
            this.settings.pat = savedPat;
            this.updateStatus('Saved settings loaded. Fetching data...');
            this.loadAppData();
        }
    },

    saveSettings() {
        const repo = this.repoPathInput.value.trim();
        const pat = this.patInput.value.trim();

        if (!this.validateRepoPath(repo)) {
            this.updateStatus('Error: Invalid repository format. Please use "owner/repo".', true);
            return;
        }
        if (!pat) {
            this.updateStatus('Error: Personal Access Token is required.', true);
            return;
        }

        this.settings.repo = repo;
        this.settings.pat = pat;
        localStorage.setItem('cortagora_repo', repo);
        localStorage.setItem('cortagora_pat', pat);
        this.updateStatus('Settings saved. Loading data...');
        this.loadAppData();
    },

    // --- 3. GitHub API Communication ---
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

    // --- 4. UI Population ---
    populateReadme(content) { this.readmeContent.innerHTML = marked.parse(atob(content)); },

    populateDropdown(select, files) {
        // ... (implementation unchanged, no `this` needed here)
        select.innerHTML = '';
        files.filter(f => f.name.endsWith('.md') && f.name.toLowerCase() !== 'readme.md')
             .forEach(f => {
                const opt = document.createElement('option');
                opt.value = f.path;
                opt.textContent = f.name.replace('.md', '').replace(/[\(\)\d]/g, '').trim();
                select.appendChild(opt);
        });
    },

    populateCheckboxes(container, files) {
        // ... (implementation unchanged, no `this` needed here)
        container.innerHTML = '';
        files.filter(f => f.name.endsWith('.md') && f.name.toLowerCase() !== 'readme.md')
             .forEach(f => {
                const id = `cb-${f.sha}`;
                const wrap = document.createElement('div');
                const cb = document.createElement('input');
                cb.type = 'checkbox'; cb.id = id; cb.value = f.path;
                const lbl = document.createElement('label');
                lbl.htmlFor = id;
                lbl.textContent = f.name.replace('.md', 'ПЕРСОНЫ', '').trim();
                wrap.append(cb, lbl);
                container.appendChild(wrap);
        });
    },

    // --- 5. Main Data Loading Function ---
    async loadAppData() {
        this.setLoadingState(this.saveButton, true, 'Save Settings & Load');
        try {
            const [readmeData, modalitiesData, personasData] = await Promise.all([
                this.githubApiFetch('tools/ticket-builder/README.md'),
                this.githubApiFetch('modalities'),
                this.githubApiFetch('personas')
            ]);
            this.populateReadme(readmeData.content);
            this.populateDropdown(this.modalitySelect, modalitiesData);
            this.populateCheckboxes(this.personasContainer, personasData);
            this.generateButton.disabled = false;
            this.updateStatus('Application ready. All components loaded successfully.');
            this.showMainApp();
        } catch (error) {
            this.updateStatus(this.getErrorMessage(error), true);
            this.generateButton.disabled = true;
        } finally {
            this.setLoadingState(this.saveButton, false, 'Save Settings & Load');
        }
    },

    // --- 6. TICKET GENERATION LOGIC ---
    async handleGenerateTicket() {
        const originalButtonText = 'Generate Ticket';
        this.setLoadingState(this.generateButton, true, originalButtonText);
        this.outputCode.textContent = 'Fetching components...';
        this.copyButton.style.display = 'none';

        try {
            const decode = (base64) => {
                const binaryString = atob(base64);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                return new TextDecoder('utf-8').decode(bytes);
            };

            const task = this.taskInput.value;
            const context = this.contextInput.value;
            const modalityPath = this.modalitySelect.value;
            const personaPaths = Array.from(document.querySelectorAll('#personas-container input:checked')).map(cb => cb.value);
            const knowledgePath = this.knowledgePathInput.value.trim();

            if (!knowledgePath) throw new Error("Ticket Context Path is required.");

            const fetchPromises = {};
            fetchPromises.protocol = this.githubApiFetch(this.CORE_PROTOCOL_PATH);
            fetchPromises.modality = this.githubApiFetch(modalityPath);
            fetchPromises.personas = Promise.all(personaPaths.map(p => this.githubApiFetch(p)));

            const knowledgeFileHeaders = await this.githubApiFetch(knowledgePath);
            const filteredKnowledgeFiles = knowledgeFileHeaders.filter(f => f.name.toLowerCase() !== 'readme.md');
            if(filteredKnowledgeFiles.length === 0) {
                this.updateStatus('Warning: No knowledge files found in the specified context path. Ticket generated without them.', false);
            }
            fetchPromises.knowledge = Promise.all(filteredKnowledgeFiles.map(f => this.githubApiFetch(f.path)));

            const results = await Promise.all(Object.values(fetchPromises));
            const [protocolData, modalityData, personasData, knowledgeData] = results;

            const protocolContent = decode(protocolData.content);
            const modalityContent = decode(modalityData.content);
            const personasContent = personasData.map(p => `--- PERSONA: ${p.name.replace('.md','')} ---\n${decode(p.content)}`).join('\n\n');
            const knowledgeContent = knowledgeData.length > 0 ? knowledgeData.map((k, i) => `--- KNOWLEDGE: ${filteredKnowledgeFiles[i].name} ---\n${decode(k.content)}`).join('\n\n') : 'No knowledge files were provided for this ticket.';

            const finalTicket = `### TASK DEFINITION\n---\n**TASK:** ${task}\n**ADDITIONAL CONTEXT:** ${context}\n\n\n### CORE PROTOCOL\n---\n${protocolContent}\n\n\n### MODALITY: ${this.modalitySelect.options[this.modalitySelect.selectedIndex].text}\n---\n${modalityContent}\n\n\n### SELECTED PERSONAS\n---\n${personasContent}\n\n\n### CURATED KNOWLEDGE\n---\n${knowledgeContent}`.trim();

            this.outputCode.textContent = finalTicket;
            this.copyButton.style.display = 'inline-block';
            this.updateStatus('Ticket generated successfully!');
        } catch (error) {
            const errorMessage = this.getErrorMessage(error);
            this.updateStatus(errorMessage, true);
            this.outputCode.textContent = errorMessage;
        } finally {
            this.setLoadingState(this.generateButton, false, originalButtonText);
        }
    },

    handleCopy() {
        navigator.clipboard.writeText(this.outputCode.textContent).then(() => {
            this.copyButton.textContent = 'Copied!';
            setTimeout(() => { this.copyButton.textContent = 'Copy to Clipboard'; }, 2000);
        }).catch(err => this.updateStatus('Failed to copy text.', true));
    },

    // --- 7. App Initialization ---
    init() {
        // Cache DOM elements
        this.configSection = document.getElementById('config-section');
        this.repoPathInput = document.getElementById('repo-path');
        this.patInput = document.getElementById('github-pat');
        this.saveButton = document.getElementById('save-button');
        this.statusArea = document.getElementById('status-area');
        this.readmeContent = document.getElementById('readme-content');
        this.modalitySelect = document.getElementById('modality-select');
        this.personasContainer = document.getElementById('personas-container');
        this.generateButton = document.getElementById('generate-button');
        this.mainAppContainer = document.getElementById('main-app-container');
        this.configHr = document.getElementById('config-hr');
        this.taskInput = document.getElementById('task-input');
        this.contextInput = document.getElementById('context-input');
        this.knowledgePathInput = document.getElementById('knowledge-path');
        this.outputCode = document.getElementById('output-code');
        this.copyButton = document.getElementById('copy-button');

        // Bind `this` for event handlers
        this.saveSettings = this.saveSettings.bind(this);
        this.handleGenerateTicket = this.handleGenerateTicket.bind(this);
        this.handleCopy = this.handleCopy.bind(this);

        // Add event listeners
        this.saveButton.addEventListener('click', this.saveSettings);
        this.generateButton.addEventListener('click', this.handleGenerateTicket);
        this.copyButton.addEventListener('click', this.handleCopy);

        // Initial Load
        this.loadSettings();
    }
};

// Start the application
TicketBuilderApp.init();
