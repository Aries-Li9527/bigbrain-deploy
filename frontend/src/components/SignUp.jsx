// Register Component 注册组件 
import { useState } from 'react';
import { Container } from '@mui/material';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

const SignUp = (props) => {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const register = async () => {
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
    if (data.token) {
      props.setToken(data.token)
      // Save token to localStorage for future auth
      localStorage.setItem('token', data.token);
    }
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        <Typography variant="h1" gutterBottom>
          Register form
        </Typography>

        {/* Name input */}
        <TextField
          required
          id="outlined-required"
          label="name"
          onChange={(e) => setName(e.target.value)}
        />
        <br>
        </br>

        {/* Email input */}
        <TextField
          required
          id="outlined-required"
          label="email"
          onChange={(e) => setEmail(e.target.value)}
        />
        <br>
        </br>

        {/* Password input */}
        <TextField
          required
          id="outlined-required"
          label="password"
          onChange={(e) => setPassword(e.target.value)}
        />
        <br>
        </br>

        {/* confirm password input */}
        <TextField
          required
          id="outlined-required"
          label="confirm password"
        //onChange={(e) => setPassword(e.target.value)}
        />
        <br>
        </br>

        {/* Submit button */}
        <Button variant="contained" onClick={register}>submit</Button>
      </Box>
    </Container>
  )
}

export default SignUp;