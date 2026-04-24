
import HealingBackground from './components/HealingBackground';
import DrawingCanvas from './components/DrawingCanvas';
import BackgroundSounds from './components/BackgroundSounds';
import './App.css';

function App() {
  return (
    <div className="App">
      <HealingBackground />
      <DrawingCanvas />
      <BackgroundSounds />
    </div>
  );
}

export default App;
