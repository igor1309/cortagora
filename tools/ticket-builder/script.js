
// --- CONSTANTS ---
const CORE_PROTOCOL_PATH = 'protocols/CORE_PROTOCOL.md';

// --- 1. DOM Element References ---
const configSection = document.getElementById('config-section');
const repoPathInput = document.getElementById('repo-path');
const patInput = document.getElementById('github-pat');
const saveButton = document.getElementById('save-button');
const statusArea = document.getElementById('status-area');
const readmeContent = document.getElementById('readme-content');
const modalitySelect = document.getElementById('modality-select');
const personasContainer = document.getElementById('personas-container');
const generateButton = document.getElementById('generate-button');
const mainAppContainer = document.getElementById('main-app-container');
const configHr = document.getElementById('config-hr');
const taskInput = document.getElementById('task-input');
const contextInput = document.getElementById('context-input');
const knowledgePathInput = document.getElementById('knowledge-path');
const outputCode = document.getElementById('output-code');
const copyButton = document.getElementById('copy-button');

// --- 2. Configuration & State ---
let settings = { repo: '', pat: '' };

// --- UTILITY FUNCTIONS ---
const getErrorMessage = (error) => {
    const msg = error.message || '';
    if (msg.includes('401')) return 'Error 401: Invalid GitHub token. Please check your Personal Access Token and its permissions.';
    if (msg.includes('404')) return 'Error 404: A file or directory was not found. Please check your paths (e.g., repo path, context path).';
    if (msg.includes('Failed to fetch')) return 'Network Error: Failed to connect to GitHub. Please check your internet connection.';
    return `An unexpected error occurred: ${msg}`;
};

const setLoadingState = (button, isLoading, originalText) => {
    button.disabled = isLoading;
    button.textContent = isLoading ? 'Loading...' : originalText;
};

const validateRepoPath = (repo) => {
    const pattern = /^[a-zA-Z0-9-._]+\/[a-zA-Z0-9-._]+$/;
    return pattern.test(repo);
};

const updateStatus = (message, isError = false) => {
    statusArea.innerHTML = `<p style="color: ${isError ? '#dc3545' : 'inherit'}">${message}</p>`;
};

const showMainApp = () => {
    configSection.style.display = 'none';
    configHr.style.display = 'none';
    mainAppContainer.style.display = 'block';
};

const loadSettings = () => {
    const savedRepo = localStorage.getItem('cortagora_repo');
    const savedPat = localStorage.getItem('cortagora_pat');
    if (savedRepo && savedPat) {
        repoPathInput.value = savedRepo;
        patInput.value = savedPat;
        settings.repo = savedRepo;
        settings.pat = savedPat;
        updateStatus('Saved settings loaded. Fetching data...');
        loadAppData();
    }
};

const saveSettings = () => {
    const repo = repoPathInput.value.trim();
    const pat = patInput.value.trim();

    if (!validateRepoPath(repo)) {
        updateStatus('Error: Invalid repository format. Please use "owner/repo".', true);
        return;
    }
    if (!pat) {
        updateStatus('Error: Personal Access Token is required.', true);
        return;
    }

    settings.repo = repo;
    settings.pat = pat;
    localStorage.setItem('cortagora_repo', repo);
    localStorage.setItem('cortagora_pat', pat);
    updateStatus('Settings saved. Loading data...');
    loadAppData();
};

// --- 3. GitHub API Communication ---
const githubApiFetch = async (endpoint) => {
    const url = `https://api.github.com/repos/${settings.repo}/contents/${endpoint}?ref=trunk`;
    const response = await fetch(url, {
        headers: { 'Authorization': `token ${settings.pat}`, 'Accept': 'application/vnd.github.v3+json' }
    });
    if (!response.ok) {
        throw new Error(`${response.status}`);
    }
    return response.json();
};

// --- 4. UI Population ---
const populateReadme = (content) => { readmeContent.innerHTML = marked.parse(atob(content)); };
const populateDropdown = (select, files) => {
    select.innerHTML = '';
    files.filter(f => f.name.endsWith('.md') && f.name.toLowerCase() !== 'readme.md')
         .forEach(f => {
            const opt = document.createElement('option');
            opt.value = f.path;
            opt.textContent = f.name.replace('.md', '').replace(/[\(\)\d]/g, '').trim();
            select.appendChild(opt);
    });
};
const populateCheckboxes = (container, files) => {
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
};

