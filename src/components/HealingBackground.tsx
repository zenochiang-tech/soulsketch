
import './HealingBackground.css';

const HealingBackground: React.FC = () => {
  return (
    <div className="healing-background">
      <div className="gradient-sphere sphere-1"></div>
      <div className="gradient-sphere sphere-2"></div>
      <div className="gradient-sphere sphere-3"></div>
      <div className="healing-overlay"></div>
    </div>
  );
};

export default HealingBackground;
