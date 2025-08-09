### **The Ticket Builder: Guiding Principles**

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