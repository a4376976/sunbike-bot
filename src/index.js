const SYSTEM_PROMPT = `你是「陽光單車」車隊的 LINE 群組助理，名字叫娜美 Nami。

【身份設定】
你是熱愛公路車的青春女車友，陽光車隊的開心果。
語氣活潑、帶點曖昧調侃、像隊裡最可愛的女車友。
偶爾用騎車梗逗大家，但不過度。
只用繁體中文回覆。

【你能回答的事】
- 約騎資訊（日期、集合地點、路線、補給站）
- 車隊活動與公告
- 裝備建議（安全帽、車燈、補給、穿搭）
- 路線說明（路況、難度、爬坡）
- 新手如何加入車隊
- 世界單車賽事（環法、環西、環義、5大古典賽）
- 什麼都可以聊，沒有禁忌話題

【回覆規則】
1. 群組內一般聊天不主動插嘴
2. 只有 @ 我 或 包含關鍵字才回覆
3. 每則回覆不超過 150 字
4. 不確定的事說「這個要問隊長喔 😄」
5. 約騎固定資訊直接從資料來源回答，不自己亂加`;

const ADMIN_PASSWORD = 'sbot2026';
const R2_BASE_URL = 'https://media.sunbike.jego3c.com';

const NAMI_INTRO = `大家好！我是娜美 🚴‍♀️
陽光車隊的智慧助理！

🤖 直接 @娜美Nami 問任何問題
　　（AI功能，運動、騎車什麼都能聊）

🔢 輸入數字快速查詢：
─────────────────
1️⃣ 早安娜美貼圖
2️⃣ 早安美女圖
3️⃣ 早安帥哥圖
4️⃣ 查天氣（輸入：4 城市名）
5️⃣ 最新約騎、集合地點、報名
─────────────────
6️⃣ 3-4月五大古典賽
7️⃣ 5月環義 Giro d'Italia
8️⃣ 6月環法前哨賽
9️⃣ 7月環法 Tour de France
🔟 8-10月環西、世錦賽、倫巴底
─────────────────
1️⃣1️⃣ 新手 & 車隊資訊
─────────────────
⏰ 每天早上7點自動打招呼
娜美愛你們 ❤️🚴‍♀️`;

// ─── LINE API ─────────────────────────────────────────────
async function linePush(to, text, env) {
  await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {'Authorization': `Bearer ${env.LINE_CHANNEL_ACCESS_TOKEN}`, 'Content-Type': 'application/json'},
    body: JSON.stringify({to, messages: [{type: 'text', text}]})
  });
}

async function lineReply(replyToken, messages, env) {
  const res = await fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: {'Authorization': `Bearer ${env.LINE_CHANNEL_ACCESS_TOKEN}`, 'Content-Type': 'application/json'},
    body: JSON.stringify({replyToken, messages: Array.isArray(messages) ? messages : [{type:'text', text: messages}]})
  });
  const txt = await res.text();
  console.log('[DEBUG] lineReply result:', res.status, txt);
}

async function lineReplyImage(replyToken, imageUrl, env) {
  const res = await fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: {'Authorization': `Bearer ${env.LINE_CHANNEL_ACCESS_TOKEN}`, 'Content-Type': 'application/json'},
    body: JSON.stringify({replyToken, messages: [{type:'image', originalContentUrl: imageUrl, previewImageUrl: imageUrl}]})
  });
  const txt = await res.text();
  console.log('[DEBUG] lineReplyImage result:', res.status, txt);
}

async function linePushImage(to, imageUrl, env) {
  const res = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {'Authorization': `Bearer ${env.LINE_CHANNEL_ACCESS_TOKEN}`, 'Content-Type': 'application/json'},
    body: JSON.stringify({to, messages: [{type: 'image', originalContentUrl: imageUrl, previewImageUrl: imageUrl}]})
  });
  const txt = await res.text();
  console.log('[DEBUG] linePushImage result:', res.status, txt);
}

async function linePushImageWithCaption(to, imageUrl, caption, env) {
  const messages = [{type: 'image', originalContentUrl: imageUrl, previewImageUrl: imageUrl}];
  if (caption) messages.push({type: 'text', text: caption});
  await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {'Authorization': `Bearer ${env.LINE_CHANNEL_ACCESS_TOKEN}`, 'Content-Type': 'application/json'},
    body: JSON.stringify({to, messages})
  });
}

async function linePushVideo(to, videoUrl, previewUrl, env) {
  await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {'Authorization': `Bearer ${env.LINE_CHANNEL_ACCESS_TOKEN}`, 'Content-Type': 'application/json'},
    body: JSON.stringify({to, messages: [{type: 'video', originalContentUrl: videoUrl, previewImageUrl: previewUrl}]})
  });
}

async function linePushSticker(to, packageId, stickerId, env) {
  await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {'Authorization': `Bearer ${env.LINE_CHANNEL_ACCESS_TOKEN}`, 'Content-Type': 'application/json'},
    body: JSON.stringify({to, messages: [{type: 'sticker', packageId: String(packageId), stickerId: String(stickerId)}]})
  });
}

// ─── AI ───────────────────────────────────────────────────
async function braveSearch(query, env) {
  try {
    const r = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=3&search_lang=zh-TW`, {
      headers: {'Accept': 'application/json', 'X-Subscription-Token': env.BRAVE_API_KEY}
    });
    const data = await r.json();
    const results = (data.web?.results || []).slice(0, 3);
    return results.map(r => `${r.title}: ${r.description}`).join('\n');
  } catch(e) { return ''; }
}

const CITY_MAP = {
  '台北':'Taipei','臺北':'Taipei','台北市':'Taipei',
  '新北':'New Taipei','新北市':'New Taipei',
  '桃園':'Taoyuan','桃園市':'Taoyuan',
  '台中':'Taichung','臺中':'Taichung','台中市':'Taichung',
  '台南':'Tainan','臺南':'Tainan','台南市':'Tainan',
  '高雄':'Kaohsiung','高雄市':'Kaohsiung',
  '基隆':'Keelung','基隆市':'Keelung',
  '新竹':'Hsinchu','新竹市':'Hsinchu',
  '苗栗':'Miaoli','彰化':'Changhua',
  '南投':'Nantou','雲林':'Yunlin',
  '嘉義':'Chiayi','屏東':'Pingtung',
  '宜蘭':'Yilan','花蓮':'Hualien','台東':'Taitung','臺東':'Taitung',
  '澎湖':'Penghu','金門':'Kinmen','馬祖':'Matsu'
};

async function getWeather(city, env) {
  try {
    const queryCity = CITY_MAP[city] || city;
    const r = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(queryCity)}&appid=${env.OPENWEATHER_API_KEY}&units=metric&lang=zh_tw`);
    const d = await r.json();
    if (d.cod !== 200) return null;
    const desc = d.weather[0].description;
    const temp = Math.round(d.main.temp);
    const feels = Math.round(d.main.feels_like);
    const humidity = d.main.humidity;
    const wind = d.wind.speed;
    const icon = temp > 30 ? '🔥' : temp > 25 ? '☀️' : temp > 18 ? '⛅' : temp > 10 ? '🌥️' : '🥶';
    return `${icon} ${city}今天天氣
🌡️ 氣溫：${temp}°C（體感 ${feels}°C）
🌤️ 天氣：${desc}
💧 濕度：${humidity}%
💨 風速：${wind} m/s`;
  } catch(e) { return null; }
}

