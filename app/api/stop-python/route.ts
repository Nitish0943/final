// app/api/stop-python/route.ts
import { NextResponse } from "next/server";
import {
  getPythonProcess,
  clearPythonProcess,
} from "@/lib/pythonProcess";

export async function POST() {
  const pythonProcess = getPythonProcess();

  if (!pythonProcess) {
    return NextResponse.json(
      { success: false, message: "Python backend not running" },
      { status: 400 }
    );
  }

  try {
    pythonProcess.kill();
    clearPythonProcess();
    return NextResponse.json(
      { success: true, message: "Python backend stopped" },
      { status: 200 }
    );
  } catch (err) {
    console.error("Failed to stop Python process:", err);
    return NextResponse.json(
      { success: false, error: "Failed to stop Python backend" },
      { status: 500 }
    );
  }
}
