import { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import CelebrationIcon from '@mui/icons-material/Celebration';

// List of rotating messages to show while waiting in the lobby
const loadingMessages = [
  'Waiting for the host to start...',
  'Get ready for some fun!',
  'Hang tight! The game will begin shortly.',
];

const Lobby = () => {
  // State to keep track of which loading message to show
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    // Set up an interval to change the loading message every 3 seconds
    const interval = setInterval(() => {
      // Move to the next message, looping back to the start if at the end
      setMessageIndex(prev => (prev + 1) % loadingMessages.length);
    }, 3000);

    // Clean up the interval when component unmounts
    return () => clearInterval(interval);
  }, []);

  return (
    <Box sx={{
      p: 6,                         // Padding
      display: 'flex',             // Flexbox layout
      flexDirection: 'column',     // Stack children vertically
      alignItems: 'center',        // Center children horizontally
      gap: 3,                       // Space between children
    }}>
      {/* Display a celebration icon to add visual excitement */}
      <CelebrationIcon sx={{ fontSize: 60, color: '#ff9800' }} />

      {/* Title of the screen */}
      <Typography variant="h4">Lobby</Typography>

      {/* Dynamically show a rotating message */}
      <Typography variant="h6" color="text.secondary">
        {loadingMessages[messageIndex]}
      </Typography>

      {/* Show a spinner to indicate loading */}
      <CircularProgress color="secondary" />
    </Box>
  );
};

export default Lobby;
