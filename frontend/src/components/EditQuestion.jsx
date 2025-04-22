import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Typography, TextField, Box, Button,
  MenuItem, Select, InputLabel, FormControl, Checkbox, FormControlLabel,
} from '@mui/material';
import { fetchAllGames } from '../DataProvider';
import AUTH from '../Constant';

const EditQuestion = () => {
  const { game_id, question_id } = useParams();
  const navigate = useNavigate();

  const [questionData, setQuestionData] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [type, setType] = useState('single');

  const validateAnswers = () => {
    const correctCount = answers.filter(ans => ans.correct).length;
    const hasEmptyText = answers.some(ans => !ans.text.trim());

    if (!questionData.time || questionData.time <= 0) {
      alert('Time limit must be greater than 0.');
      return false;
    }

    if (!questionData.point || questionData.point <= 0) {
      alert('Points must be greater than 0.');
      return false;
    }

    if (type === 'single') {
      if (correctCount !== 1) {
        alert('Single choice question must have exactly one correct answer.');
        return false;
      }
      if (hasEmptyText) {
        alert('The option content cannot be empty.');
        return false;
      }
    }

    if (type === 'multiple') {
      if (correctCount < 2 || correctCount > 6) {
        alert('Multiple choice question must have between 2 and 6 correct answers.');
        return false;
      }
      if (hasEmptyText) {
        alert('The option content cannot be empty.');
        return false;
      }
    }

    if (type === 'judgement') {
      if (answers.length !== 2) {
        alert('Judgement questions must have exactly two options: True and False.');
        return false;
      }
      if (correctCount !== 1) {
        alert('Judgement questions must have exactly one correct answer.');
        return false;
      }
    }

    return true;
  };

  useEffect(() => {
    fetchAllGames().then((data) => {
      const game = data.games.find(g => String(g.id) === game_id);
      if (!game) return;

      const q = game.questions.find(q => String(q.id) === question_id);
      if (!q) return;

      setQuestionData(q);
      setType(q.type || 'single');
      if (q.type === 'judgement') {
        const trueCorrect = q.optionAnswers?.find(ans => ans.text === 'True' && ans.correct);
        setAnswers([
          { text: 'True', correct: !!trueCorrect },
          { text: 'False', correct: !trueCorrect }
        ]);
      } else {
        setAnswers(q.optionAnswers?.length ? q.optionAnswers : [
          { text: '', correct: false },
          { text: '', correct: false },
        ]);
      }
    });
  }, [game_id, question_id]);

  if (!questionData) return <div>Loading...</div>;

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>Edit Question</Typography>

      <TextField
        label="Question details"
        fullWidth
        sx={{ mb: 2 }}
        value={questionData.question}
        onChange={(e) => setQuestionData({ ...questionData, question: e.target.value })}
      />

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Question Type</InputLabel>
        <Select
          value={type}
          label="Question Type"
          onChange={(e) => {
            const newType = e.target.value;
            setType(newType);

            if (newType === 'judgement') {
              setAnswers([
                { text: 'True', correct: true },
                { text: 'False', correct: false }
              ]);
            } else {
              setAnswers([
                { text: '', correct: false },
                { text: '', correct: false }
              ]);
            }
          }}
        >
          <MenuItem value="single">Single Choice</MenuItem>
          <MenuItem value="multiple">Multiple Choice</MenuItem>
          <MenuItem value="judgement">Judgement</MenuItem>
        </Select>
      </FormControl>

      <TextField
        label="Time Limit (seconds)"
        type="number"
        placeholder="e.g. 30"
        fullWidth
        sx={{ mb: 2 }}
        value={questionData.time === 0 ? '' : questionData.time}
        onChange={(e) =>
          setQuestionData({ ...questionData, time: parseInt(e.target.value) || 0 })
        }
      />


      <TextField
        label="Points"
        type="number"
        placeholder="e.g. 10"
        fullWidth
        sx={{ mb: 2 }}
        value={questionData.point === 0 ? '' : questionData.point}
        onChange={(e) =>
          setQuestionData({ ...questionData, point: parseInt(e.target.value) || 0 })
        }
      />


      <TextField
        label="YouTube Video URL (optional)"
        fullWidth
        sx={{ mb: 2 }}
        value={questionData.video}
        onChange={(e) =>
          setQuestionData({ ...questionData, video: e.target.value })
        }
      />
      <TextField
        label="Image URL (optional)"
        fullWidth
        sx={{ mb: 2 }}
        value={questionData.image}
        onChange={(e) =>
          setQuestionData({ ...questionData, image: e.target.value })
        }
      />
      <Typography variant="h6" sx={{ mt: 3 }}>Answers</Typography>
      {answers.map((answer, index) => (
        <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
          <TextField
            label={`Option ${index + 1}`}
            value={answer.text}
            disabled={type === 'judgement'}
            onChange={(e) => {
              const newAnswers = [...answers];
              newAnswers[index].text = e.target.value;
              setAnswers(newAnswers);
            }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={answer.correct}
                onChange={(e) => {
                  const newAnswers = [...answers];
                  if (type === 'single' || type === 'judgement') {
                    newAnswers.forEach((ans, i) => {
                      newAnswers[i].correct = i === index ? e.target.checked : false;
                    });
                  } else {
                    newAnswers[index].correct = e.target.checked;
                  }
                  setAnswers(newAnswers);
                }}
              />
            }
            label="Correct"
          />
        </Box>
      ))}

      {type !== 'judgement' && (
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <Button
            variant="outlined"
            disabled={answers.length >= 6}
            onClick={() => {
              if (answers.length < 6) {
                setAnswers([...answers, { text: '', correct: false }]);
              }
            }}
          >
            Add Answer
          </Button>

          <Button
            variant="outlined"
            color="error"
            disabled={answers.length <= 2}
            onClick={() => {
              if (answers.length > 2) {
                const newAnswers = [...answers];
                newAnswers.pop();
                setAnswers(newAnswers);
              }
            }}
          >
            Remove Last
          </Button>
        </Box>
      )}

      <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
        <Button
          variant="contained"
          onClick={() => {
            if (!validateAnswers()) return;
            const userToken = localStorage.getItem(AUTH.TOKEN_KEY);
            fetchAllGames().then((data) => {
              const allGames = data.games || [];
              const targetGame = allGames.find(g => String(g.id) === game_id);
              if (!targetGame) return;

              const updatedQuestions = targetGame.questions.map((q) =>
                String(q.id) === question_id
                  ? { ...questionData, type, optionAnswers: answers }
                  : q
              );

              const updatedGame = { ...targetGame, questions: updatedQuestions };

              const updatedGames = allGames.map((g) =>
                String(g.id) === game_id ? updatedGame : g
              );

              return fetch('http://localhost:5005/admin/games', {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${userToken}`,
                },
                body: JSON.stringify({ games: updatedGames }),
              }).then((res) => {
                if (res.ok) {
                  alert('Question saved successfully!');
                  navigate(`/game/${game_id}`);
                } else {
                  alert('Failed to save the question.');
                }
              });
            });
          }}
        >
          Save Question
        </Button>

        <Button
          variant="outlined"
          color="secondary"
          onClick={() => navigate(`/game/${game_id}`)}
        >
          Cancel
        </Button>
      </Box>


    </Container>
  );
};

export default EditQuestion;
