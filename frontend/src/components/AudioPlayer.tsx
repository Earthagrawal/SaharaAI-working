import React from 'react';

interface AudioPlayerProps {
  src: string;
  title?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ src, title }) => {
  const ref = React.useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [volume, setVolume] = React.useState(1);
  React.useEffect(() => {
    if (!ref.current) return;
    const audio = ref.current;
    const onTime = () => setProgress(audio.currentTime);
    const onLoaded = () => setDuration(audio.duration);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onLoaded);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onLoaded);
    };
  }, []);
  React.useEffect(() => {
    if (ref.current) ref.current.volume = volume;
  }, [volume]);
  return (
    <div className="flex items-center gap-2" role="region" aria-label="Audio player">
      <button className="btn-icon" aria-label={playing ? 'Pause' : 'Play'} onClick={() => {
        if (!ref.current) return;
        if (playing) { ref.current.pause(); setPlaying(false); }
        else { ref.current.play(); setPlaying(true); }
      }}>{playing ? '⏸' : '▶️'}</button>
      <input type="range" min={0} max={duration} value={progress} onChange={e => {
        if (!ref.current) return;
        ref.current.currentTime = Number(e.target.value);
        setProgress(Number(e.target.value));
      }} className="flex-1" aria-label="Seek" />
      <input type="range" min={0} max={1} step={0.01} value={volume} onChange={e => setVolume(Number(e.target.value))} aria-label="Volume" className="w-16" />
      <audio ref={ref} src={src} onEnded={() => setPlaying(false)} hidden />
      {title && <span className="text-xs text-slate-500 ml-2">{title}</span>}
      <span className="text-xs ml-2">{Math.floor(progress)}/{Math.floor(duration)}s</span>
    </div>
  );
};
