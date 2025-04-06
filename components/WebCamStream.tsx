"use client";

import React, { useEffect, useRef, useState } from "react";
import * as tmImage from "@teachablemachine/image";

const WebCamStream = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [prediction, setPrediction] = useState({ cheating: 0, notCheating: 0 });

  const MODEL_URL = "/models/tm-my-image-model/";

  useEffect(() => {
    const initWebcam = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    };

    const loadModelAndPredict = async () => {
      const model = await tmImage.load(`${MODEL_URL}model.json`, `${MODEL_URL}metadata.json`);
      const loop = async () => {
        if (videoRef.current && model) {
          const predictions = await model.predict(videoRef.current);
          const cheating = predictions.find(p => p.className === "cheating")?.probability || 0;
          const notCheating = predictions.find(p => p.className === "not cheating")?.probability || 0;
          setPrediction({ cheating, notCheating });
        }
        requestAnimationFrame(loop);
      };
      loop();
    };

    initWebcam().then(loadModelAndPredict);
  }, []);

  return (
    <div className="w-full h-96 max-w-md rounded-2xl overflow-hidden relative shadow-lg bg-black">
      {/* 👀 Video Feed */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="w-full h-full object-cover"
      />

      {/* 🔤 Overlay: Name + Prediction */}
      <div className="absolute bottom-0 w-full bg-black/60 text-white text-center py-2 text-sm">
        <p>not cheating: {(prediction.notCheating * 100).toFixed(2)}%</p>
        <p>cheating: {(prediction.cheating * 100).toFixed(2)}%</p>
        <p className="text-lg font-semibold mt-1">Nitish Pathak</p>
      </div>
    </div>
  );
};

export default WebCamStream;
