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
  const navigate = useNavigate(); // For navigating programmatically

  const [sessionData, setSessionData] = useState(null); // Session metadata
  const [players, setPlayers] = useState([]); // Players list
  const [questions, setQuestions] = useState([]); // Question list
  const [gameId, setGameId] = useState(null); // Game ID linked to session
  const [openConfirm, setOpenConfirm] = useState(false); // Dialog state for results

  // Fetch session status from backend
  const fetchStatus = async () => {
    const res = await fetch(`http://localhost:5005/admin/session/${session_id}/status`, {
      headers: { Authorization: `Bearer ${localStorage.getItem(AUTH.TOKEN_KEY)}` }
    });
    const data = await res.json();
    if (res.ok) {
      setSessionData(data.results);
      // Try to get the associated gameId based on active session ID
      const gameIdFromActive = await getGameIdByActiveSessionId(session_id);
      if (gameIdFromActive) {
        setGameId(gameIdFromActive);
        console.log('gameId matched by active session:', gameIdFromActive);
      } else {
        console.warn('No game matched active session ID');
      }
    } else {
      alert(data.error || 'Failed to fetch session status');
    }
  };

  // Match active session ID with game
  const getGameIdByActiveSessionId = async (sessionId) => {
    const res = await fetch('http://localhost:5005/admin/games', {
      headers: { Authorization: `Bearer ${localStorage.getItem(AUTH.TOKEN_KEY)}` }
    });
    const data = await res.json();
    if (!res.ok) return null;

    const match = data.games.find(game => Number(game.active) === Number(sessionId));
    if (!match) {
      console.warn('No game matched active session ID', sessionId);
    }
    return match?.id ?? null;
  };

  // Fallback: match game by exact question list (used after session ends)
  const fetchGameIdFromSession = async (sessionQuestions) => {
    const res = await fetch('http://localhost:5005/admin/games', {
      headers: { Authorization: `Bearer ${localStorage.getItem(AUTH.TOKEN_KEY)}` }
    });
    const data = await res.json();
    if (!res.ok) return null;

    const match = data.games.find(game =>
      JSON.stringify(game.questions) === JSON.stringify(sessionQuestions)
    );

    if (!match) {
      console.warn('No game matches these session questions');
    }

    return match?.id ?? null;
  };

  // Fetch results after session ends
  const fetchResults = async () => {
    const res = await fetch(`http://localhost:5005/admin/session/${session_id}/results`, {
      headers: { Authorization: `Bearer ${localStorage.getItem(AUTH.TOKEN_KEY)}` }
    });
    const data = await res.json();

    if (res.ok) {
      setPlayers(data.players || []);
      setQuestions(data.questions || []);
      // Fallback gameId lookup if it's not already set
      if (!gameId) {
        const gameIdFromSession = await fetchGameIdFromSession(data.questions);
        if (gameIdFromSession) {
          setGameId(gameIdFromSession);
          console.log('Game ID matched by questions:', gameIdFromSession);
        }
      }
    } else {
      alert(data.error || 'Failed to fetch session results');
    }
  };

  // Advance to next question
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
  
    // ✅ 延迟 1 秒后再获取新状态，确保后端处理完毕
    setTimeout(() => {
      fetchStatus();
    }, 1000);
  };
  

  // Stop the session
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

    // Don't re-fetch status after stopping, just update local state
    setSessionData(prev => ({ ...prev, active: false }));
    setOpenConfirm(true);
  };

  // Initial fetch of session status
  useEffect(() => {
    if (session_id) fetchStatus();
  }, [session_id]);

  // Fetch results after session ends
  useEffect(() => {
    if (sessionData && sessionData.active === false) fetchResults();
  }, [sessionData]);

  // Loading spinner
  if (!sessionData) return <Box sx={{ p: 4 }}><CircularProgress /></Box>;

  // Generate chart data from question and player info
  const chartData = questions.map((q, idx) => {
    const total = players.length;
    const correctCount = players.filter(p => p.answers?.[idx]?.correct).length;
    const avgTime = (
      players.reduce((acc, p) => acc + (p.answers?.[idx]?.answeredAt - p.answers?.[idx]?.questionStartedAt || 0), 0)
      / (players.length || 1)
    ) / 1000;
    return {
      name: `Q${idx + 1}`,
      correctRate: total ? Math.round((correctCount / total) * 100) : 0,
      avgTime: isNaN(avgTime) ? 0 : avgTime.toFixed(1)
    };
  });

  // Top 5 players by score
  const topPlayers = [...players]
    .map(p => ({ name: p.name, score: p.score || 0 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  // UI
  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>Session Management</Typography>
      <Typography>Session ID: {session_id}</Typography>
      <Typography>Position: {sessionData.position}</Typography>
      <Typography>Status: {sessionData.active ? 'Active' : 'Ended'}</Typography>

      {/* Controls shown only when session is active */}
      {sessionData.active && (
        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          <Button variant="contained" onClick={advance}>Advance to Next Question</Button>
          <Button variant="outlined" color="error" onClick={stopGame}>Stop Game</Button>
        </Box>
      )}

      {/* Results shown when session ends */}
      {!sessionData.active && (
        <>
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

          <Typography variant="h5" sx={{ mt: 4 }}>Correct Rate per Question (%)</Typography>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="correctRate" />
            </BarChart>
          </ResponsiveContainer>

          <Typography variant="h5" sx={{ mt: 4 }}>Average Answer Time (s)</Typography>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="avgTime" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        </>
      )}

      {/* Confirmation dialog after stopping session */}
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
