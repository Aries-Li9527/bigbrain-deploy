import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AUTH from '../Constant';
import {
  Box, Typography, Button, CircularProgress, Table, TableBody,
  TableCell, TableHead, TableRow, Dialog, DialogTitle,
  DialogContent, DialogActions
} from '@mui/material';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  Tooltip, ResponsiveContainer
} from 'recharts';

const SessionPage = () => {
  const { session_id } = useParams(); // Get session ID from URL
  const navigate = useNavigate(); // Navigation hook

  const [sessionData, setSessionData] = useState(null); // Session metadata
  const [players, setPlayers] = useState([]); // List of players
  const [questions, setQuestions] = useState([]); // List of question labels 
  const [gameId, setGameId] = useState(null); // Game ID tied to the session
  const [openConfirm, setOpenConfirm] = useState(false); // Dialog state for session end

  // Fetch current session status
  const fetchStatus = async () => {
    const res = await fetch(`http://localhost:5005/admin/session/${session_id}/status`, {
      headers: { Authorization: `Bearer ${localStorage.getItem(AUTH.TOKEN_KEY)}` }
    });
    const data = await res.json();
    if (res.ok) {
      setSessionData(data.results);
      const gameIdFromActive = await getGameIdByActiveSessionId(session_id);
      if (gameIdFromActive) setGameId(gameIdFromActive);
    } else {
      alert(data.error || 'Failed to fetch session status');
    }
  };

  // Match session ID to a game by its active ID
  const getGameIdByActiveSessionId = async (sessionId) => {
    const res = await fetch('http://localhost:5005/admin/games', {
      headers: { Authorization: `Bearer ${localStorage.getItem(AUTH.TOKEN_KEY)}` }
    });
    const data = await res.json();
    if (!res.ok) return null;
    const match = data.games.find(game => Number(game.active) === Number(sessionId));
    return match?.id ?? null;
  };

  // Fetch final results after session ends
  const fetchResults = async () => {
    const res = await fetch(`http://localhost:5005/admin/session/${session_id}/results`, {
      headers: { Authorization: `Bearer ${localStorage.getItem(AUTH.TOKEN_KEY)}` }
    });

    const { results: rawPlayers } = await res.json();
    if (!Array.isArray(rawPlayers)) return;

    const numQuestions = rawPlayers[0]?.answers?.length || 0;
    const questions = Array.from({ length: numQuestions }, (_, i) => `Q${i + 1}`);

    const processedPlayers = rawPlayers.map(p => ({
      name: p.name,
      score: p.answers.filter(a => a.correct).length,
      answers: p.answers
    }));

    setQuestions(questions);
    setPlayers(processedPlayers);
  };

  // Advance to the next question
  const advance = async () => {
    const res = await fetch(`http://localhost:5005/admin/game/${gameId}/mutate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem(AUTH.TOKEN_KEY)}`
      },
      body: JSON.stringify({ mutationType: 'advance' })
    });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || 'Failed to advance question');
      return;
    }

    // Wait briefly before fetching updated session status
    setTimeout(() => {
      fetchStatus();
    }, 1000);
  };

  // End the session/game
  const stopGame = async () => {
    if (!gameId) {
      alert('Game ID not available. Cannot stop game.');
      return;
    }

    const res = await fetch(`http://localhost:5005/admin/game/${gameId}/mutate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem(AUTH.TOKEN_KEY)}`
      },
      body: JSON.stringify({ mutationType: 'end' })
    });

    if (!res.ok) {
      const data = await res.json();
      alert(data.error || 'Failed to stop session');
      return;
    }

    setSessionData(prev => ({ ...prev, active: false }));
    setOpenConfirm(true);
  };

  // Run on initial mount
  useEffect(() => {
    if (session_id) fetchStatus();
  }, [session_id]);

  // Watch for session end to trigger results fetch
  useEffect(() => {
    if (sessionData && sessionData.active === false) {
      fetchResults();
    }
  }, [sessionData]);

  // Show loading spinner if no session data yet
  if (!sessionData) return <Box sx={{ p: 4 }}><CircularProgress /></Box>;

  // Build data for charts (correct rate and average response time)
  const chartData = questions.map((qLabel, idx) => {
    const total = players.length;
    const correctCount = players.filter(p => p.answers?.[idx]?.correct).length;

    const totalTime = players.reduce((acc, p) => {
      const ans = p.answers?.[idx];
      if (!ans || !ans.answeredAt || !ans.questionStartedAt) return acc;
      return acc + (new Date(ans.answeredAt) - new Date(ans.questionStartedAt));
    }, 0);

    const avgTime = totalTime / total / 1000;

    return {
      name: qLabel,
      correctRate: total ? Math.round((correctCount / total) * 100) : 0,
      avgTime: isNaN(avgTime) ? 0 : avgTime.toFixed(1)
    };
  });

  // Get top 5 players sorted by score
  const topPlayers = [...players]
    .map(p => ({ name: p.name, score: p.score || 0 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);


  // UI
  return (
    <Box sx={{ p: 4 }}>
      {/* Header and session info */}
      <Typography variant="h4" gutterBottom>Session Management</Typography>
      <Typography>Session ID: {session_id}</Typography>
      <Typography>Position: {sessionData.position}</Typography>
      <Typography>Status: {sessionData.active ? 'Active' : 'Ended'}</Typography>

      {/* Buttons to control the session, shown only if session is active */}
      {sessionData.active && (
        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          <Button variant="contained" onClick={advance}>Advance to Next Question</Button>
          <Button variant="outlined" color="error" onClick={stopGame}>Stop Game</Button>
        </Box>
      )}

      {/* Results and charts shown when session has ended */}
      {!sessionData.active && (
        <>
          {/* Top 5 player scores */}
          <Typography variant="h5" sx={{ mt: 4 }}>Top 5 Players</Typography>
          <Table sx={{ mt: 2 }}>
            <TableHead>
              <TableRow><TableCell>Player</TableCell><TableCell>Score</TableCell></TableRow>
            </TableHead>
            <TableBody>
              {topPlayers.map((player, idx) => (
                <TableRow key={idx}>
                  <TableCell>{player.name}</TableCell>
                  <TableCell>{player.score}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Bar chart for correct answer rate per question */}
          <Typography variant="h5" sx={{ mt: 6 }}>Correct Rate per Question (%)</Typography>
          <Box sx={{ mb: 10, minHeight: 360 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 30, right: 30, left: 20, bottom: 30 }}
              >
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="correctRate" fill="#82ca9d" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Box>

          {/* Line chart for average answer time per question */}
          <Typography variant="h5" sx={{ mt: 6 }}>Average Answer Time (s)</Typography>
          <Box sx={{ mb: 10, minHeight: 360 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 30, right: 30, left: 20, bottom: 30 }}
              >
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="avgTime"
                  stroke="#8884d8"
                  strokeWidth={2}
                  dot={{ r: 4, stroke: '#8884d8', strokeWidth: 2, fill: '#fff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </>
      )}

      {/* Confirmation dialog shown after session is stopped */}
      <Dialog open={openConfirm} onClose={() => setOpenConfirm(false)}>
        <DialogTitle>View Results</DialogTitle>
        <DialogContent>
          <Typography>Would you like to view the results?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirm(false)}>No</Button>
          <Button onClick={() => navigate(`/session/${session_id}`)} autoFocus>Yes</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SessionPage;
