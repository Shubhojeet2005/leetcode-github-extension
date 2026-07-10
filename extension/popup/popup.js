// Simple state management pattern
class PopupApp {
  constructor() {
    this.state = {
      apiKey: "",
      githubToken: "",
      githubOwner: "",
      githubRepo: "",
    };
    this.status = { message: "", type: "" };
    this.root = document.getElementById("root");
    this.loadSettings();
  }

  loadSettings() {
    chrome.storage.sync.get(
      ["apiKey", "githubToken", "githubOwner", "githubRepo"],
      (items) => {
        this.state = {
          apiKey: items.apiKey || "",
          githubToken: items.githubToken || "",
          githubOwner: items.githubOwner || "",
          githubRepo: items.githubRepo || "",
        };
        this.render();
      }
    );
  }

  handleChange(field, value) {
    this.state[field] = value;
  }

  getFieldValues() {
    return {
      apiKey: document.getElementById("apiKey")?.value.trim() || "",
      githubToken: document.getElementById("githubToken")?.value.trim() || "",
      githubOwner: document.getElementById("githubOwner")?.value.trim() || "",
      githubRepo: document.getElementById("githubRepo")?.value.trim() || "",
    };
  }

  async handleTestConnection() {
    const { apiKey } = this.getFieldValues();

    if (!apiKey) {
      this.setStatus("Enter your Backend API Key first.", "error");
      return;
    }

    this.setStatus("Testing connection...", "info");

    try {
      const res = await fetch("http://localhost:5000/api/solutions/verify", {
        headers: { "x-api-key": apiKey },
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        this.setStatus("Connection OK — API key matches the backend.", "success");
        return;
      }

      if (res.status === 401) {
        this.setStatus(
          "Unauthorized — copy API_KEY from backend/.env into Backend API Key, then Save.",
          "error"
        );
        return;
      }

      this.setStatus(data.error || `Connection failed (${res.status}).`, "error");
    } catch {
      this.setStatus(
        "Cannot reach backend at http://localhost:5000. Start it with npm run dev.",
        "error"
      );
    }
  }

  handleSave() {
    const { apiKey, githubToken, githubOwner, githubRepo } = this.getFieldValues();

    this.state = { apiKey, githubToken, githubOwner, githubRepo };

    if (!apiKey || !githubToken || !githubOwner || !githubRepo) {
      this.setStatus("Please fill in all fields before saving.", "error");
      return;
    }

    chrome.storage.sync.set(
      { apiKey, githubToken, githubOwner, githubRepo },
      () => {
        if (chrome.runtime.lastError) {
          this.setStatus(chrome.runtime.lastError.message, "error");
          return;
        }
        this.setStatus("Settings saved successfully.", "success");
      }
    );
  }

  setStatus(message, type) {
    this.status = { message, type };
    this.render();
    if (type === "success") {
      setTimeout(() => {
        this.status = { message: "", type: "" };
        this.render();
      }, 3000);
    }
  }

  render() {
    this.root.innerHTML = `
      <h3>LeetCode → GitHub Tracker</h3>
      <div class="form-container">
        <div class="form-group">
          <label for="apiKey">Backend API Key</label>
          <input
            id="apiKey"
            type="password"
            placeholder="your-secret-key"
            value="${this.escapeHtml(this.state.apiKey)}"
          />
        </div>
        <div class="form-group">
          <label for="githubToken">GitHub Token</label>
          <input
            id="githubToken"
            type="password"
            placeholder="ghp_xxx"
            value="${this.escapeHtml(this.state.githubToken)}"
          />
        </div>
        <div class="form-group">
          <label for="githubOwner">GitHub Owner</label>
          <input
            id="githubOwner"
            type="text"
            placeholder="your-github-username"
            value="${this.escapeHtml(this.state.githubOwner)}"
          />
        </div>
        <div class="form-group">
          <label for="githubRepo">GitHub Repo</label>
          <input
            id="githubRepo"
            type="text"
            placeholder="leetcode-solutions"
            value="${this.escapeHtml(this.state.githubRepo)}"
          />
        </div>
        <button id="saveBtn">Save Settings</button>
        <button id="testBtn" type="button" class="secondary">Test Connection</button>
        ${this.status.message ? `<div class="status ${this.status.type}">${this.escapeHtml(this.status.message)}</div>` : ""}
        <div class="hint">Use a GitHub token with repo contents write access.</div>
      </div>
    `;

    // Attach event listeners
    document
      .getElementById("apiKey")
      .addEventListener("input", (e) =>
        this.handleChange("apiKey", e.target.value)
      );
    document
      .getElementById("githubToken")
      .addEventListener("input", (e) =>
        this.handleChange("githubToken", e.target.value)
      );
    document
      .getElementById("githubOwner")
      .addEventListener("input", (e) =>
        this.handleChange("githubOwner", e.target.value)
      );
    document
      .getElementById("githubRepo")
      .addEventListener("input", (e) =>
        this.handleChange("githubRepo", e.target.value)
      );
    document
      .getElementById("saveBtn")
      .addEventListener("click", () => this.handleSave());
    document
      .getElementById("testBtn")
      .addEventListener("click", () => this.handleTestConnection());
  }

  escapeHtml(text) {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }
}

// Initialize the app
window.app = new PopupApp();