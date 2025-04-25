import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import TextField from '@mui/material/TextField';
import { fetchAllGames } from '../DataProvider';
import AUTH from '../Constant';
import CardShape from './Card';

// --------------------------
// Style for the modal popup
// --------------------------
const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90vw',
  maxWidth: 400,
  bgcolor: 'background.paper',
  border: '1px solid #ccc',
  borderRadius: 2,
  boxShadow: 24,
  p: 4,
};


const Dashboard = () => {
  // -------------------------------
  // Modal open/close control
  // -------------------------------
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setTitle('');
    setUploadFile(null);
    setUserTypedTitle(false);
    setIsUploadLocked(false);
  };


  // -------------------------------
  // Title input for new game
  // -------------------------------
  const [title, setTitle] = useState('');

  // -------------------------------
  // List of all games for the current user
  // -------------------------------
  const [games, setGames] = useState([]);
  const [userTypedTitle, setUserTypedTitle] = useState(false);
  const [isUploadLocked, setIsUploadLocked] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);


  // -------------------------------------------------------
  // Post new game to backend, based on current game list
  // -------------------------------------------------------
  const postNewGame = () => {
    const ownerEmail = localStorage.getItem(AUTH.USER_KEY);
    const userToken = localStorage.getItem(AUTH.TOKEN_KEY);

    // If the user uploads a json file, follow the file upload path
    if (uploadFile) {
      const reader = new FileReader();

      // When the file is read
      reader.onload = async (event) => {
        try {
          // Parse the uploaded file content as JSON
          const content = JSON.parse(event.target.result);
          if (!userTypedTitle) {
            setTitle(content.name || '');
            setIsUploadLocked(true);
          }


          // Basic validation: check if required fields exist
          if (!content.name || !Array.isArray(content.questions)) {
            alert('Invalid JSON structure');
            return;
          }

          // Add required fields: owner and id
          content.owner = ownerEmail;
          content.id = Math.floor(Math.random() * 100000000);

          // Ensure thumbnail field exists (default to empty string)
          if (!content.thumbnail) content.thumbnail = '';

          // Fetch existing games from backend
          const oldGame = await fetchAllGames().then(d => d.games || []);

          // Add the new game to the existing list
          const updatedGames = [...oldGame, content];

          // Upload the updated game list to the backend via PUT request
          await fetch('http://localhost:5005/admin/games', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${userToken}`,
            },
            body: JSON.stringify({ games: updatedGames }),
          });

          // Notify user and reset UI state
          alert('Game uploaded successfully!');
          handleClose();            // Close modal
          setTitle('');             // Clear input
          setUserTypedTitle(false);
          setUploadFile(null);      // Reset file state
          setIsUploadLocked(false);
          getGames();               // Refresh game list

        } catch (_) {
          // Show error if JSON parsing fails
          alert('Error parsing uploaded JSON');
        }
      };

      // Start reading the file as text
      reader.readAsText(uploadFile);
      return;
    }


    fetchAllGames().then((data) => {
      const oldGame = Array.isArray(data.games) ? data.games : [];

      const newGame = {
        id: Math.floor(Math.random() * 100000000),
        owner: ownerEmail,
        name: title,
        thumbnail: '',
        questions: [],
      };

      const updatedGames = [...oldGame, newGame];

      return fetch('http://localhost:5005/admin/games', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ games: updatedGames }),
      });
    }).then(() => {
      window.alert("Game created successfully!");
      handleClose();
      setTitle('');
      setUserTypedTitle(false);
      getGames();
    });
  };

  const deleteGame = (gameId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this game?");
    if (!confirmDelete) return;

    const userToken = localStorage.getItem(AUTH.TOKEN_KEY);

    fetchAllGames().then((data) => {
      const updatedGames = data.games.filter(game => String(game.id) !== String(gameId));

      return fetch('http://localhost:5005/admin/games', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ games: updatedGames }),
      });
    }).then(res => {
      if (res.ok) {
        window.alert("Game deleted successfully.");
        getGames();  // Refresh UI
      } else {
        window.alert("Failed to delete the game.");
      }
    });
  };
  // -------------------------------------------------------
  // Load all games from backend when component is mounted
  // -------------------------------------------------------
  const getGames = () => {
    fetchAllGames().then((data) => {
      setGames(data.games);
    });
  };

  // getGames
  useEffect(() => {
    getGames();
  }, []);

  return (
    <Box
      sx={{
        maxWidth: '1200px',
        mx: 'auto',
        px: { xs: 2, sm: 3 },
        py: { xs: 2, sm: 3 },
      }}
    >
      {/* Create Button Section */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-start',
          mb: 3,
        }}
      >
        <Button variant="contained" onClick={handleOpen}>
          CREATE A NEW GAME
        </Button>
      </Box>

      {/*Render Game Cards */}
      <CardShape games={games} onDelete={deleteGame} refresh={getGames} />

      {/* Create Game Modal */}
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          {/*  Modal Title */}
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Create a new game here!
          </Typography>

          <br />

          <TextField
            required
            fullWidth
            id="game-title-input"
            label="Enter game title"
            value={title}
            disabled={isUploadLocked}
            onChange={(e) => {
              setTitle(e.target.value);
              setUserTypedTitle(true);
            }}
          />

          <br /><br />

          {/* Buttons (Cancel + Submit) */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            {/*  Cancel */}
            <Button
              variant="outlined"
              onClick={handleClose}
            >
              Cancel
            </Button>

            <label htmlFor="upload-json">
              <input
                id="upload-json"
                type="file"
                accept=".json"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setUploadFile(file);

                    const reader = new FileReader();
                    reader.onload = (event) => {
                      try {
                        const content = JSON.parse(event.target.result);
                        if (content.name && !userTypedTitle) {
                          setTitle(content.name);
                          setIsUploadLocked(true);
                        }
                      } catch {
                        alert('Invalid JSON file');
                      }
                    };
                    reader.readAsText(file);
                  }
                }}
              />
              <Button variant="outlined" component="span">
                Choose File
              </Button>

            </label>


            {/* Submit */}
            <Button
              variant="contained"
              onClick={postNewGame}
              disabled={!title.trim() && !uploadFile}
            >
              Submit
            </Button>
          </Box>
        </Box>
      </Modal>

    </Box>
  );
};

export default Dashboard;
