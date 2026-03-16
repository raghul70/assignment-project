// Global variables
let currentUser = null;
let currentAssignment = null;
let currentQuestions = [];
let userAnswers = [];
let currentQuestionIndex = 0;

// Check session on page load
document.addEventListener('DOMContentLoaded', function() {
    checkSession();
    
    // Add event listeners for forms
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    const createAssignmentForm = document.getElementById('createAssignmentForm');
    if (createAssignmentForm) {
        createAssignmentForm.addEventListener('submit', handleCreateAssignment);
    }
    
    // Load dashboard data if on dashboard page
    if (window.location.pathname.includes('dashboard')) {
        loadDashboard();
    }
    
    // Load quiz data if on quiz page
    if (window.location.pathname.includes('quiz')) {
        loadQuiz();
    }
    
    // Load result data if on result page
    if (window.location.pathname.includes('result')) {
        loadResult();
    }
});

// Check user session
async function checkSession() {
    try {
        const response = await fetch('/api/auth/session');
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            
            // Update UI based on user role
            if (document.getElementById('welcomeUser')) {
                document.getElementById('welcomeUser').textContent = 
                    `Welcome, ${currentUser.username} (${currentUser.role})`;
            }
            
            // Show teacher section if user is teacher
            const teacherSection = document.getElementById('teacherSection');
            if (teacherSection) {
                teacherSection.style.display = currentUser.role === 'teacher' ? 'block' : 'none';
            }
        } else if (!window.location.pathname.includes('login')) {
            // Redirect to login if not authenticated
            window.location.href = '/';
        }
    } catch (error) {
        console.error('Session check error:', error);
    }
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const role = document.getElementById('loginRole').value;
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, role })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('Login successful! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1500);
        } else {
            showMessage(data.message, 'danger');
        }
    } catch (error) {
        showMessage('Error during login', 'danger');
        console.error('Login error:', error);
    }
}

// Handle register
async function handleRegister(e) {
    e.preventDefault();
    
    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    const role = document.getElementById('registerRole').value;
    
    if (password !== confirmPassword) {
        showMessage('Passwords do not match', 'danger');
        return;
    }
    
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, role })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('Registration successful! You can now login.', 'success');
            // Switch to login tab
            document.getElementById('pills-login-tab').click();
            // Clear register form
            document.getElementById('registerForm').reset();
        } else {
            showMessage(data.message, 'danger');
        }
    } catch (error) {
        showMessage('Error during registration', 'danger');
        console.error('Register error:', error);
    }
}

// Show message
function showMessage(message, type) {
    const messageDiv = document.getElementById('message');
    if (messageDiv) {
        messageDiv.style.display = 'block';
        messageDiv.className = `alert alert-${type}`;
        messageDiv.textContent = message;
        
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 3000);
    }
}

