import { useParams, useNavigate } from 'react-router-dom'; // Get URL params and navigation hook
import { useEffect, useState } from 'react'; // React hooks for state and side effects
import Lobby from './Lobby';
import { Box, TextField, Button, Typography } from '@mui/material';

// PlayScreen component: the main view for a player during the game
const PlayScreen = () => {
  const { session_id } = useParams(); // Get session ID from the URL
  const [stage, setStage] = useState('loading'); // Current stage of the screen
  const [playerName, setPlayerName] = useState(''); // Input name from the player
  const [playerId, setPlayerId] = useState(null); // Player ID returned by the server
  const navigate = useNavigate(); // Navigation function

  const [position, setPosition] = useState(-1); // Current question index
  const [lastKnownPosition, setLastKnownPosition] = useState(-2); // Previous known question index

  const [question, setQuestion] = useState(null); // Current question data
  const [selected, setSelected] = useState([]); // Selected answers
  const [durationLeft, setTimeLeft] = useState(null); // Remaining time for the question
  const [questionFetched, setQuestionFetched] = useState(false); // Whether the question has been fetched

  // Check if the session has ended
  const checkSessionEnded = async () => {
    const res = await fetch(`http://localhost:5005/admin/session/${session_id}/status`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data.active === false;
  };

  // Fetch player's current status in the game
  const fetchStatus = async () => {
    if (!playerId) return;

    const res = await fetch(`http://localhost:5005/play/${playerId}/status`);
    const data = await res.json();

    if (!res.ok) {
      console.warn('fetchStatus failed:', data);
      if (data.error?.includes('not an active session')) {
        // Redirect if backend says session is over
        navigate(`/result/${session_id}/${playerId}`);
      }
      return;
    }

    const newPosition = data.position;
    setPosition(newPosition);

    const ended = await checkSessionEnded();
    if (ended) {
      // Redirect to results if session is ended
      navigate(`/result/${session_id}/${playerId}`);
      return;
    }
    if (newPosition === -1) {
      // Waiting for next question
      setStage('waiting');
      setQuestionFetched(false);
      setTimeLeft(null);
    } else if (newPosition !== lastKnownPosition) {
      // New question available
      setLastKnownPosition(newPosition);
      setQuestionFetched(false);
      setTimeout(fetchQuestion, 1000);
    }
  };

  // Fetch the current question data
  const fetchQuestion = async () => {
    if (!playerId || questionFetched) return;

    const res = await fetch(`http://localhost:5005/play/${playerId}/question`);
    if (!res.ok) {
      const errorText = await res.text();
      console.warn('fetchQuestion failed:', errorText);
      return;
    }
    const data = await res.json();
    const q = data.question;
    setQuestion(q);
    setQuestionFetched(true);
    setSelected([]);

    const start = new Date(q.isoTimeLastQuestionStarted);
    const now = new Date();
    const secondsPassed = Math.floor((now - start) / 1000);
    const remaining = q.duration - secondsPassed;
    setTimeLeft(remaining > 0 ? remaining : 0);
    setStage('question');
  };

  // Submit selected answers to the backend
  const submitAnswer = async (answerIds) => {
    if (!playerId || !answerIds || answerIds.length === 0) return;

    const res = await fetch(`http://localhost:5005/play/${playerId}/answer`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers: answerIds }),
    });
    const data = await res.json();
    if (!res.ok) {
      console.warn('Submit error:', data);
    }
  };

  // Join the session using player name
  const joinSession = async () => {
    const res = await fetch(`http://localhost:5005/play/join/${session_id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: playerName }),
    });

    const data = await res.json();
    if (res.ok) {
      setPlayerId(data.playerId);
      setStage('waiting');
    } else {
      alert(data.error || 'Failed to join session');
    }
  };

  // On playerId change, start polling the game status
  useEffect(() => {
    if (!playerId) {
      setStage('join');
    } else {
      fetchStatus();
      const interval = setInterval(fetchStatus, 3000);
      return () => clearInterval(interval);
    }
  }, [playerId]);

  // Countdown for each question
  useEffect(() => {
    if (stage === 'question' && durationLeft !== null && durationLeft > 0) {
      const t = setTimeout(() => setTimeLeft(durationLeft - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [durationLeft, stage]);

  // Render different UI based on stage
  if (stage === 'loading') return <p>Loading...</p>;

  if (stage === 'join') {
    return (
      <Box sx={{ p: { xs: 2, sm: 5 }, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <Typography variant="h5">Join Game</Typography>
        <TextField
          fullWidth
          placeholder="Enter your name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          sx={{ maxWidth: 400 }}
        />
        <Button variant="contained" onClick={joinSession}>Join</Button>
      </Box>
    );
  }

  if (stage === 'waiting') {
    return <Lobby />;
  }

  if (stage === 'question') {
    if (!question || !question.question || !Array.isArray(question.optionAnswers)) {
      return <p>Waiting for question data...</p>;
    }
    return (
      <Box sx={{ p: { xs: 2, sm: 5 } }}>
        <Typography variant="h5" gutterBottom>{question.question}</Typography>
        <Typography variant="subtitle1">Current Question: Q{position + 1}</Typography>

        {question.image && (
          <Box component="img" src={question.image} alt="question" sx={{ width: '100%', maxWidth: 600, borderRadius: 2, my: 2 }} />
        )}

        {question.video && (
          <Box component="video" src={question.video} controls sx={{ width: '100%', maxWidth: 600, borderRadius: 2, my: 2 }} />
        )}

        <Typography sx={{ my: 2 }}>Duration left: {durationLeft}s</Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {question.optionAnswers.map((ans, idx) => (
            <Button
              key={ans.text}
              variant={selected.includes(idx) ? 'contained' : 'outlined'}
              onClick={() => {
                const value = idx;
                const newSelected = question.type === 'multiple'
                  ? selected.includes(value)
                    ? selected.filter(i => i !== value)
                    : [...selected, value]
                  : [value];

                setSelected(newSelected);
                submitAnswer(newSelected.map(i => question.optionAnswers[i].text));
              }}
              sx={{ minWidth: 150, maxWidth: '100%' }}
            >
              {ans.text}
            </Button>
          ))}
        </Box>
      </Box>
    );
  }

  return null;
};

export default PlayScreen;
