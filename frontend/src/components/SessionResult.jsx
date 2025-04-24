import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  Box, Typography, Table, TableHead, TableRow, TableCell,
  TableBody, CircularProgress, Button
} from '@mui/material';

import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip
} from 'recharts';
import AUTH from '../Constant';
import AdvancedPointsExplanation from './AdvancedPointsExplanation';

const SessionResult = () => {
  const { session_id } = useParams(); // Get session ID from route params
  const [players, setPlayers] = useState([]); // Store processed player result data
  const [questions, setQuestions] = useState([]); // Store question labels like Q1, Q2, etc.

  useEffect(() => {
    const fetchResults = async () => {
      // Fetch session results using admin API with auth token
      const res = await fetch(`http://localhost:5005/admin/session/${session_id}/results`, {
        headers: { Authorization: `Bearer ${localStorage.getItem(AUTH.TOKEN_KEY)}` }
      });

      const { results } = await res.json();

      // Determine number of questions from the first player's answers
      const numQuestions = results[0]?.answers?.length || 0;
      const qLabels = Array.from({ length: numQuestions }, (_, i) => `Q${i + 1}`);

      // Process each player: extract name, score (count of correct answers), and their answers
      const processedPlayers = results.map(p => {
        const score = p.answers.filter(a => a.correct).length;
        const points = p.answers.reduce((total, a) => {
          if (!a.correct || !a.answeredAt || !a.questionStartedAt || !a.questionPoints || !a.questionTimeLimit) return total;
          const timeTaken = (new Date(a.answeredAt) - new Date(a.questionStartedAt)) / 1000;
          const timeRemaining = Math.max(a.questionTimeLimit - timeTaken, 0);
          return total + timeRemaining * a.questionPoints;
        }, 0);
        return { name: p.name, score, advancedScore: points, answers: p.answers };
      });

      // Update states
      setPlayers(processedPlayers);
      setQuestions(qLabels);
    };

    fetchResults();
  }, [session_id]);

  // Construct chart data for each question
  const chartData = questions.map((qLabel, idx) => {
    const total = players.length;
    const correctCount = players.filter(p => p.answers?.[idx]?.correct).length;

    // Calculate total response time for the question across all players
    const totalTime = players.reduce((acc, p) => {
      const ans = p.answers?.[idx];
      if (!ans?.answeredAt || !ans?.questionStartedAt) return acc;
      return acc + (new Date(ans.answeredAt) - new Date(ans.questionStartedAt));
    }, 0);

    // Average response time in seconds
    const avgTime = totalTime / total / 1000;

    return {
      name: qLabel,
      correctRate: total ? Math.round((correctCount / total) * 100) : 0, // % correct
      avgTime: isNaN(avgTime) ? 0 : avgTime.toFixed(1) // round to 1 decimal
    };
  });

  // Get top 5 players sorted by score
  const topPlayers = [...players]
    .sort((a, b) => {
      if (b.score === a.score) {
        return b.advancedScore - a.advancedScore;
      }
      return b.score - a.score;
    })
    .slice(0, 5);

  // Show loading spinner while waiting for data
  if (players.length === 0) {
    return <Box sx={{ p: 4 }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>Session Result Summary</Typography>

      {/* Top players */}
      <Typography variant="h5" sx={{ mt: 2 }}>Top 5 Players</Typography>
      <Table sx={{ mt: 2 }}>
        <TableHead>
          <TableRow>
            <TableCell>Player</TableCell>
            <TableCell>Score</TableCell>
            <TableCell>Advanced Score</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {topPlayers.map((player, idx) => (
            <TableRow key={idx}>
              <TableCell>{player.name}</TableCell>
              <TableCell>{player.score}</TableCell>
              <TableCell>{(player.advancedScore ?? 0).toFixed(2)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Correct Rate Chart */}
      <Typography variant="h5" sx={{ mt: 6 }}>Correct Rate per Question (%)</Typography>
      <Box sx={{ minHeight: 360 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 30, right: 30, left: 20, bottom: 30 }}>
            <XAxis dataKey="name" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Bar dataKey="correctRate" fill="#82ca9d" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Box>

      {/* Avg Time Chart */}
      <Typography variant="h5" sx={{ mt: 6 }}>Average Answer Time (s)</Typography>
      <Box sx={{ minHeight: 360 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 30, right: 30, left: 20, bottom: 30 }}>
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

      <Box sx={{ mt: 6 }}>
        <Button
          variant="outlined"
          onClick={() => window.history.back()}
        >
          back
        </Button>
      </Box>

      <Box sx={{ mt: 6 }}>
        <AdvancedPointsExplanation />
      </Box>

    </Box>
  );
};

export default SessionResult;