// Load dashboard data
async function loadDashboard() {
    try {
        // Load assignments
        const assignmentsResponse = await fetch('/api/assignments');
        const assignments = await assignmentsResponse.json();
        
        if (currentUser.role === 'student') {
            // Load completed assignments for student
            const completedResponse = await fetch(`/api/assignments/student/${currentUser.username}/completed`);
            const completedAssignments = await completedResponse.json();
            
            // Load results
            const resultsResponse = await fetch(`/api/results/${currentUser.username}`);
            const results = await resultsResponse.json();
            
            // Update stats
            document.getElementById('totalAssignments').textContent = assignments.length;
            document.getElementById('completedAssignments').textContent = results.length;
            document.getElementById('pendingAssignments').textContent = 
                assignments.length - results.length;
            
            // Load assignments table
            loadAssignmentsTable(assignments, completedAssignments);
            
            // Load results table
            loadResultsTable(results);
        } else {
            // Teacher stats
            document.getElementById('totalAssignments').textContent = assignments.length;
            document.getElementById('completedAssignments').textContent = '-';
            document.getElementById('pendingAssignments').textContent = '-';
            
            // Load assignments table for teacher
            loadAssignmentsTable(assignments, []);
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

// Load assignments table
function loadAssignmentsTable(assignments, completedAssignments) {
    const tableBody = document.getElementById('assignmentsTable');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    assignments.forEach(assignment => {
        const isCompleted = completedAssignments.includes(assignment._id);
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${assignment.title}</td>
            <td>${assignment.subject}</td>
            <td>${assignment.totalQuestions || 0}</td>
            <td>
                <span class="badge ${isCompleted ? 'bg-success' : 'bg-warning'}">
                    ${isCompleted ? 'Completed' : 'Pending'}
                </span>
            </td>
            <td>
                ${!isCompleted && currentUser.role === 'student' ? 
                    `<button class="btn btn-primary btn-sm" onclick="startAssignment('${assignment._id}')">
                        <i class="fas fa-play"></i> Start
                    </button>` : 
                    '<span class="text-muted">-</span>'
                }
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Load results table
function loadResultsTable(results) {
    const tableBody = document.getElementById('resultsTable');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    results.forEach(result => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${result.assignmentTitle}</td>
            <td>${result.score}/${result.totalQuestions}</td>
            <td>${result.percentage.toFixed(2)}%</td>
            <td>${new Date(result.submittedAt).toLocaleDateString()}</td>
        `;
        tableBody.appendChild(row);
    });
}

// Start assignment
async function startAssignment(assignmentId) {
    window.location.href = `/quiz?id=${assignmentId}`;
}

// Handle create assignment
async function handleCreateAssignment(e) {
    e.preventDefault();
    
    const title = document.getElementById('assignmentTitle').value;
    const subject = document.getElementById('assignmentSubject').value;
    
    try {
        const response = await fetch('/api/assignments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title,
                subject,
                createdBy: currentUser.username
            })
        });
        
        const assignment = await response.json();
        
        if (response.ok) {
            // Show questions section
            document.getElementById('questionsSection').style.display = 'block';
            document.getElementById('questionsSection').dataset.assignmentId = assignment._id;
            
            // Clear form
            document.getElementById('createAssignmentForm').reset();
            
            // Add first question field
            addQuestionField();
            
            showMessage('Assignment created! Add questions below.', 'success');
        }
    } catch (error) {
        console.error('Error creating assignment:', error);
    }
}

// Add question field
function addQuestionField() {
    const container = document.getElementById('questionsContainer');
    const questionCount = container.children.length + 1;
    
    const questionDiv = document.createElement('div');
    questionDiv.className = 'question-item border p-3 mb-3 rounded';
    questionDiv.innerHTML = `
        <h6>Question ${questionCount}</h6>
        <div class="mb-2">
            <input type="text" class="form-control question-text" placeholder="Enter question" required>
        </div>
        <div class="row">
            <div class="col-md-6 mb-2">
                <input type="text" class="form-control option1" placeholder="Option 1" required>
            </div>
            <div class="col-md-6 mb-2">
                <input type="text" class="form-control option2" placeholder="Option 2" required>
            </div>
            <div class="col-md-6 mb-2">
                <input type="text" class="form-control option3" placeholder="Option 3" required>
            </div>
            <div class="col-md-6 mb-2">
                <input type="text" class="form-control option4" placeholder="Option 4" required>
            </div>
        </div>
        <div class="mb-2">
            <label>Correct Answer:</label>
            <select class="form-select correct-answer" required>
                <option value="1">Option 1</option>
                <option value="2">Option 2</option>
                <option value="3">Option 3</option>
                <option value="4">Option 4</option>
            </select>
        </div>
        <button class="btn btn-danger btn-sm" onclick="removeQuestion(this)">Remove</button>
    `;
    
    container.appendChild(questionDiv);
}

// Remove question
function removeQuestion(button) {
    button.closest('.question-item').remove();
}

// Save questions
async function saveQuestions() {
    const assignmentId = document.getElementById('questionsSection').dataset.assignmentId;
    const questionItems = document.querySelectorAll('.question-item');
    
    const questions = [];
    
    for (let item of questionItems) {
        const question = {
            question: item.querySelector('.question-text').value,
            option1: item.querySelector('.option1').value,
            option2: item.querySelector('.option2').value,
            option3: item.querySelector('.option3').value,
            option4: item.querySelector('.option4').value,
            correctAnswer: parseInt(item.querySelector('.correct-answer').value)
        };
        
        questions.push(question);
    }
    
    try {
        const response = await fetch(`/api/assignments/${assignmentId}/questions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ questions })
        });
        
        if (response.ok) {
            showMessage('Questions saved successfully!', 'success');
            document.getElementById('questionsSection').style.display = 'none';
            document.getElementById('questionsContainer').innerHTML = '';
            loadDashboard(); // Refresh dashboard
        }
    } catch (error) {
        console.error('Error saving questions:', error);
    }
}

// Load quiz
async function loadQuiz() {
    const urlParams = new URLSearchParams(window.location.search);
    const assignmentId = urlParams.get('id');
    
    if (!assignmentId) {
        window.location.href = '/dashboard';
        return;
    }
    
    try {
        const response = await fetch(`/api/assignments/${assignmentId}`);
        const data = await response.json();
        
        currentAssignment = data.assignment;
        currentQuestions = data.questions;
        userAnswers = new Array(currentQuestions.length).fill(null);
        
        document.getElementById('assignmentTitle').textContent = currentAssignment.title;
        document.getElementById('totalQuestions').textContent = currentQuestions.length;
        
        // Load first question
        loadQuestion(0);
    } catch (error) {
        console.error('Error loading quiz:', error);
    }
}

// Load question
function loadQuestion(index) {
    currentQuestionIndex = index;
    const question = currentQuestions[index];
    
    document.getElementById('currentQuestion').textContent = index + 1;
    document.getElementById('questionText').textContent = question.question;
    
    // Create options
    const optionsContainer = document.getElementById('optionsContainer');
    optionsContainer.innerHTML = '';
    
    const options = [
        question.option1,
        question.option2,
        question.option3,
        question.option4
    ];
    
    options.forEach((option, i) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = `option-card ${userAnswers[index] === i + 1 ? 'selected' : ''}`;
        optionDiv.onclick = () => selectOption(i + 1);
        
        optionDiv.innerHTML = `
            <div class="form-check">
                <input class="form-check-input" type="radio" 
                    name="questionOption" 
                    value="${i + 1}"
                    ${userAnswers[index] === i + 1 ? 'checked' : ''}>
                <label class="form-check-label">
                    ${option}
                </label>
            </div>
        `;
        
        optionsContainer.appendChild(optionDiv);
    });
    
    // Update navigation buttons
    document.getElementById('prevBtn').disabled = index === 0;
    
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');
    
    if (index === currentQuestions.length - 1) {
        nextBtn.style.display = 'none';
        submitBtn.style.display = 'inline-block';
    } else {
        nextBtn.style.display = 'inline-block';
        submitBtn.style.display = 'none';
    }
    
    // Update progress bar
    const progress = ((index + 1) / currentQuestions.length) * 100;
    document.getElementById('progressBar').style.width = `${progress}%`;
}

// Select option
function selectOption(optionNumber) {
    userAnswers[currentQuestionIndex] = optionNumber;
    
    // Update UI
    const optionCards = document.querySelectorAll('.option-card');
    optionCards.forEach((card, i) => {
        if (i + 1 === optionNumber) {
            card.classList.add('selected');
            card.querySelector('input').checked = true;
        } else {
            card.classList.remove('selected');
            card.querySelector('input').checked = false;
        }
    });
}

// Next question
function nextQuestion() {
    if (currentQuestionIndex < currentQuestions.length - 1) {
        loadQuestion(currentQuestionIndex + 1);
    }
}

// Previous question
function previousQuestion() {
    if (currentQuestionIndex > 0) {
        loadQuestion(currentQuestionIndex - 1);
    }
}

// Submit quiz
async function submitQuiz() {
    // Calculate score
    let score = 0;
    currentQuestions.forEach((question, index) => {
        if (userAnswers[index] === question.correctAnswer) {
            score++;
        }
    });
    
    const totalQuestions = currentQuestions.length;
    const percentage = (score / totalQuestions) * 100;
    
    try {
        // Save result
        const response = await fetch('/api/results/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                studentName: currentUser.username,
                assignmentId: currentAssignment._id,
                score,
                totalQuestions
            })
        });
        
        if (response.ok) {
            // Store result in session storage for result page
            sessionStorage.setItem('quizResult', JSON.stringify({
                score,
                totalQuestions,
                correctAnswers: score,
                wrongAnswers: totalQuestions - score,
                percentage
            }));
            
            // Redirect to result page
            window.location.href = '/result';
        }
    } catch (error) {
        console.error('Error submitting quiz:', error);
    }
}

