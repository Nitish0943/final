// app/api/start-python/route.ts
import { NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";
import { getPythonProcess, setPythonProcess } from "@/lib/pythonProcess";

export async function POST() {
  if (getPythonProcess()) {
    return NextResponse.json(
      { success: true, message: "Python backend already running" },
      { status: 200 }
    );
  }

  try {
    const scriptPath = path.join(process.cwd(), "eye_gaze.py");
    const pythonProcess = spawn("python", [scriptPath]);

    pythonProcess.stdout.on("data", (data: Buffer) => {
      console.log(`[Python STDOUT]: ${data.toString()}`);
    });

    pythonProcess.stderr.on("data", (data: Buffer) => {
      console.error(`[Python STDERR]: ${data.toString()}`);
    });

    pythonProcess.on("exit", (code: number) => {
      console.log(`Python process exited with code ${code}`);
      setPythonProcess(null);
    });

    setPythonProcess(pythonProcess);

    return NextResponse.json(
      { success: true, message: "Python backend started" },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error launching Python script:", err);
    return NextResponse.json(
      { success: false, error: "Failed to launch Python script" },
      { status: 500 }
    );
  }
}
