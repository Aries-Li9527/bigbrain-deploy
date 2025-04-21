import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import AUTH from '../Constant';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [games, setGames] = useState([]); // List of user's games
  const [newGameName, setNewGameName] = useState(''); // Input state for creating new game
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [gameToDelete, setGameToDelete] = useState(null);

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
  // Create a new game and upload the updated list to the backend
  const createGame = async () => {
    // Retrieve the user's token and email from localStorage
    const token = localStorage.getItem(AUTH.TOKEN_KEY);
    const ownerEmail = localStorage.getItem('email');

    // Fetch all games from the backend
    const res = await fetch('http://localhost:5005/admin/games', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    const allGames = data.games || [];

    // Filter only the games owned by the current user
    const myGames = allGames.filter(g => g.owner === ownerEmail);

    // Restore questions from localStorage for each game if available
    const gamesWithQuestions = myGames.map(game => {
      const local = JSON.parse(localStorage.getItem(`questions-${game.id}`) || '[]');
      return {
        ...game,
        questions: local.length > 0 ? local : game.questions || [],
      };
    });

    // Step 4: Create a new game object
    const newGame = {
      id: Math.floor(Math.random() * 10000000), // Randomly generate a unique ID
      name: newGameName,                        // Use the inputted game name
      owner: ownerEmail,                        // Set the current user as owner
      thumbnail: '',                            // Default empty thumbnail
      questions: [],                            // Start with no questions
      active: false,                            // Default to inactive
    };

    // Combine existing games with the new game
    const updatedGames = [...gamesWithQuestions, newGame];

    // Save the updated games list to the backend using PUT
    const putRes = await fetch('http://localhost:5005/admin/games', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ games: updatedGames }),
    });

    // If successful, refresh game list and clear input field
    if (putRes.ok) {
      await fetchGames();        // Refresh the games shown on the dashboard
      setNewGameName('');        // Clear the input field
    } else {
      const err = await putRes.text();
      console.error('Creation failed:', err);  // Log any errors
    }
  };


  // Delete a game by its ID and update the backend accordingly
  const deleteGame = async (id) => {
    // Retrieve the user's token and email
    const token = localStorage.getItem(AUTH.TOKEN_KEY);
    const ownerEmail = localStorage.getItem('email');

    // Fetch all games from the backend
    const res = await fetch('http://localhost:5005/admin/games', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const allGames = await res.json();

    // Filter games that belong to the current user
    const myGames = allGames.games.filter(game => game.owner === ownerEmail);

    // Ensure each game keeps any locally stored questions
    const gamesWithPreservedQuestions = myGames.map(game => {
      const local = JSON.parse(localStorage.getItem(`questions-${game.id}`) || '[]');
      return {
        ...game,
        questions: local.length > 0 ? local : game.questions || [],
      };
    });

    // Filter out the game to be deleted
    const updatedGames = gamesWithPreservedQuestions.filter(game => game.id !== id);

    // Send the updated game list to the backend
    const putRes = await fetch('http://localhost:5005/admin/games', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ games: updatedGames }),
    });

    // If successful, update frontend and remove local storage entry
    if (putRes.ok) {
      setGames(updatedGames);                         // Update state to reflect deletion
      localStorage.removeItem(`questions-${id}`);     // Clean up any locally cached questions
    } else {
      const err = await putRes.text();
      console.error('Deletion failed:', err);         // Log error if PUT fails
    }
  };


  return (
    <><Box sx={{ p: 4 }}>
      {/* Page title */}
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      {/* New game creation form */}
      <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
        <TextField
          label="New game name"
          value={newGameName}
          onChange={(e) => setNewGameName(e.target.value)} />
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
                  sx={{ height: 80, mt: 1, borderRadius: 1 }} />
              )}
            </CardContent>
            <Button
              size="small"
              color="error"
              onClick={(e) => {
                e.stopPropagation();
                setGameToDelete(game);
                setDeleteDialogOpen(true);
              }}
            >
              Delete Game
            </Button>
          </Card>
        ))}
      </Box>
    </Box>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Game</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the game "{gameToDelete?.name}"?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            color="error"
            onClick={async () => {
              await deleteGame(gameToDelete.id);
              setDeleteDialogOpen(false);
              setGameToDelete(null);
            }}
          >
            Confirm Delete
          </Button>
        </DialogActions>
      </Dialog></>
  );
};

export default Dashboard;
