"use client";

import React, { useEffect, useRef, useState } from "react";
import * as tmImage from "@teachablemachine/image";

interface WebcamStreamProps {
  shouldRun: boolean;
}

const WebcamStream = ({ shouldRun }: WebcamStreamProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [prediction, setPrediction] = useState({ cheating: 0, notCheating: 0 });
  const modelRef = useRef<tmImage.CustomMobileNet | null>(null);
  const animationRef = useRef<number>();
  const streamRef = useRef<MediaStream | null>(null);

  const MODEL_URL = "/models/tm-my-image-model/";

  useEffect(() => {
    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();

          // Ensure video is ready
          await new Promise(resolve => {
            const checkReady = () => {
              if (videoRef.current && videoRef.current.readyState >= 3) resolve(true);
              else setTimeout(checkReady, 100);
            };
            checkReady();
          });
        } else {
          console.error("Video element is not available.");
          return;
        }

        if (!modelRef.current) {
          console.log("Loading model...");
          try {
            modelRef.current = await tmImage.load(
              `${MODEL_URL}model.json`,
              `${MODEL_URL}metadata.json`
            );
            console.log("Model loaded successfully.");
          } catch (modelError) {
            console.error("Error loading model:", modelError);
            return;
          }
        }

        const predictLoop = async () => {
          if (videoRef.current && modelRef.current) {
            try {
              const predictions = await modelRef.current.predict(videoRef.current);
              console.log("Raw Predictions:", predictions);

              // Validate predictions
              if (!predictions || predictions.length === 0) {
                console.error("No predictions received from the model.");
                return;
              }

              // Map predictions to their respective classes
              const cheatingPrediction = predictions.find(
                p => p.className.toLowerCase() === "cheating"
              );
              const notCheatingPrediction = predictions.find(
                p => p.className.toLowerCase() === "not cheating"
              );

              const cheating = cheatingPrediction ? cheatingPrediction.probability : 0;
              const notCheating = notCheatingPrediction ? notCheatingPrediction.probability : 0;

              // Log normalized probabilities for debugging
              console.log("Mapped Predictions:", {
                cheating: (cheating * 100).toFixed(2),
                notCheating: (notCheating * 100).toFixed(2),
              });

              setPrediction({ cheating, notCheating });
            } catch (predictionError) {
              console.error("Error during prediction:", predictionError);
            }
          } else {
            console.error("Video element or model is not ready.");
          }

          animationRef.current = requestAnimationFrame(predictLoop);
        };

        predictLoop();
      } catch (err) {
        console.error("Webcam/model initialization error:", err);
      }
    };

    if (shouldRun) {
      init();
    } else {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    }

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [shouldRun]);

  return (
    <div className="w-full h-96 max-w-md rounded-2xl overflow-hidden relative shadow-lg bg-black">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-0 w-full bg-black/70 text-white text-center py-2 text-sm">
        <p>not cheating: {(prediction.notCheating * 100).toFixed(2)}%</p>
        <p>cheating: {(prediction.cheating * 100).toFixed(2)}%</p>
        <p className="text-lg font-semibold mt-1">Nitish Pathak</p>
      </div>
    </div>
  );
};

export default WebcamStream;
