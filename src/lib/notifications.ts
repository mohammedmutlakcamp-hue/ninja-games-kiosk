const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || '';
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_KEY || '';

/**
 * Notify a player's friends that they started playing a game.
 * Called from GamesTab when a player launches a game.
 */
export async function notifyFriendsGameStart(
  player: { uid: string; username: string; friends?: string[] },
  game: { name: string; id: string },
) {
  const friendIds = player.friends || [];
  if (friendIds.length === 0 || !ONESIGNAL_APP_ID) return;

  try {
    const response = await fetch('https://api.onesignal.com/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        include_aliases: {
          external_id: friendIds,
        },
        target_channel: 'push',
        headings: { en: 'Friend Playing! 🎮' },
        contents: { en: `${player.username} is playing ${game.name}!` },
        data: {
          type: 'friend_playing',
          playerId: player.uid,
          playerName: player.username,
          gameId: game.id,
          gameName: game.name,
        },
        chrome_web_icon: 'https://www.ninjagamesjo.com/img/icon-192.png',
      }),
    });

    if (!response.ok) {
      console.error('OneSignal notification failed:', await response.text());
    }
  } catch (err) {
    console.error('Failed to notify friends:', err);
  }
}
