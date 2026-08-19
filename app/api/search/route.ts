import { NextResponse } from 'next/server';
import { getYTMusic } from '@/lib/ytmusic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const type = searchParams.get('type');
  
  if (!query) return NextResponse.json([], { status: 200 });
  
  try {
    const ytmusic = await getYTMusic();
    
    if (type === 'playlist') {
      let playlists = await ytmusic.searchPlaylists(query).catch((e: any) => { 
        console.warn('Error searching playlists (e.g. ZodError):', e?.name || e?.message); 
        return []; 
      });
      // Filter out mixes (IDs starting with RD) as they cannot be fetched via getPlaylist
      if (Array.isArray(playlists)) {
        playlists = playlists.filter((p: any) => p.playlistId && !p.playlistId.startsWith('RD'));
      } else {
        playlists = [];
      }
      return NextResponse.json(playlists, {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      });
    }
    
    if (type === 'artist') {
      const artists = await ytmusic.searchArtists(query).catch((e: any) => { 
        console.warn('Error searching artists:', e?.name || e?.message); 
        return []; 
      });
      return NextResponse.json(Array.isArray(artists) ? artists : [], { 
        headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } 
      });
    }
    
    if (type === 'song') {
      const songs = await ytmusic.searchSongs(query).catch((e: any) => { 
        console.warn('Error searching songs:', e?.name || e?.message); 
        return []; 
      });
      return NextResponse.json(Array.isArray(songs) ? songs : [], { 
        headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } 
      });
    }
    
    if (type === 'video') {
      const videos = await ytmusic.searchVideos(query).catch((e: any) => { 
        console.warn('Error searching videos:', e?.name || e?.message); 
        return []; 
      });
      return NextResponse.json(Array.isArray(videos) ? videos : [], { 
        headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } 
      });
    }

    if (type === 'all') {
      const results = await ytmusic.search(query).catch((e: any) => { 
        console.warn('Error searching all:', e?.name || e?.message); 
        return []; 
      });
      return NextResponse.json(Array.isArray(results) ? results : [], { 
        headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } 
      });
    }

    // Default: search sequentially with fallbacks to avoid 403 or schema failures
    const songs = await ytmusic.searchSongs(query).catch(() => []);
    const videos = await ytmusic.searchVideos(query).catch(() => []);
    const artists = await ytmusic.searchArtists(query).catch(() => []);
    
    const results = [
      ...(Array.isArray(songs) ? songs : []),
      ...(Array.isArray(videos) ? videos : []),
      ...(Array.isArray(artists) ? artists : [])
    ];

    return NextResponse.json(results, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error: any) {
    console.error('Search route error:', error?.message || error);
    return NextResponse.json([], { status: 200 });
  }
}
