import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from '@mui/material';
import AUTH from '../Constant';
import AdvancedPointsExplanation from './AdvancedPointsExplanation';

const PlayerResult = () => {
  // Extract session ID and player ID from the URL parameters
  const { session_id, player_id } = useParams();

  // States to hold player results, question points, question texts, total score, and max score
  const [results, setResults] = useState([]);
  const [questionPoints, setQuestionPoints] = useState([]);
  const [questionTexts, setQuestionTexts] = useState([]);
  const [totalScore, setTotalScore] = useState(0);
  const [maxScore, setMaxScore] = useState(0);
  const [advancedScore, setAdvancedScore] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch the player's answer results
        const res1 = await fetch(`http://localhost:5005/play/${player_id}/results`);
        if (!res1.ok) throw new Error('Failed to fetch player results');
        const resultData = await res1.json();

        // 2. Fetch the session status to get the game questions
        const token = localStorage.getItem(AUTH.TOKEN_KEY);
        const res2 = await fetch(`http://localhost:5005/admin/session/${session_id}/status`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const sessionData = await res2.json();
        const questions = sessionData.results?.questions || [];

        // 3. Extract points and texts from each question
        const points = questions.map(q => q.point || 0);
        const limits = questions.map(q => q.time || q.duration); // 或 q.duration，视你后端字段而定

        const texts = questions.map(q => q.question || 'Untitled Question');

        // 4. Calculate total possible score and actual score based on correct answers
        const total = points.reduce((acc, val) => acc + val, 0);
        const score = resultData.reduce((sum, r, i) => {
          return r.correct ? sum + (points[i] || 0) : sum;
        }, 0);

        // Update states with the fetched and calculated data
        setResults(resultData);
        setQuestionPoints(points);
        setQuestionTexts(texts);
        setTotalScore(score);
        setMaxScore(total);

        // Initialize the advanced score accumulator
        let advanced = 0;

        // Loop through each result item (each question answered by the player)
        resultData.forEach((r, i) => {
          // Only calculate if the answer is correct and time information exists
          if (r.correct && r.answeredAt && r.questionStartedAt) {
            // Calculate time taken to answer the question in seconds
            const timeTaken = (new Date(r.answeredAt) - new Date(r.questionStartedAt)) / 1000;

            // Get the time limit for this question (fall back to 0 if not found)
            const timeLimit = limits[i] || 0;

            // Calculate remaining time (time saved by answering faster)
            const timeRemaining = timeLimit - timeTaken;

            // Only add to advanced score if time remaining is positive
            if (timeRemaining > 0) {
              // Advanced score for this question = time remaining × question points
              advanced += timeRemaining * (points[i] || 0);
            }
          }
        });

        // Save the computed advanced score to component state
        setAdvancedScore(advanced);


      } catch (err) {
        console.error(err);
        // Set results to null to trigger error message in UI
        setResults(null);
      }
    };
    // Trigger data fetch on component mount or param change
    fetchData();
  }, [session_id, player_id]);

  // Render an error message if data failed to load
  if (results === null) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="h6" color="error">
          Failed to load player results. Please try again later.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>Quiz Results</Typography>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Question</TableCell>
            <TableCell>Correct</TableCell>
            <TableCell>Time Taken (s)</TableCell>
            <TableCell>Points</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {results.map((r, i) => {
            const time = r.answeredAt && r.questionStartedAt
              ? Math.round((new Date(r.answeredAt) - new Date(r.questionStartedAt)) / 1000)
              : '-';
            return (
              <TableRow key={i}>
                <TableCell>
                  <strong>Q{i + 1}</strong>
                  <br />
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {questionTexts[i]}
                  </Typography>
                </TableCell>
                <TableCell>{r.correct ? 'Yes' : 'No'}</TableCell>
                <TableCell>{time}</TableCell>
                <TableCell>
                  {r.correct ? `${questionPoints[i] || 0} / ${questionPoints[i] || 0}` : `0 / ${questionPoints[i] || 0}`}
                </TableCell>

              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Total score display */}
      <Typography variant="h5" sx={{ mt: 4 }}>
        Total Score: {totalScore} / {maxScore}
      </Typography>

      <Typography variant="h6" sx={{ mt: 2 }}>
        Advanced Score (Speed × Points): {advancedScore.toFixed(2)}
      </Typography>

      <Box sx={{ mt: 6 }}>
        <AdvancedPointsExplanation />
      </Box>

    </Box>
  );
};

export default PlayerResult;
