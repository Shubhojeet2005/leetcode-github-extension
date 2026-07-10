const BACKEND_URL = "http://localhost:5000/api/solutions"; // change in prod

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type !== "ACCEPTED_SOLUTION") return;

  (async () => {
    try {
      const { apiKey, githubToken, githubOwner, githubRepo } =
        await chrome.storage.sync.get([
          "apiKey",
          "githubToken",
          "githubOwner",
          "githubRepo",
        ]);

      if (!apiKey) {
        console.error("[Background] Missing API key. Open the extension popup and save settings.");
        sendResponse({ ok: false, error: "Missing API key" });
        return;
      }

      const res = await fetch(BACKEND_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey.trim(),
        },
        body: JSON.stringify({
          ...message.payload,
          githubConfig: {
            githubToken: githubToken || "",
            githubOwner: githubOwner || "",
            githubRepo: githubRepo || "",
          },
        }),
      });

      let data;
      try {
        data = await res.json();
      } catch {
        data = { error: "Invalid response from backend" };
      }

      if (!res.ok) {
        console.error("[Background] Backend error:", data);
        const error =
          data.error === "Unauthorized"
            ? "Unauthorized — Backend API Key must match API_KEY in backend/.env"
            : data.error || res.statusText;
        sendResponse({ ok: false, error, hint: data.hint });
        return;
      }

      console.log("[Background] Saved:", data);
      sendResponse({ ok: true, data });
    } catch (err) {
      console.error("[Background] Error sending to backend:", err);
      sendResponse({ ok: false, error: err.message });
    }
  })();

  return true;
});
