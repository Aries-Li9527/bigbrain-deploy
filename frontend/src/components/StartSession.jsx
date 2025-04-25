import { useState } from 'react';
import Button from '@mui/material/Button';
import SessionPopup from './SessionPopup'; // Component to show session info and join link
import AUTH from '../Constant';
import { useNavigate } from 'react-router-dom';

// StartSession component is responsible for starting a game session
// It checks if a session can be started, sends a request to start it,
// and displays the session information in a popup if successful.
const StartSession = ({ gameId, refresh }) => {
  const [popupOpen, setPopupOpen] = useState(false); // Controls the visibility of the session popup
  const [sid, setSid] = useState(null);              // Stores the session ID returned from backend
  const [loading, setLoading] = useState(false);     // Prevents multiple clicks while loading
  const navigate = useNavigate();                    // Used for navigation after session starts

  // Handles the start session logic
  const handleStart = async () => {
    if (loading) return; // Prevent double click during request
    setLoading(true);

    const token = localStorage.getItem(AUTH.TOKEN_KEY); // Get the auth token from localStorage

    // Send request to start a game session
    const res = await fetch(`http://localhost:5005/admin/game/${gameId}/mutate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ mutationType: 'start' }) // Backend expects mutationType: 'start' to begin a session
    });

    const data = await res.json();
    setLoading(false);

    // If successful, show popup with session ID
    if (res.ok && (data.sessionId || data.data?.sessionId)) {
      const sessionId = data.sessionId || data.data?.sessionId;
      setSid(sessionId);
      setPopupOpen(true);
    } else {
      alert(data.error || 'Failed to start session'); // Show error if session couldn't be started
    }
  };

  return (
    <>
      {/* Button to start the game session */}
      <Button
        size="small"
        onClick={handleStart}
        disabled={loading}
      >
        {loading ? 'Starting...' : 'Start Game'}
      </Button>

      {/* Session popup shows session ID and links after successful start */}
      <SessionPopup
        open={popupOpen}
        sessionId={sid}
        gameId={gameId}
        onClose={(action) => {
          setPopupOpen(false);
          refresh?.(); // Refresh parent component's game list if provided
          
          // Navigate based on user's choice in popup
          if (action === 'dashboard') {
            navigate('/dashboard');
          } else if (sid) {
            navigate(`/session/${sid}`);
          }
        }}
      />
    </>
  );
};

export default StartSession;
