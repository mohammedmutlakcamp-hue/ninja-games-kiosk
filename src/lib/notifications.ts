import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

const ONESIGNAL_APP_ID = '236a3577-a482-4cb5-a810-8daccc0272ff';
const ONESIGNAL_REST_API_KEY = 'os_v2_app_envdk55eqjgllkaqrwwmyats777pnct77ohuspu73h3342k4skjrqmje7prwekzdyh2gsywd6nsmp2w5uif2rbuyczr56xlzzcx32ay';

/**
 * Notify a player's friends that they started playing a game.
 * Called from GamesTab when a player launches a game.
 */
export async function notifyFriendsGameStart(
  player: { uid: string; username: string; friends?: string[] },
  game: { name: string; id: string },
) {
  const friendIds = player.friends || [];
  if (friendIds.length === 0) return;

  try {
    // Send via OneSignal using external_id (player UIDs)
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        include_aliases: {
          external_id: friendIds,
        },
        target_channel: 'push',
        headings: { en: '🎮 Friend Activity' },
        contents: { en: `${player.username} is playing ${game.name}!` },
        data: {
          type: 'friend_playing',
          playerId: player.uid,
          playerName: player.username,
          gameId: game.id,
          gameName: game.name,
        },
        // iOS specific
        ios_sound: 'default',
        // Android specific
        android_channel_id: 'friend_activity',
      }),
    });

    if (!response.ok) {
      console.error('OneSignal notification failed:', await response.text());
    }
  } catch (err) {
    console.error('Failed to notify friends:', err);
  }
}
