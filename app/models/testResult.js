const mongoose = require('mongoose');

const testResultSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    score: Number,
    answers: [String], // This is where I would store the answers
    dateTaken: { type: Date, default: Date.now }
});

const TestResult = mongoose.model('TestResult', testResultSchema);
module.exports = TestResult;
