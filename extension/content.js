(function () {
  const PENDING_KEY = "leetcode_tracker_pending_solution";
  let resultObserver = null;
  let hasCaptured = false;
  let isSending = false;

  function isExtensionConnected() {
    try {
      return Boolean(chrome.runtime?.id);
    } catch {
      return false;
    }
  }

  function savePending(payload) {
    try {
      sessionStorage.setItem(PENDING_KEY, JSON.stringify(payload));
    } catch (err) {
      console.warn("[LeetCode Tracker] Could not cache pending solution:", err);
    }
  }

  function clearPending() {
    try {
      sessionStorage.removeItem(PENDING_KEY);
    } catch (_) {}
  }

  function showNotice(message, type = "info") {
    const existing = document.getElementById("leetcode-tracker-notice");
    if (existing) existing.remove();

    const banner = document.createElement("div");
    banner.id = "leetcode-tracker-notice";
    banner.textContent = message;
    banner.style.cssText = [
      "position:fixed",
      "top:16px",
      "right:16px",
      "z-index:999999",
      "max-width:360px",
      "padding:12px 14px",
      "border-radius:8px",
      "font:600 13px/1.4 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",
      "color:#fff",
      "box-shadow:0 8px 24px rgba(0,0,0,0.18)",
      type === "error" ? "background:#dc2626" : "background:#2563eb",
    ].join(";");
    document.body.appendChild(banner);
    setTimeout(() => banner.remove(), 6000);
  }

  function sendToBackground(payload, onComplete) {
    if (!isExtensionConnected()) {
      savePending(payload);
      showNotice(
        "LeetCode Tracker: extension was reloaded. Refresh this page to sync your solution.",
        "error"
      );
      onComplete?.(false, "Extension context invalidated");
      return;
    }

    try {
      chrome.runtime.sendMessage({ type: "ACCEPTED_SOLUTION", payload }, (response) => {
        if (chrome.runtime.lastError) {
          const msg = chrome.runtime.lastError.message;
          console.error("[LeetCode Tracker]", msg);
          savePending(payload);

          if (msg.includes("Extension context invalidated")) {
            showNotice(
              "LeetCode Tracker: extension was reloaded. Refresh this page to sync your solution.",
              "error"
            );
          }

          onComplete?.(false, msg);
          return;
        }

        if (response?.ok) {
          clearPending();
          showNotice("LeetCode Tracker: solution saved to GitHub.");
          console.log("[LeetCode Tracker] Saved successfully:", response.data);
          onComplete?.(true);
          return;
        }

        console.error("[LeetCode Tracker] Save failed:", response?.error || "Unknown error");
        showNotice(
          `LeetCode Tracker: save failed — ${response?.error || "Unknown error"}`,
          "error"
        );
        onComplete?.(false, response?.error);
      });
    } catch (err) {
      console.error("[LeetCode Tracker]", err.message);
      savePending(payload);
      showNotice(
        "LeetCode Tracker: extension was reloaded. Refresh this page to sync your solution.",
        "error"
      );
      onComplete?.(false, err.message);
    }
  }

  function retryPendingSend() {
    let raw;
    try {
      raw = sessionStorage.getItem(PENDING_KEY);
    } catch {
      return;
    }
    if (!raw || !isExtensionConnected()) return;

    let payload;
    try {
      payload = JSON.parse(raw);
    } catch {
      clearPending();
      return;
    }

    console.log("[LeetCode Tracker] Retrying pending solution:", payload.slug);
    sendToBackground(payload, (ok) => {
      if (ok) {
        showNotice("LeetCode Tracker: pending solution synced to GitHub.");
      }
    });
  }

  function pollForAcceptedResult() {
    if (resultObserver) {
      resultObserver.disconnect();
      resultObserver = null;
    }
    hasCaptured = false;

    resultObserver = new MutationObserver(() => {
      const resultTag = document.querySelector('[data-e2e-locator="submission-result"]');

      if (resultTag && resultTag.textContent.trim() === "Accepted") {
        if (hasCaptured) return;
        hasCaptured = true;
        resultObserver.disconnect();
        resultObserver = null;
        setTimeout(() => captureAndSend(), 1500);
      }
    });

    const targetNode = document.querySelector("#app") || document.body;
    resultObserver.observe(targetNode, { childList: true, subtree: true });
  }

  function captureAndSend() {
    if (isSending) return;
    isSending = true;

    const titleEl =
      document.querySelector('[data-cy="question-title"]') ||
      document.querySelector(".text-title-large a");
    const title = titleEl?.textContent.trim() || "Unknown Title";

    const slugMatch = window.location.pathname.match(/\/problems\/([\w-]+)/);
    const slug = slugMatch ? slugMatch[1] : "unknown";

    const difficultyEl =
      document.querySelector("[diff]") ||
      document.querySelector(
        ".text-difficulty-easy, .text-difficulty-medium, .text-difficulty-hard"
      );
    const difficulty = difficultyEl?.textContent.trim() || "Unknown";

    const descEl = document.querySelector('[data-track-load="description_content"]');
    const description = descEl?.innerText.trim() || "";

    const tagEls = document.querySelectorAll('a[href*="/tag/"]');
    const tags = [...tagEls].map((t) => t.textContent.trim());

    const codeLines = document.querySelectorAll(".view-line");
    let code = "";
    if (codeLines.length > 0) {
      code = [...codeLines].map((l) => l.textContent).join("\n");
    }

    const langEl =
      document.querySelector('button[id*="headlessui-listbox-button"]') ||
      document.querySelector(".ant-select-selection-item");
    const language = langEl?.textContent.trim() || "Unknown";

    const payload = {
      title,
      slug,
      difficulty,
      description,
      tags,
      code,
      language,
      solvedAt: new Date().toISOString(),
      leetcodeUrl: window.location.href,
    };

    console.log("[LeetCode Tracker] Captured:", payload);
    savePending(payload);

    sendToBackground(payload, () => {
      isSending = false;
    });
  }

  function attachSubmitListener() {
    document.addEventListener("click", (e) => {
      const btn =
        e.target.closest('button[data-e2e-locator="console-submit-button"]') ||
        e.target.closest('button[data-cy="submit-code-btn"]') ||
        e.target.closest("#submit_code");

      if (btn) {
        pollForAcceptedResult();
      }
    });
  }

  attachSubmitListener();
  retryPendingSend();
})();
