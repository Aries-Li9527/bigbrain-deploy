import { useState } from 'react';
import Button from '@mui/material/Button';
import SessionPopup from './SessionPopup'; // Component for showing session info and link
import AUTH from '../Constant';
import { useNavigate } from 'react-router-dom';

const StartSession = ({ gameId }) => {
  // State to control popup visibility
  const [popupOpen, setPopupOpen] = useState(false);
  // State to store the created session ID
  const [sid, setSid] = useState(null);
  // React Router navigation hook
  const navigate = useNavigate();

  // Function to start a game session
  const handleStart = async () => {
    const token = localStorage.getItem(AUTH.TOKEN_KEY);

    const res = await fetch(`http://localhost:5005/admin/game/${gameId}/mutate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ mutationType: 'start' }) // Tell backend to start a session
    });

    const data = await res.json();
    if (res.ok) {
      const sessionId = data.sessionId || data.data?.sessionId; // Fallback if structure varies
      setSid(sessionId);         // Store session ID
      setPopupOpen(true);        // Open popup
    } else {
      alert(data.error || 'Failed to start session'); // Handle error
    }
  };

  return (
    <>
      {/* Button to trigger starting session */}
      <Button size="small" onClick={handleStart}>Start Game</Button>

      {/* Popup that shows the session ID and options */}
      <SessionPopup
        open={popupOpen}
        sessionId={sid}
        onClose={(redirect = true) => {
          setPopupOpen(false);                // Close the popup
          if (redirect && sid) {
            navigate(`/session/${sid}`);      // Navigate to the session page if allowed
          }
        }}
      />
    </>
  );
};

export default StartSession;
