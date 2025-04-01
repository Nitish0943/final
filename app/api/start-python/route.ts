import { NextResponse } from "next/server";
import { exec } from "child_process";
import path from "path";

export async function POST() {
  try {
    // Ensure correct absolute path resolution
    const scriptPath = path.join(process.cwd(), "backend", "eye_gaze.py");
    
    // Wrap the script path in quotes to handle spaces in file paths
    const command = `python "${scriptPath}"`;
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error("Error starting Python script:", error);
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }
      if (stderr) {
        console.error("Python script stderr:", stderr);
      }
      console.log("Python script output:", stdout);
    });

    return NextResponse.json({ success: true, message: "Python script started" });
  } catch (err: any) {
    console.error("Unexpected error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
