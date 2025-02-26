import type { StartAvatarResponse } from "@heygen/streaming-avatar";
import StreamingAvatar, {
  AvatarQuality,
  StreamingEvents, TaskMode, TaskType, VoiceEmotion,
} from "@heygen/streaming-avatar";
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  Divider,
  Input,
  Select,
  SelectItem,
  Spinner,
  Chip,
  Tabs,
  Tab,
  Textarea,
} from "@nextui-org/react";
import { useEffect, useRef, useState } from "react";
import { useMemoizedFn, usePrevious } from "ahooks";
import InteractiveAvatarTextInput from "./InteractiveAvatarTextInput";
import { AVATARS, STT_LANGUAGE_LIST } from "@/app/lib/constants";
import { GoogleGenerativeAI } from "@google/generative-ai";

// // Configura o cliente do Gemini
// const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
// console.log(genAI);
// const model = genAI.getGenerativeModel({
//   model: "learnlm-1.5-pro-experimental",
//   systemInstruction:
//     'Você é um tutor virtual que irá conduzir uma situação de aprendizagem passo a passo com o aluno, de modo que avalie gradualmente o progresso do aluno. Invcentive o aluno a continuar na atividade para alcançar o objetivo. Inicie se apresentando e perguntando se o aluno esta pronto, posteriormente apresente a situação de aprendizagem a seguir:\nContextualização:\nA "TechSolutions," uma empresa de pequeno porte com 20 funcionários e 5 anos de experiência, é especializada no desenvolvimento de software sob medida para otimizar processos de pequenas e médias empresas.\n\nA TechSolutions tem como clientes empresas dos setores de varejo, serviços e indústria. Ela oferece soluções como sistemas de gestão de estoque, CRM e ferramentas de automação de marketing. A empresa valoriza o contato próximo com o cliente e a personalização das soluções, buscando sempre atender às necessidades específicas de cada negócio.\n\nRecentemente, a TechSolutions foi contratada pela "Alimentos Delícia," uma indústria alimentícia local que busca modernizar seu sistema de controle de produção. Para dar início ao projeto, a equipe precisa realizar um levantamento detalhado dos requisitos do cliente, buscando entender suas necessidades, expectativas e restrições. A empresa utiliza um sistema legado com pouca escalabilidade e funcionalidades limitadas. A Alimentos Delícia busca aumentar sua eficiência produtiva, reduzir desperdícios e ter maior controle sobre todo o processo, desde a entrada da matéria-prima até a expedição do produto final.\n\nVisando preparar os alunos, o plano de ensino da unidade curricular “Levantamento de Requisitos” sugere a necessidade de inclusão de figuras, esquemas, desenhos, leiautes, formulários, etc, para complementar a situação de aprendizagem e descrever qual imagem deve ser incluída.\n\nDesafio:\nConsiderando o cenário apresentado, você e sua equipe, como consultores da TechSolutions, foram designados para conduzir uma entrevista de levantamento de requisitos com o gerente de produção da Alimentos Delícia, Sr. João. O objetivo é coletar informações detalhadas sobre os processos atuais, identificar os principais problemas e necessidades e definir os requisitos para o novo sistema de controle de produção.\n\nPara isso, você deverá:\n\nElaborar um roteiro de entrevista estruturado, com perguntas claras e objetivas que abordem os processos de produção, os dados coletados, os sistemas utilizados, as dificuldades encontradas e as expectativas em relação ao novo sistema.\nAplicar técnicas de comunicação eficazes durante a entrevista, como escuta ativa, perguntas abertas e fechadas e feedback constante, buscando obter o máximo de informações relevantes.\nUtilizar metodologias ágeis, como Scrum e Kanban, para organizar as tarefas e priorizar os requisitos levantados.\nAplicar os princípios do Design Thinking, buscando entender a fundo as necessidades do cliente e gerar soluções inovadoras e centradas no usuário.\nResultados Esperados:\nAo final desta situação de aprendizagem, espera-se que você e sua equipe sejam capazes de:\n\nElaborar um roteiro de entrevista claro, estruturado e completo, que aborde todos os aspectos relevantes para o levantamento de requisitos.\nConduzir uma entrevista de levantamento de requisitos de forma profissional e eficaz, obtendo informações precisas e relevantes para o projeto.\nIdentificar os principais problemas e necessidades do cliente, traduzindo-os em requisitos funcionais e não funcionais claros e mensuráveis.\nAplicar metodologias ágeis e os princípios do Design Thinking para organizar, priorizar e validar os requisitos levantados.\nApresentar um relatório final completo e detalhado, com todos os requisitos levantados, priorizados e validados, que servirá como base para o desenvolvimento do novo sistema de controle de produção.\nApresentar o protótipo do Briefing preenchido que será entregue ao cliente.',
// });

