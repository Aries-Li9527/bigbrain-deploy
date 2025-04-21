import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  CardActions,
} from '@mui/material';
import AUTH from '../Constant';
import { useLocation } from 'react-router-dom';

const EditGame = () => {
  const { gameId } = useParams(); // Get gameId from URL parameters
  const navigate = useNavigate();
  const location = useLocation();

  const [game, setGame] = useState(null); // Current game object
  const [editName, setEditName] = useState(''); // Game name to be edited
  const [editThumbnail, setEditThumbnail] = useState(''); // Game thumbnail to be edited

  const token = localStorage.getItem(AUTH.TOKEN_KEY);
  const ownerEmail = localStorage.getItem('email');

  // Compress the uploaded image before saving (client-side compression)
  const compressImage = (file, maxWidth = 400, maxHeight = 400) =>
    new Promise((resolve) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        img.src = e.target.result;
      };

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = Math.min(maxWidth / img.width, maxHeight / img.height, 1);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.7)); // Return base64 JPEG string
      };

      reader.readAsDataURL(file);
    });

  // Fetch games from backend and populate target game
  const fetchGame = async () => {
    const res = await fetch('http://localhost:5005/admin/games', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();

    const owned = data.games.filter(g => g.owner === ownerEmail);

    const current = owned.find(g => g.id.toString() === gameId);

    // Check if local questions exist and override the game questions
    const tempKey = `questions-${gameId}`;
    const localQuestions = JSON.parse(localStorage.getItem(tempKey) || '[]');
    if (localQuestions.length > 0) {
      current.questions = localQuestions;
    }

    setGame(current);
    setEditName(current?.name || '');
    setEditThumbnail(current?.thumbnail || '');
  };

  // Re-fetch game whenever path changes (e.g. question updated)
  useEffect(() => {
    fetchGame();
  }, [location.pathname]);

  // Update a specific game (by ID) and save the full games list to the backend
  const updateGame = async (updatedGame) => {
    const token = localStorage.getItem(AUTH.TOKEN_KEY);
    const tempKey = `questions-${gameId}`; // LocalStorage key for this game's questions
    const localQuestions = JSON.parse(localStorage.getItem(tempKey) || '[]');

    // Compose the updated game with local questions included
    const finalGame = {
      ...updatedGame,
      questions: localQuestions,
    };

    // Fetch all existing games from the backend
    const resAll = await fetch('http://localhost:5005/admin/games', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await resAll.json();
    const backendGames = data.games || [];

    // Merge all games — keeping local questions if available
    const mergedGames = backendGames.map(g => {
      const key = `questions-${g.id}`;
      const local = JSON.parse(localStorage.getItem(key) || '[]');

      // Replace the target game with the updated one
      if (g.id.toString() === gameId) {
        return finalGame;
      }

      // Preserve local questions for other games if available
      return {
        ...g,
        questions: local.length > 0 ? local : (g.questions || []),
      };
    });

    // PUT the updated full games list back to backend
    const res = await fetch('http://localhost:5005/admin/games', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ games: mergedGames }),
    });

    // If update succeeds, refetch game and notify user
    if (res.ok) {
      await fetchGame(); // Refresh the current game data from backend
      alert('Game saved successfully!');
    } else {
      const err = await res.text();
      console.error('Update failed:', err); // Log error if update fails
      alert('Failed to update game.');
    }
  };

  // Delete question from local storage
  const deleteQuestion = (index) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;

    const tempKey = `questions-${gameId}`;
    const currentQuestions = JSON.parse(localStorage.getItem(tempKey) || '[]');

    currentQuestions.splice(index, 1); // Remove question
    localStorage.setItem(tempKey, JSON.stringify(currentQuestions)); // Save changes

    setGame({ ...game, questions: currentQuestions }); // Update local state
  };

  // Save updated game name and thumbnail
  const saveMeta = () => {
    const updated = {
      ...game,
      name: editName,
      thumbnail: editThumbnail,
    };
    updateGame(updated);
    alert('Game saved successfully!');
  };

  // Show loading text if game is not loaded yet
  if (!game) return <Typography sx={{ p: 4 }}>Loading...</Typography>;

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>Edit Game: {game.name}</Typography>

      {/* Editable metadata form */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>Edit Game Metadata</Typography>
        <TextField
          label="Game Name"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          sx={{ mr: 2, mb: 2 }}
        />

        <TextField
          label="Thumbnail URL"
          value={editThumbnail}
          onChange={(e) => setEditThumbnail(e.target.value)}
          fullWidth
          sx={{ mt: 2, mb: 2 }}
        />

        <Button variant="outlined" component="label">
          Upload Image File
          <input
            type="file"
            hidden
            accept="image/*"
            onChange={async (e) => {
              const file = e.target.files[0];
              if (file) {
                const compressed = await compressImage(file);
                setEditThumbnail(compressed);
              }
            }}
          />
        </Button>

        {/* Thumbnail preview */}
        {editThumbnail && (
          <Box mt={2}>
            <Typography variant="body2">Thumbnail Preview:</Typography>
            <Box
              component="img"
              src={editThumbnail}
              alt="Preview"
              sx={{ height: 100, borderRadius: 1, mt: 1 }}
            />
          </Box>
        )}

        <Box mt={2}>
          <Button variant="contained" onClick={saveMeta}>
            Save
          </Button>
        </Box>
      </Box>

      {/* Add new question */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6">Add New Question</Typography>
        <Button
          variant="contained"
          onClick={() => {
            const local = JSON.parse(localStorage.getItem(`questions-${gameId}`) || '[]');
            const nextIndex = local.length;
            navigate(`/game/${gameId}/question/${nextIndex}`);
          }}
        >
          Add New Question
        </Button>
      </Box>

      {/* List of existing questions */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {game.questions?.map((q, index) => (
          <Card key={index} variant="outlined">
            <CardContent>
              <Typography>Q{index + 1}: {q.text || '[Untitled]'}</Typography>
              <Typography>Time: {q.time || 0} seconds</Typography>

              {/* Video link display */}
              {q.video && (
                <Typography sx={{ mt: 1 }}>
                  Video: <a href={q.video} target="_blank" rel="noopener noreferrer">{q.video}</a>
                </Typography>
              )}

              {/* Image URL display */}
              {q.image && (
                <Typography sx={{ mt: 1 }}>
                  Image URL: <a href={q.image} target="_blank" rel="noopener noreferrer">{q.image}</a>
                </Typography>
              )}
            </CardContent>

            <CardActions>
              <Button
                size="small"
                onClick={() => navigate(`/game/${gameId}/question/${index}`)}
              >
                Edit
              </Button>
              <Button
                size="small"
                color="error"
                onClick={() => deleteQuestion(index)}
              >
                Delete
              </Button>
            </CardActions>
          </Card>
        ))}
      </Box>      

      {/* Back navigation */}
      <Box sx={{ mt: 4 }}>
        <Button variant="contained" color="secondary" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </Box>
    </Box>
  );
};

export default EditGame;
