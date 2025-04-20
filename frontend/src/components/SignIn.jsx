import { useState } from 'react';
import {
  Container, Box, TextField, Button,
  Typography, Snackbar, Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AUTH from '../Constant';

const SignIn = (props) => {
  // States for user input and error handling
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  // Login handler
  const login = async () => {
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

      if (!res.ok) {
        handleError(data.error || 'Login failed.');
        return;
      }

      if (data.token) {
        props?.setToken?.(data.token);
        localStorage.setItem(AUTH.TOKEN_KEY, data.token);
        localStorage.setItem('email', email);
        navigate('/dashboard');
      } else {
        handleError(data.error || 'Login failed.');
      }
    } catch (_) {
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
        sx={{ display: "flex", flexDirection: "column" }}
      >
        <Typography variant="h1" gutterBottom>
          Sign In
        </Typography>

        {/* Email input */}
        <TextField
          required
          id="email-input"
          label="Email"
          onChange={(e) => setEmail(e.target.value)}
        />
        <br />

        {/* Password input */}
        <TextField
          required
          id="password-input"
          label="Password"
          type="password"
          onChange={(e) => setPassword(e.target.value)}
        />
        <br />

        {/* Submit button */}
        <Button variant="contained" type="submit">
          Submit
        </Button>
      </Box>
    </Container>
  );
};

export default SignIn;
