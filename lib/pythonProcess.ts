// lib/pythonProcess.ts

let pythonProcess: any = null;

export function getPythonProcess() {
  return pythonProcess;
}

export function setPythonProcess(process: any) {
  pythonProcess = process;
}

export function clearPythonProcess() {
  pythonProcess = null;
}
