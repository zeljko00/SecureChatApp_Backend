import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";
import { CustomTextField } from "../../styled-mui/inputs";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import InputAdornment from "@mui/material/InputAdornment";
import AccountCircle from "@mui/icons-material/AccountCircle";
import KeyIcon from "@mui/icons-material/Key";
import chatIcon from "../../assets/images/chat-icon.png";
import { login } from "../../services/user.service";
export const LoginPage = () => {
  const [username, setUsername] = useState("user");
  const [password, setPassword] = useState("password");
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const navigate = useNavigate();
  const user = "user";
  const token = "token";

  console.log(tokenize("porukaaaaa", 4));

  const handleOpenSnackbar = () => {
    setOpenSnackbar(true);
  };
  const handleCloseSnackbar = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setOpenSnackbar(false);
  };

  const signIn = () => {
    login(username, password)
      .catch((error) => {
        error.request && error.request.status === 401
          ? setSnackbarMessage("Invalid credentials!")
          : setSnackbarMessage("Service unavailable!");
        handleOpenSnackbar();
      })
      .then((response) => {
        sessionStorage.setItem(
          user,
          JSON.stringify({ username: username, password: password })
        );
        sessionStorage.setItem(token, response.data);
        setSnackbarMessage("Success!");
        handleOpenSnackbar();
      });
  };
  const signUp = () => {
    navigate("/SecureChat/register");
  };

  return (
    <div id="login-page">
      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
      >
        <MuiAlert
          onClose={handleCloseSnackbar}
          severity="error"
          sx={{ width: "100%" }}
          variant="filled"
          elevation={6}
        >
          {snackbarMessage}
        </MuiAlert>
      </Snackbar>
      <img src={chatIcon} alt="chat" id="chat-icon"></img>
      <CustomTextField
        label="Username"
        variant="outlined"
        margin="normal"
        value={username}
        onChange={(event) => {
          setUsername(event.target.value);
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <AccountCircle color="primary" />
            </InputAdornment>
          ),
        }}
      ></CustomTextField>
      <br></br>
      <CustomTextField
        label="Password"
        type="password"
        autoComplete="current-password"
        variant="outlined"
        margin="normal"
        value={password}
        onChange={(event) => {
          setPassword(event.target.value);
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <KeyIcon color="primary" />
            </InputAdornment>
          ),
        }}
      />
      <Button
        variant="contained"
        id="login-btn"
        onClick={signIn}
        sx={{ textTransform: "none" }}
      >
        Sign in
      </Button>
      <Button
        variant="text"
        id="register-btn"
        onClick={signUp}
        sx={{ textTransform: "none" }}
      >
        Create account
      </Button>
    </div>
  );
};
export default LoginPage;

const tokenize = (msg, n) => {
  const tokenLen = Math.floor(msg.length / n);
  const x = msg.length % n;
  const regex1 = new RegExp(".{" + tokenLen + "}", "g");
  const regex2 = new RegExp(".{" + (tokenLen + 1) + "}", "g");
  const arr1 = msg.slice(x * (tokenLen + 1), msg.length).match(regex1);
  if (x !== 0) {
    return msg.match(regex2).slice(0, x).concat(arr1);
  } else return arr1;
};
