import { useEffect, useRef, useCallback } from "react";
import { Client } from "@stomp/stompjs";

const WS_URL = "ws://localhost:8080/ws";

export default function useWebSocket(onNotification) {
  const clientRef = useRef(null);

  useEffect(() => {
    const client = new Client({
      brokerURL: WS_URL,
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe("/topic/notifications", (msg) => {
          const payload = JSON.parse(msg.body);
          onNotification?.(payload);
        });
      },
    });

    client.activate();
    clientRef.current = client;

    return () => client.deactivate();
  }, [onNotification]);

  const send = useCallback((type, message) => {
    clientRef.current?.publish({
      destination: "/app/notify",
      body: JSON.stringify({ type, message }),
    });
  }, []);

  return { send };
}