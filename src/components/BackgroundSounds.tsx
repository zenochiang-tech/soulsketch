import React, { useState, useRef, useEffect } from 'react';
import './BackgroundSounds.css';

interface SoundTrack {
  id: string;
  name: string;
  icon: string;
  url: string;
}

const TRACKS: SoundTrack[] = [
  { id: 'rain', name: '细雨', icon: '🌧️', url: 'https://actions.google.com/sounds/v1/weather/rain_heavy_loud.ogg' },
  { id: 'waves', name: '海浪', icon: '🌊', url: 'https://actions.google.com/sounds/v1/water/waves_crashing_on_shore.ogg' },
  { id: 'forest', name: '森林', icon: '🍃', url: 'https://actions.google.com/sounds/v1/ambient/morning_forest.ogg' },
  { id: 'fire', name: '篝火', icon: '🔥', url: 'https://actions.google.com/sounds/v1/foley/fire_embers_crackling.ogg' },
];

const BackgroundSounds: React.FC = () => {
  const [activeTrack, setActiveTrack] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.5);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const toggleSound = (trackId: string) => {
    if (activeTrack === trackId) {
      // 如果点击当前正在播放的，则停止
      audioRef.current?.pause();
      setActiveTrack(null);
    } else {
      // 播放新的轨道
      setActiveTrack(trackId);
      const track = TRACKS.find(t => t.id === trackId);
      if (track && audioRef.current) {
        audioRef.current.src = track.url;
        audioRef.current.play().catch(err => console.log("Autoplay blocked or load error", err));
      }
    }
  };

  return (
    <div className="sound-manager">
      <audio ref={audioRef} loop />
      
      <div className="sound-controls">
        {TRACKS.map(track => (
          <button 
            key={track.id}
            className={`sound-btn ${activeTrack === track.id ? 'active' : ''}`}
            onClick={() => toggleSound(track.id)}
            title={track.name}
          >
            <span className="sound-icon">{track.icon}</span>
          </button>
        ))}
        
        <div className="volume-slider-wrapper">
          <span className="vol-icon">🔊</span>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.01" 
            value={volume} 
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="volume-slider"
          />
        </div>
      </div>
    </div>
  );
};

export default BackgroundSounds;
