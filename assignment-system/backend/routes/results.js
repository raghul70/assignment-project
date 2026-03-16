const express = require('express');
const router = express.Router();
const Result = require('../models/Result');
const Assignment = require('../models/Assignment');

// Submit assignment results
router.post('/submit', async (req, res) => {
    try {
        const { studentName, assignmentId, score, totalQuestions } = req.body;
        
        const percentage = (score / totalQuestions) * 100;
        
        // Get assignment title
        const assignment = await Assignment.findById(assignmentId);
        
        const result = new Result({
            studentName,
            assignmentId,
            assignmentTitle: assignment.title,
            score,
            totalQuestions,
            percentage
        });

        await result.save();
        res.status(201).json(result);
    } catch (error) {
        console.error('Error submitting results:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get student's results
router.get('/:studentName', async (req, res) => {
    try {
        const results = await Result.find({ 
            studentName: req.params.studentName 
        }).sort({ submittedAt: -1 });
        
        res.json(results);
    } catch (error) {
        console.error('Error fetching results:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all results (for teachers)
router.get('/teacher/all', async (req, res) => {
    try {
        const results = await Result.find().sort({ submittedAt: -1 });
        res.json(results);
    } catch (error) {
        console.error('Error fetching all results:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;