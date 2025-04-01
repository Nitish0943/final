"use client";
import { useEffect, useState } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:5000"); // Connect to Python backend

const EyeTracking = () => {
  const [videoFrame, setVideoFrame] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  useEffect(() => {
    const startPythonBackend = async () => {
      try {
        const response = await fetch("/api/start-python", { method: "POST" });
        if (!response.ok) {
          throw new Error(`Failed to start Python backend: ${response.statusText}`);
        }
        console.log("Python backend started successfully.");
      } catch (error) {
        console.error("Error starting Python backend:", error);
      }
    };

    startPythonBackend();

    socket.on("video_frame", (data: string) => {
      setVideoFrame(`data:image/jpeg;base64,${data}`);
    });

    socket.on("alert", (data: { message: string }) => {
      setAlertMessage(data.message);
      setTimeout(() => setAlertMessage(null), 5000);
    });

    return () => {
      socket.off("video_frame");
      socket.off("alert");
    };
  }, []);

  return (
    <div className="text-center">
      <h3 className="text-lg font-bold mb-2">Live Eye Tracking</h3>
      {alertMessage && (
        <div className="bg-red-500 text-white p-2 rounded mb-2">{alertMessage}</div>
      )}
      <div className="border border-gray-300 p-2 rounded-md">
        {videoFrame ? (
          <img src={videoFrame} alt="Eye Tracking Feed" className="w-full" />
        ) : (
          <p>Loading video feed...</p>
        )}
      </div>
    </div>
  );
};

export default EyeTracking;
