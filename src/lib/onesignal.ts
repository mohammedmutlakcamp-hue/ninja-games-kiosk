const ONESIGNAL_APP_ID = 'envdk55e-qjgl-lkaq-rwwm-yats76s7x7ah';
const ONESIGNAL_REST_KEY = 'os_v2_app_envdk55eqjgllkaqrwwmyats76s7x7aha5tu77mhcg5ooap2ekc4bchfax2o3j5gt22bqdf42o2finfynajgomgfcu7wc5jgvpgisja';

// Initialize OneSignal on client side
export async function initOneSignal(playerUid: string, username: string) {
  if (typeof window === 'undefined') return;

  const OneSignal = (window as any).OneSignalDeferred || [];
  (window as any).OneSignalDeferred = OneSignal;

  OneSignal.push(async function (os: any) {
    await os.init({
      appId: ONESIGNAL_APP_ID,
      serviceWorkerParam: { scope: '/' },
      serviceWorkerPath: '/OneSignalSDKWorker.js',
      notifyButton: { enable: false },
      allowLocalhostAsSecureOrigin: true,
    });

    // Set external user ID for targeted notifications
    await os.login(playerUid);

    // Add tags for filtering
    await os.User.addTags({
      username: username,
      uid: playerUid,
    });
  });
}

// Send notification via REST API (server-side or from admin)
export async function sendNotification(params: {
  title: string;
  message: string;
  targetUids?: string[]; // specific player UIDs, or empty for all
  data?: Record<string, string>;
  url?: string;
}) {
  const body: any = {
    app_id: ONESIGNAL_APP_ID,
    headings: { en: params.title },
    contents: { en: params.message },
    url: params.url || 'https://www.ninjagamesjo.com/app',
    data: params.data || {},
    chrome_web_icon: 'https://www.ninjagamesjo.com/img/icon-192.png',
  };

  if (params.targetUids && params.targetUids.length > 0) {
    body.include_aliases = { external_id: params.targetUids };
    body.target_channel = 'push';
  } else {
    body.included_segments = ['All'];
  }

  const res = await fetch('https://api.onesignal.com/notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Key ${ONESIGNAL_REST_KEY}`,
    },
    body: JSON.stringify(body),
  });

  return res.json();
}

// Notification helper functions
export async function notifyFriendOnline(friendUids: string[], username: string) {
  if (friendUids.length === 0) return;
  return sendNotification({
    title: 'Friend Online!',
    message: `${username} just came online at Ninja Games`,
    targetUids: friendUids,
    data: { type: 'friend_online', username },
  });
}

export async function notifyCoinsReceived(targetUid: string, senderName: string, amount: number) {
  return sendNotification({
    title: 'Tokens Received!',
    message: `${senderName} sent you ${amount} tokens`,
    targetUids: [targetUid],
    data: { type: 'coins_received', sender: senderName, amount: String(amount) },
  });
}

export async function notifyChestReceived(targetUid: string, senderName: string, chestName: string) {
  return sendNotification({
    title: 'Gift Received!',
    message: `${senderName} sent you a ${chestName}`,
    targetUids: [targetUid],
    data: { type: 'chest_received', sender: senderName, chest: chestName },
  });
}

export async function notifyDailyTasksReset() {
  return sendNotification({
    title: 'Daily Tasks Reset!',
    message: 'New daily tasks are available. Come claim your rewards!',
    data: { type: 'daily_tasks_reset' },
  });
}

export async function notifyCustom(title: string, message: string, targetUids?: string[]) {
  return sendNotification({ title, message, targetUids });
}
