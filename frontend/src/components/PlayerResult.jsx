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

const PlayerResult = () => {
  const { player_id } = useParams();
  const [results, setResults] = useState([]);
  const [questionPoints, setQuestionPoints] = useState([]);
  const [questionTexts, setQuestionTexts] = useState([]);
  const [totalScore, setTotalScore] = useState(0);
  const [maxScore, setMaxScore] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. 获取玩家答题记录
        const res1 = await fetch(`http://localhost:5005/play/${player_id}/results`);
        if (!res1.ok) throw new Error('Failed to fetch player results');
        const resultData = await res1.json();

        // 2. 获取后台所有游戏信息
        const token = localStorage.getItem(AUTH.TOKEN_KEY);
        const email = localStorage.getItem(AUTH.USER_KEY);
        const res2 = await fetch('http://localhost:5005/admin/games', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const { games } = await res2.json();

        // 3. 找到当前用户的游戏（假设只有一个）
        const game = games.find(g => g.owner === email);
        const questions = game?.questions || [];

        const points = questions.map(q => q.point || 0);
        const texts = questions.map(q => q.question || 'Untitled Question');

        const total = points.reduce((acc, val) => acc + val, 0);
        const score = resultData.reduce((sum, r, i) => {
          return r.correct ? sum + (points[i] || 0) : sum;
        }, 0);

        setResults(resultData);
        setQuestionPoints(points);
        setQuestionTexts(texts);
        setTotalScore(score);
        setMaxScore(total);
      } catch (err) {
        console.error(err);
        setResults(null);
      }
    };

    fetchData();
  }, [player_id]);

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
    </Box>
  );
};

export default PlayerResult;
