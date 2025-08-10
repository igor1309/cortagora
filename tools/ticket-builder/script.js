import { createUiModule } from './js/ui.js';
import { createApiModule } from './js/api.js';

const TicketBuilderApp = {
    // --- CONSTANTS ---
    CORE_PROTOCOL_PATH: 'protocols/CORE_PROTOCOL.md',

    // --- State & Config ---
    settings: { repo: '', pat: '' },

    // The UI and API modules will be instantiated and placed here.
    ui: null,
    api: null,

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
            // This now calls the ui object attached to 'this'
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
            this.ui.setGeneratorEnabled(true);
            this.ui.updateStatus('Application ready. All components loaded successfully.');
            this.ui.showMainApp();
        } catch (error) {
            this.ui.updateStatus(this.getErrorMessage(error), true);
            this.ui.setGeneratorEnabled(false);
        } finally {
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
        const textToCopy = this.ui.getOutputText();
        navigator.clipboard.writeText(textToCopy)
            .then(() => {
                this.ui.setCopiedState();
            })
            .catch(err => this.ui.updateStatus('Failed to copy text.', true));
    },

    // --- App Initialization ---
    init() {
        // The main app creates and integrates modules, injecting dependencies.
        // `marked` is available globally from the CDN script.
        this.ui = createUiModule(window, marked);
        this.api = createApiModule(window);

        this.ui.init();
        this.api.init(this.settings);
        this.saveSettings = this.saveSettings.bind(this);
        this.handleGenerateTicket = this.handleGenerateTicket.bind(this);
        this.handleCopy = this.handleCopy.bind(this);
        this.ui.bindEvents({
            onSave: this.saveSettings,
            onGenerate: this.handleGenerateTicket,
            onCopy: this.handleCopy
        });
        this.loadSettings();
    }
};

// Start the application
TicketBuilderApp.init();
