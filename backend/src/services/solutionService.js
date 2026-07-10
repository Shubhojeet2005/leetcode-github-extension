const Solution = require("../models/Solution");
const { pushSolutionToGitHub } = require("./githubService");

async function saveSolution(data) {
  const githubPath = await pushSolutionToGitHub(data);

  const { githubConfig, ...solutionData } = data;

  const solution = await Solution.findOneAndUpdate(
    { slug: solutionData.slug },
    { ...solutionData, githubPath },
    { upsert: true, new: true }
  );

  return solution;
}

module.exports = { saveSolution };