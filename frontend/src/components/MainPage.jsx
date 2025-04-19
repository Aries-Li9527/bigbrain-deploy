// MainPage 组件：根据是否登录展示欢迎信息
// MainPage component: displays welcome text if user is logged in
import { Box, Typography, Container } from "@mui/material";

const MainPage = (props) => {
  return (
    <Container maxWidth="md">
      <Box
        sx={{
          minHeight: "70vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          mt: 8,
        }}
      >
        <Typography variant="h3" gutterBottom>
          Welcome to Big Brain
        </Typography>

        <Typography variant="h5" color="text.secondary">
          {props.token === null 
            ? <>
              Please click the login button to log in. <br />
              New here? Feel free to register an account and join us!
            </>
            : <>You are already logged in — enjoy your stay!</>}
        </Typography>
      </Box>
    </Container>
  );
};

export default MainPage;