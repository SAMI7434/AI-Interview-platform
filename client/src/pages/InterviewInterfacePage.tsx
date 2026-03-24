import { editInterview, getInterviewByID } from "@/api/mockinterview.api";
import InterviewInterface from "@/components/InterviewInterface";
import Loader from "@/components/Loader/Loader";
import { useEffect, useState } from "react";
import { useNotification } from "@/components/Notifications/NotificationContext";
import { MockInterview, Notification } from "@/vite-env";
import { useParams } from "react-router-dom";
import { generateQuestions } from "@/api/gemini.api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import InterviewInstructions from "@/components/InterviewInterface/InterviewInstructionsComponent";

const InterviewInterfacePage = () => {
  const { addNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const { id } = useParams<{ id: string }>();
  const [interviewData, setInterviewData] = useState<MockInterview>();
  const [isFullScreen, setIsFullScreen] = useState<boolean>(
    !!document.fullscreenElement
  );

  const [isInterviewStarted, setIsInterviewStarted] = useState(false);
  useEffect(() => {
    const startInterview = async () => {
      try {
        console.log("=== STARTING INTERVIEW ===");
        console.log("Interview ID:", id);
        
        if (!id) {
          throw new Error("Interview ID is required");
        }

        // Fetch interview data first
        const interviewData = await getInterviewByID(id);
        console.log("Fetched interview data:", interviewData);

        if (!interviewData) {
          throw new Error("Interview not found");
        }

        // Prepare Gemini API request with interviewID and skills
        const formData = {
          interviewID: id,
          skills: interviewData.skills || [],
        };
        console.log("Calling Gemini API with:", formData);

        // Generate questions using Gemini
        const response = await generateQuestions(formData);
        console.log("Gemini API response:", response);

        // Check if response has data property or is direct response
        const questionsData = response.data || response;
        console.log("Questions data:", questionsData);

        if (!questionsData) {
          throw new Error("Failed to generate questions - no data received");
        }

        // Update interview data with generated questions
        interviewData.dsaQuestions = questionsData.dsaQuestions || [];
        interviewData.coreSubjectQuestions = questionsData.coreSubjectQuestions || [];
        interviewData.technicalQuestions = questionsData.techStackQuestions || [];
        interviewData.overallRating = 0;
        interviewData.overallReview = "";

        console.log("Updated interview data with questions:", interviewData);

        // Save updated interview data
        const editedInterview = await editInterview(id, interviewData);
        console.log("Saved interview:", editedInterview);
        
        setInterviewData(editedInterview);
        enterFullScreen();
        setLoading(false);
      } catch (error: any) {
        console.error("=== ERROR STARTING INTERVIEW ===");
        console.error("Error details:", error);
        console.error("Error message:", error?.message);
        console.error("Error response:", error?.response?.data);
        
        const errorMessage = error?.response?.data?.error || error?.message || "Failed to start interview. Please try again.";
        
        const newNotification: Notification = {
          id: Date.now().toString(),
          type: "error",
          message: errorMessage,
        };
        addNotification(newNotification);
        setLoading(false);
        
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 5000);
      }
    };
    startInterview();
  }, [id]);
  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullScreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullScreenChange);
    document.addEventListener("mozfullscreenchange", handleFullScreenChange);
    document.addEventListener("MSFullscreenChange", handleFullScreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullScreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullScreenChange
      );
      document.removeEventListener(
        "mozfullscreenchange",
        handleFullScreenChange
      );
      document.removeEventListener(
        "MSFullscreenChange",
        handleFullScreenChange
      );
    };
  }, []);

  const enterFullScreen = () => {
    const elem = document.documentElement as HTMLElement & {
      mozRequestFullScreen?: () => Promise<void>;
      webkitRequestFullscreen?: () => Promise<void>;
      msRequestFullscreen?: () => Promise<void>;
    };

    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.mozRequestFullScreen) {
      elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen();
    }
  };

  const handleStartInterview = () => {
    enterFullScreen();
    setIsInterviewStarted(true);
  };

  // useScreenMonitor();

  if (loading) return <Loader />;

  if (!isInterviewStarted)
    return (
      <div className="w-screen h-screen flex justify-center items-center">
        <InterviewInstructions onStartInterview={handleStartInterview} />
      </div>
    );

  return (

    <div>
      {!isFullScreen && (
        <div className="h-screen w-screen fixed top-0 z-50 flex justify-center items-center bg-black">
          <Card className="p-6 bg-zinc-800/50 border-zinc-700 min-h-[150px]">
            <h2 className="text-xl font-semibold text-white mb-4">
              You must enter fullscreen mode to proceed with the interview.
            </h2>
            <div className="w-full flex items-center justify-center">
              <Button onClick={enterFullScreen} variant="secondary">
                Enter FullScreen
              </Button>
            </div>
          </Card>
        </div>
      )}
      {!loading && interviewData && (
        <InterviewInterface interviewDetails={interviewData} />
      )}
    </div>
  );
};

export default InterviewInterfacePage;