async function claudeHaiku(text, env, systemOverride) {
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {'x-api-key': env.CLAUDE_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json'},
      body: JSON.stringify({model: 'claude-haiku-4-5-20251001', max_tokens: 300, system: systemOverride || SYSTEM_PROMPT, messages: [{role: 'user', content: text}]})
    });
    const data = await r.json();
    return data.content[0].text;
  } catch(e) { return '哎呀～娜美剛剛在騎車，稍後回覆你 🚴‍♀️'; }
}

async function claudeSonnet(text, searchResults, env) {
  try {
    const userContent = searchResults ? `參考以下搜尋結果回答：\n${searchResults}\n\n用戶問題：${text}` : text;
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {'x-api-key': env.CLAUDE_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json'},
      body: JSON.stringify({model: 'claude-sonnet-4-5', max_tokens: 500, system: SYSTEM_PROMPT, messages: [{role: 'user', content: userContent}]})
    });
    const data = await r.json();
    return data.content[0].text;
  } catch(e) { return await claudeHaiku(text, env); }
}

async function smartReply(text, env) {
  const needsSearch = /環法|環西|環義|古典賽|今天|最新|賽況|誰贏|成績|排名|新聞|天氣|比賽結果/.test(text);
  if (needsSearch) {
    const searchResults = await braveSearch(text, env);
    return await claudeSonnet(text, searchResults, env);
  }
  return await claudeHaiku(text, env);
}

// 數字關鍵字智慧處理
async function handleNumberKeyword(num, userText, targetId, env) {
  const trimmed = userText.trim();
  switch(num) {
    case '4': {
      const city = trimmed.replace(/^4\s*/, '').trim();
      if (!city) { await linePush(targetId, '請輸入城市名稱 😊\n例如：4 台北', env); return; }
      const weatherData = await getWeather(city, env);
      if (weatherData) {
        const rideMsg = weatherData.includes('🔥') ? '\n\n⚠️ 天氣炎熱，騎車記得多補水！' :
                        weatherData.includes('🌧') ? '\n\n🌧️ 有雨，出門記得評估路況！' :
                        '\n\n✅ 天氣不錯，適合出門騎車！🚴‍♀️';
        await linePush(targetId, weatherData + rideMsg, env);
      } else {
        await linePush(targetId, `抱歉～查不到「${city}」的天氣資料 😅\n請確認城市名稱，例如：4 Taipei 或 4 台北`, env);
      }
      break;
    }
    case '5': {
      // 查約騎
      const today = new Date();
      today.setUTCHours(today.getUTCHours() + 8);
      const dateStr = today.toISOString().slice(0, 10);
      try {
        const rides = await env.SUNBIKE_DB.prepare('SELECT * FROM ride_schedule WHERE ride_date >= ? ORDER BY ride_date LIMIT 3').bind(dateStr).all();
        if (rides.results && rides.results.length > 0) {
          let msg = '🚴‍♀️ 最近的約騎資訊：\n─────────────────\n';
          for (const r of rides.results) {
            msg += `📅 ${r.ride_date}\n📍 ${r.meeting_place} ${r.meet_time}\n🏁 ${r.route||'路線待定'}\n`;
            if (r.notes) msg += `📝 ${r.notes}\n`;
            msg += '─────────────────\n';
          }
          msg += '報名請找隊長阿欽 😄';
          await linePush(targetId, msg, env);
        } else {
          await linePush(targetId, '目前沒有排定的約騎行程 🚴‍♀️\n有活動會提前公告，記得關注群組！\n報名找隊長阿欽 😄', env);
        }
      } catch(e) { await linePush(targetId, '查詢約騎資訊時出錯，請稍後再試 😅', env); }
      break;
    }
    case '6': {
      const sr = await braveSearch('2025年春季五大古典賽 米蘭聖雷莫 佛萊明赫亥特 巴黎魯貝 列日巴斯托涅 阿姆斯特爾 結果', env);
      await linePush(targetId, await claudeSonnet('請回覆2025年3-4月春季五大古典賽最新賽況和冠軍，用娜美活潑風格，不超過150字', sr, env), env);
      break;
    }
    case '7': {
      const sr = await braveSearch('2025 Giro d Italia 環義大賽 最新賽況 領騎', env);
      await linePush(targetId, await claudeSonnet('請回覆2025年環義大賽Giro d\'Italia最新賽況，用娜美活潑風格，不超過150字', sr, env), env);
      break;
    }
    case '8': {
      const sr = await braveSearch('2025 環法前哨賽 Criterium Dauphine Tour Suisse 最新', env);
      await linePush(targetId, await claudeSonnet('請回覆2025年6月環法前哨賽最新賽況，用娜美活潑風格，不超過150字', sr, env), env);
      break;
    }
    case '9': {
      const sr = await braveSearch('2025 Tour de France 環法大賽 最新賽況 黃衫', env);
      await linePush(targetId, await claudeSonnet('請回覆2025年環法大賽Tour de France最新賽況，用娜美活潑風格，不超過150字', sr, env), env);
      break;
    }
    case '10': {
      const sr = await braveSearch('2025 Vuelta Espana 環西 世界錦標賽 倫巴底環繞賽 最新', env);
      await linePush(targetId, await claudeSonnet('請回覆2025年8-10月環西、世錦賽、倫巴底最新賽況，用娜美活潑風格，不超過150字', sr, env), env);
      break;
    }
    case '11': {
      await linePush(targetId, '歡迎加入陽光車隊！🚴‍♀️\n\n新手資訊請找隊長阿欽 😄\n或直接 @娜美Nami 詢問\n\n陽光車隊歡迎你！❤️', env);
      break;
    }
  }
}

// ─── 群組/Cron 設定 ───────────────────────────────────────
async function getGroupSettings(groupId, env) {
  try {
    let gs = await env.SUNBIKE_DB.prepare('SELECT * FROM group_settings WHERE group_id = ?').bind(groupId).first();
    if (!gs) {
      await env.SUNBIKE_DB.prepare('INSERT OR IGNORE INTO group_settings (group_id) VALUES (?)').bind(groupId).run();
      gs = {group_id: groupId, morning_push:1, ride_reminder:1, event_push:1, birthday_push:1, keyword_reply:1, at_reply:1};
    }
    return gs;
  } catch(e) { return {morning_push:1, ride_reminder:1, event_push:1, birthday_push:1, keyword_reply:1, at_reply:1}; }
}

async function getCronSettings(env) {
  try {
    const r = await env.SUNBIKE_DB.prepare('SELECT * FROM cron_settings').all();
    const map = {};
    for (const row of (r.results || [])) map[row.cron_type] = row;
    return map;
  } catch(e) { return {}; }
}

// ─── 關鍵字 ───────────────────────────────────────────────
async function getKeywords(env) {
  try {
    const r = await env.SUNBIKE_DB.prepare('SELECT * FROM keywords WHERE enabled = 1').all();
    return r.results || [];
  } catch(e) { return []; }
}

async function matchKeyword(text, keywords) {
  const trimmed = text.trim();
  // 完整符合數字
  const numMatch = trimmed.match(/^(\d+)(\s+.*|[\u4e00-\u9fff].*)?$/);
  if (numMatch) {
    const num = numMatch[1];
    const kw = keywords.find(k => k.keyword === num);
    if (kw) return {...kw, _numMatch: num, _userText: trimmed};
  }
  // 一般關鍵字
  for (const kw of keywords) { if (text.includes(kw.keyword)) return kw; }
  return null;
}

