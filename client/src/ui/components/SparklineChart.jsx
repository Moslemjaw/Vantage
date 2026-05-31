import React, { useEffect, useRef } from 'react';

export default function SparklineChart({ data, width = 100, height = 30, color = '#22d3ee', lineWidth = 2 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !data || data.length === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, w, h);

    // Extract values (assuming data is array of objects with 'close' or just numbers)
    const values = data.map(d => typeof d === 'number' ? d : d.close || d.value || 0).filter(v => v > 0);
    if (values.length < 2) return;

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1; // avoid division by zero
    const padding = 2;

    const stepX = w / (values.length - 1);
    const scaleY = (h - padding * 2) / range;

    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    // Convert hex to rgb for rgba
    let rgb = '34, 211, 238'; // Default cyan
    if (color === '#10b981') rgb = '16, 185, 129'; // Emerald
    if (color === '#f43f5e') rgb = '244, 63, 94'; // Rose

    gradient.addColorStop(0, `rgba(${rgb}, 0.3)`);
    gradient.addColorStop(1, `rgba(${rgb}, 0)`);

    // Draw path
    ctx.beginPath();
    ctx.moveTo(0, h - (values[0] - min) * scaleY - padding);
    
    for (let i = 1; i < values.length; i++) {
      const x = i * stepX;
      const y = h - (values[i] - min) * scaleY - padding;
      ctx.lineTo(x, y);
    }

    // Stroke line
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Fill area
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

  }, [data, width, height, color]);

  return (
    <canvas 
      ref={canvasRef} 
      width={width} 
      height={height} 
      className="inline-block"
      style={{ width: `${width}px`, height: `${height}px` }}
    />
  );
}
