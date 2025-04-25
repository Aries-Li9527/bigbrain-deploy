// Import required modules (UI components, utilities, etc.)
import { Container } from '@mui/material';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useState, useEffect } from 'react';
import Modal from '@mui/material/Modal';
import { useNavigate, useParams } from 'react-router-dom';

import AUTH from '../Constant';
import { fetchAllGames } from '../DataProvider';
// Function to fetch all games

// --------------------------
// Modal style for popup
// --------------------------
const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

// --------------------------
// EditGame Component 
// --------------------------
const EditGame = () => {
  const navigate = useNavigate();
  const { game_id } = useParams();

  // -------------------------------------
  // State declarations
  // -------------------------------------
  const [name, setName] = useState("");             // Game title
  const [game, setGame] = useState(null);           // Current game object
  const [open, setOpen] = useState(false);          // Modal open/close state
  const [thumbnail, setThumbnail] = useState("");   // Thumbnail image URL
  const [questions, setQuestions] = useState([]);   // List of questions for the current game
  const [questionName, setQuestionName] = useState([]); // Title of the new question to be added

  // ----------------------------
  // open/close modal
  // ----------------------------
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  // -----------------------------------------------
  // Load game data on mount
  // -----------------------------------------------
  useEffect(() => {
    fetchAllGames().then((data) => {
      const foundGame = data.games.find(game => String(game.id) === game_id);
      if (foundGame) {
        setGame(foundGame);
        setQuestions(foundGame.questions);
        setName(foundGame.name);
        setThumbnail(foundGame.thumbnail);
      }
    });
  }, [game_id]);


  // ---------------------------------------------------
  // Save updated game name and thumbnail
  // ---------------------------------------------------
  const saveUpdateGame = () => {
    const userToken = localStorage.getItem(AUTH.TOKEN_KEY);
    fetchAllGames().then((data) => {
      const oldGame = data.games || [];

      // Update the current game information
      const updatedGames = oldGame.map(g =>
        String(g.id) === game_id ? { ...g, name, thumbnail } : g
      );

      // Send an update request
      return fetch('http://localhost:5005/admin/games', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ games: updatedGames }),
      }).then(res => {
        if (res.ok) {
          res.json();
          setName("");
          setThumbnail("");
          window.alert("Game updated successfully!");
          navigate('/dashboard');
        } else {
          window.alert("Failed to update the game.");
        }
      });
    });
  };

  // ---------------------------------------------------------------------
  // Add new question to current game based on modal input
  // ---------------------------------------------------------------------
  const postNewQuestion = () => {
    const userToken = localStorage.getItem(AUTH.TOKEN_KEY);

    fetchAllGames().then((data) => {
      const oldgame = Array.isArray(data.games) ? data.games : [];
      const foundGame = oldgame.find(game => String(game.id) === game_id);

      const newQuestion = {
        id: Math.floor(Math.random() * 100000000),
        question: questionName,
        duration: 0,
        point: 0,
        type: "",
        video: "",
        image: "",
        correctAnswers: [],
        optionAnswers: [],
      };

      const updateGame = {
        ...foundGame,
        questions: [...foundGame.questions, newQuestion]
      };

      const updatedGames = oldgame.map(g =>
        String(g.id) === game_id ? updateGame : g
      );

      return fetch('http://localhost:5005/admin/games', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ games: updatedGames }),
      }).then(res => res.json())
        .then(() => {
          setQuestionName("");
          handleClose();
          setQuestions(prev => [...prev, newQuestion]);
        });
    });
  };

  // ------------------------------------------------------------
  // Delete a question from current game and update to backend
  // ------------------------------------------------------------
  const handleDeleteQuestion = (questionId) => {

    const confirmed = window.confirm("Are you sure you want to delete this question?");
    if (!confirmed) return;

    const userToken = localStorage.getItem(AUTH.TOKEN_KEY);

    fetchAllGames().then((data) => {
      const allGames = Array.isArray(data.games) ? data.games : [];
      const targetGame = allGames.find((game) => String(game.id) === game_id);

      // Filter out the target problem
      const updatedQuestions = targetGame.questions.filter((q) => q.id !== questionId);

      // Build the updated game object
      const updatedGame = {
        ...targetGame,
        questions: updatedQuestions,
      };

      // Replace the updated game to the list of all games
      const updatedGames = allGames.map((g) =>
        String(g.id) === game_id ? updatedGame : g
      );

      // Send an update request
      return fetch('http://localhost:5005/admin/games', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ games: updatedGames }),
      }).then((res) => res.json())
        .then(() => {
          setQuestions(updatedQuestions);
        });
    });
  };

  const handleEditQuestion = (questionId) => {
    navigate(`/game/${game_id}/question/${questionId}`);
  };

  // -------------------------------
  // The loading status during the initial loading
  // -------------------------------
  if (!game) return <div>loading...</div>;

  //Component JSX layout
  return (
    <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 3 } }}>
      {/* Edit form section */}
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        <Typography variant="h5" gutterBottom>
          Edit your games :{game.name} here!
        </Typography>

        {/* Game title input */}
        <TextField
          id="game-name-input"
          label="Game name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <br />

        {/* Thumbnail URL input */}
        <TextField
          id="Thumbnail-URL"
          label="Thumbnail URL"
          value={thumbnail}
          onChange={(e) => setThumbnail(e.target.value)}
        />
        <br />

        {/*Submit changes */}
        <Button variant="contained" onClick={saveUpdateGame}>
          Save changes
        </Button>

        <Button variant="outlined" color="secondary" onClick={() => navigate('/dashboard')}>
          Cancel
        </Button>
      </Box>

      {/*new question---------------------------------------- */}
      <br />
      <br />
      <Button variant="contained" onClick={handleOpen}>Add a new question </Button>

      {/* Modal for creating new question */}
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Question title
          </Typography>
          <br />
          <TextField
            required
            id="question-title-input"
            label="question name"
            value={questionName}
            onChange={(e) => setQuestionName(e.target.value)}
          />
          <br /><br />
          <Button variant="contained" onClick={postNewQuestion}>Submit</Button>
        </Box>
      </Modal>
      <br /><br />

      {questions.map((q) => (
        <Box
          key={q.id}
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 3,
            border: '1px solid #e0e0e0',
            borderRadius: 3,
            mb: 3,
            bgcolor: 'white',
            boxShadow: '0px 2px 6px rgba(0,0,0,0.08)',
            transition: 'all 0.3s ease',
            '&:hover': {
              boxShadow: '0px 4px 12px rgba(0,0,0,0.12)',
              transform: 'translateY(-2px)',
            },
          }}
        >
          {/* The left information area */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Question ID: {q.id}
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              Question: {q.question || <i style={{ color: '#aaa' }}>No question content</i>}
            </Typography>

            {q.video && (
              <Typography variant="body2" color="text.secondary">
                <a href={q.video} target="_blank" rel="noopener noreferrer">YouTube Video</a>
              </Typography>
            )}

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
              <Button size="small" variant="outlined" onClick={() => handleEditQuestion(q.id)}>
                Edit
              </Button>
              <Button size="small" variant="outlined" color="error" onClick={() => handleDeleteQuestion(q.id)}>
                Delete
              </Button>
            </Box>
          </Box>

          {/* The picture area on the right */}
          {q.image && (
            <Box
              component="img"
              src={q.image}
              alt="Thumbnail"
              sx={{
                width: 90,
                height: 'auto',
                borderRadius: 2,
              }}
            />

          )}
        </Box>
      ))}

    </Container>
  );
};
export default EditGame;
