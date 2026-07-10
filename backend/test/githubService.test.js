const test = require('node:test');
const assert = require('node:assert/strict');
const { resolveGitHubConfig } = require('../src/services/githubService');

test('resolveGitHubConfig prefers request-specific GitHub settings', () => {
  const config = resolveGitHubConfig({
    githubConfig: {
      githubToken: 'user-token',
      githubOwner: 'alice',
      githubRepo: 'leetcode-solutions',
    },
  });

  assert.equal(config.token, 'user-token');
  assert.equal(config.owner, 'alice');
  assert.equal(config.repo, 'leetcode-solutions');
});

test('resolveGitHubConfig falls back to environment defaults', () => {
  process.env.GITHUB_TOKEN = 'env-token';
  process.env.GITHUB_OWNER = 'env-owner';
  process.env.GITHUB_REPO = 'env-repo';

  const config = resolveGitHubConfig({});

  assert.equal(config.token, 'env-token');
  assert.equal(config.owner, 'env-owner');
  assert.equal(config.repo, 'env-repo');
});
