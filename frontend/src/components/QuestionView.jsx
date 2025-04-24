import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Button } from '@mui/material';
import AUTH from '../Constant';

const QuestionView = () => {
  // Get gameId and questionId from route parameters
  const { gameId, questionId } = useParams();
  const navigate = useNavigate();
  const index = parseInt(questionId, 10); // Convert questionId to integer index

  // State to hold the current question and loading status
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch question data when component mounts
  useEffect(() => {
    const fetchQuestion = async () => {
      const token = localStorage.getItem(AUTH.TOKEN_KEY);
      const email = localStorage.getItem('email');

      try {
        const res = await fetch('http://localhost:5005/admin/games', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error('Failed to fetch games');

        const { games } = await res.json();

        // Find the specific game owned by the current user
        const game = games.find(g => g.id.toString() === gameId && g.owner === email);

        // Check if question exists
        if (!game || !Array.isArray(game.questions) || !game.questions[index]) {
          alert('The question does not exist or has not been saved.');
          setQuestion(null);
        } else {
          setQuestion(game.questions[index]);
        }
      } catch (err) {
        console.error('Failed to load question:', err);
        alert('Failed to load question.');
        setQuestion(null);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestion();
  }, [gameId, index, navigate]);

  // Show loading indicator while fetching data
  if (loading) {
    return <Typography sx={{ p: 4 }}>Loading...</Typography>;
  }

  // Show fallback UI if the question is not found
  if (!question) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="h6" color="error">
          Unable to load the question, please return to the previous page.
        </Typography>
        <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate(`/game/${gameId}`)}>
          Return to Game
        </Button>
      </Box>
    );
  }

  // Main view: Display question details
  return (
    <Box sx={{ p: { xs: 2, sm: 4 }, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>Question Detail</Typography>

      {/* Basic question metadata */}
      <Typography sx={{ wordBreak: 'break-word' }}><strong>Text:</strong> {question.text}</Typography>
      <Typography sx={{ wordBreak: 'break-word' }}><strong>Type:</strong> {question.type}</Typography>
      <Typography><strong>Time:</strong> {question.duration} seconds</Typography>
      <Typography><strong>Points:</strong> {question.points}</Typography>
      <Typography sx={{ wordBreak: 'break-word' }}><strong>YouTube:</strong> {question.video || 'N/A'}</Typography>

      {/* Show image if provided */}
      {question.image && (
        <Box mt={2}>
          <Typography><strong>Image:</strong></Typography>
          <Box
            component="img"
            src={question.image}
            alt="Question"
            sx={{
              height: 100,
              marginTop: 2, 
              maxWidth: '100%',
            }}
          />

        </Box>
      )}

      {/* Render answer list */}
      <Box mt={2}>
        <Typography><strong>Answers:</strong></Typography>
        {question.answers?.map((ans, i) => (
          <Typography key={i} sx={{ wordBreak: 'break-word' }}>
            - {ans.text} {ans.correct ? '(✓ correct)' : ''}
          </Typography>
        ))}
      </Box>

      {/* Action buttons: Edit or return to game */}
      <Box mt={4} sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
        <Button fullWidth variant="contained" onClick={() => navigate(`/game/${gameId}/question/${index}`)}>
          Edit Question
        </Button>
        <Button fullWidth variant="outlined" onClick={() => navigate(`/game/${gameId}`)}>
          Back to Game
        </Button>
      </Box>
    </Box>
  );
};

export default QuestionView;
