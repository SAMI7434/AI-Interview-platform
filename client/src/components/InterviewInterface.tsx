"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import {
  Camera,
  SquareMIcon as MicSquare,
  Power,
  Video,
  VideoOff,
  Volume2,
  Settings,
} from "lucide-react";
import { Timer } from "./InterviewInterface/Timer";
import { ExitButton } from "./InterviewInterface/ExitButton";
import { ScreenRecorder } from "./InterviewInterface/ScreenRecorder";
import { useNavigate } from "react-router-dom";
import AudioVisualizer from "@/components/InterviewInterface/AudioVisualizer";
import { MockInterview, Question } from "@/vite-env";
import CodeEditor from "./CodeEdior/CodeEditor";
import Loader from "./Loader/Loader";
import { useNotification } from "@/components/Notifications/NotificationContext";
import { Notification } from "@/vite-env";
import { generateReview } from "@/api/gemini.api";

interface InterviewInterfaceProps {
  interviewDetails: MockInterview;
}

interface QuestionWithType extends Question {
  type: "coreSubjectQuestions" | "technicalQuestions" | "dsaQuestions";
}

const InterviewInterface: React.FC<InterviewInterfaceProps> = ({
  interviewDetails,
}) => {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [isInterviewStarted, setIsInterviewStarted] = useState(!false);
  const [showDialog, setShowDialog] = useState(!true);

  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const navigate = useNavigate();

  const [Questions, setQuestions] = useState<QuestionWithType[]>([]);
  const maxQuestions = Questions.length || 0;
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isCurrentAnswerSaved, setIsCurrentAnswerSaved] = useState(false);

  const AZURE_SUBSCRIPTION_KEY = import.meta.env.VITE_AZURE_SUBSCRIPTION_KEY;
  const AZURE_REGION = import.meta.env.VITE_AZURE_REGION;

  const [transcript, setTranscript] = useState(
    "Speech-to-text content will appear here.."
  );

  const [partialTranscript, setPartialTranscript] = useState("");
  // const [language, setLanguage] = useState("en-US");
  const language = "en-US";
  const recognizerRef = useRef<SpeechSDK.SpeechRecognizer | null>(null);

  const [codeResponse, setCodeResponse] = useState("");
  const [savedInterviewData, setSavedInterviewData] =
    useState<MockInterview>(interviewDetails);

  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>("");
  const [microphoneVolume, setMicrophoneVolume] = useState(100);
  const [showAudioSettings, setShowAudioSettings] = useState(false);

  const { addNotification } = useNotification();

  useEffect(() => {
    if (isCameraOn) {
      startCamera();
    } else {
      stopCamera();
    }
  }, [isCameraOn]);

  // Get available audio devices
  useEffect(() => {
    const getAudioDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputDevices = devices.filter(device => device.kind === 'audioinput');
        setAudioDevices(audioInputDevices);
        if (audioInputDevices.length > 0) {
          setSelectedAudioDevice(audioInputDevices[0].deviceId);
        }
      } catch (err) {
        console.error("Error getting audio devices:", err);
      }
    };
    getAudioDevices();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      streamRef.current = stream;
      setHasPermission(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setHasPermission(false);
      setIsCameraOn(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const toggleCamera = () => {
    setIsCameraOn((prev) => !prev);
  };

  const handleSetNextQuestion = async () => {
    if (isCurrentAnswerSaved) {
      if (currentQuestion < maxQuestions - 1) {
        setCurrentQuestion(currentQuestion + 1);
        // console.log(interviewDetails);
        setTranscript("");
        setIsCurrentAnswerSaved(false);
      } else {
        // console.log(interviewDetails);
        try {
          setLoading(true);
          const generateReviewResponse = await generateReview({
            InterviewDetailsObject: savedInterviewData,
          });
          if (generateReviewResponse) {
            navigate("/dashboard");
          }
        } catch (error) {
          console.error(error);
          const newNotification: Notification = {
            id: Date.now().toString(),
            type: "error",
            message: "Failed to generate review",
          };
          addNotification(newNotification);
        }
      }
    } else {
      const newNotification: Notification = {
        id: Date.now().toString(),
        type: "error",
        message: "Saved Current Response to move to next Question",
      };
      addNotification(newNotification);
    }
  };

  // const handleSetPreviousQuestion = () => {
  //   if (currentQuestion > 0) {
  //     setCurrentQuestion(currentQuestion - 1);
  //   }
  // };

  const startRecognition = () => {
    if (!AZURE_SUBSCRIPTION_KEY || !AZURE_REGION) {
      alert("Azure credentials are missing.");
      return;
    }

    const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(
      AZURE_SUBSCRIPTION_KEY,
      AZURE_REGION
    );
    speechConfig.speechRecognitionLanguage = language;

    const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
    const recognizer = new SpeechSDK.SpeechRecognizer(
      speechConfig,
      audioConfig
    );
    recognizerRef.current = recognizer;

    setIsCurrentAnswerSaved(false);
    setTranscript("");
    setPartialTranscript("");
    // setIsListening(true);

    recognizer.recognizing = (sender, event) => {
      sender;

      setPartialTranscript(event.result.text);
    };

    recognizer.recognized = (sender, event) => {
      sender;
      if (event.result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
        let finalText = event.result.text;
        // if (language === "hi-IN") {
        //   console.log("Transliterating Hindi text...");
        //   finalText = transliterate(finalText);
        // }
        setIsCurrentAnswerSaved(false);
        setTranscript((prev) => `${prev} ${finalText}`.trim());
        setPartialTranscript("");
      }
    };

    recognizer.startContinuousRecognitionAsync();
  };

  const stopRecognition = () => {
    if (recognizerRef.current) {
      recognizerRef.current.stopContinuousRecognitionAsync(() => {
        recognizerRef.current?.close();
        recognizerRef.current = null;
        // setIsListening(false);
      });
    }
  };

  const handleRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
      startRecognition();
    } else {
      setIsRecording(false);
      stopRecognition();
    }
  };

  const handleEditorOpen = () => {
    setIsEditorOpen(!isEditorOpen);
  };

  useEffect(() => {
    const handleQuestions = async () => {
      const coreSubjectQuestions =
        interviewDetails.coreSubjectQuestions?.map((q) => ({
          ...q,
          type: "coreSubjectQuestions" as const,
        })) || [];

      const technicalQuestions =
        interviewDetails.technicalQuestions?.map((q) => ({
          ...q,
          type: "technicalQuestions" as const,
        })) || [];

      const dsaQuestions =
        interviewDetails.dsaQuestions?.map((q) => ({
          ...q,
          type: "dsaQuestions" as const,
        })) || [];

      const allQuestions: QuestionWithType[] = [
        ...technicalQuestions,
        ...coreSubjectQuestions,
        ...dsaQuestions,
      ];

      // console.log(allQuestions);
      setQuestions(allQuestions);
      setLoading(false);
    };

    handleQuestions();
  }, [interviewDetails]);

  const handleSaveResponse = () => {
    // Validate that we have questions and current question exists
    if (Questions.length === 0 || currentQuestion >= Questions.length) {
      const newNotification: Notification = {
        id: Date.now().toString(),
        type: "error",
        message: "Error: No question available to save",
      };
      addNotification(newNotification);
      return;
    }

    try {
      const allResponse = `Text Response: ${transcript}\nCode Response: ${codeResponse}`;
      const currentQuestionObj = Questions[currentQuestion];
      const category = currentQuestionObj.type;

      if (category === "technicalQuestions") {
        const updatedTechnicalQuestions = (
          savedInterviewData as any
        ).technicalQuestions.map((q: Question) => {
          if (q.question === currentQuestionObj.question) {
            return { ...q, answer: allResponse };
          }
          return q;
        });

        setSavedInterviewData((prevDetails) => ({
          ...prevDetails,
          technicalQuestions: updatedTechnicalQuestions,
        }));
      } else if (category === "coreSubjectQuestions") {
        const updatedCoreSubjectQuestions = (
          savedInterviewData as any
        ).coreSubjectQuestions.map((q: Question) => {
          if (q.question === currentQuestionObj.question) {
            return { ...q, answer: allResponse };
          }
          return q;
        });

        setSavedInterviewData((prevDetails) => ({
          ...prevDetails,
          coreSubjectQuestions: updatedCoreSubjectQuestions,
        }));
      } else if (category === "dsaQuestions") {
        const updatedDsaQuestions = (savedInterviewData as any).dsaQuestions.map(
          (q: Question) => {
            if (q.question === currentQuestionObj.question) {
              return { ...q, answer: allResponse };
            }
            return q;
          }
        );

        setSavedInterviewData((prevDetails) => ({
          ...prevDetails,
          dsaQuestions: updatedDsaQuestions,
        }));
      }

      const newNotification: Notification = {
        id: Date.now().toString(),
        type: "info",
        message: "Saved Successfully",
      };
      addNotification(newNotification);
      setIsCurrentAnswerSaved(true);
    } catch (error) {
      console.error("Error saving response:", error);
      const newNotification: Notification = {
        id: Date.now().toString(),
        type: "error",
        message: "Failed to save response. Please try again.",
      };
      addNotification(newNotification);
    }
  };

  if (!isInterviewStarted)
    return (
      <div className="">
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Start Interview</DialogTitle>
            </DialogHeader>
            <p>Do you want to start the interview?</p>
            <DialogFooter>
              <Button
                variant="destructive"
                onClick={() => navigate("/dashboard")}
              >
                No
              </Button>
              <Button
                onClick={() => {
                  console.log("Interview is started");
                  setIsInterviewStarted(true);
                  setShowDialog(false);
                }}
              >
                Yes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );

  if (loading)
    return (
      <div className="">
        <Loader />
      </div>
    );
  return (
    <div className="min-h-screen bg-zinc-900">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-zinc-800/50 backdrop-blur-sm">
        <h1 className="text-2xl font-bold">
          <span className="bg-gradient-to-r from-[#4AE087] via-[#84B7D4] to-[#9D7AEA] bg-clip-text text-transparent">
            AI-Powered
          </span>
          <span className="text-white"> Mock Interview</span>
        </h1>
        <div className="flex items-center">
          <ScreenRecorder />
          <Button
            className="h-[35px]"
            variant="outline"
            onClick={handleEditorOpen}
          >{`${
            isEditorOpen ? "Close Code Editor" : "Open Code Editor"
          }`}</Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side - Question and Response Area */}
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-6 bg-zinc-800/50 border-zinc-700">
            <h2 className="text-xl font-semibold text-white mb-4">
              Current Question {currentQuestion + 1} of {maxQuestions} [
              Category ]
            </h2>
            <p className="text-zinc-300">
              {Questions.length > 0 ? Questions[currentQuestion].question : ""}
            </p>
            <div className="w-full mt-1 flex justify-end">
              {/* <Button
                onClick={handleSetPreviousQuestion}
                className={`mt-2 ${
                  currentQuestion === 0 ? "bg-gray-700" : "bg-blue-600"
                } hover:bg-blue-800`}
              >
                Previous
              </Button> */}
              <div className=" gap-2 ">
                <Button
                  onClick={handleSaveResponse}
                  className={`mt-2 ${isCurrentAnswerSaved ? "bg-amber-900" : "bg-amber-600"} mr-2`}
                >
                  {isCurrentAnswerSaved ? "Saved" : "Save Response"}
                </Button>
                <Button
                  onClick={handleSetNextQuestion}
                  className={`mt-2 ${
                    currentQuestion === maxQuestions - 1
                      ? "bg-gray-700"
                      : "bg-green-600"
                  } hover:bg-green-800`}
                >
                  {`${
                    currentQuestion === maxQuestions - 1 ? "Submit" : "Next"
                  }`}
                </Button>
              </div>
            </div>
          </Card>
          <Card className="p-6 bg-zinc-800/50 border-zinc-700 min-h-[300px]">
            <h2 className="text-xl font-semibold text-white mb-4">
              Your Text Response
            </h2>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="You can type your response here or use the microphone to record. Both will be combined when you save."
              className="w-full h-full bg-zinc-800 text-white p-3 rounded border border-zinc-700 focus:border-emerald-500 focus:outline-none resize-none placeholder:text-zinc-500 placeholder:italic"
            />
          </Card>
          <Card className="p-6 bg-zinc-800/50 border-zinc-700 min-h-[200px]">
            <h2 className="text-xl font-semibold text-white mb-4">
              Code Submission
            </h2>
            <div className="">
              <textarea
                value={codeResponse}
                onChange={(e) => {
                  setCodeResponse(e.target.value);
                }}
                placeholder="Paste or type your code here. You can also open the Code Editor from the navbar for a better coding experience."
                className="w-full bg-zinc-800 text-white h-full p-3 rounded border border-zinc-700 focus:border-emerald-500 focus:outline-none resize-none placeholder:text-zinc-500 placeholder:italic"
              />
            </div>
          </Card>
        </div>

        {/* Right Side - Camera and Controls */}
        <div className="space-y-4">
          <Card className="aspect-video relative bg-zinc-800/50 border-zinc-700 overflow-hidden">
            {isCameraOn && hasPermission ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-800">
                {hasPermission === false ? (
                  <p className="text-red-500">Camera permission denied</p>
                ) : (
                  <Camera className="w-16 h-16 text-zinc-600" />
                )}
              </div>
            )}
          </Card>

          <div className="flex justify-center gap-4">
            <Button
              variant={isCameraOn ? "default" : "destructive"}
              size="lg"
              onClick={toggleCamera}
              className="w-40"
            >
              {isCameraOn ? (
                <>
                  <Video className="mr-2 h-4 w-4" />
                  Camera On
                </>
              ) : (
                <>
                  <VideoOff className="mr-2 h-4 w-4" />
                  Camera Off
                </>
              )}
            </Button>

            <Button
              variant={isRecording ? "destructive" : "outline"}
              size="lg"
              onClick={handleRecording}
              className="w-40"
            >
              {isRecording ? (
                <>
                  <Power className="mr-2 h-4 w-4" />
                  Stop
                </>
              ) : (
                <>
                  <MicSquare className="mr-2 h-4 w-4" />
                  Record
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={() => setShowAudioSettings(!showAudioSettings)}
              className="w-40"
            >
              <Settings className="mr-2 h-4 w-4" />
              Audio Settings
            </Button>
          </div>

          {/* Audio Settings Card */}
          {showAudioSettings && (
            <Card className="p-4 bg-zinc-800/50 border-zinc-700">
              <h3 className="text-sm font-semibold text-white mb-4">Audio Settings</h3>
              
              {/* Microphone Selection */}
              {audioDevices.length > 0 && (
                <div className="mb-4">
                  <label className="text-xs font-medium text-zinc-300 mb-2 block">
                    Microphone Device
                  </label>
                  <select
                    value={selectedAudioDevice}
                    onChange={(e) => setSelectedAudioDevice(e.target.value)}
                    className="w-full bg-zinc-700 border border-zinc-600 text-white text-sm rounded p-2"
                  >
                    {audioDevices.map((device) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Microphone ${audioDevices.indexOf(device) + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Microphone Volume */}
              <div className="mb-4">
                <label className="text-xs font-medium text-zinc-300 mb-2 flex items-center gap-2">
                  <Volume2 className="h-4 w-4" />
                  Microphone Volume: {microphoneVolume}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={microphoneVolume}
                  onChange={(e) => setMicrophoneVolume(Number(e.target.value))}
                  className="w-full h-2 bg-zinc-600 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Audio Info */}
              <div className="text-xs text-zinc-400">
                <p>Status: {isRecording ? "🔴 Recording" : "⚫ Idle"}</p>
                <p>Devices Available: {audioDevices.length}</p>
              </div>
            </Card>
          )}
          <Card className="p-6 bg-zinc-800/50 border-zinc-700 min-h-[70px]">
            <div className="text-zinc-400">{partialTranscript}</div>
          </Card>
          <Card className="p-6 bg-zinc-800/50 border-zinc-700 min-h-[120px]">
            <h3 className="text-sm font-semibold text-white mb-2">Audio Visualizer</h3>
            {isRecording && <AudioVisualizer />}
            {!isRecording && <p className="text-zinc-400 text-sm italic">Audio visualizer active during recording</p>}
          </Card>
        </div>
      </div>
      <Timer />
      <ExitButton />
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-6xl h-[90vh] overflow-auto p-0">
          <DialogHeader className="px-6 pt-6 pb-0">
            <DialogTitle>Code Editor</DialogTitle>
          </DialogHeader>
          <div className="flex-grow overflow-auto">
            <CodeEditor />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InterviewInterface;
