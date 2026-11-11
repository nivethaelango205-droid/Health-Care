import { request, isDemoModeActive } from './api';

export interface PageMetadata {
  route: string;
  nameEn: string;
  nameTa: string;
  descriptionEn: string;
  descriptionTa: string;
  suggestionsEn: string[];
  suggestionsTa: string[];
  keyActions: Array<{ id: string; selector: string; labelEn: string; labelTa: string }>;
}

export const PAGE_REGISTRY: Record<string, PageMetadata> = {
  '/patient/dashboard': {
    route: '/patient/dashboard',
    nameEn: 'Patient Dashboard',
    nameTa: 'முகப்பு பலகை',
    descriptionEn: 'Main healthcare portal overview, upcoming appointments, and quick actions.',
    descriptionTa: 'முக்கிய சுகாதார தகவல், அடுத்த சந்திப்புகள் மற்றும் உடனடி சேவைகள்.',
    suggestionsTa: [
      'டாக்டர் அப்பாயின்ட்மென்ட் எப்படி எடுப்பது?',
      'எனது மருத்துவ அறிக்கைகள் எங்கே?',
      'அவசர ஆம்புலன்ஸ் உதவி தேவை',
    ],
    suggestionsEn: [
      'How do I book an appointment?',
      'Where are my medical records?',
      'I need emergency ambulance assistance',
    ],
    keyActions: [
      { id: 'find_doctors', selector: '#action-find-doctors', labelEn: 'Find Doctors', labelTa: 'மருத்துவர்கள் தேடு' },
      { id: 'emergency_108', selector: '#action-emergency-108', labelEn: 'Emergency 108', labelTa: 'அவசர உதவி 108' },
    ],
  },
  '/patient/doctors': {
    route: '/patient/doctors',
    nameEn: 'Find Doctors & Availability',
    nameTa: 'மருத்துவர்கள் பட்டியல்',
    descriptionEn: 'Search verified specialists offering rural telemedicine consultations.',
    descriptionTa: 'கிராமப்புற சேவை வழங்கும் சான்றளிக்கப்பட்ட சிறப்பு மருத்துவர்கள்.',
    suggestionsTa: [
      'ஒரு மருத்துவரை எப்படி தேர்ந்தெடுப்பது?',
      'நேரத்தை எவ்வாறு முடிவு செய்வது?',
      'பொது மருத்துவ நிபுணர் யார்?',
    ],
    suggestionsEn: [
      'How do I select a doctor?',
      'How do I choose an appointment time?',
      'Who is the general physician?',
    ],
    keyActions: [
      { id: 'book_slot', selector: '.doctor-book-btn, #action-book-doctor', labelEn: 'Book Slot', labelTa: 'நேரம் பதிவு செய்' },
    ],
  },
  '/patient/appointments': {
    route: '/patient/appointments',
    nameEn: 'My Appointments & Letters',
    nameTa: 'எனது சந்திப்புகள்',
    descriptionEn: 'Manage consultation bookings and download official appointment letters.',
    descriptionTa: 'முன்பதிவு செய்யப்பட்ட சந்திப்புகள் மற்றும் உறுதிப்படுத்தல் கடிதங்கள்.',
    suggestionsTa: [
      'எனது அப்பாயின்ட்மென்ட் கடிதத்தை பதிவிறக்குவது எப்படி?',
      'வீடியோ அழைப்பில் எப்படி இணைவது?',
    ],
    suggestionsEn: [
      'How do I download my appointment letter?',
      'How do I join the video consultation?',
    ],
    keyActions: [
      { id: 'download_pdf', selector: '#action-download-letter', labelEn: 'Download PDF', labelTa: 'PDF பதிவிறக்கம்' },
      { id: 'join_call', selector: '#action-join-consultation', labelEn: 'Join Call', labelTa: 'அழைப்பில் இணையுங்கள்' },
    ],
  },
  '/patient/consultations': {
    route: '/patient/consultations',
    nameEn: 'Video Consultation Session',
    nameTa: 'வீடியோ மருத்துவ ஆலோசனை',
    descriptionEn: 'End-to-end encrypted remote video session with certified doctor.',
    descriptionTa: 'மருத்துவருடன் நேரடி பாதுகாப்பான வீடியோ அழைப்பு ஆலோசனை.',
    suggestionsTa: [
      'கேமரா மற்றும் மைக் எப்படி இயக்குவது?',
      'மருத்துவர் எப்போது இணைவார்?',
    ],
    suggestionsEn: [
      'How do I enable camera and microphone?',
      'When will the doctor join?',
    ],
    keyActions: [
      { id: 'toggle_cam', selector: '#action-toggle-camera', labelEn: 'Toggle Camera', labelTa: 'கேமரா இயக்கு' },
      { id: 'toggle_mic', selector: '#action-toggle-mic', labelEn: 'Toggle Mic', labelTa: 'மைக் இயக்கு' },
    ],
  },
  '/patient/records': {
    route: '/patient/records',
    nameEn: 'Personal Digital Health Records',
    nameTa: 'மருத்துவ பதிவுகள்',
    descriptionEn: 'Verified digital prescriptions, diagnosis summaries, and clinical notes.',
    descriptionTa: 'மருத்துவ பரிந்துரைகள் மற்றும் சிகிச்சை குறிப்புகள்.',
    suggestionsTa: [
      'மருத்துவ பரிந்துரை சீட்டு எங்கே உள்ளது?',
      'என் அறிக்கைகள் பாதுகாப்பானதா?',
    ],
    suggestionsEn: [
      'Where is my prescription?',
      'Are my health records encrypted?',
    ],
    keyActions: [
      { id: 'view_record', selector: '#action-view-prescription', labelEn: 'View Record', labelTa: 'பதிவை காண்க' },
    ],
  },
  '/patient/ambulance': {
    route: '/patient/ambulance',
    nameEn: 'Emergency & Ambulance Assistance',
    nameTa: 'அவசர ஆம்புலன்ஸ் உதவி',
    descriptionEn: 'Direct emergency hotline access, GPS sharing, and coordination requests.',
    descriptionTa: 'அவசர உதவி எண்கள் 108 / 112 மற்றும் இருப்பிட பகிர்வு.',
    suggestionsTa: [
      'ஆம்புலன்ஸ் உதவி கோருவது எப்படி?',
      'என் இருப்பிடத்தை எப்படி பகிர்வது?',
      'அவசர எண் 108 ஐ அழைப்பது எப்படி?',
    ],
    suggestionsEn: [
      'How do I request ambulance assistance?',
      'How do I share my GPS location?',
      'Call emergency 108 directly',
    ],
    keyActions: [
      { id: 'call_108', selector: '#action-call-108', labelEn: 'Call 108', labelTa: '108 அழைக்க' },
      { id: 'share_gps', selector: '#action-share-gps', labelEn: 'Share Location', labelTa: 'இருப்பிடம் பகிர்' },
    ],
  },
  '/doctor/dashboard': {
    route: '/doctor/dashboard',
    nameEn: 'Doctor Clinical Workspace',
    nameTa: 'மருத்துவர் பணித்தளம்',
    descriptionEn: 'Review patient appointments, video queues, and medical notes.',
    descriptionTa: 'நோயாளி சந்திப்புகள், வீடியோ வரிசை மற்றும் குறிப்புகள்.',
    suggestionsTa: [
      'இன்று எனக்கு எத்தனை சந்திப்புகள் உள்ளன?',
      'நோயாளி குறிப்புகளை எங்கு பார்ப்பது?',
    ],
    suggestionsEn: [
      'How many appointments do I have today?',
      'Where are my patient records?',
    ],
    keyActions: [],
  },
  '/doctor/appointments': {
    route: '/doctor/appointments',
    nameEn: 'Assigned Appointments',
    nameTa: 'ஒதுக்கப்பட்ட சந்திப்புகள்',
    descriptionEn: 'Confirm incoming rural telemedicine appointment requests.',
    descriptionTa: 'சந்திப்பு முன்பதிவுகளை உறுதிப்படுத்துங்கள்.',
    suggestionsTa: [
      'சந்திப்பை எப்படி உறுதி செய்வது?',
    ],
    suggestionsEn: [
      'How do I confirm an appointment?',
    ],
    keyActions: [],
  },
  '/admin/dashboard': {
    route: '/admin/dashboard',
    nameEn: 'Administrative Console',
    nameTa: 'நிர்வாக பலகை',
    descriptionEn: 'Platform metrics, doctor verifications, and ambulance coordination.',
    descriptionTa: 'தள புள்ளிவிவரங்கள் மற்றும் மருத்துவர் சான்றளிப்பு.',
    suggestionsTa: [
      'மருத்துவர் சரிபார்ப்பு எங்கே உள்ளது?',
      'ஆம்புலன்ஸ் கோரிக்கைகள் எத்தனை?',
    ],
    suggestionsEn: [
      'Where is doctor verification?',
      'How many ambulance requests are pending?',
    ],
    keyActions: [],
  },
};

