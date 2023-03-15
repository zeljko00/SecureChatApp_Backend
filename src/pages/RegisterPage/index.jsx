import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
import "./RegisterPage.css";
import { CustomTextField } from "../../styled-mui/inputs";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import InputAdornment from "@mui/material/InputAdornment";
import AccountCircle from "@mui/icons-material/AccountCircle";
import KeyIcon from "@mui/icons-material/Key";
import profileIcon from "../../assets/images/profile.png";
import { register } from "../../services/user.service";
export const RegisterPage = () => {
  const [username, setUsername] = useState("user");
  const [usernameError, setUsernameError] = useState("");
  const [password, setPassword] = useState("password");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("password");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const user = "user";
  const token = "token";
  const handleChangeUsername = (event) => {
    if (event.target.value.length <= 5 && event.target.value.length > 0)
      setUsernameError("At least 6 characters!");
    else {
      setUsernameError("");
    }
    setUsername(event.target.value);
  };
  const handleOpenSnackbar = () => {
    setOpenSnackbar(true);
  };
  const handleCloseSnackbar = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setOpenSnackbar(false);
  };
  const signup = () => {
    if (
      username.length > 5 &&
      password.length > 7 &&
      password === confirmPassword
    ) {
      register(username, password)
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
    }
  };
  return (
    <div id="register-page">
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
      <img src={profileIcon} alt="chat" id="profile-icon"></img>
      <CustomTextField
        label="Username"
        variant="outlined"
        margin="normal"
        value={username}
        autoComplete={false}
        onChange={(event) => handleChangeUsername(event)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <AccountCircle color="primary" />
            </InputAdornment>
          ),
        }}
        sx={{
          input: { color: "white" },
          label: { color: "white" },
          fieldset: { borderColor: "white" },
        }}
      ></CustomTextField>
      <div className="error-label">{usernameError}</div>
      <CustomTextField
        label="Password"
        type="password"
        autoComplete="current-password"
        variant="outlined"
        margin="normal"
        value={password}
        onChange={(event) => {
          if (event.target.value.length < 8 && event.target.value.length > 0)
            setPasswordError("At least 8 characters!");
          else setPasswordError("");
          setPassword(event.target.value);
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <KeyIcon color="primary" />
            </InputAdornment>
          ),
        }}
        sx={{
          input: { color: "white" },
          label: { color: "white" },
          fieldset: { borderColor: "white" },
        }}
      />
      <div className="error-label">{passwordError}</div>
      <CustomTextField
        label="Confirm password"
        type="password"
        autoComplete="current-password"
        variant="outlined"
        margin="normal"
        value={confirmPassword}
        onChange={(event) => {
          if (event.target.value !== password)
            setConfirmPasswordError("Passwords don't match!");
          else {
            setConfirmPasswordError("");
          }
          setConfirmPassword(event.target.value);
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <KeyIcon color="primary" />
            </InputAdornment>
          ),
        }}
        sx={{
          input: { color: "white" },
          label: { color: "white" },
          fieldset: { borderColor: "white" },
        }}
      />
      <div className="error-label">{confirmPasswordError}</div>
      <Button
        variant="contained"
        id="login-btn"
        sx={{ textTransform: "none" }}
        onClick={signup}
      >
        Submit
      </Button>
    </div>
  );
};
export default RegisterPage;
