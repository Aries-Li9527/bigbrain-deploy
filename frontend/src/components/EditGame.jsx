// Import required modules (UI components, utilities, etc.)
import { Container } from '@mui/material';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Modal from '@mui/material/Modal';

import AUTH from '../Constant';
import { fetchAllGames } from '../DataProvider'; // Function to fetch all games

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
  // 初始加载游戏数据（通过 game_id 匹配）
  // Load game data on mount
  // -----------------------------------------------
  useEffect(() => {
    fetchAllGames().then((data) => {
      const foundGame = data.games.find(game => String(game.id) === game_id);
      if (foundGame) {
        setGame(foundGame);
        setQuestions(foundGame.questions);
      }
    });
  }, [game, questions]);

  // ---------------------------------------------------
  // 保存当前游戏基本信息（标题和缩略图）
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
        res.json(); 
        setName("");
        setThumbnail("");
      });
    });
  };

  

  //Component JSX layout
  return (
    <Container maxWidth="lg">
      {/* Edit form section */}
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        <Typography variant="h2" gutterBottom>
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
            flexDirection: 'column',
            gap: 1.5,
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
          {/* ID - Display question ID */}
          <Typography variant="subtitle2" color="text.secondary">
            Question ID: {q.id}
          </Typography>

          {/* Display question content */}
          <Typography variant="body1" fontWeight={500}>
            Question: {q.question || <i style={{ color: '#aaa' }}>No question content</i>}
          </Typography>
        </Box>
      ))}
    </Container>
  );
};
export default EditGame;