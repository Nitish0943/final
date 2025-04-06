"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { vapi } from "@/lib/vapi.sdk";
import { interviewer } from "@/constants";
import { createFeedback } from "@/lib/actions/general.action";
import WebcamStream from "@/components/WebCamStream"; // ✅ Corrected import

enum CallStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
}

interface SavedMessage {
  role: "user" | "system" | "assistant";
  content: string;
}

const Agent = ({
  userName,
  userId,
  interviewId,
  feedbackId,
  type,
  questions,
}: AgentProps) => {
  const router = useRouter();
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastMessage, setLastMessage] = useState<string>("");

  useEffect(() => {
    const handleCallEvents = {
      onCallStart: () => setCallStatus(CallStatus.ACTIVE),
      onCallEnd: () => setCallStatus(CallStatus.FINISHED),
      onMessage: (message: Message) => {
        if (message.type === "transcript" && message.transcriptType === "final") {
          setMessages((prev) => [...prev, { role: message.role, content: message.transcript }]);
        }
      },
      onSpeechStart: () => setIsSpeaking(true),
      onSpeechEnd: () => setIsSpeaking(false),
      onError: (error: Error) => console.error("VAPI Error:", error),
    };

    vapi.on("call-start", handleCallEvents.onCallStart);
    vapi.on("call-end", handleCallEvents.onCallEnd);
    vapi.on("message", handleCallEvents.onMessage);
    vapi.on("speech-start", handleCallEvents.onSpeechStart);
    vapi.on("speech-end", handleCallEvents.onSpeechEnd);
    vapi.on("error", handleCallEvents.onError);

    return () => {
      vapi.off("call-start", handleCallEvents.onCallStart);
      vapi.off("call-end", handleCallEvents.onCallEnd);
      vapi.off("message", handleCallEvents.onMessage);
      vapi.off("speech-start", handleCallEvents.onSpeechStart);
      vapi.off("speech-end", handleCallEvents.onSpeechEnd);
      vapi.off("error", handleCallEvents.onError);
    };
  }, []);

  useEffect(() => {
    if (messages.length > 0) setLastMessage(messages[messages.length - 1].content);

    const handleGenerateFeedback = async () => {
      try {
        const { success, feedbackId: id } = await createFeedback({
          interviewId: interviewId!,
          userId: userId!,
          transcript: messages,
          feedbackId,
        });

        if (success && id) {
          router.push(`/interview/${interviewId}/feedback`);
        } else {
          console.error("Error saving feedback");
          router.push("/");
        }
      } catch (error) {
        console.error("Feedback generation failed:", error);
      }
    };

    if (callStatus === CallStatus.FINISHED && type !== "generate") {
      handleGenerateFeedback();
    }
  }, [messages, callStatus, feedbackId, interviewId, router, type, userId]);

  const handleCall = async () => {
    setCallStatus(CallStatus.CONNECTING);
  
    try {
      // Call the API to start the Python script
      const response = await fetch("/api/start-python/", { method: "POST" });
  
      if (!response.ok) {
        throw new Error(`Failed to start Python script: ${response.statusText}`);
      }
  
      const data = await response.json();
      if (!data.success) {
        throw new Error(`Python script error: ${data.error || "Unknown error"}`);
      }
  
      console.log("✅ Python script started successfully.");
    } catch (error) {
      console.error("❌ Error starting Python script:", error);
    }
  
    try {
      // Start VAPI process
      if (type === "generate") {
        await vapi.start(process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID!, {
          variableValues: { username: userName, userid: userId },
        });
      } else {
        const formattedQuestions = questions?.map((q) => `- ${q}`).join("\n") || "";
        await vapi.start(interviewer, { variableValues: { questions: formattedQuestions } });
      }
    } catch (error) {
      console.error("❌ Error starting VAPI:", error);
      setCallStatus(CallStatus.INACTIVE);
    }
  };

  const handleDisconnect = async () => {
    setCallStatus(CallStatus.FINISHED);
  
    try {
      // Stop the Python script with a timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5-second timeout
  
      const response = await fetch("/api/stop-python/", { 
        method: "POST",
        signal: controller.signal
      });
  
      clearTimeout(timeoutId);
  
      if (!response.ok) {
        throw new Error(`Failed to stop Python script: ${response.statusText}`);
      }
  
      const data = await response.json();
      if (!data.success) {
        throw new Error(`Python script stop error: ${data.error || "Unknown error"}`);
      }
  
      console.log("✅ Python script stopped successfully.");
    } catch (error) {
      if (error.name === "AbortError") {
        console.error("❌ Error: Python script stop request timed out.");
      } else {
        console.error("❌ Error stopping Python script:", error);
      }
    }
  
    try {
      vapi.stop(); // Stop the call
      console.log("✅ Call disconnected successfully.");
    } catch (error) {
      console.error("❌ Error disconnecting call:", error);
    }
  };
  
  
  
  return (
    <>
      <div className="call-view">
        {/* AI Interviewer Card */}
        <div className="card-interviewer">
          <div className="avatar">
            <Image src="/ai-avatar.png" alt="AI Interviewer" width={65} height={54} className="object-cover" />
            {isSpeaking && <span className="animate-speak" />}
          </div>
          <h3>AI Interviewer</h3>
        </div>

        {/* User Profile Card with Live Webcam Stream */}
        <div className="card-border">
          <div className="card-content">
            <WebcamStream /> {/* ✅ Live Video Feed Instead of Static Image */}
          </div>
        </div>
      </div>

      {messages.length > 0 && (
        <div className="transcript-border">
          <div className="transcript">
            <p className="animate-fadeIn opacity-100">{lastMessage}</p>
          </div>
        </div>
      )}

      <div className="w-full flex justify-center">
        {callStatus !== CallStatus.ACTIVE ? (
          <button className="btn-call" onClick={handleCall}>
            {callStatus === CallStatus.INACTIVE || callStatus === CallStatus.FINISHED ? "Call" : ". . ."}
          </button>
        ) : (
          <button className="btn-disconnect" onClick={handleDisconnect}>
            End
          </button>
        )}
      </div>
    </>
  );
};

export default Agent;
