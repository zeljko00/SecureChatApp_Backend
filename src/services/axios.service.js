import { createAxiosClient } from "./request.interceptor";

const host = "192.168.100.8";
export const BASE_URL = "http://" + host + ":8080/SecureChat/";

function getToken() {
  try {
    const token = sessionStorage.getItem("token");
    // console.log(token);
    return token;
  } catch (ex) {
    console.log("no token");
    return "NO_TOKEN";
  }
}
// sets headers and baseURL for each ajax request
export const client = createAxiosClient({
  options: {
    baseURL: BASE_URL,
    timeout: 300000,
    headers: {
      "Content-Type": "application/json",
    },
  },
  getToken,
});
