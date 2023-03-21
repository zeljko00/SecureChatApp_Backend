/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from "react";
import { over } from "stompjs";
import SocketJS from "sockjs-client";
import { useNavigate } from "react-router-dom";
import {
  onlineUsers,
  assignAvatar,
  assignAvatarToSingleUser,
} from "../../services/user.service";
import { encode } from "../../services/steg.service/encode";
import { decode } from "../../services/steg.service/decode";
import { tokenize } from "../../services/message.service";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import IconButton from "@mui/material/IconButton";
import PhotoCamera from "@mui/icons-material/PhotoCamera";
import Badge from "@mui/material/Badge";
import TextField from "@mui/material/TextField";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";
import "./ChatPage.css";
import { Global } from "@emotion/react";
import CssBaseline from "@mui/material/CssBaseline";
import { grey } from "@mui/material/colors";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import SwipeableDrawer from "@mui/material/SwipeableDrawer";
import avatar from "../../assets/images/avatar4.png";
import { styled } from "@mui/material/styles";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import MailIcon from "@mui/icons-material/Mail";
import LockIcon from "@mui/icons-material/Lock";
import SendIcon from "@mui/icons-material/Send";
import Fab from "@mui/material/Fab";
import PeopleIcon from "@mui/icons-material/People";
import { BASE_URL } from "../../services/axios.service";

let stompClient = null;

