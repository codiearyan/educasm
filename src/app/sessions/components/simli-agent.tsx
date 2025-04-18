"use client";

import { useRef, useState } from "react";
import { DailyProvider } from "@daily-co/daily-react";
import DailyIframe, { DailyCall } from "@daily-co/daily-js";
import { VideoBox } from "./video-box";
import { cn } from "@/lib/utils";
import { IconSparkles } from "@tabler/icons-react";

interface SimliAgentProps {
  onStart: () => void;
  onClose: () => void;
  onError: (error: string) => void;
}

const SIMLI_API_KEY = process.env.NEXT_PUBLIC_SIMLI_API_KEY;

export const SimliAgent = ({ onStart, onClose, onError }: SimliAgentProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isAvatarVisible, setIsAvatarVisible] = useState(false);
  const [callObject, setCallObject] = useState<DailyCall | null>(null);
  const myCallObjRef = useRef<DailyCall | null>(null);
  const [chatbotId, setChatbotId] = useState<string | null>(null);
  //@ts-ignore
  const loadingTimeoutRef = useRef<NodeJS.Timeout>();

  const handleJoinRoom = async () => {
    setIsLoading(true);

    try {
      if (!SIMLI_API_KEY) {
        throw new Error("Simli API key is not configured");
      }

      const response = await fetch("https://api.simli.ai/startE2ESession", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apiKey: SIMLI_API_KEY,
          faceId: process.env.NEXT_PUBLIC_SIMLI_FACE_ID,
          voiceId: process.env.NEXT_PUBLIC_SIMLI_VOICE_ID,
          firstMessage: "Hello, I am your tutor. How can I help you today? I'm here to help you with your questions and concerns.",
          systemPrompt: "You are a tutor for a student who is learning. You are to help the student with their questions and concerns.",
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to start session: ${response.statusText}`);
      }

      const data = await response.json();
      const roomUrl = data.roomUrl;
      
      if (!roomUrl) {
        throw new Error("No room URL received from server");
      }

      let newCallObject = DailyIframe.getCallInstance();
      if (newCallObject === undefined) {
        newCallObject = DailyIframe.createCallObject({
          videoSource: false,
        });
      }

      newCallObject.setUserName("User");
      await newCallObject.join({ url: roomUrl });
      myCallObjRef.current = newCallObject;
      setCallObject(newCallObject);
      
      // Set a timeout for loading the chatbot
      loadingTimeoutRef.current = setTimeout(() => {
        if (!chatbotId) {
          handleError("Timeout: Failed to connect to AI tutor");
        }
      }, 30000); // 30 second timeout

      loadChatbot();
    } catch (error) {
      handleError(error instanceof Error ? error.message : "Failed to start session");
    }
  };

  const handleError = (errorMessage: string) => {
    console.error(errorMessage);
    setIsLoading(false);
    setIsAvatarVisible(false);
    if (callObject) {
      callObject.leave();
      setCallObject(null);
    }
    onError(errorMessage);
  };

  const loadChatbot = async () => {
    if (myCallObjRef.current) {
      let chatbotFound: boolean = false;

      const participants = myCallObjRef.current.participants();
      for (const [key, participant] of Object.entries(participants)) {
        if (participant.user_name === "Chatbot") {
          setChatbotId(participant.session_id);
          chatbotFound = true;
          setIsLoading(false);
          setIsAvatarVisible(true);
          if (loadingTimeoutRef.current) {
            clearTimeout(loadingTimeoutRef.current);
          }
          onStart();
          break;
        }
      }
      if (!chatbotFound) {
        setTimeout(loadChatbot, 500);
      }
    } else {
      setTimeout(loadChatbot, 500);
    }
  };

  const handleLeaveRoom = async () => {
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    if (callObject) {
      await callObject.leave();
      setCallObject(null);
      onClose();
      setIsAvatarVisible(false);
      setIsLoading(false);
    }
  };

  return (
    <>
      {isAvatarVisible && (
        <div className="h-[350px] w-[350px]">
          <DailyProvider callObject={callObject}>
            {chatbotId && <VideoBox id={chatbotId} />}
          </DailyProvider>
        </div>
      )}
      <div className="flex flex-col items-center w-full">
        {!isAvatarVisible ? (
          <button
            onClick={handleJoinRoom}
            disabled={isLoading}
            className={cn(
              "w-full h-12 disabled:bg-gray-700 bg-gradient-to-r from-purple-500 to-blue-500",
              "text-white rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
            )}
          >
            {isLoading ? (
              <IconSparkles className="h-5 w-5 animate-spin" />
            ) : (
              "Start Session"
            )}
          </button>
        ) : (
          <button
            onClick={handleLeaveRoom}
            className="w-full h-12 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all duration-300"
          >
            End Session
          </button>
        )}
      </div>
    </>
  );
}; 