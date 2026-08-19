'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Track, usePlayerStore } from '@/lib/store';
import { 
  History, 
  Cast, 
  Play, 
  MoreVertical, 
  Radio, 
  Sparkles, 
  RefreshCw, 
  Clock, 
  Compass, 
  Flame, 
  Volume2,
  TrendingUp,
  Disc3
} from 'lucide-react';
import Image from 'next/image';
import { SmoothImage } from '@/components/SmoothImage';
import { HorizontalScroll } from '@/components/HorizontalScroll';
import { MixedScroll } from '@/components/MixedScroll';
import { CommunityPlaylistCard } from '@/components/CommunityPlaylistCard';
import { MarqueeText } from '@/components/MarqueeText';
import { getHighResImage } from '@/lib/utils';
import { motion, AnimatePresence, Variants } from 'motion/react';
import Link from 'next/link';
import { HomeSkeleton } from '@/components/HomeSkeleton';

interface MoodCategory {
  id: string;
  name: string;
  query: string;
  icon?: string;
}

const METROLIST_MOODS: MoodCategory[] = [
  { id: 'all', name: 'Semua', query: '' },
  { id: 'chill', name: 'Santai', query: 'lagu santai akustik chill indonesia' },
  { id: 'focus', name: 'Fokus', query: 'lofi study focus deep instrumental' },
  { id: 'commute', name: 'Perjalanan', query: 'roadtrip music commute songs indonesia' },
  { id: 'workout', name: 'Olahraga', query: 'workout gym pump up energy hits' },
  { id: 'energize', name: 'Energi', query: 'upbeat pop dance semangat hits' },
  { id: 'party', name: 'Pesta', query: 'party dance club remix songs' },
  { id: 'romance', name: 'Romantis', query: 'lagu cinta romantis indonesia terbaik' },
  { id: 'sleep', name: 'Tidur', query: 'relaxing sleep piano rain peaceful' },
  { id: 'nostalgia', name: 'Nostalgia', query: 'lagu nostalgia 90an 2000an indonesia' },
  { id: 'acoustic', name: 'Akustik', query: 'lagu akustik cafe santai indonesia' },
  { id: 'pop', name: 'Pop Hits', query: 'top hits pop indonesia 2024 terbaru' },
  { id: 'rock', name: 'Rock', query: 'lagu rock indonesia terbaik alternative' },
  { id: 'jedagjedug', name: 'Jedag Jedug', query: 'lagu fyp tiktok remix jedag jedug' },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', damping: 24, stiffness: 260 },
  },
};

