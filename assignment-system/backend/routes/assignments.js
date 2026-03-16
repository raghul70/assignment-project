const express = require('express');
const router = express.Router();
const Assignment = require('../models/Assignment');
const Question = require('../models/Question');
const Result = require('../models/Result');

// Get all assignments
router.get('/', async (req, res) => {
    try {
        const assignments = await Assignment.find().sort({ createdAt: -1 });
        res.json(assignments);
    } catch (error) {
        console.error('Error fetching assignments:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get single assignment with questions
router.get('/:id', async (req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.id);
        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        const questions = await Question.find({ assignmentId: req.params.id });
        res.json({ assignment, questions });
    } catch (error) {
        console.error('Error fetching assignment:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create assignment (teacher only)
router.post('/', async (req, res) => {
    try {
        const { title, subject, createdBy } = req.body;
        
        const assignment = new Assignment({
            title,
            subject,
            createdBy
        });

        await assignment.save();
        res.status(201).json(assignment);
    } catch (error) {
        console.error('Error creating assignment:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Add questions to assignment
router.post('/:id/questions', async (req, res) => {
    try {
        const { questions } = req.body;
        
        // Add assignmentId to each question
        const questionsWithAssignmentId = questions.map(q => ({
            ...q,
            assignmentId: req.params.id
        }));

        await Question.insertMany(questionsWithAssignmentId);

        // Update total questions count in assignment
        await Assignment.findByIdAndUpdate(req.params.id, {
            totalQuestions: questions.length
        });

        res.status(201).json({ message: 'Questions added successfully' });
    } catch (error) {
        console.error('Error adding questions:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get student's completed assignments
router.get('/student/:studentName/completed', async (req, res) => {
    try {
        const results = await Result.find({ 
            studentName: req.params.studentName 
        }).distinct('assignmentId');
        
        res.json(results);
    } catch (error) {
        console.error('Error fetching completed assignments:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;