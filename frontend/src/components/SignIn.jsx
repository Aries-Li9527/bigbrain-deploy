// SignIn Component 
import { useState } from 'react';
import { Container } from '@mui/material';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useNavigate } from 'react-router-dom';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import AUTH from '../Constant';

const SignIn = (props) => {
  // States to store user input for email, password
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  // Login function to handle registration request
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
        props.setToken(data.token);
        localStorage.setItem(AUTH.TOKEN_KEY, data.token);
        navigate('/');
      }
    } catch (_) {
      handleError('Network error. Please check your connection.');
    }
  };

  // Handle error: set error message and open the Snackbar
  const handleError = (message) => {
    setError(message);
    setOpen(true);
  };

  // Close the Snackbar
  const handleClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setOpen(false);
  };

  return (
    <Container maxWidth="lg">

      {/* Snackbar component for displaying error messages */}
      <Snackbar
        open={open}
        autoHideDuration={4000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ zIndex: (theme) => theme.zIndex.snackbar + 10 }}
      >
        {/* Alert component showing the actual error text */}
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

      <Box
        component="form"
        onSubmit={(e) => {
          e.preventDefault();
          login();
        }}
        sx={{ display: "flex", flexDirection: "column" }}
      >

        <Typography variant="h1" gutterBottom>
          Login form
        </Typography>

        {/* Email input */}
        <TextField
          required
          id="email-input"
          label="email"
          onChange={(e) => setEmail(e.target.value)}
        />
        <br>
        </br>

        {/* Password input */}
        <TextField
          required
          id="password-input"
          label="password"
          onChange={(e) => setPassword(e.target.value)}
        />
        <br>
        </br>

        {/* Submit button */}
        <Button variant="contained" type="submit">submit</Button>
      </Box>
    </Container>
  );
};

export default SignIn;
