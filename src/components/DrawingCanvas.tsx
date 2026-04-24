import React, { useRef, useEffect, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import './DrawingCanvas.css';

type BrushType = 'glow' | 'crayon' | 'rainbow';

const DrawingCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#FFFBFA');
  const [lineWidth, setLineWidth] = useState(6);
  const [brushType, setBrushType] = useState<BrushType>('glow');
  
  // 历史记录状态
  const [history, setHistory] = useState<ImageData[]>([]);
  const [redoStack, setRedoStack] = useState<ImageData[]>([]);
  
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const hueRef = useRef(0); // 用于彩虹笔触

  const hexToRgba = (hex: string, alpha: number) => {
    let r = 255, g = 255, b = 255;
    if (hex.startsWith('#')) {
      r = parseInt(hex.slice(1, 3), 16);
      g = parseInt(hex.slice(3, 5), 16);
      b = parseInt(hex.slice(5, 7), 16);
    }
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const saveState = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (canvas && ctx) {
      const state = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setHistory(prev => [...prev.slice(-19), state]); // 最多保存20步
      setRedoStack([]); // 新的操作清空重做栈
    }
  }, []);

  const applyBrushSettings = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = lineWidth;
    
    if (brushType === 'glow') {
      ctx.strokeStyle = color;
      ctx.shadowBlur = 10;
      ctx.shadowColor = hexToRgba(color, 0.6);
      ctx.globalAlpha = 0.8;
    } else if (brushType === 'crayon') {
      ctx.strokeStyle = color;
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 0.6;
      // 蜡笔效果通过动态改变 lineWidth 模拟
    } else if (brushType === 'rainbow') {
      ctx.shadowBlur = 15;
      ctx.globalAlpha = 1;
    }
  }, [color, lineWidth, brushType]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const initCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;

      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) return;
      
      context.scale(dpr, dpr);
      applyBrushSettings(context);
      contextRef.current = context;
      
      // 初始状态存入历史
      const initialState = context.getImageData(0, 0, canvas.width, canvas.height);
      setHistory([initialState]);
    };

    initCanvas();

    const handleResize = () => {
      if (!canvas || !contextRef.current) return;
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      tempCtx?.drawImage(canvas, 0, 0);

      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;

      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) return;
      context.scale(dpr, dpr);
      applyBrushSettings(context);
      contextRef.current = context;
      context.drawImage(tempCanvas, 0, 0, canvas.width / dpr, canvas.height / dpr);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (contextRef.current) applyBrushSettings(contextRef.current);
  }, [color, lineWidth, brushType, applyBrushSettings]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const { offsetX, offsetY } = getCoordinates(e);
    saveState(); // 开始绘制前保存当前状态
    contextRef.current?.beginPath();
    contextRef.current?.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !contextRef.current) return;
    const { offsetX, offsetY } = getCoordinates(e);
    
    if (brushType === 'rainbow') {
      hueRef.current = (hueRef.current + 2) % 360;
      const rainbowColor = `hsla(${hueRef.current}, 80%, 70%, 0.8)`;
      contextRef.current.strokeStyle = rainbowColor;
      contextRef.current.shadowColor = rainbowColor;
    } else if (brushType === 'crayon') {
      // 模拟蜡笔的随机颗粒感
      contextRef.current.lineWidth = lineWidth + (Math.random() * 2 - 1);
    }

    contextRef.current.lineTo(offsetX, offsetY);
    contextRef.current.stroke();
  };

  const stopDrawing = () => {
    contextRef.current?.closePath();
    setIsDrawing(false);
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    if ('nativeEvent' in e && e.nativeEvent instanceof MouseEvent) {
      return { offsetX: e.nativeEvent.offsetX, offsetY: e.nativeEvent.offsetY };
    } else {
      const touch = (e as React.TouchEvent).touches[0];
      const rect = (canvasRef.current as HTMLCanvasElement).getBoundingClientRect();
      return {
        offsetX: touch.clientX - rect.left,
        offsetY: touch.clientY - rect.top
      };
    }
  };

  const handleUndo = () => {
    if (history.length <= 1 || !contextRef.current || !canvasRef.current) return;
    
    const currentState = contextRef.current.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
    const prevState = history[history.length - 1];
    
    setRedoStack(prev => [currentState, ...prev]);
    setHistory(prev => prev.slice(0, -1));
    
    contextRef.current.putImageData(prevState, 0, 0);
  };

  const handleRedo = () => {
    if (redoStack.length === 0 || !contextRef.current || !canvasRef.current) return;
    
    const nextState = redoStack[0];
    const currentState = contextRef.current.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
    
    setHistory(prev => [...prev, currentState]);
    setRedoStack(prev => prev.slice(1));
    
    contextRef.current.putImageData(nextState, 0, 0);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas || !contextRef.current) return;
    
    saveState();
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FFDEB4', '#B2A4FF', '#FFB4B4', '#B4E4FF']
    });

    canvas.style.transition = 'opacity 0.5s ease-out';
    canvas.style.opacity = '0';
    
    setTimeout(() => {
      contextRef.current?.clearRect(0, 0, canvas.width, canvas.height);
      canvas.style.opacity = '1';
    }, 500);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    const gradient = ctx.createLinearGradient(0, 0, 0, exportCanvas.height);
    gradient.addColorStop(0, '#B2A4FF');
    gradient.addColorStop(1, '#FFDEB4');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

    ctx.drawImage(canvas, 0, 0);

    const link = document.createElement('a');
    link.download = `soulsketch-${new Date().getTime()}.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="canvas-container">
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
      
      <div className="settings-panel">
        <div className="tool-group color-picker-wrapper">
          <input 
            type="color" 
            id="color-input"
            value={color} 
            onChange={(e) => setColor(e.target.value)} 
            className="color-input"
          />
          <label htmlFor="color-input" className="color-label" style={{ backgroundColor: color }} title="选择心情色彩"></label>
        </div>

        <div className="tool-group size-slider-wrapper">
          <span className="tool-icon">🖌️</span>
          <input 
            type="range" 
            min="1" 
            max="40" 
            value={lineWidth} 
            onChange={(e) => setLineWidth(Number(e.target.value))}
            className="size-slider"
          />
          <span className="size-preview" style={{ width: lineWidth/2, height: lineWidth/2, backgroundColor: color }}></span>
        </div>

        <div className="tool-group brush-types">
          <button 
            className={`brush-btn ${brushType === 'glow' ? 'active' : ''}`}
            onClick={() => setBrushType('glow')}
            title="微光笔触"
          >✨</button>
          <button 
            className={`brush-btn ${brushType === 'crayon' ? 'active' : ''}`}
            onClick={() => setBrushType('crayon')}
            title="蜡笔笔触"
          >🖍️</button>
          <button 
            className={`brush-btn ${brushType === 'rainbow' ? 'active' : ''}`}
            onClick={() => setBrushType('rainbow')}
            title="彩虹笔触"
          >🌈</button>
        </div>

        <div className="tool-group undo-redo">
          <button className="icon-btn" onClick={handleUndo} disabled={history.length <= 1} title="撤销">↩️</button>
          <button className="icon-btn" onClick={handleRedo} disabled={redoStack.length === 0} title="重做">↪️</button>
        </div>
      </div>

      <div className="actions-bar">
        <button className="action-btn clear-btn" onClick={handleClear} title="清除烦恼">
          <span className="breeze-icon">🍃</span>
          <span className="btn-text">让烦恼随风散去...</span>
        </button>
        
        <button className="action-btn save-btn" onClick={handleSave} title="留住治愈">
          <span className="save-icon">📸</span>
          <span className="btn-text">留住此刻</span>
        </button>
      </div>
    </div>
  );
};

export default DrawingCanvas;
