

const DrillTimer = ({ time, duration, progress, isCountUp = false }) => {
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progress * circumference;

  // Determine color based on time and mode
  let colorClass = 'text-success';
  if (!isCountUp) {
    if (time <= 10) {
      colorClass = 'text-danger';
    } else if (time <= duration / 2) {
      colorClass = 'text-warning';
    }
  } else {
    colorClass = 'text-accent-primary';
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative flex items-center justify-center w-80 h-80">
      {/* Background circle */}
      <svg className="absolute w-full h-full transform -rotate-90">
        <circle
          cx="160"
          cy="160"
          r={radius}
          stroke="currentColor"
          strokeWidth="12"
          fill="transparent"
          className="text-border opacity-50"
        />
        {/* Progress circle */}
        <circle
          cx="160"
          cy="160"
          r={radius}
          stroke="currentColor"
          strokeWidth="12"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={`transition-all duration-1000 ease-linear ${colorClass}`}
          style={{ strokeLinecap: 'round' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`text-6xl font-bold font-mono ${colorClass}`}>
          {formatTime(time)}
        </span>
        <span className="text-sm text-text-muted mt-2 font-medium tracking-widest uppercase">
          {isCountUp ? "Time Elapsed" : "Time Remaining"}
        </span>
      </div>
    </div>
  );
};

export default DrillTimer;
