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

const PlayerResult = () => {
  const { player_id } = useParams(); // Get player_id from route
  const [results, setResults] = useState([]);

  // Fetch player answer results
  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await fetch(`http://localhost:5005/play/${player_id}/results`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setResults(data);
      } catch (err) {
        console.error('Failed to fetch results:', err);
        setResults(null); // null means error
      }
    };

    fetchResults();
  }, [player_id]);

  // Display error message if fetch failed
  if (results === null) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="h6" color="error">
          Failed to load player results. Please try again later.
        </Typography>
      </Box>
    );
  }

  // Render result table
  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>Quiz Results</Typography>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Question</TableCell>
            <TableCell>Correct</TableCell>
            <TableCell>Time Taken (s)</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {results.map((r, i) => {
            const time = r.answeredAt && r.questionStartedAt
              ? Math.round((new Date(r.answeredAt) - new Date(r.questionStartedAt)) / 1000)
              : '-';
            return (
              <TableRow key={i}>
                <TableCell>Q{i + 1}</TableCell>
                <TableCell>{r.correct ? 'Yes' : 'No'}</TableCell>
                <TableCell>{time}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Box>
  );
};

export default PlayerResult;