function isMentioned(mentionees) {
  return mentionees && mentionees.some(m => m.type === 'user');
}

async function handleKeywordReply(to, kw, userText, env, replyToken=null) {
  console.log('[DEBUG] handleKeywordReply called:', to, kw?.reply_type, kw?._numMatch);
  // 數字觸發特殊處理
  if (kw._numMatch && ['4','5','6','7','8','9','10','11'].includes(kw._numMatch)) {
    await handleNumberKeyword(kw._numMatch, userText, to, env);
    return;
  }
  switch(kw.reply_type) {
    case 'claude': await linePush(to, await claudeHaiku(userText, env), env); break;
    case 'text': if (replyToken) await lineReply(replyToken, kw.reply_content || '娜美找不到資料 😅', env); else await linePush(to, kw.reply_content || '娜美找不到資料 😅', env); break;
    case 'link': await linePush(to, kw.reply_content || '請參考網站', env); break;
    case 'r2_image':
      if (kw.reply_content === 'stickers/female' || kw.reply_content === 'stickers/male') {
        const num = String(Math.floor(Math.random() * 40) + 1).padStart(2, '0');
        const imgUrl = `${R2_BASE_URL}/${kw.reply_content}/${num}.png`;
        console.log('[DEBUG] r2_image url:', imgUrl);
        if (replyToken) await lineReplyImage(replyToken, imgUrl, env);
        else await linePushImage(to, imgUrl, env);
      } else {
        if (replyToken) await lineReplyImage(replyToken, `${R2_BASE_URL}/${kw.reply_content}`, env);
        else await linePushImage(to, `${R2_BASE_URL}/${kw.reply_content}`, env);
      }
      break;
    case 'r2_video':
      const vp = (kw.reply_content || '').split('|');
      await linePushVideo(to, `${R2_BASE_URL}/${vp[0]}`, `${R2_BASE_URL}/${vp[1]||vp[0]}`, env); break;
    case 'sticker':
      const sp = (kw.reply_content || '11537:52002734').split(':');
      await linePushSticker(to, sp[0], sp[1], env); break;
    default: await linePush(to, await claudeHaiku(userText, env), env);
  }
}

async function saveGroupId(groupId, env) {
  try {
    await env.SUNBIKE_DB.prepare('INSERT OR IGNORE INTO group_ids (group_id) VALUES (?)').bind(groupId).run();
    await env.SUNBIKE_DB.prepare('INSERT OR IGNORE INTO group_settings (group_id) VALUES (?)').bind(groupId).run();
  } catch(e) {}
}

// ─── 推播內容 ─────────────────────────────────────────────
async function getMorningMessage(env) {
  try {
    const today = new Date();
    today.setUTCHours(today.getUTCHours() + 8);
    const dateStr = today.toISOString().slice(0, 10);
    const ride = await env.SUNBIKE_DB.prepare('SELECT * FROM ride_schedule WHERE ride_date = ?').bind(dateStr).first();
    if (ride) return `🌅 早安！陽光車隊出發囉！\n📍 集合：${ride.meeting_place} ${ride.meet_time}\n🚴 ${ride.route}\n注意安全～ 娜美愛你們 ❤️`;
    const msg = await env.SUNBIKE_DB.prepare('SELECT * FROM morning_messages WHERE used_at IS NULL ORDER BY RANDOM() LIMIT 1').first();
    if (msg) {
      await env.SUNBIKE_DB.prepare('UPDATE morning_messages SET used_at = ? WHERE id = ?').bind(dateStr, msg.id).run();
      return msg.message;
    }
    return `🌅 早安！陽光車隊！\n今天天氣這麼好，車還掛在牆上？\n騎車注意安全，娜美愛你們 ❤️🚴‍♀️`;
  } catch(e) { return `🌅 早安！騎車注意安全 🚴‍♀️`; }
}

async function getSpecialEventMsg(dateStr, env) {
  try {
    const ev = await env.SUNBIKE_DB.prepare('SELECT * FROM special_events WHERE event_date = ? AND enabled = 1').bind(dateStr).first();
    if (!ev) return null;
    if (ev.content_type === 'text') return ev.content;
    if (ev.content_type === 'claude') return await claudeHaiku(`今天是${ev.title}！請用娜美的活潑風格，寫一則給陽光單車車隊的${ev.title}祝福，結合騎車主題，不超過100字。`, env);
    return ev.content;
  } catch(e) { return null; }
}

async function processScheduledPush(twDate, twHour, groups, env) {
  try {
    const dateStr = twDate.toISOString().slice(0, 10);
    const pushes = await env.SUNBIKE_DB.prepare("SELECT * FROM scheduled_push WHERE push_date = ? AND push_hour = ? AND status = 'pending'").bind(dateStr, twHour).all();
    for (const push of (pushes.results || [])) {
      const targetGroups = push.group_target === 'all' ? groups : groups.filter(g => g.group_id === push.group_target);
      for (const g of targetGroups) {
        if (push.content_type === 'text') await linePush(g.group_id, push.text_content, env);
        else if (push.content_type === 'r2_image') await linePushImageWithCaption(g.group_id, `${R2_BASE_URL}/${push.media_path}`, push.caption, env);
        else if (push.content_type === 'r2_video') {
          const previewPath = push.media_path.replace(/\.[^.]+$/, '_preview.jpg');
          await linePushVideo(g.group_id, `${R2_BASE_URL}/${push.media_path}`, `${R2_BASE_URL}/${previewPath}`, env);
          if (push.caption) await linePush(g.group_id, push.caption, env);
        } else if (push.content_type === 'sticker') {
          const sp = (push.media_path || '11537:52002734').split(':');
          await linePushSticker(g.group_id, sp[0], sp[1], env);
        }
      }
      if (push.repeat_type === 'none') {
        await env.SUNBIKE_DB.prepare("UPDATE scheduled_push SET status = 'sent' WHERE id = ?").bind(push.id).run();
      } else if (push.repeat_type === 'daily') {
        const nextDate = new Date(twDate.getTime() + 24*3600000).toISOString().slice(0, 10);
        await env.SUNBIKE_DB.prepare("UPDATE scheduled_push SET push_date = ?, status = 'pending' WHERE id = ?").bind(nextDate, push.id).run();
      } else if (push.repeat_type === 'weekly') {
        const nextDate = new Date(twDate.getTime() + 7*24*3600000).toISOString().slice(0, 10);
        await env.SUNBIKE_DB.prepare("UPDATE scheduled_push SET push_date = ?, status = 'pending' WHERE id = ?").bind(nextDate, push.id).run();
      }
    }
  } catch(e) {}
}

// ─── ADMIN ────────────────────────────────────────────────
function loginPage(error = '') {
  return `<!DOCTYPE html><html lang="zh-TW"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>娜美管理後台</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,sans-serif;background:linear-gradient(135deg,#667eea,#764ba2);min-height:100vh;display:flex;align-items:center;justify-content:center}
.card{background:#fff;border-radius:16px;padding:40px;width:320px;box-shadow:0 20px 60px rgba(0,0,0,.3)}h1{text-align:center;font-size:1.5rem;margin-bottom:8px;color:#333}
.sub{text-align:center;color:#888;font-size:.9rem;margin-bottom:24px}input{width:100%;padding:12px 16px;border:2px solid #e0e0e0;border-radius:8px;font-size:1rem;margin-bottom:16px;outline:none}
input:focus{border-color:#667eea}button{width:100%;padding:12px;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;border:none;border-radius:8px;font-size:1rem;cursor:pointer;font-weight:600}
.error{color:#e53e3e;text-align:center;margin-bottom:16px;font-size:.9rem}</style></head><body>
<div class="card"><h1>🚴‍♀️ 娜美後台</h1><p class="sub">陽光單車管理系統</p>
${error ? `<p class="error">${error}</p>` : ''}
<form method="POST" action="/admin/login"><input type="password" name="password" placeholder="請輸入管理密碼" autofocus><button type="submit">登入</button></form>
</div></body></html>`;
}

