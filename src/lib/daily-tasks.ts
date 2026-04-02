// Daily task progress tracking helper
// Import and call trackDailyTask() from any component to update progress

import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export type TaskAction =
  | 'play_minigame'       // played any mini game
  | 'get_headshot'        // hit a target in aim trainer
  | 'send_coins'          // sent coins to a friend
  | 'open_chest'          // opened a chest
  | 'order_food'          // ordered food/drinks
  | 'win_match'           // won a match in any game
  | 'play_time'           // minutes played (pass amount)
  | 'earn_coins'          // coins earned from games (pass amount)
  | 'add_friend';         // added a friend

/**
 * Update daily task progress for a player.
 * Call this whenever a tracked action happens.
 * @param playerId - player uid
 * @param action - the action type
 * @param amount - how much progress to add (default 1)
 */
export async function trackDailyTask(playerId: string, action: TaskAction, amount = 1) {
  const todayKey = getTodayKey();
  const docRef = doc(db, 'daily-tasks', `${playerId}_${todayKey}`);

  try {
    const snap = await getDoc(docRef);
    if (!snap.exists()) return; // tasks not generated yet

    const data = snap.data();
    const tasks = data.tasks || [];
    let changed = false;

    const updatedTasks = tasks.map((task: any) => {
      if (task.claimed) return task; // already claimed, skip

      let shouldUpdate = false;

      switch (task.id) {
        case 'play_1_minigame':
        case 'play_3_minigames':
          shouldUpdate = action === 'play_minigame';
          break;
        case 'get_1_headshot':
        case 'get_5_headshots':
          shouldUpdate = action === 'get_headshot';
          break;
        case 'send_coins_friend':
          shouldUpdate = action === 'send_coins';
          break;
        case 'open_1_chest':
          shouldUpdate = action === 'open_chest';
          break;
        case 'order_food':
          shouldUpdate = action === 'order_food';
          break;
        case 'win_1_match':
          shouldUpdate = action === 'win_match';
          break;
        case 'play_5_minutes':
        case 'play_15_minutes':
          shouldUpdate = action === 'play_time';
          break;
        case 'earn_50_coins':
        case 'earn_100_coins':
          shouldUpdate = action === 'earn_coins';
          break;
        case 'add_1_friend':
          shouldUpdate = action === 'add_friend';
          break;
      }

      if (shouldUpdate) {
        changed = true;
        return { ...task, progress: Math.min(task.progress + amount, task.target) };
      }
      return task;
    });

    if (changed) {
      await setDoc(docRef, { tasks: updatedTasks }, { merge: true });
    }
  } catch (err) {
    console.error('Failed to track daily task:', err);
  }
}
