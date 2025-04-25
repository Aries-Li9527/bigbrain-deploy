// -----------------------------------------------------------
// Load all games from backend when component is mounted
// -----------------------------------------------------------

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Typography, TextField, Box, Button,
  MenuItem, Select, InputLabel, FormControl, Checkbox, FormControlLabel, Menu
} from '@mui/material';
import { fetchAllGames } from '../DataProvider';
import AUTH from '../Constant';


const EditQuestion = () => {
  const { game_id, question_id } = useParams(); // get params from URL
  const navigate = useNavigate();

  const [questionData, setQuestionData] = useState(null); // current question object
  const [answers, setAnswers] = useState([]); // answer options
  const [type, setType] = useState('single'); // question type

  // -----------------------------------------------------------
  // Validate answers 
  // -----------------------------------------------------------
  const validateAnswers = () => {
    const correctCount = answers.filter(ans => ans.correct).length;
    const hasEmptyText = answers.some(ans => !ans.text.trim());

    if (!questionData.duration || questionData.duration <= 0) {
      alert('Duration limit must be greater than 0.');
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

      // special handling for judgement type
      if (q.type === 'judgement') {
        const trueCorrect = q.optionAnswers?.find(ans => ans.text === 'True' && ans.correct);
        setAnswers([
          { text: 'True', correct: !!trueCorrect },
          { text: 'False', correct: !trueCorrect }
        ]);
      } else {
        // use existing or 2 default blank options
        setAnswers(q.optionAnswers?.length ? q.optionAnswers : [
          { text: '', correct: false },
          { text: '', correct: false },
        ]);
      }
    });
  }, [game_id, question_id]);

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = (value) => {
    setAnchorEl(null);
    if (value) {
      setQuestionData({ ...questionData, duration: value });
    }
  };


  if (!questionData) return <div>Loading...</div>;

  return (
    <Container
      maxWidth="md"
      sx={{
        mt: 4,
        px: { xs: 2, sm: 3 },
        py: { xs: 2, sm: 3 }
      }}
    >
      {/* Page title */}
      <Typography variant="h4" gutterBottom>Edit Question</Typography>

      {/* Question detail input */}
      <TextField
        label="Question details"
        fullWidth
        sx={{ mb: 2 }}
        value={questionData.question}
        onChange={(e) => setQuestionData({ ...questionData, question: e.target.value })}
      />

      {/* Question type dropdown */}
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Question Type</InputLabel>
        <Select
          value={type}
          label="Question Type"
          onChange={(e) => {
            const newType = e.target.value;
            setType(newType);

            // Judgement has fixed two options
            if (newType === 'judgement') {
              setAnswers([
                { text: 'True', correct: true },
                { text: 'False', correct: false }
              ]);
            } else {
              // Other types start with two empty options
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

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          label="Duration (seconds)"
          type="number"
          placeholder="e.g. 30"
          fullWidth
          value={questionData.duration || ''}
          onChange={(e) =>
            setQuestionData({
              ...questionData,
              duration: parseInt(e.target.value) || 0
            })
          }
        />
        <Button variant="outlined" onClick={handleClick}>
          Recommend
        </Button>
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={() => handleClose(null)}
        >
          {[30, 60, 90, 120].map((value) => (
            <MenuItem key={value} onClick={() => handleClose(value)}>
              {value} seconds
            </MenuItem>
          ))}
        </Menu>
      </Box>


      {/* Point value */}
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

      {/* Optional YouTube video */}
      <TextField
        label="YouTube Video URL (optional)"
        fullWidth
        sx={{ mb: 2 }}
        value={questionData.video}
        onChange={(e) =>
          setQuestionData({ ...questionData, video: e.target.value })
        }
      />

      {/* Optional image URL */}
      <TextField
        label="Image URL (optional)"
        fullWidth
        sx={{ mb: 2 }}
        value={questionData.image}
        onChange={(e) =>
          setQuestionData({ ...questionData, image: e.target.value })
        }
      />

      {/* Answer list */}
      <Typography variant="h6" sx={{ mt: 3 }}>Answers</Typography>
      {answers.map((answer, index) => (
        <Box
          key={index}
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'stretch', sm: 'center' },
            gap: 2,
            mt: 1
          }}
        >
          {/* Option input */}
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

          {/* Correct answer checkbox */}
          <FormControlLabel
            control={
              <Checkbox
                checked={answer.correct}
                onChange={(e) => {
                  const newAnswers = [...answers];
                  if (type === 'single' || type === 'judgement') {
                    // Only one correct answer allowed
                    newAnswers.forEach((ans, i) => {
                      newAnswers[i].correct = i === index ? e.target.checked : false;
                    });
                  } else {
                    // Multiple choice allows multiple correct answers
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

      {/* Add/remove options (non-judgement only) */}
      {type !== 'judgement' && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
            mt: 2
          }}
        >
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

      {/* Save and Cancel actions */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          mt: 4
        }}
      >
        <Button
          variant="contained"
          onClick={() => {
            if (!validateAnswers()) return;
            const userToken = localStorage.getItem(AUTH.TOKEN_KEY);
            fetchAllGames().then((data) => {
              const allGames = data.games || [];
              const targetGame = allGames.find(g => String(g.id) === game_id);
              if (!targetGame) return;

              // Update the current question
              const updatedQuestions = targetGame.questions.map((q) =>
                String(q.id) === question_id
                  ? {
                    ...questionData,
                    type,
                    optionAnswers: answers,
                    correctAnswers: answers.filter(ans => ans.correct).map(ans => ans.text)
                  }
                  : q
              );

              // Update game object
              const updatedGame = { ...targetGame, questions: updatedQuestions };

              const updatedGames = allGames.map((g) =>
                String(g.id) === game_id ? updatedGame : g
              );

              // Send PUT request to save
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