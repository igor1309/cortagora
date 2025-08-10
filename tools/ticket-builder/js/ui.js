// This file defines a factory function that creates and returns the UI module.
window.createUiModule = function() {
    const uiModule = {
        _elements: {},

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

        bindEvents(handlers) {
            this._elements.saveButton.addEventListener('click', handlers.onSave);
            this._elements.generateButton.addEventListener('click', handlers.onGenerate);
            this._elements.copyButton.addEventListener('click', handlers.onCopy);
        },

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
        displayTicket(ticketTemplate) {
            const modalityText = this._elements.modalitySelect.options[this._elements.modalitySelect.selectedIndex].text;
            const finalTicketText = ticketTemplate.replace('MODALITY_PLACEHOLDER', modalityText);
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
        setCredentials(repo, pat) {
            this._elements.repoPathInput.value = repo;
            this._elements.patInput.value = pat;
        },
        setGeneratorEnabled(isEnabled) {
            this._elements.generateButton.disabled = !isEnabled;
        }
    };
    return uiModule;
};
