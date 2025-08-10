// Path: js/ui.js
// This file defines a factory function that creates and returns the UI module.
// It receives its dependencies (window, marked) to improve testability.
// It is exported to be used as an ES Module.
export const createUiModule = function(window, marked) {
    const doc = window.document; // Local reference to the document object

    const uiModule = {
        _elements: {},

        init() {
            this._elements = {
                configSection: doc.getElementById('config-section'),
                repoPathInput: doc.getElementById('repo-path'),
                patInput: doc.getElementById('github-pat'),
                saveButton: doc.getElementById('save-button'),
                statusArea: doc.getElementById('status-area'),
                readmeContent: doc.getElementById('readme-content'),
                modalitySelect: doc.getElementById('modality-select'),
                personasContainer: doc.getElementById('personas-container'),
                generateButton: doc.getElementById('generate-button'),
                mainAppContainer: doc.getElementById('main-app-container'),
                configHr: doc.getElementById('config-hr'),
                taskInput: doc.getElementById('task-input'),
                contextInput: doc.getElementById('context-input'),
                knowledgePathInput: doc.getElementById('knowledge-path'),
                knowledgePathList: doc.getElementById('knowledge-path-list'),
                outputCode: doc.getElementById('output-code'),
                copyButton: doc.getElementById('copy-button'),
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
        getModalityDisplayName: function() {
            const selectedOption = this._elements.modalitySelect.options[this._elements.modalitySelect.selectedIndex];
            return selectedOption ? selectedOption.text : '';
        },
        getKnowledgePath: function() { return this._elements.knowledgePathInput.value.trim(); },
        getSelectedPersonas: function() {
            return Array.from(this._elements.personasContainer.querySelectorAll('input:checked')).map(cb => {
                // The label is assumed to be the next sibling of the input checkbox
                const label = cb.nextElementSibling;
                return {
                    path: cb.value,
                    displayName: label ? label.textContent.trim() : ''
                };
            });
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
            this._elements.readmeContent.innerHTML = marked.parse(window.atob(content));
        },
        populateDropdown(files) {
            const select = this._elements.modalitySelect;
            select.innerHTML = '';
            files.forEach(f => {
                const opt = doc.createElement('option');
                opt.value = f.path;
                opt.textContent = f.displayName;
                select.appendChild(opt);
            });
        },
        populateCheckboxes(files) {
            const container = this._elements.personasContainer;
            container.innerHTML = '';
            files.forEach(f => {
                const id = `cb-${f.sha}`;
                const wrap = doc.createElement('div');
                const cb = doc.createElement('input');
                cb.type = 'checkbox'; cb.id = id; cb.value = f.path;
                const lbl = doc.createElement('label');
                lbl.htmlFor = id;
                lbl.textContent = f.displayName;
                wrap.append(cb, lbl);
                container.appendChild(wrap);
            });
        },
        populateKnowledgeList(directories) {
            const datalist = this._elements.knowledgePathList;
            datalist.innerHTML = '';
            directories.forEach(dir => {
                const opt = doc.createElement('option');
                opt.value = dir.path;
                datalist.appendChild(opt);
            });
        },
        displayTicket(ticketText) {
            this._elements.outputCode.textContent = ticketText;
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
            window.setTimeout(() => {
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
