### **Project Specification: The Ticket Builder**

#### **1. Project Overview**
The Ticket Builder is a minimalist, client-side web application designed to assemble a structured text prompt (a "ticket") for an LLM. It functions as a UI front-end for a private GitHub repository, combining a user-defined task with pre-curated knowledge and selected expert "personas" into a single, cohesive document. The application will have no backend and will be hosted as a static site.

#### **2. Core User Workflow & Philosophy**
The application is built around a "Manual RAG" (Retrieval-Augmented Generation) philosophy. The user is responsible for curating the context for each task *before* using the app.

1.  **Curate the Context:** In the GitHub repo, the user creates a dedicated subfolder within `/semi-RAG/` for a specific task.
2.  **Populate the Context:** The user copies relevant documents from the `/lore/` (project-specific) and `/domains/` (reusable craft) directories into this new task folder.
3.  **Assemble the Ticket:** The user opens the web application and uses its interface to select the curated context folder, add the task description, and choose the appropriate personas and modality.
4.  **Generate:** The application fetches all specified components and assembles the final prompt.

#### **3. Data Source: GitHub Repository Structure**
The application will interact with a single private GitHub repository structured as follows:

```
/ (Repo Root)
├── lore/
│   # Project-specific world bibles, character sheets, etc.
├── domains/
│   # Reusable knowledge on craft, theory, marketing, etc.
├── semi-RAG/
│   # "Workshop" for temporary, curated folders for each ticket.
├── modalities/
│   # Contains one .md file per modality (e.g., 'Brainstorming.md').
├── personas/
│   # Contains one .md file per persona (e.g., 'Tony_Gilroy.md').
├── protocols/
│   └── CORE_PROTOCOL.md # The fundamental blueprint for the ticket.
└── tools/
    └── ticket-builder/
        └── README.md # Guiding principles for the app, to be displayed in the UI.
```

#### **4. Application Architecture**
*   **Type:** Static Web Application (single `index.html` file).
*   **Technology Stack:** Vanilla JavaScript (ES6+), HTML5, CSS3. No frameworks required, but a micro-CSS framework (e.g., Pico.css) is acceptable for styling.
*   **Data Persistence:** Browser `localStorage` will be used to store GitHub repository settings.
*   **Backend:** None. All logic and API calls will be handled client-side via JavaScript.

#### **5. User Interface (UI) Specification**
The UI will be a single-page layout, divided into the following sections from top to bottom:

1.  **Guiding Principles (Collapsible Section):**
    *   A `<details>`/`<summary>` element titled "Show/Hide Guiding Principles".
    *   When expanded, it will display the formatted content of the `tools/ticket-builder/README.md` file.

2.  **Configuration Section:**
    *   Text Input: `GitHub Repo (owner/repo)`
    *   Password Input: `GitHub Personal Access Token (PAT)`
    *   Button: `Save Settings & Load`

3.  **Task Definition Section:**
    *   Large Textarea: `Task` (for the primary user prompt).
    *   Large Textarea: `Additional Context` (for optional user-provided text).

4.  **Component Selection Section:**
    *   **Modality:** A `<select>` dropdown menu, dynamically populated with the filenames from the `/modalities/` directory.
    *   **Personas:** A `<div>` containing a list of checkboxes, dynamically populated with the filenames from the `/personas/` directory.
    *   **Curated Knowledge:** A text input field labeled `Ticket Context Path`, where the user will paste the path to their curated `/semi-RAG/` subfolder.

5.  **Action Section:**
    *   Button: `Generate Ticket`.

6.  **Output Section:**
    *   A read-only `<pre><code>` block to display the final, assembled ticket.
    *   A `Copy to Clipboard` button next to the output block.

7.  **Status Area:**
    *   A `<div>` at the bottom or top of the page to display status messages (e.g., "Files loaded," "Error: Invalid Token").

#### **6. Functional Specification (Logic)**

1.  **On Page Load:**
    *   Check `localStorage` for saved GitHub repo and PAT settings.
    *   If settings exist, automatically trigger the "Load App Data" process.

2.  **On "Save Settings & Load" Click:**
    *   Validate that both the repo and PAT fields are not empty.
    *   Save the values to `localStorage`.
    *   Trigger the "Load App Data" process.

3.  **"Load App Data" Process (triggered by load or save):**
    *   Use the GitHub API and the PAT to:
        *   Fetch and display the content of `tools/ticket-builder/README.md`.
        *   Fetch the file list from the `/modalities/` directory and populate the dropdown.
        *   Fetch the file list from the `/personas/` directory and populate the checkboxes.
    *   Display a success message in the status area.

4.  **On "Generate Ticket" Click:**
    *   Retrieve all user inputs: Task, Context, selected Modality, checked Personas, and the Ticket Context Path.
    *   Create an array of `fetch` promises to retrieve the content of all required files:
        *   `protocols/CORE_PROTOCOL.md`
        *   The selected Modality file from `/modalities/`.
        *   All checked Persona files from `/personas/`.
        *   **All** files located within the user-provided `Ticket Context Path` (e.g., `/semi-RAG/ticket-001/`). This requires a preliminary API call to list the files in that directory, followed by fetches for each file.
    *   Execute all fetches using `Promise.all`.
    *   Decode all file content from Base64 (as returned by the GitHub API).
    *   Assemble the final ticket as a single formatted string, clearly delineating each section.
    *   Display the final string in the output block.

#### **7. Authentication**
*   The application will authenticate with the GitHub API using a Personal Access Token (PAT).
*   The user must generate a **classic** PAT with full **`repo`** scope.
*   The PAT is stored exclusively in the browser's `localStorage` and is never transmitted anywhere other than the GitHub API.

#### **8. Error Handling**
The application must gracefully handle and display user-friendly messages for:
*   Invalid or expired PAT (401 Unauthorized).
*   Invalid repository path (404 Not Found).
*   Invalid Ticket Context Path (404 Not Found).
*   Network failures.

#### **9. Deployment**
*   The application will be deployed as a static website.
*   Recommended free hosting services: **Netlify Drop** or **GitHub Pages**.
