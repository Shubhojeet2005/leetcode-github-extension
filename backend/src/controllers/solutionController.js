const { saveSolution } = require("../services/solutionService");
const Solution = require("../models/Solution");

exports.create = async (req, res) => {
  try {
    const solution = await saveSolution(req.body);
    res.status(201).json({ success: true, solution });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    const { difficulty, tag, lang } = req.query;
    const filter = {};
    if (difficulty) filter.difficulty = difficulty;
    if (tag)        filter.tags = tag;
    if (lang)       filter.language = lang;

    const solutions = await Solution.find(filter).sort({ solvedAt: -1 });
    res.json(solutions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const solution = await Solution.findOne({ slug: req.params.slug });
    if (!solution) return res.status(404).json({ error: "Not found" });
    res.json(solution);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};