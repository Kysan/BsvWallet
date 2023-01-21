import fs from "fs";

function readFileSync(filePath: string): string {
  if (typeof window === "undefined") {
    try {
      return fs.readFileSync(filePath).toString();
    } catch {
      return "";
    }
  } else {
    var buffer = localStorage.getItem(filePath);
    return buffer;
  }
}

function writeFileSync(filePath: string, data: string) {
  if (typeof window === "undefined") {
    fs.writeFileSync(filePath, data);
  } else {
    localStorage.setItem(filePath, data);
  }
}

function existsSync(path: string) {
  if (typeof window === "undefined") {
    return fs.existsSync(path);
  } else {
    return localStorage.getItem(path);
  }
}

function mkdirSync(path: string) {
  if (typeof window === "undefined") {
    fs.mkdirSync(path);
  } else {
    // pas besoin tout les paths sont valide avec le localStorage
  }
}

export default { readFileSync, writeFileSync, existsSync, mkdirSync };