export default function InteractiveAvatar() {
  const [heygenApiKey, setHeygenApiKey] = useState<string>("");
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [isLoadingRepeat, setIsLoadingRepeat] = useState(false);
  const [stream, setStream] = useState<MediaStream>();
  const [debug, setDebug] = useState<string>();
  const [knowledgeId, setKnowledgeId] = useState<string>("");
  const [avatarId, setAvatarId] = useState<string>("");
  const [language, setLanguage] = useState<string>('pt');
  const [data, setData] = useState<StartAvatarResponse>();
  const [text, setText] = useState<string>("");
  const mediaStream = useRef<HTMLVideoElement>(null);
  const avatar = useRef<StreamingAvatar | null>(null);
  const [chatMode, setChatMode] = useState("text_mode");
  const [isUserTalking, setIsUserTalking] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [instrucaoSistema, setInstrucaoSistema] = useState<string>("");

  // Usamos useRef para armazenar o cliente Gemini
  const genAIRef = useRef<GoogleGenerativeAI | null>(null);

  // Função para configurar o cliente Gemini
  const setupGeminiClient = () => {
    const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!geminiApiKey) {
      alert("Por favor, insira uma chave de API válida.");
      return false;
    }

    // Cria o cliente Gemini apenas se ainda não foi criado
    if (!genAIRef.current) {
      genAIRef.current = new GoogleGenerativeAI(geminiApiKey);
      console.log("Cliente Gemini configurado com sucesso!");
    }

    return true;
  };

  // Função para enviar mensagem ao Gemini
  async function sendToGemini(input: string): Promise<string> {
    if (!genAIRef.current) {
      throw new Error("Gemini API Key não configurada.");
    }

    const model = genAIRef.current.getGenerativeModel({
      model: "learnlm-1.5-pro-experimental",
      systemInstruction: instrucaoSistema,
    });

    const chatSession = model.startChat({
      generationConfig: {
        temperature: 1,
        topP: 0.95,
        topK: 64,
        maxOutputTokens: 8192,
        responseMimeType: "text/plain",
      },
      history: [],
    });

    const result = await chatSession.sendMessage(input);
    return result.response.text();
  }

  async function fetchAccessToken() {
    try {
      const response = await fetch("/api/get-access-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ apiKey: heygenApiKey }), // Envia a chave de API do HeyGen
      });

      if (!response.ok) {
        throw new Error("Failed to fetch access token");
      }

      const data = await response.json();
      const token = data.token;

      console.log("Access Token:", token); // Log do token para verificação
      return token;
    } catch (error) {
      console.error("Error fetching access token:", error);
      setDebug("Failed to fetch access token");
      return "";
    }
  }

  // Configura o Web Speech API
  useEffect(() => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const SpeechRecognition = window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = language;

      recognitionInstance.onresult = async (event) => {
        const transcript = event.results[0][0].transcript;
        console.log("Transcribed text:", transcript);

        try {
          if (!setupGeminiClient()) {
            throw new Error("Gemini API Key não configurada.");
          }
          const geminiResponse = await sendToGemini(transcript);
          await avatar.current?.speak({
            text: geminiResponse,
            taskType: TaskType.REPEAT,
            taskMode: TaskMode.SYNC,
          });
        } catch (error) {
          console.error("Error communicating with Gemini:", error);
          setDebug("Failed to communicate with Gemini");
        }
      };

      recognitionInstance.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setDebug("Speech recognition error");
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    } else {
      console.error("Web Speech API not supported");
      setDebug("Web Speech API not supported");
    }
  }, [language]);

  async function startSession() {
    setIsLoadingSession(true);

    // Usa a chave de API do HeyGen diretamente
    const newToken = await fetchAccessToken();

    avatar.current = new StreamingAvatar({
      token: newToken,
    });
    avatar.current.on(StreamingEvents.AVATAR_START_TALKING, (e) => {
      console.log("Avatar started talking", e);
    });
    avatar.current.on(StreamingEvents.AVATAR_STOP_TALKING, (e) => {
      console.log("Avatar stopped talking", e);
    });
    avatar.current.on(StreamingEvents.STREAM_DISCONNECTED, () => {
      console.log("Stream disconnected");
      endSession();
    });
    avatar.current?.on(StreamingEvents.STREAM_READY, (event) => {
      console.log(">>>>> Stream ready:", event.detail);
      setStream(event.detail);
    });

    try {
      const res = await avatar.current.createStartAvatar({
        quality: AvatarQuality.High,
        avatarName: avatarId,
        knowledgeId: knowledgeId,
        voice: {
          rate: 1.5,
          emotion: VoiceEmotion.EXCITED,
        },
        language: language,
        disableIdleTimeout: true,
      });

      setData(res);
      setChatMode("voice_mode"); // Define o modo como voice_mode
    } catch (error) {
      console.error("Error starting avatar session:", error);
    } finally {
      setIsLoadingSession(false);
    }
  }

  async function handleSpeak() {
    setIsLoadingRepeat(true);
    if (!avatar.current) {
      setDebug("Avatar API not initialized");
      return;
    }

    try {
      const geminiResponse = await sendToGemini(text);
      await avatar.current.speak({
        text: geminiResponse,
        taskType: TaskType.REPEAT,
        taskMode: TaskMode.SYNC,
      });
    } catch (error) {
      console.error("Error communicating with Gemini:", error);
      setDebug("Failed to communicate with Gemini");
    } finally {
      setIsLoadingRepeat(false);
    }
  }

  async function handleInterrupt() {
    if (!avatar.current) {
      setDebug("Avatar API not initialized");
      return;
    }
    await avatar.current.interrupt().catch((e) => {
      setDebug(e.message);
    });
  }

  async function endSession() {
    await avatar.current?.stopAvatar();
    setStream(undefined);
  }

  const handleChangeChatMode = useMemoizedFn(async (v) => {
    if (v === chatMode) {
      return;
    }
    if (v === "text_mode") {
      if (recognition) {
        recognition.stop();
        setIsListening(false);
      }
    }
    setChatMode(v);
  });

  const previousText = usePrevious(text);
  useEffect(() => {
    if (!previousText && text) {
      avatar.current?.startListening();
    } else if (previousText && !text) {
      avatar?.current?.stopListening();
    }
  }, [text, previousText]);

  useEffect(() => {
    return () => {
      endSession();
    };
  }, []);

  useEffect(() => {
    if (stream && mediaStream.current) {
      mediaStream.current.srcObject = stream;
      mediaStream.current.onloadedmetadata = () => {
        mediaStream.current!.play();
        setDebug("Playing");
      };
    }
  }, [mediaStream, stream]);

  return (
    <div className="w-full flex flex-col gap-4">
      <Card>
        <CardBody className="h-[500px] flex flex-col justify-center items-center">
          {stream ? (
            <div className="h-[500px] w-[900px] justify-center items-center flex rounded-lg overflow-hidden">
              <video
                ref={mediaStream}
                autoPlay
                playsInline
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                }}
              >
                <track kind="captions" />
              </video>
              <div className="flex flex-col gap-2 absolute bottom-3 right-3">
                <Button
                  className="bg-gradient-to-tr from-indigo-500 to-indigo-300 text-white rounded-lg"
                  size="md"
                  variant="shadow"
                  onClick={handleInterrupt}
                >
                  Interromper fala
                </Button>
                <Button
                  className="bg-gradient-to-tr from-indigo-500 to-indigo-300 text-white rounded-lg"
                  size="md"
                  variant="shadow"
                  onClick={endSession}
                >
                  Finalizar
                </Button>
              </div>
            </div>
          ) : !isLoadingSession ? (
            <div className="h-full justify-center items-center flex flex-col gap-8 w-[700px] self-center">
              <div className="flex flex-col gap-2 w-full">
                <p className="text-sm font-medium leading-none">
                  Chave de API do HeyGen
                </p>
                <Input
                  placeholder="Insira sua chave de API do HeyGen"
                  value={heygenApiKey}
                  onChange={(e) => setHeygenApiKey(e.target.value)}
                />
                <p className="text-sm font-medium leading-none">
                  Avatar Personalizado
                </p>
                <Select
                  placeholder="Selecione um avatar de exemplo"
                  size="md"
                  onChange={(e) => {
                    setAvatarId(e.target.value);
                  }}
                >
                  {AVATARS.map((avatar) => (
                    <SelectItem
                      key={avatar.avatar_id}
                      textValue={avatar.avatar_id}
                    >
                      {avatar.name}
                    </SelectItem>
                  ))}
                </Select>
                <p className="text-sm font-medium leading-none">
                  Selecione o idioma
                </p>
                <Select
                  label="Idioma"
                  placeholder="Idioma"
                  className="max-w-xs"
                  selectedKeys={[language]}
                  onChange={(e) => {
                    setLanguage(e.target.value);
                  }}
                >
                  {STT_LANGUAGE_LIST.map((lang) => (
                    <SelectItem key={lang.key}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </Select>
                <p className="text-sm font-medium leading-none">
                  Instrução de Sistema
                </p>
                <Textarea
                  placeholder="Digite a instrução de sistema"
                  value={instrucaoSistema}
                  onChange={(e) => setInstrucaoSistema(e.target.value)}
                  rows={50}
                />
              </div>
              <Button
                className="bg-gradient-to-tr from-red-500 to-red-900 w-full text-white"
                size="md"
                variant="shadow"
                onClick={startSession}
              >
                Iniciar
              </Button>
            </div>
          ) : (
            <Spinner color="default" size="lg" />
          )}
        </CardBody>
        <Divider />
        <CardFooter className="flex flex-col gap-3 relative">
          <Tabs
            aria-label="Options"
            selectedKey={chatMode}
            onSelectionChange={(v) => {
              handleChangeChatMode(v);
            }}
          >
                       <Tab key="voice_mode" title="Modo conversação" />
          </Tabs>
          {chatMode === "text_mode" ? (
            <div className="w-full flex relative">
              <InteractiveAvatarTextInput
                disabled={!stream}
                input={text}
                label="Chat"
                loading={isLoadingRepeat}
                placeholder="Digite algo para o avatar responder"
                setInput={setText}
                onSubmit={handleSpeak}
              />
              {text && (
                <Chip className="absolute right-16 top-3">Escutando</Chip>
              )}
            </div>
          ) : (
            <div className="w-full text-center">
              <Button
                isDisabled={!stream}
                className="bg-gradient-to-tr from-red-500 to-red-900 text-white"
                size="md"
                variant="shadow"
                onClick={() => {
                  if (recognition) {
                    if (isListening) {
                      recognition.stop();
                      setIsListening(false);
                    } else {
                      recognition.start();
                      setIsListening(true);
                    }
                  }
                }}
              >
                {isListening ? "Escutando..." : "Aperte para falar"}
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>
      <p className="font-mono text-right">
        <span className="font-bold">Mensagens de Sistema:</span>
        <br />
        {debug}
      </p>
    </div>
  );
}