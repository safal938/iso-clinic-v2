import { Diagnosis, Question, ChatMessage, EducationItem, AnalyticsData, ChecklistItem } from '../../types/nurse-sim';

// WebSocket endpoints - use wss:// for secure connections
const WS_BASE_URL = 'wss://clinic-hepa-v2-stable-481780815788.europe-west1.run.app';
const SIMULATION_URL = `${WS_BASE_URL}/ws/simulation/audio`;

// Message types from backend
export interface ChatMessageData {
  type: 'chat';
  data: ChatMessage[];
  source: string;
}

export interface DiagnosisMessage {
  type: 'diagnosis';
  diagnosis: Diagnosis[];
  source: string;
}

export interface QuestionsMessage {
  type: 'questions';
  questions: Question[];
  source: string;
}

export interface EducationMessage {
  type: 'education';
  data: EducationItem[];
  source: string;
}

export interface AnalyticsMessage {
  type: 'analytics';
  data: AnalyticsData;
  source: string;
}

export interface ChecklistMessage {
  type: 'checklist';
  data: ChecklistItem[];
  source: string;
}

export interface StatusMessage {
  type: 'status';
  data: any;
  source: string;
}

export interface ReportMessage {
  type: 'report';
  data: any;
  source: string;
}

export interface AudioMessage {
  type: 'audio';
  data: string; // base64 encoded audio
}

export type WebSocketMessage = 
  | ChatMessageData 
  | DiagnosisMessage 
  | QuestionsMessage 
  | EducationMessage
  | AnalyticsMessage
  | ChecklistMessage
  | StatusMessage
  | ReportMessage
  | AudioMessage;

export interface SessionCallbacks {
  onChat?: (messages: ChatMessage[]) => void;
  onDiagnoses?: (diagnoses: Diagnosis[]) => void;
  onQuestions?: (questions: Question[]) => void;
  onEducation?: (items: EducationItem[]) => void;
  onAnalytics?: (analytics: AnalyticsData) => void;
  onChecklist?: (items: ChecklistItem[]) => void;
  onStatus?: (status: any) => void;
  onReport?: (report: any) => void;
  onAudio?: (audioData: string) => void;
  onStatusChange?: (status: 'connecting' | 'connected' | 'disconnected' | 'error') => void;
  onSessionComplete?: () => void;
  onLog?: (message: string, type?: 'info' | 'error' | 'success') => void;
}

export class ClinicalSession {
  private socket: WebSocket | null = null;
  private callbacks: SessionCallbacks;
  private patientId: string;
  private gender: string;
  private isRunning: boolean = false;
  private audioQueue: string[] = [];
  private isPlayingAudio: boolean = false;
  private currentAudioChunks: Uint8Array[] = [];
  private pendingChatMessages: ChatMessage[] = []; // Queue for chat messages waiting for audio
  private currentAudioElement: HTMLAudioElement | null = null;

  constructor(patientId: string, gender: string, callbacks: SessionCallbacks) {
    this.patientId = patientId;
    this.gender = gender;
    this.callbacks = callbacks;
  }

  private log(message: string, type: 'info' | 'error' | 'success' = 'info') {
    this.callbacks.onLog?.(message, type);
    console.log(`[ClinicalSession] ${message}`);
  }

  private base64ToBuffer(base64: string): Uint8Array {
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  private handleAudioPacket(data: any) {
    if (data.data) {
      const bytes = this.base64ToBuffer(data.data);
      this.currentAudioChunks.push(bytes);
    }

    if (data.isFinal) {
      if (this.currentAudioChunks.length > 0) {
        const blob = new Blob(this.currentAudioChunks, { type: 'audio/mp3' });
        const url = URL.createObjectURL(blob);
        this.audioQueue.push(url);
        this.playNextAudio();
        this.currentAudioChunks = [];
      }
    }
  }

  private playNextAudio() {
    if (this.isPlayingAudio || this.audioQueue.length === 0) return;
    
    this.isPlayingAudio = true;
    const audioUrl = this.audioQueue.shift()!;
    const audio = new Audio(audioUrl);
    this.currentAudioElement = audio;
    
    audio.play().catch(e => {
      this.log(`Audio playback error: ${e}`, 'error');
      this.isPlayingAudio = false;
      this.currentAudioElement = null;
      this.playNextAudio();
    });
    
    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
      this.isPlayingAudio = false;
      this.currentAudioElement = null;
      
      // Display pending chat messages after audio finishes
      if (this.pendingChatMessages.length > 0) {
        this.log(`Displaying ${this.pendingChatMessages.length} pending chat messages after audio completed`);
        this.callbacks.onChat?.(this.pendingChatMessages);
        this.pendingChatMessages = [];
      }
      
      this.playNextAudio();
    };
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      this.log('Session already running', 'error');
      return;
    }

