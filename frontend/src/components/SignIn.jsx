// SignIn Component 登录组件 
import { useState } from 'react';
import { Container } from '@mui/material';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

const SignIn = (props) => {
  // 三个状态分别用于收集用户输入的邮箱、密码、用户名
  // States to store user input for email, password, and name
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  // 登录逻辑：发送 POST 请求，获取 token 并存入 localStorage
  // Login function: send POST request, receive token, store in localStorage
  const login = async () => {
    const url = 'http://localhost:5005/admin/auth/login'
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
      console.log("login!")
      props.setToken(data.token)
      // Save token to localStorage for future auth
      localStorage.setItem('token', data.token);
    }
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        <Typography variant="h1" gutterBottom>
          Login form
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

        {/* Submit button */}
        <Button variant="contained" onClick={login}>submit</Button>
      </Box>
    </Container>
  );
};

export default SignIn;
