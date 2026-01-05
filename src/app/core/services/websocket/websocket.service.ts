import { Injectable } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface ExtractionEvent {
  type: string;
  extraction_key: string;
  status: string;
  progress: number;
  message: string;
  timestamp: string;
  metadata?: { [key: string]: any };
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private stompClient: Client | null = null;
  private eventSubject = new BehaviorSubject<ExtractionEvent | null>(null);

  public events$: Observable<ExtractionEvent | null> = this.eventSubject.asObservable();

  connect(): void {
    if (this.stompClient && this.stompClient.connected) {
      console.log('[WebSocketService] WebSocket already connected');
      return;
    }

    const apiUrl = environment.apiUrl;
    console.log('[WebSocketService] Connecting to WebSocket at:', `${apiUrl}/ws-extraction`);

    this.stompClient = new Client({
      webSocketFactory: () => new SockJS(`${apiUrl}/ws-extraction`),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (str) => {
        console.log('[WebSocketService] STOMP:', str);
      }
    });

    this.stompClient.onConnect = (frame) => {
      console.log('[WebSocketService] WebSocket connected successfully', frame);
    };

    this.stompClient.onStompError = (frame) => {
      console.error('[WebSocketService] WebSocket STOMP error:', frame.headers['message'], frame.body);
    };

    this.stompClient.onWebSocketError = (event) => {
      console.error('[WebSocketService] WebSocket error event:', event);
    };

    this.stompClient.activate();
    console.log('[WebSocketService] WebSocket activation initiated');
  }

  subscribeToExtraction(extractionKey: string): void {
    console.log('[WebSocketService] subscribeToExtraction called for key:', extractionKey);

    if (!this.stompClient) {
      console.error('[WebSocketService] WebSocket client not initialized');
      return;
    }

    const destination = `/topic/extraction/${extractionKey}`;
    console.log('[WebSocketService] Destination topic:', destination);

    // Wait for connection if not connected yet
    const subscribe = () => {
      console.log('[WebSocketService] Subscribing to topic:', destination);
      const subscription = this.stompClient!.subscribe(destination, (message: IMessage) => {
        console.log('[WebSocketService] Raw message received:', message.body);
        const event: ExtractionEvent = JSON.parse(message.body);
        console.log('[WebSocketService] Parsed extraction event:', event);
        this.eventSubject.next(event);
      });
      console.log('[WebSocketService] Subscription created:', subscription.id);
    };

    if (this.stompClient.connected) {
      console.log('[WebSocketService] WebSocket already connected, subscribing immediately');
      subscribe();
    } else {
      console.log('[WebSocketService] WebSocket not connected yet, waiting for connection...');
      // Wait for connection and then subscribe
      const originalOnConnect = this.stompClient.onConnect;
      this.stompClient.onConnect = (frame) => {
        console.log('[WebSocketService] Connection established, calling original onConnect and subscribing');
        if (originalOnConnect) originalOnConnect(frame);
        subscribe();
      };
    }
  }

  disconnect(): void {
    if (this.stompClient) {
      console.log('[WebSocketService] Disconnecting WebSocket');
      this.stompClient.deactivate();
      this.stompClient = null;
      console.log('[WebSocketService] WebSocket disconnected');
    }
  }

  clearEvents(): void {
    console.log('[WebSocketService] Clearing events');
    this.eventSubject.next(null);
  }
}
