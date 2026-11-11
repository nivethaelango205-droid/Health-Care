// Emergency assistance and navigation chat service
import { request, isDemoModeActive } from './api';
import { AmbulanceRequest } from '../types';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  actionId?: 'call_112' | 'call_108' | 'open_form' | 'share_location' | 'check_status';
  mode?: 'guided' | 'ai';
}

export interface AssistanceChatResponse {
  reply: string;
  mode: 'guided' | 'ai';
  provider?: string;
  actionId?: 'call_112' | 'call_108' | 'open_form' | 'share_location' | 'check_status';
}

export const INITIAL_GREETING: ChatMessage = {
  id: 'msg-init-0',
  sender: 'assistant',
  text: "Hello! I'm RuralCare Assist. I can help you understand how to request ambulance assistance, share your location, or contact emergency services. For an immediate emergency, call 112 directly.",
  timestamp: new Date().toISOString(),
  mode: 'guided',
};

export const assistanceService = {
  /**
   * Send user message to the assistance service.
   * Attempts the secure backend AI endpoint (POST /api/assistance/chat) first.
   * If not configured or unreachable, seamlessly provides safety-verified Guided Assistance.
   */
  async sendMessage(
    message: string,
    history: ChatMessage[],
    activeRequests: AmbulanceRequest[] = []
  ): Promise<AssistanceChatResponse> {
    const trimmed = message.trim();

    // 1. Try real backend AI endpoint if in live mode
    if (!isDemoModeActive()) {
      try {
        const boundedHistory = history.slice(-6).map((h) => ({
          sender: h.sender,
          text: h.text,
        }));

        const res = await request<AssistanceChatResponse>('/assistance/chat', {
          method: 'POST',
          body: JSON.stringify({
            message: trimmed,
            history: boundedHistory,
          }),
        });

        if (res && res.reply) {
          return {
            reply: res.reply,
            mode: res.mode === 'ai' ? 'ai' : 'guided',
            provider: res.provider,
            actionId: res.actionId,
          };
        }
      } catch (err) {
        // Backend AI endpoint is not yet configured or returned an error.
        // Fall back gracefully to verified Guided Assistance mode.
      }
    }

    // 2. Verified Guided Assistance Mode (Honest, rule-guided navigation support)
    return this.generateGuidedResponse(trimmed, activeRequests);
  },

  /**
   * Deterministic, safety-verified guided assistance logic.
   * Emphasizes emergency numbers, form navigation, location sharing, and real request status.
   */
  generateGuidedResponse(message: string, activeRequests: AmbulanceRequest[]): AssistanceChatResponse {
    const lower = message.toLowerCase();

    // Emergency or critical life-threatening query
    if (
      lower.includes('heart attack') ||
      lower.includes('chest pain') ||
      lower.includes('unconscious') ||
      lower.includes('bleeding heavily') ||
      lower.includes('breath') ||
      lower.includes('emergency') ||
      lower.includes('112') ||
      lower.includes('die') ||
      lower.includes('urgent')
    ) {
      return {
        reply:
          '🚨 In any life-threatening medical emergency, call 112 or 108 immediately. Do not rely solely on web requests. Keep the patient calm and stay on the call with the emergency responder.',
        mode: 'guided',
        actionId: 'call_112',
      };
    }

    // Ambulance request inquiry
    if (
      lower.includes('how do i request') ||
      lower.includes('request an ambulance') ||
      lower.includes('need an ambulance') ||
      lower.includes('book ambulance') ||
      lower.includes('call ambulance')
    ) {
      return {
        reply:
          'For immediate emergency assistance, please dial 108 or 112 directly. You can also submit an internal assistance request using the form on this page so our tele-operations team can coordinate with your local sub-center.',
        mode: 'guided',
        actionId: 'open_form',
      };
    }

    // Location inquiry
    if (
      lower.includes('share my location') ||
      lower.includes('location') ||
      lower.includes('gps') ||
      lower.includes('coordinates') ||
      lower.includes('where am i')
    ) {
      return {
        reply:
          'You can share your location by clicking "Use Current GPS" next to the pickup address field. Your browser will prompt for permission to capture your coordinates to help ambulance coordination.',
        mode: 'guided',
        actionId: 'share_location',
      };
    }

    // Status check
    if (
      lower.includes('status') ||
      lower.includes('where is my ambulance') ||
      lower.includes('track') ||
      lower.includes('check my assistance')
    ) {
      if (activeRequests.length === 0) {
        return {
          reply:
            'You do not have any active assistance requests on record. To submit a new request, please fill in your contact number and pickup address in the form.',
          mode: 'guided',
          actionId: 'open_form',
        };
      }

      const latest = activeRequests[0];
      if (latest.status === 'submitted') {
        return {
          reply: `Your assistance request (Ref: ${latest.id.substring(0, 8)}...) has been recorded and is currently awaiting administrative review. Note: Internal logging does not guarantee emergency vehicle availability. If urgent, dial 108 directly.`,
          mode: 'guided',
          actionId: 'check_status',
        };
      }

      if (latest.status === 'acknowledged') {
        return {
          reply: `Your assistance request (Ref: ${latest.id.substring(0, 8)}...) was acknowledged by the tele-operations desk. The sub-center team has been alerted for coordination.`,
          mode: 'guided',
          actionId: 'check_status',
        };
      }

      return {
        reply: `Your previous request (Ref: ${latest.id.substring(0, 8)}...) is marked as ${latest.status}. If you need further assistance, you can submit a new request or call 108.`,
        mode: 'guided',
        actionId: 'check_status',
      };
    }

    // Medical inquiry disclaimer
    if (
      lower.includes('medicine') ||
      lower.includes('prescription') ||
      lower.includes('pain') ||
      lower.includes('tablet') ||
      lower.includes('fever') ||
      lower.includes('treatment')
    ) {
      return {
        reply:
          'RuralCare Assist provides application navigation and emergency coordination guidance only. For medical diagnosis or medication prescriptions, please book a video consultation with a certified doctor through the Patient Portal.',
        mode: 'guided',
        actionId: 'open_form',
      };
    }

    // Default guidance
    return {
      reply:
        "I'm here to help you navigate emergency transport requests and contacts. You can call 112 for national emergency services, call 108 for state ambulance assistance, or submit an internal request using the form.",
      mode: 'guided',
      actionId: 'open_form',
    };
  },
};
