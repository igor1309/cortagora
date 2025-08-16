## **The Ticket Builder**

### Guiding Principles

This tool assembles a targeted prompt for an LLM by combining a specific task with curated knowledge and expert perspectives. Follow this workflow for best results.

**1. Separate Your Knowledge (The Library):**
Your knowledge base is divided into two primary categories:
*   **`/lore`:** The "World." Contains project-specific bibles, character profiles, and story beats. Each project gets its own subfolder.
*   **`/domains`:** The "Craft." Contains universal, reusable knowledge about storytelling, character theory, marketing, etc.

**2. Curate Your Context (The Workshop Table):**
For each new task, create a dedicated folder inside `/semi-RAG/`. The name should describe the ticket (e.g., `ticket-004-act1-inciting-incident`).
*   **From `/lore`:** Copy the specific character sheets, world rules, or scenes relevant to this exact task into your new ticket folder.
*   **From `/domains`:** Copy the theoretical frameworks or craft guides that will help analyze the problem into the same folder.

**3. Assemble The Ticket (The App's Job):**
*   **Task & Context:** Define your specific goal in the text fields.
*   **Ticket Context Path:** Provide the path to the curated folder you just created (e.g., `semi-RAG/ticket-004-act1-inciting-incident`).
*   **Personas & Modality:** Select the expert lens and the creative mode you wish to apply.

The app will now gather all these components into a single, powerful, and highly focused prompt.

---

### Running the Application

This application uses modern JavaScript Modules (ESM). Due to browser security policies (CORS), it cannot be run by simply opening the `index.html` file from your local filesystem. You must serve the files from a simple local web server.

Here are a few easy ways to do this. Choose one:

**1. Using VS Code's Live Server Extension (Recommended)**
1.  Install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension from the VS Code Marketplace.
2.  In the VS Code file explorer, right-click on `index.html`.
3.  Select "Open with Live Server". Your browser will open with the app running.

**2. Using Python**
If you have Python installed, you can use its built-in web server.
1.  Open your terminal or command prompt.
2.  Navigate to the project's root directory (the one containing `index.html`).
3.  Run the command: `python -m http.server`
4.  Open your web browser and go to `http://localhost:8000`.

**3. Using Node.js**
If you have Node.js and npm installed, you can use the `serve` package.
1.  Open your terminal or command prompt.
2.  Navigate to the project's root directory.
3.  Run the command: `npx serve`
4.  The terminal will give you a local URL (e.g., `http://localhost:3000`). Open it in your browser.
