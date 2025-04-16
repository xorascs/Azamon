import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true })
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Map to track connections by userId
  private userConnections = new Map<string, Set<Socket>>();

  handleConnection(client: Socket, ...args: any[]) {
    const notificationToken = client.handshake.query.notificationToken as string;
    if (!notificationToken) {
      console.warn(`Client ${client.id} connected without userId`);
      return;
    }

    // Add the connection to the user's set of connections
    if (!this.userConnections.has(notificationToken)) {
      this.userConnections.set(notificationToken, new Set());
    }
    const connections = this.userConnections.get(notificationToken);
    connections!.add(client);

    console.log(`Client ${client.id} joined as user: ${notificationToken}`);
  }

  handleDisconnect(client: Socket) {
    const notificationToken = client.handshake.query.notificationToken as string;
    if (!notificationToken) {
      console.warn(`Client ${client.id} disconnected without userIp`);
      return;
    }

    // Remove the connection from the user's set of connections
    if (this.userConnections.has(notificationToken)) {
      const connections = this.userConnections.get(notificationToken);
      connections!.delete(client);

      // Clean up if no connections remain for the user
      if (connections!.size === 0) {
        this.userConnections.delete(notificationToken);
      }
    }

    console.log(`Client ${client.id} disconnected as user: ${notificationToken}`);
  }

  // Send a message to all connections of a specific user
  sendToUser(notificationToken: string, event: string, data: any) {
    if (this.userConnections.has(notificationToken)) {
      const connections = this.userConnections.get(notificationToken);
      connections!.forEach((socket) => socket.emit(event, data));
    } else {
      console.warn(`No active connections found for user ${notificationToken}`);
    }
  }

  // Broadcast a message to all users
  broadcast(event: string, data: any) {
    this.server.emit(event, data);
  }
}