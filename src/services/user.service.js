import axios from "axios";
import { client } from "./axios.service";
import { BASE_URL } from "./axios.service";
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