    this.isRunning = true;
    this.callbacks.onStatusChange?.('connecting');

    return new Promise((resolve, reject) => {
      // Connect to single simulation WebSocket
      this.socket = new WebSocket(SIMULATION_URL);

      this.socket.onopen = () => {
        this.log('Connected to simulation', 'success');
        this.callbacks.onStatusChange?.('connected');
        
        // Start session with patient data
        this.socket?.send(JSON.stringify({ 
          type: 'start', 
          patient_id: this.patientId,
          gender: this.gender
        }));
        
        resolve();
      };

      this.socket.onmessage = (event) => {
        this.handleMessage(event);
      };

      this.socket.onerror = (error) => {
        this.log('WebSocket error', 'error');
        this.callbacks.onStatusChange?.('error');
        reject(error);
      };

      this.socket.onclose = () => {
        this.log('WebSocket disconnected');
        if (this.isRunning) {
          this.callbacks.onStatusChange?.('disconnected');
        }
      };
    });
  }

  private handleMessage(event: MessageEvent) {
    try {
      const data = JSON.parse(event.data) as any; // Use any to handle flexible backend response
      
      // Log raw data for debugging
      console.log('[WebSocket] Received message:', data.type, data);
      
      switch (data.type) {
        case 'chat':
          // Backend might send data.data, data.chat, data.messages, or data.questions
          const chatMessages = data.data || data.chat || data.messages || data.questions || [];
          this.log(`Received ${chatMessages.length} chat messages`);
          console.log('[WebSocket] Chat messages:', chatMessages);
          
          // If audio is currently playing, queue the messages to display after audio finishes
          if (this.isPlayingAudio) {
            this.log('Audio is playing, queuing chat messages for after playback');
            this.pendingChatMessages = chatMessages;
          } else {
            // No audio playing, display immediately
            this.callbacks.onChat?.(chatMessages);
          }
          break;
          
        case 'diagnosis':
          this.log(`Received ${data.diagnosis?.length || 0} diagnoses`);
          this.callbacks.onDiagnoses?.(data.diagnosis || []);
          break;
          
        case 'questions':
          this.log(`Received ${data.questions?.length || 0} questions`);
          this.callbacks.onQuestions?.(data.questions || []);
          break;

        case 'education':
          this.log(`Received ${data.data?.length || 0} education items`);
          this.callbacks.onEducation?.(data.data || []);
          break;

        case 'analytics':
          this.log('Received analytics data');
          this.callbacks.onAnalytics?.(data.data);
          break;

        case 'checklist':
          this.log(`Received ${data.data?.length || 0} checklist items`);
          this.callbacks.onChecklist?.(data.data || []);
          break;

        case 'status':
          this.callbacks.onStatus?.(data.data);
          break;

        case 'report':
          this.log('Received report data');
          this.callbacks.onReport?.(data.data);
          break;

        case 'audio':
          this.handleAudioPacket(data);
          this.callbacks.onAudio?.(data.data);
          break;

        default:
          this.log(`Unknown message type: ${(data as any).type}`);
      }
    } catch (error) {
      this.log(`Error parsing message: ${error}`, 'error');
    }
  }

  stop() {
    this.isRunning = false;
    
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    // Stop current audio playback
    if (this.currentAudioElement) {
      this.currentAudioElement.pause();
      this.currentAudioElement = null;
    }
    
    // Clean up audio queue
    this.audioQueue.forEach(url => URL.revokeObjectURL(url));
    this.audioQueue = [];
    this.currentAudioChunks = [];
    this.isPlayingAudio = false;
    this.pendingChatMessages = [];
    
    this.callbacks.onStatusChange?.('disconnected');
    this.log('Session stopped', 'success');
  }

  get running() {
    return this.isRunning;
  }
}