// Load result
function loadResult() {
    const resultData = sessionStorage.getItem('quizResult');
    
    if (resultData) {
        const result = JSON.parse(resultData);
        
        document.getElementById('totalQuestions').textContent = result.totalQuestions;
        document.getElementById('correctAnswers').textContent = result.correctAnswers;
        document.getElementById('wrongAnswers').textContent = result.wrongAnswers;
        document.getElementById('percentage').textContent = `${result.percentage.toFixed(2)}%`;
        document.getElementById('score').textContent = `${result.score}/${result.totalQuestions}`;
        
        // Clear session storage
        sessionStorage.removeItem('quizResult');
    } else {
        window.location.href = '/dashboard';
    }
}

// Logout
document.addEventListener('click', function(e) {
    if (e.target.id === 'logoutBtn' || e.target.closest('#logoutBtn')) {
        e.preventDefault();
        fetch('/api/auth/logout', { method: 'POST' })
            .then(() => {
                window.location.href = '/';
            });
    }
});

// Menu navigation
document.addEventListener('click', function(e) {
    if (e.target.closest('.menu-item') && !e.target.closest('#logoutBtn')) {
        e.preventDefault();
        const menuItem = e.target.closest('.menu-item');
        const page = menuItem.dataset.page;
        
        // Update active menu
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });
        menuItem.classList.add('active');
        
        // Show corresponding content
        document.getElementById('dashboardContent').style.display = 'none';
        document.getElementById('assignmentsContent').style.display = 'none';
        document.getElementById('resultsContent').style.display = 'none';
        
        if (page === 'dashboard') {
            document.getElementById('dashboardContent').style.display = 'block';
        } else if (page === 'assignments') {
            document.getElementById('assignmentsContent').style.display = 'block';
        } else if (page === 'results') {
            document.getElementById('resultsContent').style.display = 'block';
        }
    }
});