import { useState } from 'react';
import Button from '@mui/material/Button';
import SessionPopup from './SessionPopup'; // Component for showing session info and link
import AUTH from '../Constant';
import { useNavigate } from 'react-router-dom';

const StartSession = ({ gameId, refresh }) => { 
  const [popupOpen, setPopupOpen] = useState(false);
  const [sid, setSid] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleStart = async () => {
    if (loading) return;
    setLoading(true);

    const token = localStorage.getItem(AUTH.TOKEN_KEY);

    const res = await fetch(`http://localhost:5005/admin/game/${gameId}/mutate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ mutationType: 'start' })
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok && (data.sessionId || data.data?.sessionId)) {
      const sessionId = data.sessionId || data.data?.sessionId;
      setSid(sessionId);
      setPopupOpen(true);
    } else {
      alert(data.error || 'Failed to start session');
    }
  };

  return (
    <>
      <Button
        size="small"
        onClick={handleStart}
        disabled={loading}
      >
        {loading ? 'Starting...' : 'Start Game'}
      </Button>

      <SessionPopup
        open={popupOpen}
        sessionId={sid}
        gameId={gameId}
        onClose={(action) => {
          setPopupOpen(false);
          refresh?.(); 
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
