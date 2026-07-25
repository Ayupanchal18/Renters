/**
 * Color translation utilities
 */

export function hslToHex(hslStr: string | undefined): string {
  if (!hslStr) return "transparent";
  if (!hslStr.startsWith("hsl")) return hslStr;
  
  // Parse hsl(h, s%, l%) or hsla(h, s%, l%, a)
  const matches = hslStr.match(/hsla?\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*(?:,\s*([\d.]+)\s*)?\)/);
  if (!matches) return hslStr;
  
  const h = parseInt(matches[1], 10);
  const s = parseInt(matches[2], 10) / 100;
  const l = parseInt(matches[3], 10) / 100;
  const a = matches[4] !== undefined ? parseFloat(matches[4]) : 1;
  
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  
  if (0 <= h && h < 60) {
    r = c; g = x; b = 0;
  } else if (60 <= h && h < 120) {
    r = x; g = c; b = 0;
  } else if (120 <= h && h < 180) {
    r = 0; g = c; b = x;
  } else if (180 <= h && h < 240) {
    r = 0; g = x; b = c;
  } else if (240 <= h && h < 300) {
    r = x; g = 0; b = c;
  } else if (300 <= h && h < 360) {
    r = c; g = 0; b = x;
  }
  
  const red = Math.round((r + m) * 255).toString(16).padStart(2, "0");
  const green = Math.round((g + m) * 255).toString(16).padStart(2, "0");
  const blue = Math.round((b + m) * 255).toString(16).padStart(2, "0");
  
  if (a < 1) {
    const alpha = Math.round(a * 255).toString(16).padStart(2, "0");
    return `#${red}${green}${blue}${alpha}`.toUpperCase();
  }
  return `#${red}${green}${blue}`.toUpperCase();
}

/**
 * Get HSL color with custom opacity
 */
export function getOpacityColor(hslStr: string | undefined, opacity: number): string {
  if (!hslStr) return "transparent";
  if (hslStr.startsWith("hsl(")) {
    return hslStr.replace("hsl(", "hsla(").replace(")", `, ${opacity})`);
  }
  return hslStr;
}
