import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import AUTH from '../Constant';
import {
  Box, Typography, Button, CircularProgress, Table, TableBody,
  TableCell, TableHead, TableRow
} from '@mui/material';
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip
} from 'recharts';
import AdvancedPointsExplanation from './AdvancedPointsExplanation';

const SessionPage = () => {
  const { session_id } = useParams(); // Get session ID from URL
  const [sessionData, setSessionData] = useState(null); // Session metadata
  const [players, setPlayers] = useState([]); // List of players
  const [questions, setQuestions] = useState([]); // List of question labels 
  const [gameId, setGameId] = useState(null); // Game ID tied to the session


  // Fetch current session status
  const fetchStatus = async () => {
    const res = await fetch(`http://localhost:5005/admin/session/${session_id}/status`, {
      headers: { Authorization: `Bearer ${localStorage.getItem(AUTH.TOKEN_KEY)}` }
    });
    const data = await res.json();

    if (res.ok) {
      setSessionData(data.results);
      setQuestions(data.results.questions ?? []);

      // Request the results only when the session has ended
      if (data.results.active === false) {
        await fetchResults(data.results.questions ?? []);
      }
    }

  };


  // Match session ID to a game by its active ID
  const getGameIdByActiveSessionId = async (sessionId) => {
    const res = await fetch('http://localhost:5005/admin/games', {
      headers: { Authorization: `Bearer ${localStorage.getItem(AUTH.TOKEN_KEY)}` }
    });
    const data = await res.json();
    const match = data.games.find(game => {
      return String(game.active) === String(sessionId);
    });
    return match?.id ?? null;
  };

  // Fetch final results after session ends
  const fetchResults = async (questionList) => {
    const res = await fetch(`http://localhost:5005/admin/session/${session_id}/results`, {
      headers: { Authorization: `Bearer ${localStorage.getItem(AUTH.TOKEN_KEY)}` }
    });
    const { results } = await res.json();

    const numQuestions = results[0]?.answers?.length || 0;
    const qLabels = Array.from({ length: numQuestions }, (_, i) => `Q${i + 1}`);

    const processedPlayers = results.map(p => ({
      name: p.name,
      score: p.answers.reduce((sum, a, idx) => {
        const q = questionList[idx];
        return sum + (a.correct ? (q?.point ?? 0) : 0);
      }, 0),

      answers: p.answers
    }));

    setQuestions(qLabels);
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
  };



  // Run on initial mount
  useEffect(() => {
    const init = async () => {
      if (!session_id) return;

      await fetchStatus();
      const id = await getGameIdByActiveSessionId(session_id);
      if (id != null) {
        setGameId(id);
      }
    };

    init();
  }, [session_id]);


  // Show loading spinner if no session data yet
  if (!sessionData) return <Box sx={{ p: 4 }}><CircularProgress /></Box>;


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
      {!sessionData.active && (
        <>
          <Typography variant="h5" sx={{ mt: 4 }}>Top 5 Players</Typography>
          <Table sx={{ mt: 2 }}>
            <TableHead>
              <TableRow>
                <TableCell>Player</TableCell>
                <TableCell>Score</TableCell>
              </TableRow>
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

          <Typography variant="h5" sx={{ mt: 6 }}>Correct Rate per Question (%)</Typography>
          <Box sx={{ minHeight: 360, height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={questions.map((qLabel, idx) => {
                const total = players.length;
                const correctCount = players.filter(p => p.answers?.[idx]?.correct).length;
                return {
                  name: qLabel,
                  correctRate: total ? Math.round((correctCount / total) * 100) : 0
                };
              })}>
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="correctRate" fill="#82ca9d" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Box>

          <Typography variant="h5" sx={{ mt: 6 }}>Average Answer Time (s)</Typography>
          <Box sx={{ minHeight: 360, height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={questions.map((qLabel, idx) => {
                const total = players.length;
                const totalTime = players.reduce((acc, p) => {
                  const ans = p.answers?.[idx];
                  if (!ans?.answeredAt || !ans?.questionStartedAt) return acc;
                  return acc + (new Date(ans.answeredAt) - new Date(ans.questionStartedAt));
                }, 0);
                const avg = totalTime / total / 1000;
                return {
                  name: qLabel,
                  avgTime: isNaN(avg) ? 0 : Number(avg.toFixed(1))
                };
              })}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="avgTime" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </>
      )}

      {/* Buttons to control the session, shown only if session is active */}
      {sessionData.active && (
        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          <Button variant="contained" onClick={advance}>Advance to Next Question</Button>
          <Button variant="outlined" color="error" onClick={stopGame}>Stop Game</Button>
        </Box>
      )}

      <Box sx={{ mt: 6 }}>
        <AdvancedPointsExplanation />
      </Box>

    </Box>
  );
};

export default SessionPage;