export function getPageMetadata(pathname: string): PageMetadata {
  for (const [route, meta] of Object.entries(PAGE_REGISTRY)) {
    if (pathname.startsWith(route)) {
      return meta;
    }
  }
  return {
    route: pathname,
    nameEn: 'RuralCare 360',
    nameTa: 'ரூரல்கேர் 360',
    descriptionEn: 'Telemedicine Access for Rural Healthcare.',
    descriptionTa: 'கிராமப்புற தொலைதூர மருத்துவ சேவை.',
    suggestionsTa: [
      'டாக்டரை எப்படி பார்ப்பது?',
      'அவசர உதவி எண்கள் என்ன?',
    ],
    suggestionsEn: [
      'How do I consult a doctor?',
      'What are the emergency numbers?',
    ],
    keyActions: [],
  };
}

export interface AssistantVoiceResponse {
  reply: string;
  actionId?: string;
  actionTarget?: string;
  audioBase64?: string;
  audioMimeType?: string;
  mode: 'ai' | 'guided';
  language: 'ta' | 'en';
}

export const aiAssistantService = {
  /**
   * Request spoken AI guidance with real Gemini TTS audio
   */
  async askVoice(params: {
    message: string;
    history?: Array<{ sender: 'user' | 'assistant'; text: string }>;
    language?: 'ta' | 'en';
    role?: string;
    currentPage?: string;
    availableActions?: string[];
  }): Promise<AssistantVoiceResponse> {
    const lang = params.language || 'ta';
    const role = params.role || 'patient';
    const currentPage = params.currentPage || 'dashboard';

    if (!isDemoModeActive()) {
      try {
        const res = await request<AssistantVoiceResponse>('/assistance/voice', {
          method: 'POST',
          body: JSON.stringify({
            message: params.message.trim(),
            history: params.history?.slice(-6) || [],
            language: lang,
            role,
            currentPage,
            availableActions: params.availableActions || [],
          }),
        });

        if (res && res.reply) {
          return {
            reply: res.reply,
            actionId: res.actionId,
            actionTarget: res.actionTarget,
            audioBase64: res.audioBase64,
            audioMimeType: res.audioMimeType || 'audio/wav',
            mode: 'ai',
            language: res.language || lang,
          };
        }
      } catch (err) {
        console.warn('Backend voice service notice, generating safe guided reply:', err);
      }
    }

    // Safety-verified fallback navigation guide
    return this.generateFallbackResponse(params.message, lang, currentPage);
  },

  /**
   * Deterministic guided response fallback
   */
  generateFallbackResponse(
    message: string,
    language: 'ta' | 'en',
    currentPage: string
  ): AssistantVoiceResponse {
    const lower = message.toLowerCase();

    // Emergency queries
    if (
      lower.includes('வலி') ||
      lower.includes('மாரடைப்பு') ||
      lower.includes('emergency') ||
      lower.includes('chest pain') ||
      lower.includes('112') ||
      lower.includes('108')
    ) {
      return {
        reply:
          language === 'ta'
            ? 'அவசர நிலைகளுக்கு உடனே 112 அல்லது 108 ஐ உங்கள் போனில் அழைக்கவும். நான் ஆம்புலன்ஸ் உதவி பக்கத்தை திறந்து விடுகிறேன்.'
            : 'For critical emergencies, dial 112 or 108 directly on your phone. Opening the Ambulance Assistance center for you.',
        actionId: 'navigate_ambulance',
        mode: 'guided',
        language,
      };
    }

    // Doctor appointment inquiries
    if (
      lower.includes('அப்பாயின்ட்மென்ட்') ||
      lower.includes('டாக்டர்') ||
      lower.includes('doctor') ||
      lower.includes('appointment') ||
      lower.includes('book')
    ) {
      return {
        reply:
          language === 'ta'
            ? 'வணக்கம்! நிச்சயமாக உதவி செய்கிறேன். முதலில் மருத்துவர்கள் பட்டியலுக்குப் போகலாம். அங்கு உங்களுக்கு ஏற்ற மருத்துவரை தேர்ந்தெடுக்கலாம்.'
            : 'Certainly! Let me take you to the Find Doctors page where you can choose a verified medical specialist.',
        actionId: 'navigate_doctors',
        mode: 'guided',
        language,
      };
    }

    // Records inquiries
    if (lower.includes('ரெக்கார்ட்') || lower.includes('அறிக்கை') || lower.includes('record') || lower.includes('prescription')) {
      return {
        reply:
          language === 'ta'
            ? 'உங்கள் பாதுகாப்பான மருத்துவ பதிவுகள் மற்றும் மருந்து சீட்டுகளை பார்க்க Health Records பகுதிக்கு போகலாம்.'
            : 'You can review your verified prescriptions and clinical notes in the Personal Health Records section.',
        actionId: 'navigate_records',
        mode: 'guided',
        language,
      };
    }

    // Default friendly navigation guidance
    return {
      reply:
        language === 'ta'
          ? 'வணக்கம்! நான் ரூரல்கேர் AI வழிகாட்டி. மருத்துவர் சந்திப்பு, மருத்துவ பதிவுகள் அல்லது ஆம்புலன்ஸ் உதவி பெற நான் உங்களுக்கு வழிகாட்டுகிறேன்.'
          : 'Hello! I am your RuralCare AI Guide. I can help you find doctors, book appointments, access records, or request assistance.',
      actionId: 'navigate_dashboard',
      mode: 'guided',
      language,
    };
  },
};

