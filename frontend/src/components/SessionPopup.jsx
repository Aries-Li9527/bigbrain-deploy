import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography
} from '@mui/material';

// SessionPopup component displays a dialog with session ID, join link, and options to copy or navigate
const SessionPopup = ({ open, sessionId, onClose }) => {
  // Construct the full link to join the session
  const fullUrl = `${window.location.origin}/play/${sessionId}`;

  // Handle copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      alert('Link copied to clipboard!');
    } catch (err) {
      alert('Failed to copy link.');
    }
  };

  // Navigate to the session page
  const handleGo = () => {
    window.location.href = `/session/${sessionId}`;
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Session Started</DialogTitle>
      <DialogContent>
        <Typography gutterBottom>
          Session ID: <b>{sessionId}</b>
        </Typography>
        <Typography gutterBottom>
          Join link: <br />
          <span style={{ wordBreak: 'break-all' }}>{fullUrl}</span>
        </Typography>
      </DialogContent>
      <DialogActions>
        {/* Copy link button */}
        <Button onClick={handleCopy}>Copy Link</Button>
        {/* Navigate to session page */}
        <Button onClick={handleGo} variant="contained">Go to Session</Button>
        {/* Close the popup and trigger redirection if needed */}
        <Button onClick={() => onClose(true)}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default SessionPopup;
