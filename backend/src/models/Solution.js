const mongoose = require('mongoose');

const SolutionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    slug: {
        type: String, 
        required: true,
        unique: true
    },
    difficulty:  { type: String },
  description: { type: String },
  tags:        [String],
  code:        { type: String, required: true },
  language:    { type: String },
  solvedAt:    { type: Date, default: Date.now },
  leetcodeUrl: { type: String },
  githubPath:  { type: String },   // path in GitHub repo
}, { timestamps: true });

module.exports = mongoose.model("Solution", SolutionSchema);