export const ChatPage = () => {
  const usernameItem = "user";
  const tokenItem = "token";
  const lastMsg = useRef(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const drawerBleeding = 50;
  const [image, setImage] = useState(null);
  const [user, setUser] = useState({
    username: "",
    joined: false,
    token: "",
  });
  const [message, setMessage] = useState("Message");
  const [render, setRender] = useState(false);
  const [msgRpws, setMsgRows] = useState(5);
  const [showSend, setShowSend] = useState(false);
  const [open, setOpen] = React.useState(false);

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
  };
  const revealMsg = (msg) => {
    const decoded = decode(msg);
    console.log(decoded);
  };

  const handleMessageChange = (event) => {
    if (event.target.value === "" || event.target.value === "Message")
      setShowSend(false);
    else setShowSend(true);
    setMessage(event.target.value);
  };
  const handleSendMessage = () => {
    console.log(selectedUser);
    const id =
      user.username +
      "#" +
      new Date().toTimeString().split(" ")[0] +
      "#" +
      Math.floor(Math.random() * 100000000);
    const tokens = tokenize(
      message,
      id,
      selectedUser ? selectedUser.user : "unknown"
    );
    console.log(tokens);

    selectedUser.messages.push({
      received: false,
      content: message,
    });
    setRender(!render);
    if (lastMsg) lastMsg.current.scrollIntoView();
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
    // const user = JSON.parse(sessionStorage.getItem("user"));
    // if (user) {
    //   // logout(user.username, user.password).then(() => sessionStorage.clear());
    //   // iskoristiti ws za logout
    //   navigate("/SecureChat");
    // }
  };

  const toggleDrawer = (newOpen) => () => {
    setOpen(newOpen);
  };
  const onConnectionEstablished = (userObj) => {
    //timeout after establishing connection required from unknown reasons
    setTimeout(() => {
      console.log("Connection established");
      stompClient.subscribe("/chatroom/users/active", newActiveUserNotify); // subscribing user to topic that stores active users' usernames
      stompClient.subscribe("/chatroom/users/left", userLeftNotify); // subscribing user to topic that stores active users' usernames
      stompClient.send(
        "/app/chatroom/join",
        {},
        JSON.stringify({ username: userObj.username, token: userObj.token })
      );
      stompClient.subscribe(
        "/user/" + userObj.username + "/inbox",
        messageReceived
      ); // subscribing user to topic that represents his chat inbox
      setUser({
        username: userObj.username,
        joined: true,
        token: userObj.token,
      });
    }, 1000);
  };
  const userLeftNotify = () => {};
  const newActiveUserNotify = (payload) => {
    const newUser = assignAvatarToSingleUser(payload.body, user.username);
    if (newUser !== null) {
      console.log(users);
      users.push(newUser);
      console.log(users);
      setUsers(users);
    } else console.log("this user joined!");
  };
  const messageReceived = (payload) => {
    console.log("New message: ");
    console.log(payload.body);
  };
  const onError = () => {
    setSnackbarMessage("Chat service unavailable!");
    setOpenSnackbar(true);
  };
  useEffect(() => {
    const username = sessionStorage.getItem(usernameItem);
    const token = sessionStorage.getItem(tokenItem);
    const userObj = { username, token, joined: user.joined };
    console.log(userObj);
    if (!user) {
      console.log("triggered");
      navigate("/SecureChat");
    } else {
      setUser(userObj);
      onlineUsers()
        .catch(() => {})
        .then((response) => {
          console.log(assignAvatar(response.data, username));
          if (response !== undefined)
            setUsers(assignAvatar(response.data, username));
        });
      const socket = new SocketJS(BASE_URL + "ws");
      stompClient = over(socket);
      stompClient.connect({}, () => onConnectionEstablished(userObj), onError);
    }
  }, []);

  return (
    <div className="chat-page">
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{ display: { xs: "none", sm: "block" } }}
            >
              Secure Chat
            </Typography>
            <LockIcon
              sx={{ marginLeft: 1, display: { xs: "none", sm: "block" } }}
            ></LockIcon>

            <Box sx={{ flexGrow: 1, display: { xs: "none", sm: "block" } }} />
            <StyledBadge
              overlap="circular"
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              variant="dot"
            >
              <Avatar
                src={avatar}
                className="avatar-img"
                alt="avatar"
                sx={{ width: 45, height: 45, bgcolor: "black" }}
              ></Avatar>
            </StyledBadge>
            <Typography sx={{ marginRight: 2, marginLeft: 2 }}>
              {user.username}
            </Typography>
            <Box sx={{ display: { xs: "flex", md: "flex", marginRight: 70 } }}>
              <Badge badgeContent={4} color="error">
                <MailIcon />
              </Badge>
            </Box>
            <Button
              size="small"
              color="error"
              aria-label="add an alarm"
              onClick={logoutUser}
              id="logout-btn"
              sx={{ borderRadius: "10px" }}
            >
              <PowerSettingsNewIcon />
            </Button>
          </Toolbar>
        </AppBar>
      </Box>
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

      {/* {image && <img src={image} alt="source"></img>}
      <button onClick={hideMsg}>Hide</button>
      {hiddenMsg && <img src={hiddenMsg} alt="hidden"></img>}
      <button onClick={revealMsg}>Reveal</button>
      <p>{msg}</p> */}

      <Fab
        aria-label="add"
        size="small"
        sx={{
          display: { xs: "none", sm: "flex" },
          position: "fixed",
          bottom: 5,
          right: 10,
          zIndex: 1201,
        }}
        onClick={toggleDrawer(true)}
      >
        {" "}
        <PeopleIcon />
      </Fab>
      {selectedUser && (
        <div className="chat-area">
          <div className="messages">
            {selectedUser.messages.map((m) => {
              return (
                <div
                  className={
                    m.received
                      ? "message-wrapper-received"
                      : "message-wrapper-sent"
                  }
                >
                  <div
                    className={
                      "message received " + (m.received ? "received" : "sent")
                    }
                  >
                    {m.received && (
                      <Avatar
                        src={selectedUser.avatar}
                        className={"msg-avatar received-msg-avatar"}
                        alt="avatar"
                        sx={{ width: 35, height: 35, bgcolor: "black" }}
                      ></Avatar>
                    )}

                    <pre>{m.content}</pre>
                    {!m.received && (
                      <Avatar
                        src={avatar}
                        className="msg-avatar sent-msg-avatar"
                        alt="avatar"
                        sx={{ width: 35, height: 35, bgcolor: "black" }}
                      ></Avatar>
                    )}
                  </div>
                </div>
              );
            })}
            <div id="end" ref={lastMsg}></div>
          </div>
          <div className="new-message-wrapper">
            <div className="new-message">
              <IconButton
                color="primary"
                aria-label="upload picture"
                component="label"
                size="medium"
                className="buttons"
              >
                <input
                  hidden
                  accept="image/*"
                  type="file"
                  onChange={(event) => readURL(event)}
                />
                <PhotoCamera fontSize="inherit" />
              </IconButton>
              <TextField
                size="small"
                id="new-message-input"
                multiline
                fullWidth={!showSend ? false : true}
                maxRows={msgRpws}
                value={message}
                onChange={handleMessageChange}
                onFocus={() => {
                  if (message === "" || message === "Message")
                    handleMessageChange({ target: { value: "" } });
                  setMsgRows(5);
                }}
                onBlur={() => {
                  if (message === "")
                    handleMessageChange({ target: { value: "Message" } });
                  setMsgRows(1);
                }}
              ></TextField>
              {showSend && (
                <IconButton size="medium" onClick={handleSendMessage}>
                  <SendIcon color="primary" fontSize="inherit"></SendIcon>
                </IconButton>
              )}
            </div>
          </div>
        </div>
      )}
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
            {console.log(users)}
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