// --- 5. Main Data Loading Function ---
const loadAppData = async () => {
    setLoadingState(saveButton, true, 'Save Settings & Load');
    try {
        const [readmeData, modalitiesData, personasData] = await Promise.all([
            githubApiFetch('tools/ticket-builder/README.md'),
            githubApiFetch('modalities'),
            githubApiFetch('personas')
        ]);
        populateReadme(readmeData.content);
        populateDropdown(modalitySelect, modalitiesData);
        populateCheckboxes(personasContainer, personasData);
        generateButton.disabled = false;
        updateStatus('Application ready. All components loaded successfully.');
        showMainApp();
    } catch (error) {
        updateStatus(getErrorMessage(error), true);
        generateButton.disabled = true;
    } finally {
        setLoadingState(saveButton, false, 'Save Settings & Load');
    }
};

// --- 6. TICKET GENERATION LOGIC ---
const handleGenerateTicket = async () => {
    const originalButtonText = 'Generate Ticket';
    setLoadingState(generateButton, true, originalButtonText);
    outputCode.textContent = 'Fetching components...';
    copyButton.style.display = 'none';

    try {
        const decode = (base64) => {
            const binaryString = atob(base64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            return new TextDecoder('utf-8').decode(bytes);
        };

        const task = taskInput.value;
        const context = contextInput.value;
        const modalityPath = modalitySelect.value;
        const personaPaths = Array.from(document.querySelectorAll('#personas-container input:checked')).map(cb => cb.value);
        const knowledgePath = knowledgePathInput.value.trim();

        if (!knowledgePath) throw new Error("Ticket Context Path is required.");

        const fetchPromises = {};
        fetchPromises.protocol = githubApiFetch(CORE_PROTOCOL_PATH);
        fetchPromises.modality = githubApiFetch(modalityPath);
        fetchPromises.personas = Promise.all(personaPaths.map(p => githubApiFetch(p)));

        const knowledgeFileHeaders = await githubApiFetch(knowledgePath);
        const filteredKnowledgeFiles = knowledgeFileHeaders.filter(f => f.name.toLowerCase() !== 'readme.md');
        if(filteredKnowledgeFiles.length === 0) {
            updateStatus('Warning: No knowledge files found in the specified context path. Ticket generated without them.', false);
        }
        fetchPromises.knowledge = Promise.all(filteredKnowledgeFiles.map(f => githubApiFetch(f.path)));

        const results = await Promise.all(Object.values(fetchPromises));
        const [protocolData, modalityData, personasData, knowledgeData] = results;

        const protocolContent = decode(protocolData.content);
        const modalityContent = decode(modalityData.content);
        const personasContent = personasData.map(p => `--- PERSONA: ${p.name.replace('.md','')} ---\n${decode(p.content)}`).join('\n\n');
        const knowledgeContent = knowledgeData.length > 0 ? knowledgeData.map((k, i) => `--- KNOWLEDGE: ${filteredKnowledgeFiles[i].name} ---\n${decode(k.content)}`).join('\n\n') : 'No knowledge files were provided for this ticket.';

        const finalTicket = `### TASK DEFINITION\n---\n**TASK:** ${task}\n**ADDITIONAL CONTEXT:** ${context}\n\n\n### CORE PROTOCOL\n---\n${protocolContent}\n\n\n### MODALITY: ${modalitySelect.options[modalitySelect.selectedIndex].text}\n---\n${modalityContent}\n\n\n### SELECTED PERSONAS\n---\n${personasContent}\n\n\n### CURATED KNOWLEDGE\n---\n${knowledgeContent}`.trim();

        outputCode.textContent = finalTicket;
        copyButton.style.display = 'inline-block';
        updateStatus('Ticket generated successfully!');
    } catch (error) {
        const errorMessage = getErrorMessage(error);
        updateStatus(errorMessage, true);
        outputCode.textContent = errorMessage;
    } finally {
        setLoadingState(generateButton, false, originalButtonText);
    }
};

const handleCopy = () => {
    navigator.clipboard.writeText(outputCode.textContent).then(() => {
        copyButton.textContent = 'Copied!';
        setTimeout(() => { copyButton.textContent = 'Copy to Clipboard'; }, 2000);
    }).catch(err => updateStatus('Failed to copy text.', true));
};

// --- 7. Event Listeners ---
saveButton.addEventListener('click', saveSettings);
generateButton.addEventListener('click', handleGenerateTicket);
copyButton.addEventListener('click', handleCopy);

// --- Initial Load ---
loadSettings();
