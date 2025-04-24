import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box
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
    } catch (_) {
      alert('Failed to copy link.');
    }
  };

  // Navigate to the session page
  const handleGo = () => {
    window.location.href = `/session/${sessionId}`;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs" // 小屏表现更好
    >
      <DialogTitle>Session Started</DialogTitle>
      <DialogContent>
        <Typography gutterBottom>
          Session ID: <b>{sessionId}</b>
        </Typography>
        <Typography gutterBottom>
          Join link: <br />
          <Typography
            component="span"
            sx={{
              wordBreak: 'break-word',
              color: '#1976d2'
            }}
          >
            {fullUrl}
          </Typography>

        </Typography>
      </DialogContent>

      <DialogActions
        sx={{
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 1,
          px: 3,
          pb: 2,
          alignItems: { xs: 'stretch', sm: 'center' }
        }}
      >
        {/* Copy link button */}
        <Button onClick={handleCopy} fullWidth={true}>Copy Link</Button>

        {/* Navigate to session page */}
        <Button
          onClick={handleGo}
          variant="contained"
          fullWidth={true}
        >
          Go to Session
        </Button>

        {/* Close the popup and trigger redirection if needed */}
        <Button
          onClick={() => onClose(true)}
          color="secondary"
          fullWidth={true}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SessionPopup;