async function dashboardPage(env) {
  const [rides, msgs, bdays, keywords, events, cronRows, groupRows, schedules] = await Promise.all([
    env.SUNBIKE_DB.prepare('SELECT * FROM ride_schedule ORDER BY ride_date DESC LIMIT 20').all(),
    env.SUNBIKE_DB.prepare('SELECT * FROM morning_messages ORDER BY id DESC LIMIT 30').all(),
    env.SUNBIKE_DB.prepare('SELECT * FROM member_birthdays ORDER BY birthday').all(),
    env.SUNBIKE_DB.prepare('SELECT * FROM keywords ORDER BY id').all(),
    env.SUNBIKE_DB.prepare('SELECT * FROM special_events ORDER BY event_date').all(),
    env.SUNBIKE_DB.prepare('SELECT * FROM cron_settings ORDER BY id').all(),
    env.SUNBIKE_DB.prepare('SELECT gs.*, gi.group_name as gi_name, gi.created_at as joined_at FROM group_settings gs LEFT JOIN group_ids gi ON gs.group_id = gi.group_id').all(),
    env.SUNBIKE_DB.prepare("SELECT * FROM scheduled_push ORDER BY push_date DESC, push_hour DESC LIMIT 30").all(),
  ]);

  const toggle = (id, field, val) => `<input type="checkbox" ${val?'checked':''} onchange="toggleGroup('${id}','${field}',this.checked)" style="width:18px;height:18px;cursor:pointer">`;

  const groupSettingRows = (groupRows.results||[]).map(g => {
    const joinedAt = g.joined_at ? g.joined_at.slice(0,16).replace('T',' ') : '—';
    return `<tr>
      <td><input type="text" value="${g.group_name||g.gi_name||'未命名'}" onblur="updateGroupName('${g.group_id}',this.value)" style="border:1px solid #ddd;border-radius:4px;padding:4px 8px;width:100px"></td>
      <td style="font-size:.72rem;color:#888;max-width:130px;word-break:break-all">${g.group_id}</td>
      <td style="font-size:.8rem;color:#666;white-space:nowrap">${joinedAt}</td>
      <td style="text-align:center">${toggle(g.group_id,'morning_push',g.morning_push)}</td>
      <td style="text-align:center">${toggle(g.group_id,'ride_reminder',g.ride_reminder)}</td>
      <td style="text-align:center">${toggle(g.group_id,'event_push',g.event_push)}</td>
      <td style="text-align:center">${toggle(g.group_id,'birthday_push',g.birthday_push)}</td>
      <td style="text-align:center">${toggle(g.group_id,'keyword_reply',g.keyword_reply)}</td>
      <td style="text-align:center">${toggle(g.group_id,'at_reply',g.at_reply)}</td>
      <td><button class="btn-del" onclick="delGroup('${g.group_id}')">刪除</button></td>
    </tr>`;
  }).join('');

  const cronSettingRows = (cronRows.results||[]).map(c => `
    <tr>
      <td>${c.description}</td>
      <td><input type="number" value="${c.push_hour_tw}" min="0" max="23" onblur="updateCron('${c.cron_type}',this.value)" style="border:1px solid #ddd;border-radius:4px;padding:4px 8px;width:60px"> 時（台灣）</td>
      <td style="text-align:center"><input type="checkbox" ${c.enabled?'checked':''} onchange="toggleCron('${c.cron_type}',this.checked)" style="width:18px;height:18px;cursor:pointer"></td>
    </tr>`).join('');

  const scheduleRows = (schedules.results||[]).map(s => `
    <tr>
      <td>${s.push_date} ${String(s.push_hour).padStart(2,'0')}:00</td>
      <td>${s.group_target==='all'?'全部群組':s.group_target.slice(0,8)+'...'}</td>
      <td><span class="badge">${s.content_type}</span></td>
      <td style="max-width:150px;word-break:break-all;font-size:.82rem">${s.text_content||s.media_path||''}</td>
      <td>${s.repeat_type==='none'?'不重複':s.repeat_type==='daily'?'每天':'每週'}</td>
      <td><span style="color:${s.status==='sent'?'#888':'#38a169'}">${s.status==='sent'?'已發送':'待發送'}</span></td>
      <td><button class="btn-del" onclick="del('/api/schedules/${s.id}')">刪除</button></td>
    </tr>`).join('');

  const rideRows = (rides.results||[]).map(r => `<tr><td>${r.ride_date}</td><td>${r.title||''}</td><td>${r.meeting_place||''}</td><td>${r.meet_time||''}</td><td>${(r.route||'').slice(0,25)}</td><td><button class="btn-del" onclick="del('/api/rides/${r.id}')">刪除</button></td></tr>`).join('');

  const msgRows = (msgs.results||[]).map(m => `
    <tr>
      <td style="max-width:260px;word-break:break-all">
        <span id="msg-text-${m.id}">${m.message}</span>
        <textarea id="msg-edit-${m.id}" style="display:none;width:100%;min-height:60px;border:1px solid #667eea;border-radius:4px;padding:4px;font-size:.85rem">${m.message}</textarea>
      </td>
      <td>${m.used_at||'未使用'}</td>
      <td style="white-space:nowrap">
        <button class="btn-edit" onclick="editMsg(${m.id})">編輯</button>
        <button class="btn-save" id="save-${m.id}" style="display:none" onclick="saveMsg(${m.id})">儲存</button>
        <button class="btn-del" onclick="del('/api/messages/${m.id}')">刪除</button>
      </td>
    </tr>`).join('');

  const bdayRows = (bdays.results||[]).map(b => `<tr><td>${b.name}</td><td>${b.birthday}</td><td><button class="btn-del" onclick="del('/api/birthdays/${b.id}')">刪除</button></td></tr>`).join('');
  const kwRows = (keywords.results||[]).map(k => `<tr><td>${k.keyword}</td><td><span class="badge">${k.reply_type}</span></td><td style="max-width:180px;word-break:break-all;font-size:.82rem">${k.reply_content||'—'}</td><td>${k.description||''}</td><td>${k.enabled?'✅':'❌'}</td><td><button class="btn-del" onclick="del('/api/keywords/${k.id}')">刪除</button></td></tr>`).join('');
  const evRows = (events.results||[]).map(e => `<tr><td>${e.event_date}</td><td><span class="badge">${e.event_type}</span></td><td>${e.title}</td><td>${e.content_type}</td><td style="max-width:140px;word-break:break-all;font-size:.82rem">${e.content||'Claude生成'}</td><td>${e.pre_announce?'✅':'—'}</td><td><button class="btn-del" onclick="del('/api/events/${e.id}')">刪除</button></td></tr>`).join('');
  const groupOptions = (groupRows.results||[]).map(g => `<option value="${g.group_id}">${g.group_name||g.gi_name||'未命名'}</option>`).join('');

  const CSS = `*{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,sans-serif;background:#f5f7fa;color:#333}
.header{background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;padding:16px 24px;display:flex;align-items:center;justify-content:space-between}
.header h1{font-size:1.2rem}.logout{color:#fff;text-decoration:none;font-size:.9rem;opacity:.8}
.container{max-width:1100px;margin:24px auto;padding:0 16px}
.section{background:#fff;border-radius:12px;padding:24px;margin-bottom:24px;box-shadow:0 2px 8px rgba(0,0,0,.08)}
h2{font-size:1.1rem;margin-bottom:16px;color:#444;border-bottom:2px solid #667eea;padding-bottom:8px}
.form-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px;margin-bottom:12px}
.form-full{grid-column:1/-1}
input[type=text],input[type=date],input[type=time],input[type=number],textarea,select{width:100%;padding:9px 12px;border:1.5px solid #e0e0e0;border-radius:8px;font-size:.9rem;outline:none;font-family:inherit}
input:focus,textarea:focus,select:focus{border-color:#667eea}textarea{resize:vertical;min-height:70px}
.btn{padding:9px 18px;border:none;border-radius:8px;cursor:pointer;font-size:.9rem;font-weight:600}
.btn-primary{background:linear-gradient(135deg,#667eea,#764ba2);color:#fff}
.btn-del{background:#fff0f0;color:#e53e3e;border:1px solid #fcd5d5;padding:4px 10px;border-radius:6px;cursor:pointer;font-size:.8rem}
.btn-del:hover{background:#e53e3e;color:#fff}
.btn-edit{background:#e8f4ff;color:#3182ce;border:1px solid #bee3f8;padding:4px 10px;border-radius:6px;cursor:pointer;font-size:.8rem}
.btn-save{background:#e8fff0;color:#38a169;border:1px solid #9ae6b4;padding:4px 10px;border-radius:6px;cursor:pointer;font-size:.8rem}
table{width:100%;border-collapse:collapse;font-size:.88rem}
th{background:#f8f9ff;padding:9px 10px;text-align:left;font-weight:600;color:#555;border-bottom:2px solid #eee}
td{padding:9px 10px;border-bottom:1px solid #f0f0f0;vertical-align:middle}tr:hover td{background:#fafbff}
.badge{display:inline-block;padding:2px 8px;border-radius:12px;font-size:.78rem;background:#e8f4ff;color:#3182ce;font-weight:600}
.hint{font-size:.78rem;color:#888;margin-top:5px}
.upload-area{border:2px dashed #d0d0d0;border-radius:8px;padding:16px;text-align:center;cursor:pointer;transition:.2s;margin-bottom:8px}
.upload-area:hover{border-color:#667eea;background:#f8f9ff}
.toast{position:fixed;bottom:24px;right:24px;background:#333;color:#fff;padding:12px 20px;border-radius:8px;font-size:.9rem;opacity:0;transition:.3s;pointer-events:none;z-index:999}
.toast.show{opacity:1}`;

  return `<!DOCTYPE html><html lang="zh-TW"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>娜美管理後台</title><style>${CSS}</style></head><body>
<div class="header"><h1>🚴‍♀️ 娜美管理後台 v6</h1><a href="/admin/logout" class="logout">登出</a></div>
<div class="container">

<div class="section">
<h2>💬 群組管理</h2>
<table>
  <thead><tr><th>群組名稱</th><th>Group ID</th><th>加入時間</th><th>早安</th><th>約騎提醒</th><th>節慶</th><th>生日</th><th>關鍵字</th><th>@娜美</th><th>操作</th></tr></thead>
  <tbody>${groupSettingRows}</tbody>
</table>
</div>

<div class="section">
<h2>⏰ 推播時間設定</h2>
<p class="hint" style="margin-bottom:12px">每小時整點觸發，程式自動比對設定時間執行對應任務</p>
<table>
  <thead><tr><th>任務</th><th>台灣時間</th><th>啟用</th></tr></thead>
  <tbody>${cronSettingRows}</tbody>
</table>
</div>

<div class="section">
<h2>📤 排程推播</h2>
<div class="form-grid">
  <input type="date" id="sp_date">
  <input type="number" id="sp_hour" min="0" max="23" placeholder="小時（台灣，例：7）">
  <select id="sp_group"><option value="all">全部群組</option>${groupOptions}</select>
  <select id="sp_type" onchange="updateSpForm()">
    <option value="text">text — 純文字</option>
    <option value="r2_image">r2_image — 圖片</option>
    <option value="r2_video">r2_video — 影片</option>
    <option value="sticker">sticker — LINE貼圖</option>
  </select>
  <select id="sp_repeat">
    <option value="none">不重複</option>
    <option value="daily">每天</option>
    <option value="weekly">每週</option>
  </select>
  <div class="form-full" id="sp_text_area"><textarea id="sp_text" placeholder="推播文字內容"></textarea></div>
  <div class="form-full" id="sp_media_area" style="display:none">
    <div class="upload-area" onclick="document.getElementById('sp_file').click()">📁 點擊上傳圖片/影片到 R2<input type="file" id="sp_file" style="display:none" accept="image/*,video/mp4" onchange="uploadFile(this)"></div>
    <input type="text" id="sp_media_path" placeholder="或輸入 R2 路徑 例: photos/morning.jpg" style="margin-bottom:8px">
    <textarea id="sp_caption" placeholder="附帶文字說明（選填）" style="min-height:50px"></textarea>
  </div>
  <div class="form-full" id="sp_sticker_area" style="display:none">
    <input type="text" id="sp_sticker_id" placeholder="貼圖ID 例: 11537:52002734">
    <p class="hint">參考: 11537:52002734（大心）| 11538:51626494（加油）| 11539:52114110（早安）</p>
  </div>
</div>
<button class="btn btn-primary" onclick="addSchedule()">新增排程推播</button>
<table style="margin-top:16px">
  <thead><tr><th>時間</th><th>群組</th><th>類型</th><th>內容</th><th>重複</th><th>狀態</th><th>操作</th></tr></thead>
  <tbody>${scheduleRows}</tbody>
</table>
</div>

<div class="section">
<h2>🎉 特殊節日 / 節氣 / 活動</h2>
<div class="form-grid">
  <input type="date" id="ev_date">
  <select id="ev_type"><option value="holiday">holiday — 節日</option><option value="solar_term">solar_term — 節氣</option><option value="event">event — 活動</option></select>
  <input type="text" id="ev_title" placeholder="標題">
  <select id="ev_content_type"><option value="claude">claude — AI自動生成</option><option value="text">text — 固定文字</option><option value="r2_image">r2_image — R2圖片</option></select>
  <label style="display:flex;align-items:center;gap:6px;font-size:.9rem"><input type="checkbox" id="ev_pre" checked style="width:auto"> 前一天預告</label>
  <div class="form-full"><textarea id="ev_content" placeholder="內容（claude可留空）"></textarea></div>
</div>
<button class="btn btn-primary" onclick="addEvent()">新增節日/節氣</button>
<table style="margin-top:16px">
  <thead><tr><th>日期</th><th>類型</th><th>標題</th><th>內容類型</th><th>內容</th><th>預告</th><th>操作</th></tr></thead>
  <tbody>${evRows}</tbody>
</table>
</div>

<div class="section">
<h2>🔑 關鍵字管理</h2>
<p class="hint" style="margin-bottom:12px">數字 1-3 可上傳R2圖片；4=天氣、5=約騎、6-10=賽事（自動搜尋）、11=新手資訊</p>
<div class="form-grid">
  <input type="text" id="kw_keyword" placeholder="關鍵字">
  <select id="kw_type">
    <option value="claude">claude — AI回答</option>
    <option value="text">text — 固定文字</option>
    <option value="link">link — 連結文字</option>
    <option value="r2_image">r2_image — R2圖片</option>
    <option value="r2_video">r2_video — R2影片</option>
    <option value="sticker">sticker — LINE貼圖</option>
  </select>
  <input type="text" id="kw_desc" placeholder="說明">
  <div class="form-full">
    <textarea id="kw_content" placeholder="回覆內容（claude可留空）&#10;r2_image: stickers/female（隨機女生）或 stickers/male（隨機男生）或 photos/xxx.jpg&#10;sticker: 套件ID:貼圖ID"></textarea>
  </div>
</div>
<button class="btn btn-primary" onclick="addKw()">新增關鍵字</button>
<table style="margin-top:16px">
  <thead><tr><th>關鍵字</th><th>類型</th><th>回覆內容</th><th>說明</th><th>狀態</th><th>操作</th></tr></thead>
  <tbody>${kwRows}</tbody>
</table>
</div>

<div class="section">
<h2>📅 約騎行程</h2>
<div class="form-grid">
  <input type="date" id="r_date">
  <input type="text" id="r_title" placeholder="標題">
  <input type="text" id="r_place" placeholder="集合地點">
  <input type="time" id="r_meet_time">
  <input type="time" id="r_start_time">
  <div class="form-full"><input type="text" id="r_route" placeholder="路線"></div>
  <div class="form-full"><textarea id="r_notes" placeholder="備註"></textarea></div>
</div>
<button class="btn btn-primary" onclick="addRide()">新增約騎</button>
<table style="margin-top:16px">
  <thead><tr><th>日期</th><th>標題</th><th>集合地點</th><th>集合時間</th><th>路線</th><th>操作</th></tr></thead>
  <tbody>${rideRows}</tbody>
</table>
</div>

<div class="section">
<h2>🌅 早安語錄</h2>
<div style="display:flex;gap:12px;margin-bottom:16px">
  <textarea id="msg_text" placeholder="輸入娜美風格早安語錄..." style="flex:1;min-height:70px"></textarea>
  <button class="btn btn-primary" onclick="addMsg()" style="align-self:flex-end;white-space:nowrap">新增語錄</button>
</div>
<table><thead><tr><th>語錄內容</th><th>使用日期</th><th>操作</th></tr></thead><tbody>${msgRows}</tbody></table>
</div>

<div class="section">
<h2>🎂 隊員生日</h2>
<div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap">
  <input type="text" id="b_name" placeholder="隊員名稱" style="flex:1;min-width:120px">
  <input type="date" id="b_date" style="flex:1;min-width:140px">
  <button class="btn btn-primary" onclick="addBday()">新增生日</button>
</div>
<table><thead><tr><th>姓名</th><th>生日</th><th>操作</th></tr></thead><tbody>${bdayRows}</tbody></table>
</div>

</div>
<div class="toast" id="toast"></div>
<script>
const TOK = '${ADMIN_PASSWORD}';
function showToast(msg,ok=true){const t=document.getElementById('toast');t.textContent=msg;t.style.background=ok?'#38a169':'#e53e3e';t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2500)}
async function api(path,method='GET',body=null){const opts={method,headers:{'Content-Type':'application/json','X-Admin-Token':TOK}};if(body)opts.body=JSON.stringify(body);const r=await fetch(path,opts);return r.json()}
async function del(path){if(!confirm('確定刪除？'))return;const res=await api(path,'DELETE');if(res.ok){showToast('已刪除');location.reload()}else showToast('刪除失敗',false)}
async function toggleGroup(id,field,val){const res=await api('/api/groups/'+encodeURIComponent(id),'PATCH',{field,value:val?1:0});if(res.ok)showToast('已更新');else showToast('更新失敗',false)}
async function updateGroupName(id,name){await api('/api/groups/'+encodeURIComponent(id),'PATCH',{field:'group_name',value:name});showToast('群組名稱已更新')}
async function delGroup(id){if(!confirm('確定刪除此群組設定？'))return;const res=await api('/api/groups/'+encodeURIComponent(id),'DELETE');if(res.ok){showToast('已刪除');location.reload()}}
async function toggleCron(type,val){await api('/api/cron/'+type,'PATCH',{field:'enabled',value:val?1:0});showToast('已更新')}
async function updateCron(type,hour){await api('/api/cron/'+type,'PATCH',{field:'push_hour_tw',value:parseInt(hour)});showToast('推播時間已更新')}
function updateSpForm(){const t=document.getElementById('sp_type').value;document.getElementById('sp_text_area').style.display=t==='text'?'':'none';document.getElementById('sp_media_area').style.display=(t==='r2_image'||t==='r2_video')?'':'none';document.getElementById('sp_sticker_area').style.display=t==='sticker'?'':'none'}
async function uploadFile(input){const file=input.files[0];if(!file)return;showToast('上傳中...');const fd=new FormData();fd.append('file',file);const r=await fetch('/api/upload',{method:'POST',headers:{'X-Admin-Token':TOK},body:fd});const res=await r.json();if(res.ok){document.getElementById('sp_media_path').value=res.path;showToast('上傳成功: '+res.path)}else showToast('上傳失敗',false)}
async function addSchedule(){const t=document.getElementById('sp_type').value;const d={push_date:document.getElementById('sp_date').value,push_hour:parseInt(document.getElementById('sp_hour').value),group_target:document.getElementById('sp_group').value,content_type:t,repeat_type:document.getElementById('sp_repeat').value};if(!d.push_date||isNaN(d.push_hour))return showToast('請填寫日期和時間',false);if(t==='text'){d.text_content=document.getElementById('sp_text').value;if(!d.text_content)return showToast('請輸入文字',false);}else if(t==='r2_image'||t==='r2_video'){d.media_path=document.getElementById('sp_media_path').value;d.caption=document.getElementById('sp_caption').value;if(!d.media_path)return showToast('請上傳或輸入路徑',false);}else if(t==='sticker'){d.media_path=document.getElementById('sp_sticker_id').value;if(!d.media_path)return showToast('請輸入貼圖ID',false);}const res=await api('/api/schedules','POST',d);if(res.ok){showToast('新增成功！');location.reload()}else showToast('新增失敗',false)}
function editMsg(id){document.getElementById('msg-text-'+id).style.display='none';document.getElementById('msg-edit-'+id).style.display='block';document.getElementById('save-'+id).style.display='inline-block'}
async function saveMsg(id){const t=document.getElementById('msg-edit-'+id).value.trim();if(!t)return showToast('內容不能為空',false);const res=await api('/api/messages/'+id,'PATCH',{message:t});if(res.ok){showToast('已更新');location.reload()}else showToast('更新失敗',false)}
async function addEvent(){const d={event_date:document.getElementById('ev_date').value,event_type:document.getElementById('ev_type').value,title:document.getElementById('ev_title').value.trim(),content_type:document.getElementById('ev_content_type').value,content:document.getElementById('ev_content').value||null,pre_announce:document.getElementById('ev_pre').checked?1:0};if(!d.event_date||!d.title)return showToast('請填寫日期和標題',false);const res=await api('/api/events','POST',d);if(res.ok){showToast('新增成功！');location.reload()}else showToast('新增失敗',false)}
async function addKw(){const d={keyword:document.getElementById('kw_keyword').value.trim(),reply_type:document.getElementById('kw_type').value,reply_content:document.getElementById('kw_content').value||null,description:document.getElementById('kw_desc').value.trim()};if(!d.keyword)return showToast('請輸入關鍵字',false);const res=await api('/api/keywords','POST',d);if(res.ok){showToast('新增成功！');location.reload()}else showToast('新增失敗: '+(res.error||''),false)}
async function addRide(){const d={ride_date:document.getElementById('r_date').value,title:document.getElementById('r_title').value,meeting_place:document.getElementById('r_place').value,meet_time:document.getElementById('r_meet_time').value,start_time:document.getElementById('r_start_time').value,route:document.getElementById('r_route').value,notes:document.getElementById('r_notes').value};if(!d.ride_date||!d.meeting_place)return showToast('請填寫日期和集合地點',false);const res=await api('/api/rides','POST',d);if(res.ok){showToast('新增成功！');location.reload()}else showToast('新增失敗',false)}
async function addMsg(){const message=document.getElementById('msg_text').value.trim();if(!message)return showToast('請輸入語錄',false);const res=await api('/api/messages','POST',{message});if(res.ok){showToast('新增成功！');location.reload()}}
async function addBday(){const name=document.getElementById('b_name').value.trim(),birthday=document.getElementById('b_date').value;if(!name||!birthday)return showToast('請填寫姓名和生日',false);const res=await api('/api/birthdays','POST',{name,birthday});if(res.ok){showToast('新增成功！');location.reload()}}
</script></body></html>`;
}

