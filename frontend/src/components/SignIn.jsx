import { useState } from 'react';
import AUTH from '../Constant';
import { Container } from '@mui/material';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useNavigate } from 'react-router-dom';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

const SignIn = (props) => {
  // States for user input and error handling
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Login handler
  const login = async () => {

    setLoading(true);
    try {
      const url = 'http://localhost:5005/admin/auth/login';
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok || !data.token) {
        handleError(data.error || 'Login failed.');
        return;
      }

      props?.setToken?.(data.token);
      localStorage.setItem(AUTH.TOKEN_KEY, data.token);
      localStorage.setItem(AUTH.USER_KEY, email);
      navigate('/dashboard');

    } catch (_) {
      setLoading(false);
      handleError('Network error. Please check your connection.');
    }
  };

  // Display error via Snackbar
  const handleError = (message) => {
    setError(message);
    setOpen(true);
  };

  // Close Snackbar
  const handleClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setOpen(false);
  };

  return (
    <Container maxWidth="lg">
      {/* Error Snackbar */}
      <Snackbar
        open={open}
        autoHideDuration={4000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ zIndex: (theme) => theme.zIndex.snackbar + 10 }}
      >
        <Alert
          onClose={handleClose}
          severity="error"
          variant="filled"
          sx={{
            width: '100%',
            fontSize: '1.5rem',
            padding: '1.5rem',
            fontWeight: 'bold',
            borderRadius: '8px'
          }}
        >
          {error}
        </Alert>
      </Snackbar>

      {/* Login Form */}
      <Box
        component="form"
        onSubmit={(e) => {
          e.preventDefault();
          login();
        }}
        sx={{ display: "flex", flexDirection: "column", gap: 2 }}
      >
        <Typography variant="h3" gutterBottom>
          Sign In
        </Typography>

        {/* Email input */}
        <TextField
          required
          id="email-input"
          label="Email"
          type="email"
          autoComplete="email"
          aria-label="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* Password input */}
        <TextField
          required
          id="password-input"
          label="Password"
          type="password"
          autoComplete="current-password"
          aria-label="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {/* Submit button */}
        <Button
          variant="contained"
          type="submit"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Submit'}
        </Button>
      </Box>
    </Container>
  );
};

export default SignIn;
