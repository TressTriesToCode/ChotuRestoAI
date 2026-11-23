import { WS_BASE_URL } from "./client";

export type WebSocketEventHandler = (event: { type: string; payload: any; timestamp: string }) => void;

class WebSocketClient {
  private socket: WebSocket | null = null;
  private restaurantId: string = "rest-spice-jct";
  private listeners: Set<WebSocketEventHandler> = new Set();
  private reconnectTimeout: any = null;
  private pingInterval: any = null;

  public connect(restaurantId: string = "rest-spice-jct") {
    if (typeof window === "undefined") return;
    this.restaurantId = restaurantId;

    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      const url = `${WS_BASE_URL}/ws/${restaurantId}`;
      this.socket = new WebSocket(url);

      this.socket.onopen = () => {
        // Connected
        if (this.pingInterval) clearInterval(this.pingInterval);
        this.pingInterval = setInterval(() => {
          if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send("ping");
          }
        }, 25000);
      };

      this.socket.onmessage = (event) => {
        if (event.data === "pong") return;
        try {
          const parsed = JSON.parse(event.data);
          this.listeners.forEach((handler) => handler(parsed));
        } catch {
          // Non-json frame
        }
      };

      this.socket.onclose = () => {
        this.cleanup();
        this.scheduleReconnect();
      };

      this.socket.onerror = () => {
        if (this.socket) {
          this.socket.close();
        }
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.reconnectTimeout = setTimeout(() => {
      this.connect(this.restaurantId);
    }, 4000);
  }

  private cleanup() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  public subscribe(handler: WebSocketEventHandler): () => void {
    this.listeners.add(handler);
    return () => {
      this.listeners.delete(handler);
    };
  }

  public disconnect() {
    this.cleanup();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

export const wsClient = new WebSocketClient();
