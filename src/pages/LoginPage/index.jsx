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
import { login } from "../../services/user.service";
export const LoginPage = () => {
  const [username, setUsername] = useState("user");
  const [password, setPassword] = useState("password");

  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const navigate = useNavigate();

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
        if (response !== undefined) {
          const userObj = { username, token: response.data };
          sessionStorage.setItem("token", response.data);
          document.getElementById("inpLock").checked = false;
          window.setTimeout(
            () =>
              navigate("/SecureChat/chatroom", {
                state: JSON.stringify({
                  user: userObj,
                }),
              }),
            1500
          );
        }
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
      <input id="inpLock" type="checkbox" defaultChecked />
      <label className="btn-lock" htmlFor="inpLock">
        <svg width="162" height="120" viewBox="0 0 36 40">
          <path
            className="lockb"
            d="M27 27C27 34.1797 21.1797 40 14 40C6.8203 40 1 34.1797 1 27C1 19.8203 6.8203 14 14 14C21.1797 14 27 19.8203 27 27ZM15.6298 26.5191C16.4544 25.9845 17 25.056 17 24C17 22.3431 15.6569 21 14 21C12.3431 21 11 22.3431 11 24C11 25.056 11.5456 25.9845 12.3702 26.5191L11 32H17L15.6298 26.5191Z"
          ></path>
          <path
            className="lock"
            d="M6 21V10C6 5.58172 9.58172 2 14 2V2C18.4183 2 22 5.58172 22 10V21"
          ></path>
          <path className="bling" d="M29 20L31 22"></path>
          <path className="bling" d="M31.5 15H34.5"></path>
          <path className="bling" d="M29 10L31 8"></path>
        </svg>
      </label>
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
