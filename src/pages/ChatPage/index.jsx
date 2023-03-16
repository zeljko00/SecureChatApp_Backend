/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { onlineUsers, assignAvatar, logout } from "../../services/user.service";
import { encode } from "../../services/steg.service/encode";
import { decode } from "../../services/steg.service/decode";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import IconButton from "@mui/material/IconButton";
import PhotoCamera from "@mui/icons-material/PhotoCamera";
import Badge from "@mui/material/Badge";
import Fab from "@mui/material/Fab";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";
import { styled } from "@mui/material/styles";
import "./ChatPage.css";
import { Global } from "@emotion/react";
import CssBaseline from "@mui/material/CssBaseline";
import { grey } from "@mui/material/colors";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import SwipeableDrawer from "@mui/material/SwipeableDrawer";
export const ChatPage = () => {
  const user = "user";
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const drawerBleeding = 50;
  const [image, setImage] = useState(null);
  const [hiddenMsg, setHiddenMsg] = useState(null);
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();

  const StyledBox = styled(Box)(({ theme }) => ({
    backgroundColor: theme.palette.mode === "light" ? "#fff" : grey[800],
  }));
  const StyledBadge = styled(Badge)(({ theme }) => ({
    "& .MuiBadge-badge": {
      backgroundColor: "#44b700",
      color: "#44b700",
      boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
      "&::after": {
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        borderRadius: "50%",
        animation: "ripple 1.2s infinite ease-in-out",
        border: "1px solid currentColor",
        content: '""',
      },
    },
    "@keyframes ripple": {
      "0%": {
        transform: "scale(.8)",
        opacity: 1,
      },
      "100%": {
        transform: "scale(2.4)",
        opacity: 0,
      },
    },
  }));
  const Puller = styled(Box)(({ theme }) => ({
    width: 30,
    height: 6,
    backgroundColor: "rgba(255,255,255,.7)",
    borderRadius: 3,
    position: "absolute",
    top: 8,
    left: "calc(50% - 15px)",
  }));
  const readURL = (input) => {
    console.log(input.target.files);
    const reader = new FileReader();
    reader.onload = (e) => {
      console.log(e.target.result);
      setImage(e.target.result);
    };
    reader.readAsDataURL(input.target.files[0]);
  };
  const hideMsg = () => {
    const encoded = encode("secret", image);
    console.log(encoded);
    setHiddenMsg(encoded);
  };
  const revealMsg = () => {
    const msg = decode(hiddenMsg);
    console.log(msg);
    setMsg(msg);
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
  const logoutUser = () => {
    const user = JSON.parse(sessionStorage.getItem("user"));
    if (user) {
      logout(user.username, user.password).then(() => sessionStorage.clear());

      navigate("/SecureChat");
    }
  };
  const [open, setOpen] = React.useState(false);

  const toggleDrawer = (newOpen) => () => {
    setOpen(newOpen);
  };
  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem("user"));
    if (!user) {
      console.log("triggered");
      navigate("/SecureChat");
    } else {
      onlineUsers()
        .catch()
        .then((response) => {
          setUsers(assignAvatar(response.data, user.username));
        });
    }
  }, [navigate]);
  return (
    <div className="chat-page">
      <CssBaseline />
      <Global
        styles={{
          ".MuiDrawer-root > .MuiPaper-root": {
            height: `calc(50% - ${drawerBleeding}px)`,
            overflow: "visible",
          },
        }}
      />
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
      <IconButton color="primary" aria-label="upload picture" component="label">
        <input
          hidden
          accept="image/*"
          type="file"
          onChange={(event) => readURL(event)}
        />
        <PhotoCamera />
      </IconButton>

      {image && <img src={image} alt="source"></img>}
      <button onClick={hideMsg}>Hide</button>
      {hiddenMsg && <img src={hiddenMsg} alt="hidden"></img>}
      <button onClick={revealMsg}>Reveal</button>
      <p>{msg}</p>
      <Fab
        color="error"
        aria-label="add"
        size="small"
        sx={{
          position: "fixed",
          bottom: 5,
          right: 20,
          zIndex: 1201,
        }}
        onClick={logoutUser}
      >
        {" "}
        <PowerSettingsNewIcon />
      </Fab>
      <Box sx={{ textAlign: "center", pt: 1 }}>
        <Button onClick={toggleDrawer(true)}>Open</Button>
      </Box>
      <SwipeableDrawer
        anchor="bottom"
        open={open}
        onClose={toggleDrawer(false)}
        onOpen={toggleDrawer(true)}
        swipeAreaWidth={drawerBleeding}
        disableSwipeToOpen={false}
        ModalProps={{
          keepMounted: true,
        }}
        PaperProps={{
          sx: {
            div: {
              backgroundColor: "#121212",
              color: "rgba(255,255,255,.7)",
              div: {
                backgroundColor: "rgba(255,255,255,.7)",
              },
            },
          },
        }}
      >
        <StyledBox
          sx={{
            position: "absolute",
            top: -drawerBleeding,
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8,
            visibility: "visible",
            right: 0,
            left: 0,
          }}
        >
          <Puller />
          <Typography sx={{ p: 2, color: "rgba(255,255,255,.7)" }}>
            {users.length + " online users"}
          </Typography>
        </StyledBox>
        <StyledBox
          sx={{
            px: 2,
            pb: 2,
            height: "100%",
            overflow: "auto",
          }}
        >
          <div className="online-users">
            {users.map((user) => {
              return (
                <button
                  className={
                    selectedUser && selectedUser.user === user.user
                      ? "avatar-button glow"
                      : "avatar-button"
                  }
                  onClick={() => setSelectedUser(user)}
                >
                  <div key={user.user} className="user-label">
                    <StyledBadge
                      overlap="circular"
                      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                      variant="dot"
                    >
                      <Avatar
                        src={user.avatar}
                        className="avatar-img"
                        alt="avatar"
                        sx={{ width: 65, height: 65, bgcolor: "black" }}
                      ></Avatar>
                    </StyledBadge>

                    <div className="username">{user.user}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </StyledBox>
      </SwipeableDrawer>
    </div>
  );
};
export default ChatPage;
