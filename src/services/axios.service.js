import { createAxiosClient } from "./request.interceptor";
export const BASE_URL = "http://192.168.100.8:8080/SecureChat/";
function getToken() {
  try {
    const token = sessionStorage.getItem("token");
    console.log(JSON.parse(sessionStorage.getItem("user")));
    console.log(token);
    return token;
  } catch (ex) {
    console.log("no token");
    return "NO_TOKEN";
  }
}
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
