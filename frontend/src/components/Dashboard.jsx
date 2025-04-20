import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  CardActions
} from '@mui/material';
import AUTH from '../Constant';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [games, setGames] = useState([]); // List of user's games
  const [newGameName, setNewGameName] = useState(''); // Input state for creating new game
  const navigate = useNavigate();

  // Fetch all games and populate only the games owned by the logged-in user
  const fetchGames = async () => {
    const token = localStorage.getItem(AUTH.TOKEN_KEY);
    const ownerEmail = localStorage.getItem('email');
    const res = await fetch('http://localhost:5005/admin/games', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();

    // Merge local questions (saved in localStorage) if available
    const gamesWithLocalQuestions = (data.games || []).map(game => {
      if (game.owner === ownerEmail) {
        const tempKey = `questions-${game.id}`;
        const localQuestions = JSON.parse(localStorage.getItem(tempKey) || '[]');
        return {
          ...game,
          questions: localQuestions.length > 0 ? localQuestions : game.questions || [],
        };
      }
      return game;
    });

    setGames(gamesWithLocalQuestions);
  };

  // Fetch games whenever the URL path changes (useful after navigation)
  useEffect(() => {
    fetchGames();
  }, [location.pathname]);

  // Create a new game and save to backend
  const createGame = async () => {
    const token = localStorage.getItem(AUTH.TOKEN_KEY);
    const ownerEmail = localStorage.getItem('email');

    // Get current list of games
    const getRes = await fetch('http://localhost:5005/admin/games', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const gameList = await getRes.json();
    const gamesArray = gameList.games || [];
    const myGames = gamesArray.filter(game => game.owner === ownerEmail);

    // Define new game object
    const newGame = {
      id: Math.floor(Math.random() * 10000000),
      name: newGameName,
      owner: ownerEmail,
      thumbnail: '',
      questions: [],
      active: false,
    };

    const updatedGames = [...myGames, newGame];

    // Save updated list of games to backend
    const putRes = await fetch('http://localhost:5005/admin/games', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ games: updatedGames }),
    });

    if (putRes.ok) {
      await fetchGames(); // Refresh game list
      setNewGameName(''); // Clear input field
    } else {
      const err = await putRes.text();
      console.error('Creation failed:', err);
    }
  };

  // Delete a game by its ID
  const deleteGame = async (id) => {
    const token = localStorage.getItem(AUTH.TOKEN_KEY);
    const ownerEmail = localStorage.getItem('email');

    const res = await fetch('http://localhost:5005/admin/games', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const allGames = await res.json();
    const myGames = allGames.games.filter(game => game.owner === ownerEmail);
    const updatedGames = myGames.filter(game => game.id !== id);

    // Save updated list after deletion
    const putRes = await fetch('http://localhost:5005/admin/games', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ games: updatedGames }),
    });

    if (putRes.ok) {
      setGames(updatedGames); // Update frontend state
    } else {
      const err = await putRes.text();
      console.error('Deletion failed:', err);
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      {/* Page title */}
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      {/* New game creation form */}
      <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
        <TextField
          label="New game name"
          value={newGameName}
          onChange={(e) => setNewGameName(e.target.value)}
        />
        <Button variant="contained" onClick={createGame}>
          Create Game
        </Button>
      </Box>

      {/* Display list of user's games */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {games.map((game) => (
          <Card
            key={game.id}
            variant="outlined"
            sx={{ cursor: 'pointer' }}
            onClick={() => navigate(`/game/${game.id}`)} // Navigate to game detail
          >
            <CardContent>
              <Typography variant="h6">{game.name}</Typography>
              <Typography>Questions: {game.questions?.length || 0}</Typography>
              <Typography>
                Total duration:{' '}
                {game.questions?.reduce((sum, q) => sum + (q.time || 0), 0) || 0} seconds
              </Typography>
              {game.thumbnail && (
                <Box
                  component="img"
                  src={game.thumbnail}
                  alt="Thumbnail"
                  sx={{ height: 80, mt: 1, borderRadius: 1 }}
                />
              )}
            </CardContent>
            <CardActions>
              {/* Delete button */}
              <Button
                size="small"
                color="error"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent navigation
                  deleteGame(game.id);
                }}
              >
                Delete Game
              </Button>
            </CardActions>
          </Card>
        ))}
      </Box>
    </Box>
  );
};

export default Dashboard;
