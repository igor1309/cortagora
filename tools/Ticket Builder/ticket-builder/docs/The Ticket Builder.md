### **Final Blueprint Summary: The Ticket Builder**

#### **1. The Objective**
To create a minimalist, cross-platform application that assembles a highly-focused LLM prompt (a "ticket"). It achieves this by combining a user's specific task with pre-curated knowledge and selected expert "personas."

#### **2. The Technical Solution**
A **static web application** (a single `index.html` file with JavaScript and basic CSS).
*   **Why:** It is zero-cost, requires no backend server, works on any device with a web browser (macOS/iOS), and is extremely simple to build and maintain.
*   **Data Source:** It will use a **private GitHub repository** as its database, fetching all necessary files via the GitHub API.

#### **3. The Core Workflow (The "Manual RAG" Process)**
This is the most critical part of the system.
1.  **Curate the Context:** Before using the app, you manually create a dedicated subfolder inside `/semi-RAG/` for your specific task (e.g., `/semi-RAG/ticket-005-rewrite-scene/`).
2.  **Populate the Context:** You copy the relevant documents into this new folder:
    *   From the `/lore/` directory (project-specific files like character sheets).
    *   From the `/domains/` directory (reusable craft files like storytelling frameworks).
3.  **Use the App:** You open the Ticket Builder web page and fill it out:
    *   Enter your **Task** and any additional **Context**.
    *   Provide the **path** to the curated folder you just created.
    *   Select your desired **Personas** and a **Modality**.
4.  **Generate:** The app fetches all the specified components and assembles them into the final ticket, ready to be copied.

#### **4. The Repository Structure**
The entire system lives in a single private Git repository organized as follows:

```
/ (Repo Root)
├── lore/
│   # The "World Shelf": Project-specific bibles, characters, etc.
│
├── domains/
│   # The "Craft Shelf": Reusable knowledge on structure, marketing, etc.
│
├── semi-RAG/
│   # The "Workshop": Contains temporary, curated folders for each ticket.
│
└── tools/
    └── ticket-builder/
        └── README.md   # The app's guiding principles and instructions.
```

#### **5. Key Application Features**
*   **Guiding Principles:** The app will fetch and display the `tools/ticket-builder/README.md` in an expandable section at the top, ensuring the philosophy of use is always visible.
*   **Simple Inputs:** Text fields for the Task, Context, and the curated `/semi-RAG/` folder path.
*   **Dynamic Lists:** The app will populate dropdowns/checkboxes for Modalities and Personas by reading the file lists from their respective folders in the repo.
*   **Final Output:** A text area will display the fully assembled ticket with a "Copy to Clipboard" button for convenience.
