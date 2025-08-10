// Path: script.js
import { createUiModule } from './js/ui.js';
import { createApiModule } from './js/api.js';

const TicketBuilderApp = {
    // --- CONSTANTS ---
    CORE_PROTOCOL_PATH: 'protocols/CORE_PROTOCOL.md',
    SEMI_RAG_PATH: 'semi-RAG',

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
    async _fetchAndParseDirectoryItems(dirPath) {
        const directoryListing = await this.api.fetchContent(dirPath);
        const mdFiles = directoryListing.filter(f =>
            f.type === 'file' && f.name.endsWith('.md') && f.name.toLowerCase() !== 'readme.md'
        );
        const filesWithContent = await Promise.all(
            mdFiles.map(file =>
                this.api.fetchContent(file.path).then(contentData => ({...file, content: contentData.content}))
            )
        );
        return filesWithContent.map(file => {
            const decodedContent = this.api.decodeContent(file.content);
            const frontMatter = this.api.parseFrontMatter(decodedContent);
            const title = this.api.parseFrontMatterTitle(frontMatter);
            const fallbackName = file.name.replace('.md', '').trim();
            return { ...file, displayName: title || fallbackName };
        });
    },

    async loadAppData() {
        this.ui.setLoadingState('saveButton', true, 'Save Settings & Load');
        try {
            const [readmeData, modalities, personas, ragDirContents] = await Promise.all([
                this.api.fetchContent('tools/ticket-builder/README.md'),
                this._fetchAndParseDirectoryItems('modalities'),
                this._fetchAndParseDirectoryItems('personas'),
                this.api.fetchContent(this.SEMI_RAG_PATH)
            ]);

            const ragDirectories = ragDirContents.filter(item => item.type === 'dir');

            this.ui.populateReadme(readmeData.content);
            this.ui.populateDropdown(modalities);
            this.ui.populateCheckboxes(personas);
            this.ui.populateKnowledgeList(ragDirectories);
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
        // --- 1. GATHER AND VALIDATE INPUTS ---
        const task = this.ui.getTaskInput();
        if (!task) {
            this.ui.updateStatus('Error: Task definition cannot be empty.', true);
            this.ui.displayError('Please define the core task before generating a ticket.');
            return;
        }

        const knowledgePath = this.ui.getKnowledgePath();
        if (!knowledgePath) {
            this.ui.updateStatus('Error: Ticket Context Path is required.', true);
            this.ui.displayError('Please select or enter a Ticket Context Path.');
            return;
        }

        // --- PASSED VALIDATION, PROCEED WITH GENERATION ---
        const originalButtonText = 'Generate Ticket';
        this.ui.setLoadingState('generateButton', true, originalButtonText);
        this.ui.displayInitialMessage('Fetching and processing components...');
        try {
            // Get remaining inputs
            const context = this.ui.getContextInput();
            const modalityPath = this.ui.getModalityPath();
            const modalityName = this.ui.getModalityDisplayName();
            const selectedPersonas = this.ui.getSelectedPersonas();

            // --- 2. FETCH & PROCESS ALL COMPONENTS IN PARALLEL ---
            const protocolPromise = this.api.fetchContent(this.CORE_PROTOCOL_PATH)
                .then(data => this.api.stripFrontMatter(this.api.decodeContent(data.content)));

            const modalityPromise = this.api.fetchContent(modalityPath)
                .then(data => this.api.stripFrontMatter(this.api.decodeContent(data.content)));

            const personasPromise = Promise.all(selectedPersonas.map(p => this.api.fetchContent(p.path)))
                .then(results => results.map((data, i) => {
                    const stripped = this.api.stripFrontMatter(this.api.decodeContent(data.content));
                    const displayName = selectedPersonas[i].displayName;
                    return `--- PERSONA: ${displayName} ---\n${stripped}`;
                }).join('\n\n'));

            const knowledgePromise = this.api.fetchContent(knowledgePath).then(async (headers) => {
                const mdFiles = headers.filter(f => f.name.toLowerCase() !== 'readme.md');
                if (mdFiles.length === 0) {
                    this.ui.updateStatus('Warning: No knowledge files found. Ticket generated without them.', false);
                    return 'No knowledge files were provided for this ticket.';
                }
                const contentPromises = mdFiles.map(f => this.api.fetchContent(f.path));
                const filesWithContent = await Promise.all(contentPromises);

                return filesWithContent.map(fileData => {
                    const decoded = this.api.decodeContent(fileData.content);
                    const frontMatter = this.api.parseFrontMatter(decoded);
                    const title = this.api.parseFrontMatterTitle(frontMatter);
                    const stripped = this.api.stripFrontMatter(decoded);
                    const displayName = title || fileData.name.replace(/\.md$/i, '');
                    return `--- KNOWLEDGE: ${displayName} ---\n${stripped}`;
                }).join('\n\n');
            });

            const [protocolContent, modalityContent, personasContent, knowledgeContent] = await Promise.all([
                protocolPromise, modalityPromise, personasPromise, knowledgePromise
            ]);

            // --- 3. ASSEMBLE THE FINAL TICKET ---
            const ticketTemplate = `### TASK DEFINITION\n---\n**TASK:** ${task}\n**ADDITIONAL CONTEXT:** ${context}\n\n\n### CORE PROTOCOL\n---\n${protocolContent}\n\n\n### MODALITY: ${modalityName}\n---\n${modalityContent}\n\n\n### SELECTED PERSONAS\n---\n${personasContent}\n\n\n### CURATED KNOWLEDGE\n---\n${knowledgeContent}`.trim();

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
            .then(() => { this.ui.setCopiedState(); })
            .catch(err => this.ui.updateStatus('Failed to copy text.', true));
    },

    // --- App Initialization ---
    init() {
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

TicketBuilderApp.init();
