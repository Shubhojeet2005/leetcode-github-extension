const { Octokit } = require("@octokit/rest");

const EXT_MAP = {
  python: "py",
  python3: "py",
  javascript: "js",
  typescript: "ts",
  java: "java",
  c: "c",
  cpp: "cpp",
  go: "go",
  rust: "rs",
  ruby: "rb",
  php: "php",
  kotlin: "kt",
  swift: "swift",
  scala: "scala",
};

function getExtension(lang = "") {
  return EXT_MAP[lang.toLowerCase()] || "txt";
}

function resolveGitHubConfig(data = {}) {
  const githubConfig = data.githubConfig || {};
  return {
    token: githubConfig.githubToken || process.env.GITHUB_TOKEN || "",
    owner: githubConfig.githubOwner || process.env.GITHUB_OWNER || "",
    repo: githubConfig.githubRepo || process.env.GITHUB_REPO || "",
  };
}

async function pushSolutionToGitHub(payload) {
  const { title, slug, difficulty, description, tags, code, language, solvedAt, leetcodeUrl } = payload;
  const { token, owner, repo } = resolveGitHubConfig(payload);

  if (!token || !owner || !repo) {
    throw new Error("GitHub token, owner, and repo must be configured.");
  }

  const octokit = new Octokit({ auth: token });
  const ext = getExtension(language);
  const folder = difficulty?.toLowerCase() || "others";
  const fileName = `${slug}.${ext}`;
  const filePath = `${folder}/${fileName}`;

  const fileContent = [
    `# ${title}`,
    `# Difficulty: ${difficulty}`,
    `# Tags: ${tags?.join(", ")}`,
    `# URL: ${leetcodeUrl}`,
    `# Solved At: ${solvedAt}`,
    `#`,
    `# Problem:`,
    (description || "").split("\n").map((line) => `# ${line}`).join("\n"),
    ``,
    code,
  ].join("\n");

  const contentEncoded = Buffer.from(fileContent).toString("base64");

  let sha;
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path: filePath });
    sha = data.sha;
  } catch (_) {
    // file doesn't exist yet — that's fine
  }

  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: filePath,
    message: `✅ Add solution: ${title}`,
    content: contentEncoded,
    ...(sha ? { sha } : {}),
  });

  return filePath;
}

module.exports = { pushSolutionToGitHub, resolveGitHubConfig };