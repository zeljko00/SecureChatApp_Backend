import { BrowserRouter, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ChatPage from "./pages/ChatPage";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/SecureChat/login" exact element={<LoginPage />}></Route>
        <Route
          path="/SecureChat/register"
          exact
          element={<RegisterPage />}
        ></Route>
        <Route path="/SecureChat/chatroom" exact element={<ChatPage />}></Route>
        <Route path="/SecureChat" exact element={<LoginPage />}></Route>
        <Route path="*" exact element={<LoginPage />}></Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
