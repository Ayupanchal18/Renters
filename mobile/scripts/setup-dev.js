const os = require("os");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const mobileDir = path.join(__dirname, "..");

// 1. Detect computer's local IP address (Wi-Fi / Ethernet)
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const interfaceName in interfaces) {
    const list = interfaces[interfaceName];
    for (const iface of list) {
      // Skip loopback and non-IPv4 addresses
      if (iface.family === "IPv4" && !iface.internal) {
        // Prioritize Wi-Fi and Ethernet adapters
        const nameLower = interfaceName.toLowerCase();
        if (
          nameLower.includes("wi-fi") ||
          nameLower.includes("wifi") ||
          nameLower.includes("ethernet") ||
          nameLower.includes("wlan") ||
          nameLower.includes("wireless")
        ) {
          return iface.address;
        }
      }
    }
  }
  // Fallback to first non-internal IPv4 address found
  for (const interfaceName in interfaces) {
    const list = interfaces[interfaceName];
    for (const iface of list) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "localhost";
}

// 2. Setup ADB reverse if devices are connected
function setupAdbReverse(port = 8080) {
  try {
    const devicesOutput = execSync("adb devices", { encoding: "utf8" });
    const lines = devicesOutput.split("\n").map((line) => line.trim());
    const hasDevices = lines.filter(
      (line) => line && !line.startsWith("List of devices") && !line.startsWith("* daemon")
    );

    if (hasDevices.length > 0) {
      console.log(`📱 Connected Android device(s) found: ${hasDevices.join(", ")}`);
      console.log(`🔄 Running 'adb reverse tcp:${port} tcp:${port}'...`);
      execSync(`adb reverse tcp:${port} tcp:${port}`);
      console.log(`✅ Port ${port} successfully reversed.`);
      return true;
    } else {
      console.log("⚠️ No active Android devices/emulators connected via ADB.");
    }
  } catch (error) {
    console.log("⚠️ ADB port forwarding failed (adb might not be in PATH or no device is connected).");
  }
  return false;
}

// Main runner
function run() {
  console.log("🔧 Starting mobile environment automatic setup...\n");

  const localIp = getLocalIP();
  console.log(`💻 Host computer IP: ${localIp}`);

  // Setup port reverse for port 8080 (Vite frontend + Express backend)
  const reverseSuccessful = setupAdbReverse(8080);

  // If adb reverse is successful (USB or emulator is active), we can use 'localhost'!
  // This is the cleanest setup as it bypasses Windows Firewall entirely.
  // Otherwise, fallback to the computer's actual Wi-Fi IP address for wireless/Expo Go testing.
  let apiUrl;
  if (reverseSuccessful) {
    apiUrl = "http://localhost:8080";
    console.log(`🚀 API Base URL set to: ${apiUrl} (via ADB port forwarding)`);
  } else {
    apiUrl = `http://${localIp}:8080`;
    console.log(`🚀 API Base URL set to: ${apiUrl} (using Host Wi-Fi IP)`);
  }

  // 1. Update mobile/.env
  const envPath = path.join(mobileDir, ".env");
  let envContent = "";
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, "utf8");
  }

  const lines = envContent.split("\n");
  let urlUpdated = false;
  const newLines = lines.map((line) => {
    if (line.startsWith("EXPO_PUBLIC_API_BASE_URL=")) {
      urlUpdated = true;
      return `EXPO_PUBLIC_API_BASE_URL=${apiUrl}`;
    }
    return line;
  });

  if (!urlUpdated) {
    newLines.push(`EXPO_PUBLIC_API_BASE_URL=${apiUrl}`);
  }

  fs.writeFileSync(envPath, newLines.join("\n").trim() + "\n", "utf8");
  console.log(`💾 Updated: mobile/.env`);

  // 2. Update mobile/src/config/env.ts
  const envTsPath = path.join(mobileDir, "src", "config", "env.ts");
  if (fs.existsSync(envTsPath)) {
    let envTsContent = fs.readFileSync(envTsPath, "utf8");
    // Replace const DEFAULT_API_BASE_URL = "...";
    envTsContent = envTsContent.replace(
      /const DEFAULT_API_BASE_URL\s*=\s*['"`](.*?)['"`];/,
      `const DEFAULT_API_BASE_URL = "${apiUrl}";`
    );
    fs.writeFileSync(envTsPath, envTsContent, "utf8");
    console.log(`💾 Updated fallback in: mobile/src/config/env.ts`);
  }

  console.log("\n⭐ Environment setup complete!\n");
}

run();
