// small helpers shared by the svg charts
// round the max up so axis ticks look clean
export function niceMax(max) {
  if (!max || max <= 0) return 1;
  const power = Math.pow(10, Math.floor(Math.log10(max)));
  const fraction = max / power;
  const nice = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
  return nice * power;
}

// evenly spaced tick values from 0 to the top
export function makeTicks(max, count = 4) {
  const top = niceMax(max);
  return Array.from({ length: count + 1 }, (_, index) => (top / count) * index);
}

// rough width of one character in px for the chart font
export const charWidth = (fontSize) => fontSize * 0.58;

// split a label into lines that fit, long words are broken so nothing gets cut off
export function wrapLabel(text, maxWidth, fontSize) {
  const perLine = Math.max(1, Math.floor(maxWidth / charWidth(fontSize)));
  const lines = [];
  let line = "";
  String(text)
    .split(/\s+/)
    .filter(Boolean)
    .forEach((word) => {
      while (word.length > perLine) {
        if (line) {
          lines.push(line);
          line = "";
        }
        lines.push(word.slice(0, perLine));
        word = word.slice(perLine);
      }
      if (!line) line = word;
      else if (line.length + 1 + word.length <= perLine) line += ` ${word}`;
      else {
        lines.push(line);
        line = word;
      }
    });
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

// smooth curve through the points (monotone, so it never dips below the data)
export function monotonePath(points) {
  const n = points.length;
  if (!n) return "";
  if (n === 1) return `M${points[0][0]} ${points[0][1]}`;
  const dx = [];
  const slope = [];
  for (let i = 0; i < n - 1; i++) {
    dx[i] = points[i + 1][0] - points[i][0];
    slope[i] = (points[i + 1][1] - points[i][1]) / dx[i];
  }
  const tangent = [slope[0]];
  for (let i = 1; i < n - 1; i++) {
    if (slope[i - 1] * slope[i] <= 0) tangent[i] = 0;
    else
      tangent[i] =
        (3 * (dx[i - 1] + dx[i])) /
        ((2 * dx[i] + dx[i - 1]) / slope[i - 1] +
          (dx[i] + 2 * dx[i - 1]) / slope[i]);
  }
  tangent[n - 1] = slope[n - 2];
  let path = `M${points[0][0]} ${points[0][1]}`;
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    const step = dx[i] / 3;
    path += ` C${x0 + step} ${y0 + tangent[i] * step} ${x1 - step} ${
      y1 - tangent[i + 1] * step
    } ${x1} ${y1}`;
  }
  return path;
}
