'use client';

import { Track, usePlayerStore } from '@/lib/store';
import { MoreHorizontal, Trash2 } from 'lucide-react';
import { SmoothImage } from '@/components/SmoothImage';
import { getHighResImage } from '@/lib/utils';
import { MarqueeText } from './MarqueeText';

export function TrackItem({ track, queue, onRemove }: { track: Track; queue?: Track[]; onRemove?: (track: Track) => void }) {
  const playTrack = usePlayerStore((state) => state.playTrack);
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const setTrackToAdd = usePlayerStore((state) => state.setTrackToAdd);
  const isCurrent = currentTrack?.videoId === track.videoId;

  const thumbnail = getHighResImage(track.thumbnails?.[track.thumbnails.length - 1]?.url, 200);
  const artistName = Array.isArray(track.artist) ? track.artist.map(a => a.name).join(', ') : track.artist?.name || 'Unknown Artist';

  return (
    <div
      className="flex items-center p-3 hover:bg-white/5 rounded-xl cursor-pointer group transition-colors"
      onClick={() => playTrack(track, queue)}
    >
      <div className="relative w-12 h-12 rounded-md overflow-hidden shrink-0 bg-white/5">
        <SmoothImage src={thumbnail} alt={track.name} fill sizes="48px" className="object-cover" />
        {isCurrent && isPlaying && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="flex gap-0.5 items-end h-3">
              <div className="w-1 bg-[#FA243C] animate-[bounce_1s_infinite_0ms]" />
              <div className="w-1 bg-[#FA243C] animate-[bounce_1s_infinite_200ms]" />
              <div className="w-1 bg-[#FA243C] animate-[bounce_1s_infinite_400ms]" />
            </div>
          </div>
        )}
      </div>
      <div className="ml-4 flex-1 min-w-0 border-b border-white/5 pb-3 group-hover:border-transparent transition-colors">
        <MarqueeText text={track.name} className={`font-medium ${isCurrent ? 'text-[#FA243C]' : 'text-white'}`} />
        <MarqueeText text={artistName} className="text-sm text-white/60 mt-0.5" />
      </div>
      <div className="flex items-center gap-1">
        {onRemove && (
          <button 
            className="w-8 h-8 rounded-full liquid-glass-icon text-white/60 hover:text-red-500 transition-all"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(track);
            }}
            title="Hapus lagu"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
        <button 
          className="w-8 h-8 rounded-full liquid-glass-icon text-white/70 hover:text-white transition-all"
          onClick={(e) => {
            e.stopPropagation();
            setTrackToAdd(track);
          }}
          title="Opsi lagu"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
