import axios from "axios";
import { client } from "./axios.service";
import { BASE_URL } from "./axios.service";
import avatar1 from "../assets/images/avatar1.png";
import avatar2 from "../assets/images/avatar2.png";
import avatar3 from "../assets/images/avatar3.png";
import avatar4 from "../assets/images/avatar4.png";
import avatar5 from "../assets/images/avatar5.png";
import avatar6 from "../assets/images/avatar6.png";
import avatar7 from "../assets/images/avatar7.png";
import avatar8 from "../assets/images/avatar8.png";
import avatar9 from "../assets/images/avatar9.png";
import avatar10 from "../assets/images/avatar10.png";
import avatar11 from "../assets/images/avatar11.png";
import avatar12 from "../assets/images/avatar12.png";
import avatar13 from "../assets/images/avatar13.png";
import avatar14 from "../assets/images/avatar14.png";
import avatar15 from "../assets/images/avatar15.png";
export function login(username, password) {
  const credentials = btoa(username + ":" + password);
  return axios.get(BASE_URL + "users/login", {
    headers: {
      "Content-Type": "application/json",
      Authorization: "Basic " + credentials,
    },
  });
}
export function register(username, password) {
  return client.post(BASE_URL + "users/signup", {
    username: username,
    password: password,
  });
}
export function onlineUsers() {
  return client.get(BASE_URL + "users");
}
export function assignAvatar(user) {
  const random = Math.floor(Math.random() * 15) + 1;
  let avatar;
  switch (random) {
    case 1:
      avatar = avatar1;
      break;
    case 2:
      avatar = avatar2;
      break;
    case 3:
      avatar = avatar3;
      break;
    case 4:
      avatar = avatar4;
      break;
    case 5:
      avatar = avatar5;
      break;
    case 6:
      avatar = avatar6;
      break;
    case 7:
      avatar = avatar7;
      break;
    case 8:
      avatar = avatar8;
      break;
    case 9:
      avatar = avatar9;
      break;
    case 10:
      avatar = avatar10;
      break;
    case 11:
      avatar = avatar11;
      break;
    case 12:
      avatar = avatar12;
      break;
    case 13:
      avatar = avatar13;
      break;
    case 14:
      avatar = avatar14;
      break;
    default:
      avatar = avatar15;
  }
  const key = new Uint8Array(JSON.parse(user.key));
  // console.log(user);
  // console.log(user.key);
  // console.log("Repaired array: ");
  // console.log(key);
  return {
    user: user.username,
    avatar,
    key,
  };
}
