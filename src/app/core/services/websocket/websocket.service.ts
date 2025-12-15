import { Injectable } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { BehaviorSubject, Observable } from 'rxjs';

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
      console.log('WebSocket already connected');
      return;
    }

    const apiUrl = 'http://localhost:8080/invoice-extractor-service';

    this.stompClient = new Client({
      webSocketFactory: () => new SockJS(`${apiUrl}/ws-extraction`),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (str) => {
        console.log('STOMP: ' + str);
      }
    });

    this.stompClient.onConnect = () => {
      console.log('WebSocket connected successfully');
    };

    this.stompClient.onStompError = (frame) => {
      console.error('WebSocket error:', frame.headers['message'], frame.body);
    };

    this.stompClient.activate();
  }

  subscribeToExtraction(extractionKey: string): void {
    if (!this.stompClient) {
      console.error('WebSocket client not initialized');
      return;
    }

    const destination = `/topic/extraction/${extractionKey}`;

    // Wait for connection if not connected yet
    const subscribe = () => {
      this.stompClient!.subscribe(destination, (message: IMessage) => {
        const event: ExtractionEvent = JSON.parse(message.body);
        console.log('Received extraction event:', event);
        this.eventSubject.next(event);
      });
      console.log(`Subscribed to ${destination}`);
    };

    if (this.stompClient.connected) {
      subscribe();
    } else {
      console.log('Waiting for WebSocket connection...');
      // Wait for connection and then subscribe
      const originalOnConnect = this.stompClient.onConnect;
      this.stompClient.onConnect = (frame) => {
        if (originalOnConnect) originalOnConnect(frame);
        subscribe();
      };
    }
  }

  disconnect(): void {
    if (this.stompClient) {
      this.stompClient.deactivate();
      this.stompClient = null;
      console.log('WebSocket disconnected');
    }
  }

  clearEvents(): void {
    this.eventSubject.next(null);
  }
}
