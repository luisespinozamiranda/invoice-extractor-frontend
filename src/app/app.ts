import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { WebSocketService } from './core/services/websocket/websocket.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit, OnDestroy {
  protected readonly title = signal('invoice-extractor-frontend');
  private websocketService = inject(WebSocketService);

  ngOnInit(): void {
    // Connect to WebSocket when app starts
    this.websocketService.connect();
  }

  ngOnDestroy(): void {
    // Disconnect when app is destroyed
    this.websocketService.disconnect();
  }
}