export default function Home() {
  const [heroTracks, setHeroTracks] = useState<Track[]>([]);
  const [speedDialTracks, setSpeedDialTracks] = useState<Track[]>([]);
  const [quickPicksTracks, setQuickPicksTracks] = useState<Track[]>([]);
  const [communityPlaylists, setCommunityPlaylists] = useState<any[]>([]);
  const [artists, setArtists] = useState<any[]>([]);
  const [categories, setCategories] = useState<{ key: string; title: string; type: 'song' | 'mixed'; items: any[] }[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [activeMoodId, setActiveMoodId] = useState<string>('all');
  const [moodFilterData, setMoodFilterData] = useState<{ title: string; tracks: Track[] }[]>([]);
  const [loadingMood, setLoadingMood] = useState(false);
  
  const playTrack = usePlayerStore((state) => state.playTrack);
  const history = usePlayerStore((state) => state.history);
  const setTrackToAdd = usePlayerStore((state) => state.setTrackToAdd);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  
  const latestHistoryVideoId = history[0]?.track?.videoId;

  const [greeting, setGreeting] = useState({ 
    title: 'Selamat Datang', 
    sub: 'Mulai harimu dengan musik favorit' 
  });

  // Metrolist Dynamic Time-based Greeting (Calculated safely on client to prevent SSR hydration mismatch)
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11) {
      setGreeting({ title: 'Selamat Pagi', sub: 'Mulai harimu dengan musik favorit' });
    } else if (hour >= 11 && hour < 15) {
      setGreeting({ title: 'Selamat Siang', sub: 'Temani harimu dengan irama terbaik' });
    } else if (hour >= 15 && hour < 18) {
      setGreeting({ title: 'Selamat Sore', sub: 'Santai sejenak di sore hari' });
    } else {
      setGreeting({ title: 'Selamat Malam', sub: 'Irama tenang untuk malam harimu' });
    }
  }, []);

  // Metrolist "Dengarkan Lagi" (Listen Again / Forgotten Favorites from History)
  const listenAgainTracks = useMemo(() => {
    if (!history || history.length === 0) return [];
    // Take unique tracks from history
    const seen = new Set<string>();
    const unique: Track[] = [];
    for (const item of history) {
      if (item.track && item.track.videoId && !seen.has(item.track.videoId)) {
        seen.add(item.track.videoId);
        unique.push(item.track);
      }
      if (unique.length >= 16) break;
    }
    return unique;
  }, [history]);

  // Fetch Mood Specific Data when a mood pill is clicked
  useEffect(() => {
    if (activeMoodId === 'all') {
      setMoodFilterData([]);
      return;
    }

    const selectedMood = METROLIST_MOODS.find((m) => m.id === activeMoodId);
    if (!selectedMood) return;

    let isMounted = true;
    const fetchMoodData = async () => {
      setLoadingMood(true);
      try {
        const queries = [
          { title: `Pilihan ${selectedMood.name}`, q: selectedMood.query },
          { title: `Hits ${selectedMood.name}`, q: `top ${selectedMood.name} songs` },
          { title: `Suasana ${selectedMood.name}`, q: `best ${selectedMood.name} mix` },
        ];

        const results = [];
        for (const { title, q } of queries) {
          const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&type=song`);
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
              results.push({ title, tracks: data.slice(0, 10) });
            }
          }
        }

        if (isMounted) {
          setMoodFilterData(results);
        }
      } catch (error) {
        console.error('Failed to fetch mood data:', error);
      } finally {
        if (isMounted) setLoadingMood(false);
      }
    };

    fetchMoodData();

    return () => {
      isMounted = false;
    };
  }, [activeMoodId]);

  // Main Home Data Fetching (Metrolist Multi-Query Pipeline)
  const fetchHomeData = useCallback(async (showRefreshingSpinner = false) => {
    if (showRefreshingSpinner) setIsRefreshing(true);
    try {
      // Dynamic recent artist for personalized "Serupa dengan" section
      let recentArtistName = '';
      if (history.length > 0 && history[0]?.track?.artist) {
        const art = history[0].track.artist;
        recentArtistName = Array.isArray(art) ? art[0]?.name : art.name;
      }

      const queries: { key: string; title?: string; q: string; type?: string }[] = [
        { key: 'hero', q: recentArtistName ? `${recentArtistName} hits` : 'dave how i met my ex', type: 'song' },
        { key: 'speedDial', q: 'top hits indonesia viral', type: 'song' },
        { key: 'quickPicks', q: 'lagu populer viral indonesia', type: 'song' },
        { key: 'community', q: 'chill aesthetic playlists indonesia', type: 'playlist' },
        { key: 'artists', q: 'artis indonesia populer', type: 'artist' },
      ];

      const defaultCategories = [
        { key: 'cat0', title: 'Trending Sekarang', q: 'lagu indonesia hits terbaru 2024', type: 'song' },
        { key: 'cat1', title: 'Rilis Terbaru & Populer', q: 'lagu pop indonesia rilis terbaru', type: 'song' },
        ...(recentArtistName ? [{ key: 'similarRecent', title: `Serupa dengan ${recentArtistName}`, q: recentArtistName, type: 'all' }] : []),
        { key: 'similar0', title: 'Serupa dengan Hindia', q: 'Hindia', type: 'all' },
        { key: 'similar1', title: 'Serupa dengan Nadin Amizah', q: 'Nadin Amizah', type: 'all' },
        { key: 'similar2', title: 'Serupa dengan Bernadya', q: 'Bernadya', type: 'all' },
        { key: 'cat2', title: 'Top 50 Indonesia', q: 'top 50 indonesia update', type: 'song' },
        { key: 'cat3', title: 'Viral di TikTok', q: 'lagu fyp tiktok viral jedag jedug', type: 'song' },
        { key: 'cat4', title: 'Santai & Akustik', q: 'lagu akustik cafe santai indonesia', type: 'song' },
        { key: 'cat5', title: 'Nostalgia Indonesia', q: 'lagu nostalgia indonesia 2000an', type: 'song' },
      ];

      queries.push(...defaultCategories);

      // Process in chunks to prevent network choking
      const results = [];
      for (let i = 0; i < queries.length; i += 3) {
        const chunk = queries.slice(i, i + 3);
        const chunkResults = await Promise.all(
          chunk.map(async ({ key, title, q, type }) => {
            try {
              const url = type
                ? `/api/search?q=${encodeURIComponent(q)}&type=${type}`
                : `/api/search?q=${encodeURIComponent(q)}`;
              const res = await fetch(url);
              if (!res.ok) return { key, title, data: [] };
              const data = await res.json();
              return { key, title, data: Array.isArray(data) ? data : [] };
            } catch (e) {
              return { key, title, data: [] };
            }
          })
        );
        results.push(...chunkResults);
      }

      const cats: { key: string; title: string; type: 'song' | 'mixed'; items: any[] }[] = [];

      results.forEach(({ key, title, data }) => {
        if (!data || data.length === 0) return;
        if (key === 'hero') setHeroTracks(data.slice(0, 4));
        else if (key === 'speedDial') setSpeedDialTracks(data.slice(0, 45));
        else if (key === 'quickPicks') setQuickPicksTracks(data.slice(0, 20));
        else if (key === 'community') setCommunityPlaylists(data.slice(0, 10));
        else if (key === 'artists') setArtists(data.slice(0, 10));
        else if (key.startsWith('cat') && title) cats.push({ key, title, type: 'song', items: data.slice(0, 10) });
        else if (key.startsWith('similar') && title) cats.push({ key, title, type: 'mixed', items: data.slice(0, 10) });
      });

      const orderMap = new Map(defaultCategories.map((c, i) => [c.key, i]));
      cats.sort((a, b) => (orderMap.get(a.key) ?? 999) - (orderMap.get(b.key) ?? 999));

      setCategories(cats);
    } catch (error) {
      console.error('Failed to fetch home data:', error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [history]);

  useEffect(() => {
    fetchHomeData();
  }, [fetchHomeData, latestHistoryVideoId]);

  // Handle Quick Radio Launcher (Metrolist feature)
  const handleStartQuickRadio = (track: Track, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    playTrack(track, [], 'similar');
  };

  return (
    <main className="min-h-screen pt-4 pb-32 overflow-x-hidden">
      {/* Metrolist Header with Greeting & Quick Actions */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="flex items-center justify-between px-4 mb-4"
      >
        <div className="min-w-0 flex-1 pr-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#81B29A] flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Musicfly
            </span>
          </div>
          <h1 suppressHydrationWarning className="text-2xl font-black text-white leading-tight mt-0.5 tracking-tight">
            {greeting.title}
          </h1>
          <p suppressHydrationWarning className="text-xs text-white/60 truncate mt-0.5">{greeting.sub}</p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => fetchHomeData(true)}
            disabled={isRefreshing}
            className="w-10 h-10 rounded-full liquid-glass-icon flex items-center justify-center text-white/90 hover:text-white hover:scale-105 active:scale-95 transition-all shadow-md"
            title="Segarkan Beranda"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#81B29A]' : ''}`} />
          </button>

          <Link 
            href="/history" 
            className="w-10 h-10 rounded-full liquid-glass-icon flex items-center justify-center text-white/90 hover:text-white hover:scale-105 active:scale-95 transition-all shadow-md"
            title="Riwayat Putar"
          >
            <History className="w-4 h-4" />
          </Link>

          <Link
            href="/developer"
            className="w-10 h-10 rounded-full p-0.5 liquid-glass-icon flex items-center justify-center overflow-hidden hover:scale-105 active:scale-95 transition-all shadow-md"
            title="Profil Pengembang & Pengaturan"
          >
            <div className="w-full h-full rounded-full overflow-hidden relative">
              <Image src="https://f.top4top.io/p_3733w0g4e0.jpg" alt="Developer Profile" fill sizes="36px" className="object-cover" />
            </div>
          </Link>
        </div>
      </motion.div>

      {/* Metrolist Interactive Filter Pills with Animated Selection */}
      <div className="flex overflow-x-auto no-scrollbar gap-2 px-4 pr-12 mb-6 snap-x snap-mandatory scroll-smooth w-full">
        {METROLIST_MOODS.map((mood) => {
          const isActive = activeMoodId === mood.id;
          return (
            <motion.button
              key={mood.id}
              onClick={() => setActiveMoodId(mood.id)}
              whileTap={{ scale: 0.94 }}
              className={`relative whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold tracking-wide transition-all snap-center shadow-sm ${
                isActive
                  ? 'bg-white text-zinc-950 shadow-md shadow-white/10'
                  : 'liquid-glass-pill text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeMoodPill"
                  className="absolute inset-0 bg-white rounded-full -z-10"
                  transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                />
              )}
              <span className="relative z-10">{mood.name}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Main Content Area */}
      {loading || (activeMoodId !== 'all' && loadingMood) ? (
        <HomeSkeleton />
      ) : activeMoodId !== 'all' ? (
        /* Mood Filter Results View (Metrolist Style) */
        <motion.div
          key={`mood-view-${activeMoodId}`}
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-8"
        >
          {moodFilterData.map((cat, i) => (
            <motion.div key={`mood-cat-${i}`} variants={sectionVariants}>
              <HorizontalScroll title={cat.title} tracks={cat.tracks} />
            </motion.div>
          ))}

          {/* Quick Mood Grid Switcher */}
          <motion.div variants={sectionVariants} className="px-4 mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Jelajahi Suasana Lainnya</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {METROLIST_MOODS.filter((m) => m.id !== 'all' && m.id !== activeMoodId).slice(0, 6).map((m) => (
                <button
                  key={m.id}
                  onClick={() => setActiveMoodId(m.id)}
                  className="p-4 rounded-2xl liquid-glass-subtle hover:bg-white/15 text-left transition-all border border-white/10 group flex items-center justify-between"
                >
                  <span className="text-sm font-bold text-white group-hover:text-[#81B29A] transition-colors">{m.name}</span>
                  <Compass className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      ) : (
        /* Default Metrolist Home Screen Layout */
        <motion.div
          key="main-home-view"
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-10"
        >
          {/* 1. Metrolist "Dengarkan Lagi" (Listen Again from User History) */}
          {listenAgainTracks.length > 0 && (
            <motion.div variants={sectionVariants} className="mb-2">
              <div className="flex items-center justify-between px-4 mb-3">
                <div>
                  <h2 className="text-xl font-black text-white leading-tight">Dengarkan lagi</h2>
                  <p className="text-xs text-white/50">Diputar baru-baru ini</p>
                </div>
                <Link
                  href="/history"
                  className="text-xs font-semibold text-[#81B29A] hover:underline"
                >
                  Lihat semua
                </Link>
              </div>

              <div className="flex overflow-x-auto no-scrollbar gap-3 px-4 pr-10 pb-3 snap-x snap-mandatory scroll-smooth w-full">
                {listenAgainTracks.map((track, i) => {
                  const thumbnail = getHighResImage(track.thumbnails?.[track.thumbnails.length - 1]?.url, 300);
                  const artistName = Array.isArray(track.artist) ? track.artist.map((a) => a.name).join(', ') : track.artist?.name || 'Artis';
                  const isCurrent = currentTrack?.videoId === track.videoId;

                  return (
                    <motion.div
                      key={`listen-again-${track.videoId}-${i}`}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.96 }}
                      className="flex-none w-32 cursor-pointer group snap-center"
                      onClick={() => playTrack(track, listenAgainTracks, 'similar')}
                    >
                      <div className="relative w-32 h-32 rounded-2xl overflow-hidden mb-2 shadow-lg bg-white/5 border border-white/10">
                        <SmoothImage src={thumbnail} alt={track.name} fill sizes="128px" className="object-cover" />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="w-10 h-10 bg-white text-zinc-950 rounded-full flex items-center justify-center shadow-xl">
                            <Play className="w-4 h-4 fill-current ml-0.5" />
                          </div>
                        </div>
                        {isCurrent && isPlaying && (
                          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-[#FA243C] text-white text-[9px] font-black uppercase flex items-center gap-1 shadow-md animate-pulse">
                            <Volume2 className="w-2.5 h-2.5" /> Playing
                          </div>
                        )}
                      </div>
                      <MarqueeText text={track.name} className={`text-xs font-bold leading-tight ${isCurrent ? 'text-[#81B29A]' : 'text-white'}`} />
                      <MarqueeText text={artistName} className="text-[11px] text-white/50 mt-0.5" />
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* 2. Metrolist Hero Feature Carousel */}
          {heroTracks.length > 0 && (
            <motion.div variants={sectionVariants}>
              <div className="flex overflow-x-auto no-scrollbar gap-4 px-4 pr-10 snap-x snap-mandatory scroll-smooth pb-2 w-full">
                {heroTracks.map((track, i) => (
                  <motion.div
                    key={`hero-${track.videoId}-${i}`}
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.98 }}
                    className="relative w-[86vw] sm:w-[420px] shrink-0 aspect-[4/5] sm:aspect-video rounded-3xl overflow-hidden cursor-pointer group shadow-2xl snap-center bg-white/5 border border-white/10"
                    onClick={() => playTrack(track, heroTracks, 'similar')}
                  >
                    <SmoothImage
                      src={getHighResImage(track.thumbnails?.[track.thumbnails.length - 1]?.url, 800)}
                      alt={track.name}
                      fill
                      sizes="(max-width: 640px) 86vw, 420px"
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent" />
                    
                    <div className="absolute top-4 left-4 right-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full liquid-glass-pill text-[10px] font-bold uppercase tracking-wider text-white mb-2 shadow-sm">
                        <Flame className="w-3 h-3 text-[#FA243C]" /> Pilihan Utama
                      </span>
                      <MarqueeText text={track.name} className="text-2xl font-black text-white drop-shadow-md leading-tight" />
                      <MarqueeText
                        text={Array.isArray(track.artist) ? track.artist.map((a) => a.name).join(', ') : track.artist?.name}
                        className="text-white/80 font-medium text-sm drop-shadow-sm mt-0.5"
                      />
                    </div>

                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                      <button
                        onClick={(e) => handleStartQuickRadio(track, e)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full liquid-glass-subtle hover:bg-white/20 text-xs font-semibold text-white transition-all shadow-md"
                        title="Mulai Radio Berdasarkan Lagu Ini"
                      >
                        <Radio className="w-3.5 h-3.5 text-[#81B29A]" />
                        <span>Mulai Radio</span>
                      </button>

                      <div className="w-12 h-12 bg-white text-zinc-950 rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 active:scale-95 transition-all">
                        <Play className="w-6 h-6 fill-current ml-0.5" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* 3. Metrolist "Speed Dial" (Putar Cepat 3x3 Grid Carousel) */}
          {speedDialTracks.length > 0 && (
            <motion.div variants={sectionVariants} className="px-4">
              <div className="flex items-center justify-between mb-3.5">
                <div>
                  <h2 className="text-xl font-black text-white leading-tight">Putar Cepat</h2>
                  <p className="text-xs text-white/50">Koleksi lagu populer langsung putar</p>
                </div>
                <button
                  onClick={() => playTrack(speedDialTracks[0], speedDialTracks, 'similar')}
                  className="text-xs font-bold text-zinc-950 bg-white px-3.5 py-1.5 rounded-full hover:scale-105 active:scale-95 transition-all shadow-md flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  <span>Putar Semua</span>
                </button>
              </div>

              <div className="flex overflow-x-auto no-scrollbar gap-3.5 snap-x snap-mandatory scroll-smooth pb-3 w-full pr-8">
                {Array.from({ length: Math.ceil(speedDialTracks.length / 9) }).map((_, i) => {
                  const chunk = speedDialTracks.slice(i * 9, i * 9 + 9);
                  return (
                    <motion.div
                      key={`speeddial-chunk-${i}`}
                      className="w-[86vw] sm:w-[420px] shrink-0 snap-center grid grid-cols-3 gap-2.5 p-3 rounded-3xl liquid-glass-subtle border border-white/10 shadow-lg"
                    >
                      {chunk.map((track, j) => (
                        <motion.div
                          key={`speeddial-${track.videoId}-${j}`}
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.95 }}
                          className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer group bg-white/5 border border-white/10 shadow-sm"
                          onClick={() => playTrack(track, speedDialTracks, 'similar')}
                        >
                          <SmoothImage
                            src={getHighResImage(track.thumbnails?.[track.thumbnails.length - 1]?.url, 200)}
                            alt={track.name}
                            fill
                            sizes="96px"
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                            <div className="w-8 h-8 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow-lg">
                              <Play className="w-4 h-4 fill-current ml-0.5" />
                            </div>
                          </div>
                          <div className="absolute bottom-1.5 left-1.5 right-1.5">
                            <MarqueeText text={track.name} className="text-white text-[11px] font-bold drop-shadow-md leading-tight" />
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* 4. Metrolist "Pilihan Cepat" (Quick Picks 4-Track Columns) */}
          {quickPicksTracks.length > 0 && (
            <motion.div variants={sectionVariants} className="px-4">
              <div className="flex items-center justify-between mb-3.5">
                <div>
                  <h2 className="text-xl font-black text-white leading-tight">Pilihan Cepat</h2>
                  <p className="text-xs text-white/50">Rekomendasi instan untukmu</p>
                </div>
                <button
                  className="text-xs font-bold text-[#81B29A] liquid-glass-subtle px-3.5 py-1.5 rounded-full hover:bg-white/15 transition-all flex items-center gap-1.5 border border-white/10 shadow-sm"
                  onClick={() => playTrack(quickPicksTracks[0], quickPicksTracks, 'similar')}
                >
                  <Radio className="w-3.5 h-3.5 text-[#81B29A]" />
                  <span>Mulai Radio</span>
                </button>
              </div>

              <div className="flex overflow-x-auto no-scrollbar gap-3.5 snap-x snap-mandatory scroll-smooth pb-3 w-full pr-8">
                {Array.from({ length: Math.ceil(quickPicksTracks.length / 4) }).map((_, i) => {
                  const chunk = quickPicksTracks.slice(i * 4, i * 4 + 4);
                  return (
                    <div
                      key={`quickpicks-chunk-${i}`}
                      className="w-[86vw] sm:w-[420px] shrink-0 snap-center flex flex-col gap-2 p-3 rounded-3xl liquid-glass-subtle border border-white/10 shadow-lg"
                    >
                      {chunk.map((track, j) => {
                        const isCurrent = currentTrack?.videoId === track.videoId;
                        const artistName = Array.isArray(track.artist)
                          ? track.artist.map((a) => a.name).join(', ')
                          : track.artist?.name || 'Artis';

                        return (
                          <motion.div
                            key={`quickpicks-${track.videoId}-${j}`}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex items-center gap-3 cursor-pointer group hover:bg-white/10 p-2 rounded-2xl transition-all duration-200"
                            onClick={() => playTrack(track, quickPicksTracks, 'similar')}
                          >
                            <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-white/5 shadow-sm border border-white/10">
                              <SmoothImage
                                src={getHighResImage(track.thumbnails?.[track.thumbnails.length - 1]?.url, 120)}
                                alt={track.name}
                                fill
                                sizes="48px"
                                className="object-cover"
                              />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="w-7 h-7 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow-md">
                                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <MarqueeText
                                text={track.name}
                                className={`font-bold text-sm leading-tight ${isCurrent ? 'text-[#81B29A]' : 'text-white'}`}
                              />
                              <MarqueeText text={artistName} className="text-white/60 text-xs mt-0.5" />
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setTrackToAdd(track);
                              }}
                              className="w-8 h-8 rounded-full liquid-glass-icon flex items-center justify-center text-white/70 hover:text-white hover:scale-105 transition-all shrink-0"
                              title="Opsi lagu"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </motion.div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* 5. Metrolist "From the Community" Playlists */}
          {communityPlaylists.length > 0 && (
            <motion.div variants={sectionVariants} className="px-4">
              <div className="flex items-center justify-between mb-3.5">
                <div>
                  <h2 className="text-xl font-black text-white leading-tight">Daftar Putar Komunitas</h2>
                  <p className="text-xs text-white/50">Kurasi playlist terbaik dari pendengar</p>
                </div>
              </div>
              <div className="flex overflow-x-auto no-scrollbar gap-4 snap-x snap-mandatory scroll-smooth pb-3 w-full pr-8">
                {communityPlaylists.map((playlist, i) => {
                  const id = playlist.playlistId;
                  if (!id) return null;
                  return <CommunityPlaylistCard key={`community-playlist-${id}-${i}`} playlistId={id} />;
                })}
              </div>
            </motion.div>
          )}

          {/* 6. Metrolist "Tetap Mendengarkan" (Artist Circles) */}
          {artists.length > 0 && (
            <motion.div variants={sectionVariants} className="mb-2">
              <div className="flex items-center justify-between px-4 mb-3">
                <div>
                  <h2 className="text-xl font-black text-white leading-tight">Artis Pilihan</h2>
                  <p className="text-xs text-white/50">Temukan karya lengkap artis favorit</p>
                </div>
              </div>
              <div className="flex overflow-x-auto no-scrollbar gap-5 px-4 pr-10 pb-3 snap-x snap-mandatory scroll-smooth w-full">
                {artists.map((artist, i) => {
                  const artistName = artist.name || 'Artis';
                  return (
                    <Link href={`/artist/${artist.artistId}`} key={`artist-${artist.artistId}-${i}`}>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex flex-col items-center gap-2.5 cursor-pointer group shrink-0 snap-center w-28"
                      >
                        <div className="relative w-24 h-24 rounded-full overflow-hidden shadow-xl bg-white/5 border border-white/10 group-hover:border-[#81B29A]/50 transition-colors">
                          <SmoothImage
                            src={getHighResImage(artist.thumbnails?.[artist.thumbnails.length - 1]?.url, 300)}
                            alt={artistName}
                            fill
                            sizes="96px"
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="w-9 h-9 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow-lg">
                              <Play className="w-4 h-4 fill-current ml-0.5" />
                            </div>
                          </div>
                        </div>
                        <div className="text-center w-full">
                          <MarqueeText text={artistName} className="text-xs font-bold text-white group-hover:text-[#81B29A] transition-colors" />
                          <span className="text-[10px] text-white/50">Artis</span>
                        </div>
                      </motion.div>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* 7. Metrolist Categorized Tracks & Mixed Recommendations */}
          {categories.map((cat, i) => (
            <motion.div key={`cat-section-${cat.key}-${i}`} variants={sectionVariants}>
              {cat.type === 'mixed' ? (
                <MixedScroll title={cat.title} items={cat.items} />
              ) : (
                <HorizontalScroll title={cat.title} tracks={cat.items} />
              )}
            </motion.div>
          ))}
        </motion.div>
      )}
    </main>
  );
}
