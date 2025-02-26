// globals.d.ts
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
     error: string;
     message: string;
   }

interface SpeechRecognition extends EventTarget {
     start(): void;
     stop(): void;
     abort(): void;
     lang: string;
     continuous: boolean;
     interimResults: boolean;
     onresult: (event: SpeechRecognitionEvent) => void;
     onerror: (event: SpeechRecognitionErrorEvent) => void;
     onend: () => void;
   }

declare var SpeechRecognition: {
  prototype: SpeechRecognition;
  new (): SpeechRecognition;
};

declare var webkitSpeechRecognition: {
  prototype: SpeechRecognition;
  new (): SpeechRecognition;
};