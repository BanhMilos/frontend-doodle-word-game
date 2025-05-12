import io from "socket.io-client";

const token = localStorage.getItem("accessToken");
const socket = io(process.env.REACT_APP_SOCKET_URL, {
  transports: ["websocket"],
  auth: {
    token: `Bearer ${token}`
  }
});
export default socket;
