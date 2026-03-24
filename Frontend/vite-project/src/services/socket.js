import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:2473';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  connect(token = null) {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 20000,
    });

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      this.isConnected = true;
      
      // Authenticate if token is provided
      if (token) {
        this.socket.emit('authenticate', token);
      }
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.isConnected = false;
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Campaign-related methods
  joinCampaign(campaignId) {
    if (this.socket?.connected) {
      this.socket.emit('join-campaign', campaignId);
    }
  }

  leaveCampaign(campaignId) {
    if (this.socket?.connected) {
      this.socket.emit('leave-campaign', campaignId);
    }
  }

  onCampaignUpdate(callback) {
    if (this.socket) {
      this.socket.on('campaign-updated', callback);
    }
  }

  offCampaignUpdate(callback) {
    if (this.socket) {
      this.socket.off('campaign-updated', callback);
    }
  }

  // Petition-related methods
  joinPetition(petitionId) {
    if (this.socket?.connected) {
      this.socket.emit('join-petition', petitionId);
    }
  }

  leavePetition(petitionId) {
    if (this.socket?.connected) {
      this.socket.emit('leave-petition', petitionId);
    }
  }

  onPetitionUpdate(callback) {
    if (this.socket) {
      this.socket.on('petition-updated', callback);
    }
  }

  onSignatureAdded(callback) {
    if (this.socket) {
      this.socket.on('signature-added', callback);
    }
  }

  onMilestoneReached(callback) {
    if (this.socket) {
      this.socket.on('milestone-reached', callback);
    }
  }

  offPetitionUpdate(callback) {
    if (this.socket) {
      this.socket.off('petition-updated', callback);
    }
  }

  offSignatureAdded(callback) {
    if (this.socket) {
      this.socket.off('signature-added', callback);
    }
  }

  offMilestoneReached(callback) {
    if (this.socket) {
      this.socket.off('milestone-reached', callback);
    }
  }

  // Event-related methods
  joinEvent(eventId) {
    if (this.socket?.connected) {
      this.socket.emit('join-event', eventId);
    }
  }

  leaveEvent(eventId) {
    if (this.socket?.connected) {
      this.socket.emit('leave-event', eventId);
    }
  }

  onEventUpdate(callback) {
    if (this.socket) {
      this.socket.on('event-updated', callback);
    }
  }

  offEventUpdate(callback) {
    if (this.socket) {
      this.socket.off('event-updated', callback);
    }
  }

  // General notification methods
  onNotification(callback) {
    if (this.socket) {
      this.socket.on('notification', callback);
    }
  }

  offNotification(callback) {
    if (this.socket) {
      this.socket.off('notification', callback);
    }
  }

  // Utility methods
  isSocketConnected() {
    return this.isConnected && this.socket?.connected;
  }

  getSocket() {
    return this.socket;
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;