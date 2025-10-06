import React, { useState, useEffect } from "react";
import { collection, addDoc, getDocs, getDoc, doc, updateDoc, Timestamp, query, where } from "firebase/firestore";
import { db, auth, logout, getUserProfile } from "../firebase";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";

const QuizAdmin = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAnswersForm, setShowAnswersForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const [newQuiz, setNewQuiz] = useState({
    title: "",
    endTime: "",
    questions: [
      { text: "", options: ["Yes", "No"], correctAnswer: null },
      { text: "", options: ["Yes", "No"], correctAnswer: null },
      { text: "", options: ["Yes", "No"], correctAnswer: null },
    ],
  });
  const [editQuiz, setEditQuiz] = useState(null);

  useEffect(() => {
    // Check authentication status
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (!currentUser) {
        // Redirect to login if not authenticated
        navigate('/login');
      } else {
        // Check if user is admin
        try {
          const profile = await getUserProfile(currentUser.uid);
          setUserProfile(profile);
          setIsAdmin(profile?.role === 'admin');
          
          if (profile?.role !== 'admin') {
            // If not admin, redirect to home
            alert('You do not have admin privileges to access this page');
            navigate('/');
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      }
      
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [navigate]);
  
  useEffect(() => {
    // Load existing quizzes
    const fetchQuizzes = async () => {
      if (!user) return; // Don't fetch if not authenticated
      
      try {
        const querySnapshot = await getDocs(collection(db, "quizzes"));
        const quizList = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          // Convert Firestore Timestamp to JS Date if it exists
          const endTime = data.endTime instanceof Timestamp 
            ? data.endTime.toDate() 
            : new Date(data.endTime);
            
          // Check if quiz has any answers set
          const hasAnswers = data.questions && 
            data.questions.some(q => q.correctAnswer !== null && q.correctAnswer !== undefined && q.correctAnswer !== "");
            
          return {
            id: doc.id,
            ...data,
            endTime: endTime,
            questionCount: data.questions ? data.questions.length : 0,
            hasAnswers: hasAnswers
          };
        });
        setQuizzes(quizList);
      } catch (error) {
        console.error("Error loading quizzes:", error);
        alert("Failed to load quizzes. Please try again.");
      }
    };
    
    fetchQuizzes();
  }, [user]);

  const handleQuizTitleChange = (e) => {
    setNewQuiz({
      ...newQuiz,
      title: e.target.value,
    });
  };

  const handleEndTimeChange = (e) => {
    setNewQuiz({
      ...newQuiz,
      endTime: e.target.value,
    });
  };

  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = [...newQuiz.questions];

    if (field === "text") {
      updatedQuestions[index] = {
        ...updatedQuestions[index],
        text: value,
      };
    } else if (field === "correctAnswer") {
      updatedQuestions[index] = {
        ...updatedQuestions[index],
        correctAnswer: value,
      };
    }

    setNewQuiz({
      ...newQuiz,
      questions: updatedQuestions,
    });
  };

  const handleCreateQuiz = async () => {
    try {
      // Validate form
      if (!newQuiz.title.trim()) {
        alert("Please enter a quiz title");
        return;
      }

      if (!newQuiz.endTime) {
        alert("Please set an end time for the quiz");
        return;
      }

      for (let i = 0; i < newQuiz.questions.length; i++) {
        const q = newQuiz.questions[i];
        if (!q.text.trim()) {
          alert(`Question ${i + 1} text is required`);
          return;
        }

        // No longer validating correctAnswer since it will be set after quiz closes
      }

      // Save quiz to Firebase
      const quizToSave = {
        ...newQuiz,
        endTime: Timestamp.fromDate(new Date(newQuiz.endTime)),
        createdAt: Timestamp.fromDate(new Date()),
      };

      const docRef = await addDoc(collection(db, "quizzes"), quizToSave);

      // Reset form
      setNewQuiz({
        title: "",
        endTime: "",
        questions: [
          { text: "", options: ["Yes", "No"], correctAnswer: null },
          { text: "", options: ["Yes", "No"], correctAnswer: null },
          { text: "", options: ["Yes", "No"], correctAnswer: null },
        ],
      });

      setShowCreateForm(false);

      // Reload quizzes
      const querySnapshot = await getDocs(collection(db, "quizzes"));
      const updatedQuizzes = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        
        // Check if quiz has any answers set
        const hasAnswers = data.questions && 
          data.questions.some(q => q.correctAnswer !== null && q.correctAnswer !== undefined && q.correctAnswer !== "");
          
        return {
          id: doc.id,
          ...data,
          endTime: data.endTime instanceof Timestamp ? data.endTime.toDate() : new Date(data.endTime),
          questionCount: data.questions ? data.questions.length : 0,
          hasAnswers: hasAnswers
        };
      });
      
      setQuizzes(updatedQuizzes);

      alert("Quiz created successfully!");
    } catch (error) {
      console.error("Error creating quiz:", error);
      alert("Failed to create quiz. Please try again.");
    }
  };

  // Handle setting correct answers for a quiz
  const handleSetAnswers = async (quizId, updatedQuestions) => {
    try {
      // Update quiz with correct answers
      const quizRef = doc(db, "quizzes", quizId);
      await updateDoc(quizRef, { questions: updatedQuestions });
      
      // Calculate scores for all user submissions for this quiz
      const answersQuery = query(
        collection(db, "quizAnswers"),
        where("quizId", "==", quizId)
      );
      const answersSnapshot = await getDocs(answersQuery);
      
      // Process each user's answers and calculate their score
      const batchUpdates = [];
      console.log(`Found ${answersSnapshot.size} user answer submissions for this quiz`);
      
      answersSnapshot.forEach(answerDoc => {
        const userData = answerDoc.data();
        const userAnswers = userData.answers || {};
        let score = 0;
        
        console.log("User answers:", JSON.stringify(userAnswers));
        console.log("Questions with correct answers:", JSON.stringify(updatedQuestions));
        
        // Calculate score: +1 for each correct answer
        updatedQuestions.forEach((question, index) => {
          const questionId = `q${index + 1}`;
          console.log(`Checking question ${questionId}: User answered: ${userAnswers[questionId]}, Correct answer: ${question.correctAnswer}`);
          
          if (
            userAnswers[questionId] && 
            question.correctAnswer && 
            userAnswers[questionId] === question.correctAnswer
          ) {
            score += 1;
            console.log(`Correct answer! +1 point. Current score: ${score}`);
          }
        });
        
        // Update the user's answer document with the score
        const answerRef = doc(db, "quizAnswers", answerDoc.id);
        console.log(`Updating document ${answerDoc.id} with final score: ${score}/${updatedQuestions.length}`);
        
        batchUpdates.push(updateDoc(answerRef, { 
          score: score,
          totalQuestions: updatedQuestions.length
        }));
      });
      
      // Execute all updates
      console.log(`Executing ${batchUpdates.length} score updates...`);
      if (batchUpdates.length > 0) {
        await Promise.all(batchUpdates);
        console.log('All score updates completed successfully!');
      } else {
        console.log('No score updates to process.');
      }
      
      // Refresh quiz list
      const querySnapshot = await getDocs(collection(db, "quizzes"));
      const updatedQuizzes = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        
        // Check if quiz has any answers set
        const hasAnswers = data.questions && 
          data.questions.some(q => q.correctAnswer !== null && q.correctAnswer !== undefined && q.correctAnswer !== "");
          
        return {
          id: doc.id,
          ...data,
          endTime: data.endTime instanceof Timestamp ? data.endTime.toDate() : new Date(data.endTime),
          questionCount: data.questions ? data.questions.length : 0,
          hasAnswers: hasAnswers
        };
      });
      
      setQuizzes(updatedQuizzes);
      setShowAnswersForm(false);
      setSelectedQuiz(null);
      
      alert("Answers set and scores calculated successfully!");
    } catch (error) {
      console.error("Error updating quiz answers:", error);
      alert("Failed to update answers. Please try again.");
    }
  };

  // Handle logout
  const handleEditQuiz = async () => {
    try {
      if (!editQuiz || !editQuiz.id) {
        alert("No quiz selected for editing");
        return;
      }

      // Validate form
      if (!editQuiz.title.trim()) {
        alert("Please enter a quiz title");
        return;
      }

      if (!editQuiz.endTime) {
        alert("Please set an end time for the quiz");
        return;
      }

      for (let i = 0; i < editQuiz.questions.length; i++) {
        const q = editQuiz.questions[i];
        if (!q.text.trim()) {
          alert(`Question ${i + 1} text is required`);
          return;
        }
      }

      // Check if quiz has any submissions
      const answersQuery = query(
        collection(db, "quizAnswers"),
        where("quizId", "==", editQuiz.id)
      );
      const answersSnapshot = await getDocs(answersQuery);
      
      if (answersSnapshot.size > 0) {
        const confirmEdit = window.confirm(
          "This quiz already has submissions. Editing it may affect existing results. Continue?"
        );
        if (!confirmEdit) return;
      }

      // Format end time for Firestore
      let endTimeValue;
      if (typeof editQuiz.endTime === 'string') {
        endTimeValue = Timestamp.fromDate(new Date(editQuiz.endTime));
      } else if (editQuiz.endTime instanceof Date) {
        endTimeValue = Timestamp.fromDate(editQuiz.endTime);
      } else {
        endTimeValue = editQuiz.endTime; // Assume it's already a Timestamp
      }

      // Save updated quiz to Firebase
      const quizRef = doc(db, "quizzes", editQuiz.id);
      await updateDoc(quizRef, {
        title: editQuiz.title,
        endTime: endTimeValue,
        questions: editQuiz.questions,
        // Don't update createdAt
      });

      // Reset form
      setEditQuiz(null);
      setShowEditForm(false);

      // Reload quizzes
      const querySnapshot = await getDocs(collection(db, "quizzes"));
      const updatedQuizzes = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        
        // Check if quiz has any answers set
        const hasAnswers = data.questions && 
          data.questions.some(q => q.correctAnswer !== null && q.correctAnswer !== undefined && q.correctAnswer !== "");
          
        return {
          id: doc.id,
          ...data,
          endTime: data.endTime instanceof Timestamp ? data.endTime.toDate() : new Date(data.endTime),
          questionCount: data.questions ? data.questions.length : 0,
          hasAnswers: hasAnswers
        };
      });
      
      setQuizzes(updatedQuizzes);

      alert("Quiz updated successfully!");
    } catch (error) {
      console.error("Error updating quiz:", error);
      alert("Failed to update quiz. Please try again.");
    }
  };

  const handleEditQuizTitleChange = (e) => {
    setEditQuiz({
      ...editQuiz,
      title: e.target.value,
    });
  };

  const handleEditEndTimeChange = (e) => {
    setEditQuiz({
      ...editQuiz,
      endTime: e.target.value,
    });
  };

  const handleEditQuestionChange = (index, field, value) => {
    const updatedQuestions = [...editQuiz.questions];

    if (field === "text") {
      updatedQuestions[index] = {
        ...updatedQuestions[index],
        text: value,
      };
    } else if (field === "correctAnswer") {
      updatedQuestions[index] = {
        ...updatedQuestions[index],
        correctAnswer: value,
      };
    }

    setEditQuiz({
      ...editQuiz,
      questions: updatedQuestions,
    });
  };

  const handleStartEditQuiz = (quiz) => {
    // Format the date for the datetime-local input
    let formattedEndTime;
    if (quiz.endTime instanceof Date) {
      formattedEndTime = quiz.endTime.toISOString().slice(0, 16);
    } else {
      formattedEndTime = new Date(quiz.endTime).toISOString().slice(0, 16);
    }

    // Create a copy of the quiz for editing
    setEditQuiz({
      ...quiz,
      endTime: formattedEndTime
    });
    
    setShowEditForm(true);
    setShowCreateForm(false);
    setShowAnswersForm(false);
  };
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto my-8 p-6 bg-white rounded shadow text-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="card admin-card">
      <div className="flex justify-between items-center mb-6">
        <h1 className="card-title">Quiz Administration</h1>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">
            Logged in as: {user.email}
          </span>
          <button
            onClick={() => {
              setShowCreateForm(!showCreateForm);
              if (showAnswersForm) setShowAnswersForm(false);
            }}
            className="btn btn-secondary"
          >
            {showCreateForm ? "Cancel" : "Create New Quiz"}
          </button>
          <button
            onClick={handleLogout}
            className="btn"
          >
            Logout
          </button>
        </div>
      </div>

      {showCreateForm ? (
        <div className="question-builder">
          <h2 className="card-title">Create New Quiz</h2>

          <div className="form-group">
            <label className="form-label">Quiz Title</label>
            <input
              type="text"
              value={newQuiz.title}
              onChange={handleQuizTitleChange}
              className="form-input"
              placeholder="Enter quiz title"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              End Date & Time
            </label>
            <input
              type="datetime-local"
              value={newQuiz.endTime}
              onChange={handleEndTimeChange}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <h3 className="font-medium mb-4">Questions</h3>

            {newQuiz.questions.map((question, qIndex) => (
              <div key={qIndex} className="question-container mb-8">
                <h4 className="font-medium mb-2">Question {qIndex + 1}</h4>

                <div className="mb-3">
                  <input
                    type="text"
                    value={question.text}
                    onChange={(e) =>
                      handleQuestionChange(qIndex, "text", e.target.value)
                    }
                    className="form-input"
                    placeholder="Enter question text"
                  />
                </div>

                <div className="mb-3">
                  <p className="form-label">Options (Yes/No)</p>
                  <div className="flex space-x-4 py-2">
                    {question.options.map((option, oIndex) => (
                      <div key={oIndex} className="flex-1 text-center p-2 border rounded bg-gray-50">
                        {option}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Correct answers will be set after the quiz closes
                  </p>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleCreateQuiz}
            className="btn btn-accent"
          >
            Save Quiz
          </button>
        </div>
      ) : showEditForm && editQuiz ? (
        <div className="question-builder">
          <h2 className="card-title">Edit Quiz</h2>

          <div className="form-group">
            <label className="form-label">Quiz Title</label>
            <input
              type="text"
              value={editQuiz.title}
              onChange={handleEditQuizTitleChange}
              className="form-input"
              placeholder="Enter quiz title"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              End Date & Time
            </label>
            <input
              type="datetime-local"
              value={editQuiz.endTime}
              onChange={handleEditEndTimeChange}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <h3 className="font-medium mb-4">Questions</h3>

            {editQuiz.questions.map((question, qIndex) => (
              <div key={qIndex} className="question-container mb-8">
                <h4 className="font-medium mb-2">Question {qIndex + 1}</h4>

                <div className="mb-3">
                  <input
                    type="text"
                    value={question.text}
                    onChange={(e) =>
                      handleEditQuestionChange(qIndex, "text", e.target.value)
                    }
                    className="form-input"
                    placeholder="Enter question text"
                  />
                </div>

                <div className="mb-3">
                  <p className="form-label">Options (Yes/No)</p>
                  <div className="flex space-x-4 py-2">
                    {question.options.map((option, oIndex) => (
                      <div key={oIndex} className="flex-1 text-center p-2 border rounded bg-gray-50">
                        {option}
                      </div>
                    ))}
                  </div>
                  {question.correctAnswer ? (
                    <p className="text-xs text-green-600 mt-1">
                      Correct answer currently set to: {question.correctAnswer}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 mt-1">
                      Correct answers will be set after the quiz closes
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex space-x-4">
            <button
              onClick={handleEditQuiz}
              className="btn btn-accent"
            >
              Update Quiz
            </button>
            <button
              onClick={() => {
                setShowEditForm(false);
                setEditQuiz(null);
              }}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : showAnswersForm && selectedQuiz ? (
        <div className="question-builder">
          <h2 className="card-title">Set Correct Answers for {selectedQuiz.title}</h2>
          <div className="mb-6">
            {selectedQuiz.questions && selectedQuiz.questions.map((question, qIndex) => (
              <div key={qIndex} className="question-container mb-8">
                <h4 className="question-text">Question {qIndex + 1}: {question.text}</h4>
                <div className="mb-3">
                  <p className="form-label">Select Correct Answer:</p>
                  <div className="flex space-x-4">
                    {question.options.map((option, oIndex) => (
                      <div key={oIndex} className="flex-1">
                        <label className={`option-label ${
                          question.correctAnswer === option ? 'border-l-4 border-l-[var(--f1-red)]' : ''
                        }`}>
                          <input
                            type="radio"
                            name={`correct-${qIndex}`}
                            checked={question.correctAnswer === option}
                            onChange={() => {
                              const updatedQuiz = {...selectedQuiz};
                              updatedQuiz.questions[qIndex].correctAnswer = option;
                              setSelectedQuiz(updatedQuiz);
                            }}
                            className="option-input"
                          />
                          <span className="flex-1 font-medium">
                            {option}
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="admin-controls">
            <button
              onClick={() => handleSetAnswers(selectedQuiz.id, selectedQuiz.questions)}
              className="btn btn-accent"
            >
              Save Answers
            </button>
            <button
              onClick={() => {
                setShowAnswersForm(false);
                setSelectedQuiz(null);
              }}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {!showCreateForm && !showAnswersForm && !showEditForm && (
        <div>
          <h2 className="card-title mb-4">Your Quizzes</h2>

          {quizzes.length === 0 ? (
            <p className="text-gray-500">No quizzes created yet.</p>
          ) : (
            <div className="quiz-list">
              {quizzes.map((quiz) => (
                <div key={quiz.id} className="quiz-item">
                  <h3 className="quiz-title">{quiz.title}</h3>
                  <div className="quiz-meta">
                    <span>Ends: {new Date(quiz.endTime).toLocaleString()}</span>
                    <span>Questions: {quiz.questionCount}</span>
                  </div>
                  <p className="text-sm mb-3">
                    {quiz.hasAnswers ? 
                      <span style={{ color: "var(--f1-red)" }}>Answers set ✓</span> : 
                      <span className="text-orange-500">Answers not set</span>}
                  </p>
                  <div className="admin-controls">
                    <button 
                      onClick={() => handleStartEditQuiz(quiz)} 
                      className="btn btn-small btn-secondary">
                      Edit
                    </button>
                    <button className="btn btn-small btn-secondary">
                      View Results
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedQuiz(quiz);
                        setShowAnswersForm(true);
                      }}
                      className="btn btn-small btn-accent">
                      Set Answers
                    </button>
                    <button className="btn btn-small btn-secondary">
                      Share
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuizAdmin;