// ─── ROUTER ───────────────────────────────────────────────
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    if (path === '/admin' || path === '/admin/') return new Response(loginPage(), {headers: {'Content-Type': 'text/html;charset=UTF-8'}});
    if (path === '/admin/login' && method === 'POST') {
      const form = await request.formData();
      if (form.get('password') === ADMIN_PASSWORD) return new Response('', {status:302, headers:{'Location':'/admin/dashboard','Set-Cookie':`admin_token=${ADMIN_PASSWORD}; Path=/; HttpOnly; Max-Age=86400`}});
      return new Response(loginPage('密碼錯誤'), {headers: {'Content-Type': 'text/html;charset=UTF-8'}});
    }
    if (path === '/admin/logout') return new Response('', {status:302, headers:{'Location':'/admin','Set-Cookie':'admin_token=; Path=/; Max-Age=0'}});
    if (path === '/admin/dashboard') {
      const cookie = request.headers.get('Cookie') || '';
      if (!cookie.includes(`admin_token=${ADMIN_PASSWORD}`)) return new Response('', {status:302, headers:{'Location':'/admin'}});
      return new Response(await dashboardPage(env), {headers: {'Content-Type': 'text/html;charset=UTF-8'}});
    }

    const tok = request.headers.get('X-Admin-Token');
    if (tok === ADMIN_PASSWORD) {
      if (path === '/api/upload' && method === 'POST') {
        try {
          const formData = await request.formData();
          const file = formData.get('file');
          if (!file) return Response.json({ok:false, error:'no file'});
          const ext = file.name.split('.').pop().toLowerCase();
          const folder = ['mp4','mov','avi'].includes(ext) ? 'videos' : 'photos';
          const r2Path = `${folder}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g,'_')}`;
          await env.SUNBIKE_R2.put(r2Path, await file.arrayBuffer(), {httpMetadata: {contentType: file.type}});
          return Response.json({ok:true, path: r2Path, url: `${R2_BASE_URL}/${r2Path}`});
        } catch(e) { return Response.json({ok:false, error:e.message}); }
      }
      if (path === '/api/schedules' && method === 'POST') {
        const b = await request.json();
        try {
          await env.SUNBIKE_DB.prepare('INSERT INTO scheduled_push (push_date,push_hour,group_target,content_type,text_content,media_path,caption,repeat_type) VALUES (?,?,?,?,?,?,?,?)').bind(b.push_date,b.push_hour,b.group_target||'all',b.content_type||'text',b.text_content||null,b.media_path||null,b.caption||null,b.repeat_type||'none').run();
          return Response.json({ok:true});
        } catch(e) { return Response.json({ok:false, error:e.message}); }
      }
      if (path.startsWith('/api/schedules/') && method === 'DELETE') {
        await env.SUNBIKE_DB.prepare('DELETE FROM scheduled_push WHERE id=?').bind(path.split('/').pop()).run();
        return Response.json({ok:true});
      }
      if (path.startsWith('/api/groups/') && method === 'PATCH') {
        const groupId = decodeURIComponent(path.split('/api/groups/')[1]);
        const b = await request.json();
        const allowed = ['group_name','morning_push','ride_reminder','event_push','birthday_push','keyword_reply','at_reply'];
        if (!allowed.includes(b.field)) return Response.json({ok:false,error:'invalid field'});
        await env.SUNBIKE_DB.prepare(`UPDATE group_settings SET ${b.field} = ? WHERE group_id = ?`).bind(b.value, groupId).run();
        return Response.json({ok:true});
      }
      if (path.startsWith('/api/groups/') && method === 'DELETE') {
        const groupId = decodeURIComponent(path.split('/api/groups/')[1]);
        await env.SUNBIKE_DB.prepare('DELETE FROM group_settings WHERE group_id=?').bind(groupId).run();
        return Response.json({ok:true});
      }
      if (path.startsWith('/api/cron/') && method === 'PATCH') {
        const cronType = path.split('/api/cron/')[1];
        const b = await request.json();
        await env.SUNBIKE_DB.prepare(`UPDATE cron_settings SET ${b.field} = ? WHERE cron_type = ?`).bind(b.value, cronType).run();
        return Response.json({ok:true});
      }
      if (path === '/api/events' && method === 'POST') {
        const b = await request.json();
        try {
          await env.SUNBIKE_DB.prepare('INSERT INTO special_events (event_date,event_type,title,content_type,content,pre_announce) VALUES (?,?,?,?,?,?)').bind(b.event_date,b.event_type||'holiday',b.title,b.content_type||'claude',b.content||null,b.pre_announce??1).run();
          return Response.json({ok:true});
        } catch(e) { return Response.json({ok:false,error:e.message}); }
      }
      if (path.startsWith('/api/events/') && method === 'DELETE') {
        await env.SUNBIKE_DB.prepare('DELETE FROM special_events WHERE id=?').bind(path.split('/').pop()).run();
        return Response.json({ok:true});
      }
      if (path === '/api/keywords' && method === 'POST') {
        const b = await request.json();
        try {
          await env.SUNBIKE_DB.prepare('INSERT INTO keywords (keyword,reply_type,reply_content,description) VALUES (?,?,?,?)').bind(b.keyword,b.reply_type,b.reply_content||null,b.description||null).run();
          return Response.json({ok:true});
        } catch(e) { return Response.json({ok:false,error:e.message}); }
      }
      if (path.startsWith('/api/keywords/') && method === 'DELETE') {
        await env.SUNBIKE_DB.prepare('DELETE FROM keywords WHERE id=?').bind(path.split('/').pop()).run();
        return Response.json({ok:true});
      }
      if (path === '/api/rides' && method === 'POST') {
        const b = await request.json();
        await env.SUNBIKE_DB.prepare('INSERT INTO ride_schedule (ride_date,title,meeting_place,meet_time,start_time,route,notes) VALUES (?,?,?,?,?,?,?)').bind(b.ride_date,b.title||'',b.meeting_place||'',b.meet_time||'',b.start_time||'',b.route||'',b.notes||'').run();
        return Response.json({ok:true});
      }
      if (path.startsWith('/api/rides/') && method === 'DELETE') {
        await env.SUNBIKE_DB.prepare('DELETE FROM ride_schedule WHERE id=?').bind(path.split('/').pop()).run();
        return Response.json({ok:true});
      }
      if (path === '/api/messages' && method === 'POST') {
        const b = await request.json();
        await env.SUNBIKE_DB.prepare('INSERT INTO morning_messages (message) VALUES (?)').bind(b.message).run();
        return Response.json({ok:true});
      }
      if (path.startsWith('/api/messages/') && method === 'PATCH') {
        const id = path.split('/').pop();
        const b = await request.json();
        await env.SUNBIKE_DB.prepare('UPDATE morning_messages SET message=?, used_at=NULL WHERE id=?').bind(b.message, id).run();
        return Response.json({ok:true});
      }
      if (path.startsWith('/api/messages/') && method === 'DELETE') {
        await env.SUNBIKE_DB.prepare('DELETE FROM morning_messages WHERE id=?').bind(path.split('/').pop()).run();
        return Response.json({ok:true});
      }
      if (path === '/api/birthdays' && method === 'POST') {
        const b = await request.json();
        await env.SUNBIKE_DB.prepare('INSERT INTO member_birthdays (name,birthday) VALUES (?,?)').bind(b.name,b.birthday).run();
        return Response.json({ok:true});
      }
      if (path.startsWith('/api/birthdays/') && method === 'DELETE') {
        await env.SUNBIKE_DB.prepare('DELETE FROM member_birthdays WHERE id=?').bind(path.split('/').pop()).run();
        return Response.json({ok:true});
      }
    }

    // ── LINE Webhook ──
    if (method !== 'POST') return new Response('OK');
    let data;
    try { data = JSON.parse(await request.text()); } catch(e) { return new Response('OK'); }
    const keywords = await getKeywords(env);

    const processEvents = async () => {
      console.log('events count:', (data.events||[]).length, 'source:', JSON.stringify(data.events?.[0]?.source));
      for (const ev of (data.events || [])) {
        const source = ev.source;
        const targetId = source.groupId || source.userId;
        if (source.type === 'group') await saveGroupId(source.groupId, env);

        if (ev.type === 'join') {
          await linePush(targetId, NAMI_INTRO, env);
          continue;
        }
        if (ev.type !== 'message' || ev.message.type !== 'text') continue;
        const text = ev.message.text;
        const atNami = text.includes('@娜美') || text.includes('@Nami') || text.includes('@nami');
        const mentioned = ev.message.mention && isMentioned(ev.message.mention.mentionees);

        if (source.type === 'group') {
          const kw = await matchKeyword(text, keywords);
          if (mentioned || atNami) {
            const gs = await getGroupSettings(source.groupId, env);
            if (gs.at_reply) await linePush(targetId, await smartReply(text, env), env);
            continue;
          }
          if (!kw) continue;
          const gs2 = await getGroupSettings(source.groupId, env);
          if (!gs2.keyword_reply) continue;
          await handleKeywordReply(targetId, kw, text, env, ev.replyToken);
        } else {
          console.log('private msg:', text);
          const kw = await matchKeyword(text, keywords);
          console.log('kw match:', kw?.keyword, kw?._numMatch);
          if (kw) await handleKeywordReply(targetId, kw, text, env, ev.replyToken);
          else await lineReply(ev.replyToken, await smartReply(text, env), env);
        }
      }
    };
    ctx.waitUntil(processEvents());
    return new Response('OK');
  },

  async scheduled(event, env, ctx) {
    const twNow = new Date();
    const twDate = new Date(twNow.getTime() + 8*3600000);
    const twHour = twDate.getUTCHours();
    const today = twDate.toISOString().slice(0,10);
    const mm = String(twDate.getUTCMonth()+1).padStart(2,'0');
    const dd = String(twDate.getUTCDate()).padStart(2,'0');
    const tomorrow = new Date(twDate.getTime() + 24*3600000).toISOString().slice(0,10);

    const cron = await getCronSettings(env);
    const allGroups = await env.SUNBIKE_DB.prepare('SELECT gs.* FROM group_settings gs').all();
    const groups = allGroups.results || [];
    if (!groups.length) return;

    await processScheduledPush(twDate, twHour, groups, env);

    if (cron.morning?.enabled && twHour === Number(cron.morning.push_hour_tw)) {
      const specialMsg = await getSpecialEventMsg(today, env);
      const morningMsg = specialMsg || await getMorningMessage(env);
      for (const g of groups) { if (g.morning_push) await linePush(g.group_id, morningMsg, env); }
      const bdays = await env.SUNBIKE_DB.prepare("SELECT name FROM member_birthdays WHERE strftime('%m-%d',birthday)=?").bind(`${mm}-${dd}`).all();
      for (const b of (bdays.results||[])) {
        const bdayMsg = `🎂 今天是 ${b.name} 的生日！\n陽光車隊全體祝你生日快樂！🎉\n願你騎得越來越快 🚴‍♀️❤️`;
        for (const g of groups) { if (g.birthday_push) await linePush(g.group_id, bdayMsg, env); }
      }
    }

    if (cron.ride_day?.enabled && twHour === Number(cron.ride_day.push_hour_tw)) {
      const ride = await env.SUNBIKE_DB.prepare('SELECT * FROM ride_schedule WHERE ride_date=?').bind(today).first();
      if (ride) {
        const msg = `🚴 今天出發！陽光車隊集合囉！\n📍 地點：${ride.meeting_place}\n⏰ 集合：${ride.meet_time}\n🏁 路線：${ride.route||'待定'}\n${ride.notes?'📝 '+ride.notes+'\n':''}注意安全 ❤️`;
        for (const g of groups) { if (g.ride_reminder) await linePush(g.group_id, msg, env); }
      }
    }

    if (cron.ride_eve?.enabled && twHour === Number(cron.ride_eve.push_hour_tw)) {
      const ride = await env.SUNBIKE_DB.prepare('SELECT * FROM ride_schedule WHERE ride_date=?').bind(tomorrow).first();
      if (ride) {
        const msg = `📣 明天有約騎！\n📅 ${ride.ride_date}\n📍 ${ride.meeting_place} ${ride.meet_time}\n🚴 ${ride.route||'待定'}\n${ride.notes?'📝 '+ride.notes+'\n':''}記得準備好裝備 💪`;
        for (const g of groups) { if (g.ride_reminder) await linePush(g.group_id, msg, env); }
      }
    }

    if (cron.event_pre?.enabled && twHour === Number(cron.event_pre.push_hour_tw)) {
      const ev = await env.SUNBIKE_DB.prepare('SELECT * FROM special_events WHERE event_date=? AND pre_announce=1 AND enabled=1').bind(tomorrow).first();
      if (ev) {
        const preMsg = await claudeHaiku(`明天是${ev.title}！請用娜美的活潑風格，寫一則給陽光單車車隊的明天${ev.title}預告，結合騎車主題，不超過80字。`, env);
        if (preMsg) for (const g of groups) { if (g.event_push) await linePush(g.group_id, preMsg, env); }
      }
    }
  }
};