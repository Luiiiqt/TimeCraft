import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { Client } from "@stomp/stompjs";

const WS_URL = "ws://localhost:8080/ws";
const WebSocketContext = createContext(null);

export function WebSocketProvider({ children }) {
  const clientRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [connected, setConnected] = useState(false);

  const token = sessionStorage.getItem("tc_token");

  useEffect(() => {
    if (!token) return; // Don't connect if not logged in

    const client = new Client({
      brokerURL: WS_URL,
      reconnectDelay: 5000,
      onConnect: () => {
        setConnected(true);
        client.subscribe("/topic/notifications", (msg) => {
          const payload = JSON.parse(msg.body);
          setNotifications((prev) => [payload, ...prev].slice(0, 50));
        });
      },
      onDisconnect: () => setConnected(false),
    });

    client.activate();
    clientRef.current = client;
    return () => client.deactivate();
  }, [token]);

  const clearNotifications = useCallback(() => setNotifications([]), []);

  return (
    <WebSocketContext.Provider value={{ notifications, connected, clearNotifications }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocketContext() {
  return useContext(WebSocketContext);
}