import { useRef, useEffect } from 'react';

interface BarChartProps {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
}

export function BarChart({ data, color = '#3b82f6', height = 220 }: BarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = height;
    const padding = { top: 20, right: 16, bottom: 40, left: 40 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    ctx.clearRect(0, 0, w, h);

    const maxVal = Math.max(...data.map((d) => d.value), 1);
    const barCount = data.length;
    const barWidth = barCount > 0 ? chartW / barCount * 0.65 : 0;
    const gap = barCount > 0 ? chartW / barCount * 0.35 : 0;

    // Grid lines
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--grid-color').trim() || '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.font = '11px sans-serif';
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--axis-text').trim() || '#9ca3af';

    const gridSteps = 4;
    for (let i = 0; i <= gridSteps; i++) {
      const y = padding.top + (chartH / gridSteps) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(w - padding.right, y);
      ctx.stroke();
      const val = Math.round(maxVal - (maxVal / gridSteps) * i);
      ctx.textAlign = 'right';
      ctx.fillText(String(val), padding.left - 8, y + 4);
    }

    // Bars
    data.forEach((d, i) => {
      const x = padding.left + (chartW / barCount) * i + gap / 2;
      const barH = (d.value / maxVal) * chartH;
      const y = padding.top + chartH - barH;

      const gradient = ctx.createLinearGradient(0, y, 0, y + barH);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, color + '60');
      ctx.fillStyle = gradient;

      const r = Math.min(barWidth / 2, 6);
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + barWidth - r, y);
      ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + r);
      ctx.lineTo(x + barWidth, y + barH);
      ctx.lineTo(x, y + barH);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
      ctx.fill();

      // Value label
      if (d.value > 0) {
        ctx.fillStyle = color;
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(String(d.value), x + barWidth / 2, y - 6);
      }

      // X label
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--axis-text').trim() || '#9ca3af';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      const label = d.label.length > 12 ? d.label.slice(0, 10) + '..' : d.label;
      ctx.fillText(label, x + barWidth / 2, h - padding.bottom + 18);
    });
  }, [data, color, height]);

  return <canvas ref={canvasRef} style={{ width: '100%', height }} />;
}

interface LineChartProps {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
}

export function LineChart({ data, color = '#10b981', height = 220 }: LineChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = height;
    const padding = { top: 20, right: 20, bottom: 40, left: 40 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    ctx.clearRect(0, 0, w, h);

    const maxVal = Math.max(...data.map((d) => d.value), 1);

    // Grid lines
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--grid-color').trim() || '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.font = '11px sans-serif';
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--axis-text').trim() || '#9ca3af';

    const gridSteps = 4;
    for (let i = 0; i <= gridSteps; i++) {
      const y = padding.top + (chartH / gridSteps) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(w - padding.right, y);
      ctx.stroke();
      const val = Math.round(maxVal - (maxVal / gridSteps) * i);
      ctx.textAlign = 'right';
      ctx.fillText(String(val), padding.left - 8, y + 4);
    }

    if (data.length < 2) return;

    const stepX = chartW / (data.length - 1);
    const points = data.map((d, i) => ({
      x: padding.left + stepX * i,
      y: padding.top + chartH - (d.value / maxVal) * chartH,
    }));

    // Area fill
    const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
    gradient.addColorStop(0, color + '40');
    gradient.addColorStop(1, color + '05');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(points[0].x, padding.top + chartH);
    points.forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length - 1].x, padding.top + chartH);
    ctx.closePath();
    ctx.fill();

    // Line
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    points.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();

    // Dots
    points.forEach((p, i) => {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();

      // X label
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--axis-text').trim() || '#9ca3af';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      const label = data[i].label.length > 10 ? data[i].label.slice(0, 8) + '..' : data[i].label;
      ctx.fillText(label, p.x, h - padding.bottom + 18);
    });
  }, [data, color, height]);

  return <canvas ref={canvasRef} style={{ width: '100%', height }} />;
}

interface DonutChartProps {
  data: { label: string; value: number; color: string }[];
  size?: number;
}

export function DonutChart({ data, size = 180 }: DonutChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, size, size);

    const total = data.reduce((s, d) => s + d.value, 0);
    if (total === 0) return;

    const cx = size / 2;
    const cy = size / 2;
    const outerR = size / 2 - 8;
    const innerR = outerR * 0.62;

    let angle = -Math.PI / 2;

    data.forEach((d) => {
      const slice = (d.value / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(cx, cy, outerR, angle, angle + slice);
      ctx.arc(cx, cy, innerR, angle + slice, angle, true);
      ctx.closePath();
      ctx.fillStyle = d.color;
      ctx.fill();
      angle += slice;
    });

    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--axis-text').trim() || '#9ca3af';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(total), cx, cy - 6);
    ctx.font = '11px sans-serif';
    ctx.fillText('Total', cx, cy + 14);
  }, [data, size]);

  return <canvas ref={canvasRef} style={{ width: size, height: size }} />;
}

interface MultiLineChartProps {
  labels: string[];
  series: { name: string; color: string; values: number[] }[];
  height?: number;
}

export function MultiLineChart({ labels, series, height = 280 }: MultiLineChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = height;
    const padding = { top: 20, right: 120, bottom: 44, left: 40 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    ctx.clearRect(0, 0, w, h);

    const allValues = series.flatMap((s) => s.values);
    const maxVal = Math.max(...allValues, 1);
    const axisTextColor = getComputedStyle(document.documentElement).getPropertyValue('--axis-text').trim() || '#9ca3af';
    const gridColor = getComputedStyle(document.documentElement).getPropertyValue('--grid-color').trim() || '#e5e7eb';

    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    ctx.font = '11px sans-serif';
    ctx.fillStyle = axisTextColor;

    const gridSteps = 4;
    for (let i = 0; i <= gridSteps; i++) {
      const y = padding.top + (chartH / gridSteps) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(w - padding.right, y);
      ctx.stroke();
      const val = Math.round(maxVal - (maxVal / gridSteps) * i);
      ctx.textAlign = 'right';
      ctx.fillText(String(val), padding.left - 8, y + 4);
    }

    if (labels.length < 2) return;

    const stepX = chartW / (labels.length - 1);

    // X labels
    labels.forEach((label, i) => {
      const x = padding.left + stepX * i;
      ctx.fillStyle = axisTextColor;
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      const shortened = label.length > 12 ? label.slice(0, 10) + '..' : label;
      ctx.fillText(shortened, x, h - padding.bottom + 16);
    });

    // Draw each series
    series.forEach((s) => {
      const points = s.values.map((v, i) => ({
        x: padding.left + stepX * i,
        y: padding.top + chartH - (v / maxVal) * chartH,
      }));

      // Line
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();

      // Dots
      points.forEach((p) => {
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = s.color;
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    });

    // Legend
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    let legendY = padding.top + 4;
    series.forEach((s) => {
      const legendX = w - padding.right + 12;
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(legendX + 5, legendY + 4, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = axisTextColor;
      const name = s.name.length > 14 ? s.name.slice(0, 12) + '..' : s.name;
      ctx.fillText(name, legendX + 14, legendY + 8);
      legendY += 18;
    });
  }, [labels, series, height]);

  return <canvas ref={canvasRef} style={{ width: '100%', height }} />;
}
