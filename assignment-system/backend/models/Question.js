const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    assignmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assignment',
        required: true
    },
    question: {
        type: String,
        required: true
    },
    option1: {
        type: String,
        required: true
    },
    option2: {
        type: String,
        required: true
    },
    option3: {
        type: String,
        required: true
    },
    option4: {
        type: String,
        required: true
    },
    correctAnswer: {
        type: Number,
        required: true,
        min: 1,
        max: 4
    }
});

module.exports = mongoose.model('Question', questionSchema);