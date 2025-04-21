import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, TextField, Button, Select, MenuItem, FormControl,
  InputLabel, FormControlLabel, Checkbox, Radio, IconButton
} from '@mui/material';
import { Delete } from '@mui/icons-material';
import AUTH from '../Constant';

const EditQuestion = () => {
  const { gameId, questionId } = useParams(); // Retrieve game and question IDs from the URL
  const navigate = useNavigate();

  // State for game info, all user games, and the current question
  const [game, setGame] = useState(null);
  const [allGames, setAllGames] = useState([]);
  const [question, setQuestion] = useState({
    text: '',
    type: 'single',
    time: 30,
    points: 10,
    video: '',
    image: '',
    answers: [
      { text: '', correct: false },
      { text: '', correct: false }
    ]
  });

  const token = localStorage.getItem(AUTH.TOKEN_KEY);
  const ownerEmail = localStorage.getItem('email');

  // Fetch game and specific question on load
  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch('http://localhost:5005/admin/games', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      const owned = data.games.filter(g => g.owner === ownerEmail);
      const target = owned.find(g => g.id.toString() === gameId);

      // Ensure questions array is initialized
      if (target && !Array.isArray(target.questions)) {
        target.questions = [];
      }

      setAllGames(owned);
      setGame(target);

      // Load existing question if it exists
      const existing = target?.questions?.[questionId];
      if (existing) setQuestion(existing);
    };
    fetchData();
  }, [gameId, questionId]);

  // Handle changes in individual answer fields
  const handleAnswerChange = (index, field, value) => {
    const updated = [...question.answers];
    updated[index] = { ...updated[index], [field]: value };
    setQuestion({ ...question, answers: updated });
  };

  // Add a new answer option (max 6)
  const addAnswer = () => {
    if (question.answers.length >= 6) return;
    setQuestion({ ...question, answers: [...question.answers, { text: '', correct: false }] });
  };

  // Remove an answer option (min 2)
  const deleteAnswer = (index) => {
    if (question.answers.length <= 2) return;
    const updated = [...question.answers];
    updated.splice(index, 1);
    setQuestion({ ...question, answers: updated });
  };

  // Save changes to backend and localStorage
  const updateGame = async () => {
    const qIndex = Number(questionId); // Convert questionId to a number
  
    // Input validation for question content
    if (!question.text.trim()) {
      alert('Question text cannot be empty.');
      return;
    }
    if (!Array.isArray(question.answers) || question.answers.length < 2) {
      alert('Please provide at least two answers.');
      return;
    }
    if (question.answers.some(a => !a.text.trim())) {
      alert('All answers cannot be empty.');
      return;
    }
  
    // Validate correct answer counts for specific question types
    const correctCount = question.answers.filter(ans => ans.correct).length;
    if (question.type === 'single' && correctCount !== 1) {
      alert('Single choice question must have exactly one correct answer.');
      return;
    }
    if (question.type === 'multiple' && correctCount < 2) {
      alert('Multiple choice question must have at least two correct answers.');
      return;
    }
  
    // Merge judgment answers if the type is "judgement"
    const updatedQuestion = {
      ...question,
      ...(question.type === 'judgement' && {
        answers: [
          { text: 'True', correct: question.answers[0]?.correct || false },
          { text: 'False', correct: question.answers[1]?.correct || false }
        ]
      })
    };
  
    // Update localStorage for current game's question list
    const tempKey = `questions-${gameId}`;
    const localQuestions = JSON.parse(localStorage.getItem(tempKey) || '[]');
    const updatedQuestions = [...localQuestions];
    if (qIndex >= updatedQuestions.length) {
      updatedQuestions.push(updatedQuestion); // Append if it's a new question
    } else {
      updatedQuestions[qIndex] = updatedQuestion; // Overwrite existing one
    }
    localStorage.setItem(tempKey, JSON.stringify(updatedQuestions));
  
    // Fetch the complete game list from backend
    const allGamesRes = await fetch('http://localhost:5005/admin/games', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const allGamesData = await allGamesRes.json();
    const allGames = allGamesData.games || [];
  
    // Replace questions in each game with localStorage if available
    const finalGames = allGames.map(g => {
      const key = `questions-${g.id}`;
      const local = JSON.parse(localStorage.getItem(key) || '[]');
      return {
        ...g,
        questions: local.length > 0 ? local : (g.questions || []),
      };
    });
  
    // Upload the full game list (with all updated questions) to backend
    const res = await fetch('http://localhost:5005/admin/games', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ games: finalGames }),
    });
  
    // Handle response and redirect to game page if successful
    if (res.ok) {
      alert('Question published successfully!');
      navigate(`/game/${gameId}`, { replace: true });
    } else {
      const err = await res.text();
      alert('Failed to save question:\n' + err);
    }
  };
  
  

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4">Edit Question</Typography>

      {/* Question text input */}
      <TextField fullWidth label="Question Text" sx={{ my: 2 }}
        value={question.text} onChange={(e) => setQuestion({ ...question, text: e.target.value })} />

      {/* Question type dropdown */}
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Question Type</InputLabel>
        <Select value={question.type} label="Question Type"
          onChange={(e) => {
            const type = e.target.value;
            let answers = question.answers;
            if (type === 'judgement') {
              answers = [
                { text: 'True', correct: true },
                { text: 'False', correct: false }
              ];
            } else if (answers.length < 2) {
              answers = [...answers, { text: '', correct: false }];
            }
            setQuestion({ ...question, type, answers });
          }}>
          <MenuItem value="single">Single Choice</MenuItem>
          <MenuItem value="multiple">Multiple Choice</MenuItem>
          <MenuItem value="judgement">Judgement</MenuItem>
        </Select>
      </FormControl>

      {/* Time and points input */}
      <TextField fullWidth label="Time Limit (seconds)" type="number" sx={{ mb: 2 }}
        value={question.time} onChange={(e) => setQuestion({ ...question, time: parseInt(e.target.value) })} />
      <TextField fullWidth label="Points" type="number" sx={{ mb: 2 }}
        value={question.points} onChange={(e) => setQuestion({ ...question, points: parseInt(e.target.value) })} />

      {/* YouTube URL */}
      <TextField fullWidth label="YouTube Video URL" sx={{ mb: 2 }}
        value={question.video} onChange={(e) => setQuestion({ ...question, video: e.target.value })} />

      {/* Image upload */}
      <Button component="label" variant="outlined" sx={{ mb: 2 }}>
        Upload Image
        <input type="file" hidden accept="image/*"
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) {
              const reader = new FileReader();
              reader.onloadend = () =>
                setQuestion(prev => ({ ...prev, image: reader.result }));
              reader.readAsDataURL(file);
            }
          }}
        />
      </Button>

      {/* Image preview and clear button */}
      {question.image && (
        <>
          <Box mt={2}>
            <Typography variant="body2">Image Preview:</Typography>
            <Box
              component="img"
              src={question.image}
              alt="Preview"
              sx={{ height: 100, borderRadius: 1, mt: 1 }}
            />
          </Box>
          <Button
            variant="outlined"
            color="error"
            sx={{ mt: 1 }}
            onClick={() => setQuestion(prev => ({ ...prev, image: '' }))}
          >
            Clear Image
          </Button>
        </>
      )}

      {/* Answer options section */}
      <Typography variant="h6" mt={3}>Answers</Typography>

      {question.answers.map((a, i) => (
        <Box key={i} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <TextField label={`Answer ${i + 1}`} value={a.text}
            onChange={(e) => handleAnswerChange(i, 'text', e.target.value)} sx={{ mr: 2, flex: 1 }} />

          {/* Radio for judgement, checkbox for others */}
          {question.type === 'judgement' ? (
            <FormControlLabel
              control={<Radio checked={a.correct} onChange={() => {
                const updated = question.answers.map((ans, idx) => ({
                  ...ans, correct: idx === i
                }));
                setQuestion({ ...question, answers: updated });
              }} />}
              label="This is the answer"
            />
          ) : (
            <FormControlLabel
              control={<Checkbox checked={a.correct}
                onChange={(e) => {
                  const updated = [...question.answers];
                  if (question.type === 'single') {
                    updated.forEach((_, idx) => updated[idx].correct = false);
                    updated[i].correct = true;
                  } else {
                    updated[i].correct = e.target.checked;
                  }
                  setQuestion({ ...question, answers: updated });
                }} />}
              label="Correct"
            />
          )}

          {/* Delete option button */}
          {question.type !== 'judgement' && (
            <IconButton onClick={() => deleteAnswer(i)}><Delete /></IconButton>
          )}
        </Box>
      ))}

      {/* Add new answer button */}
      {question.type !== 'judgement' && question.answers.length < 6 && (
        <Button onClick={addAnswer} sx={{ mt: 1 }}>Add Option</Button>
      )}

      {/* Action buttons */}
      <Box mt={4}>
        <Button variant="contained" onClick={updateGame}>Submit</Button>
        <Button variant="text" sx={{ ml: 2 }} onClick={() => navigate(`/game/${gameId}`)}>Cancel</Button>
      </Box>
    </Box>
  );
};

export default EditQuestion;
