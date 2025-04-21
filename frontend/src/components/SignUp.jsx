// Register Component 
import { useState } from 'react';
import { Container } from '@mui/material';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useNavigate } from 'react-router-dom';
import AUTH from '../Constant';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

const SignUp = (props) => {
  // State to store form inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  // Register function to handle registration request
  const register = async () => {
    // Frontend validation before sending request
    if (!name) return handleError('Please enter your name.');
    if (!email || !email.includes('@')) return handleError('Please enter a valid email.');
    if (!password) return handleError('Please enter your password.');
    if (password !== confirmPassword) return handleError('Passwords do not match.');
    // Send POST request to backend for registration
    const url = 'http://localhost:5005/admin/auth/register'
    const res = await fetch(url, {
      method: 'post',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        name
      }),
    })
    const data = await res.json()
    // If success, store token & navigate
    if (data.token) {
      props.setToken(data.token)
      // Save token to localStorage for future auth
      localStorage.setItem(AUTH.TOKEN_KEY, data.token);
      localStorage.setItem(AUTH.USER_KEY, email);
      navigate('/dashboard');
    } else {
      handleError(data.error || "Register failed");
    }
  }

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

      {/* Container for the registration form */}
      <Box
        component="form"
        onSubmit={(e) => {
          e.preventDefault();
          register();
        }}
        sx={{ display: "flex", flexDirection: "column" }}
      >
        <Typography variant="h1" gutterBottom>
          Register form
        </Typography>

        {/* Name input */}
        <TextField
          required
          id="name-input"
          label="name"
          onChange={(e) => setName(e.target.value)}
        />
        <br>
        </br>

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
          type="password"
          id="password-input"
          label="password"
          onChange={(e) => setPassword(e.target.value)}
        />
        <br>
        </br>

        {/* confirm password input */}
        <TextField
          required
          type="password"
          id="confirm-password-input"
          label="confirm password"
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <br>
        </br>

        {/* Submit button */}
        <Button variant="contained" type="submit">submit</Button>
      </Box>
    </Container>
  )
}

export default SignUp;