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
    const qIndex = Number(questionId);

    // Validation checks
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

    const correctCount = question.answers.filter(ans => ans.correct).length;
    if (question.type === 'single' && correctCount !== 1) {
      alert('Single choice question must have exactly one correct answer.');
      return;
    }
    if (question.type === 'multiple' && correctCount < 2) {
      alert('Multiple choice question must have at least two correct answers.');
      return;
    }

    // Merge current edits with original question
    const original = game.questions?.[qIndex] || {};
    const updatedQuestion = {
      ...original,
      ...question,
      ...(question.type === 'judgement' && {
        answers: [
          { text: 'True', correct: question.answers[0]?.correct || false },
          { text: 'False', correct: question.answers[1]?.correct || false }
        ]
      }),
    };

    // Update questions array
    const updatedQuestions = [...(game.questions || [])];
    if (qIndex >= updatedQuestions.length) {
      updatedQuestions.push(updatedQuestion);
    } else {
      updatedQuestions[qIndex] = updatedQuestion;
    }

    // Save to backend
    const updatedGame = { ...game, questions: updatedQuestions };
    const updatedGames = allGames.map(g =>
      g.id === Number(gameId) ? updatedGame : g
    );

    const res = await fetch('http://localhost:5005/admin/games', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ games: updatedGames }),
    });

    // Save to localStorage & navigate on success
    if (res.ok) {
      const tempKey = `questions-${gameId}`;
      const existing = JSON.parse(localStorage.getItem(tempKey) || '[]');
      if (qIndex >= existing.length) {
        existing.push(updatedQuestion);
      } else {
        existing[qIndex] = updatedQuestion;
      }
      const shallowCopy = structuredClone(existing);
      shallowCopy[qIndex].image = ''; 
      localStorage.setItem(tempKey, JSON.stringify(shallowCopy));

      alert('Question published successfully.');
      navigate(`/game/${gameId}`, { replace: true });
    }
  };

  
};

export default EditQuestion;
