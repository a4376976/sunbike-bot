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
  const res = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {'Authorization': `Bearer ${env.LINE_CHANNEL_ACCESS_TOKEN}`, 'Content-Type': 'application/json'},
    body: JSON.stringify({to, messages: [{type: 'text', text}]})
  });
  const txt = await res.text();
  console.log('[DEBUG] linePush result:', res.status, txt.slice(0,100));
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

async function getWeather5Day(city, env) {
  try {
    const queryCity = CITY_MAP[city] || city;
    const r = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(queryCity)}&appid=${env.OPENWEATHER_API_KEY}&units=metric&lang=zh_tw&cnt=40`);
    const d = await r.json();
    if (d.cod !== '200') return null;

    // 每天取中午12點那筆（或最接近的）
    const byDay = {};
    for (const item of d.list) {
      const date = item.dt_txt.slice(0, 10);
      const hour = parseInt(item.dt_txt.slice(11, 13));
      if (!byDay[date] || Math.abs(hour - 12) < Math.abs(parseInt(byDay[date].dt_txt.slice(11,13)) - 12)) {
        byDay[date] = item;
      }
    }
    const days = Object.values(byDay).slice(0, 5);
    const lines = days.map((item, i) => {
      const date = item.dt_txt.slice(0, 10);
      const label = i === 0 ? '今天' : i === 1 ? '明天' : i === 2 ? '後天' : date.slice(5);
      const temp = Math.round(item.main.temp);
      const desc = item.weather[0].description;
      const humidity = item.main.humidity;
      const icon = temp > 30 ? '🔥' : temp > 25 ? '☀️' : temp > 18 ? '⛅' : temp > 10 ? '🌥️' : '🥶';
      const rain = item.rain?.['3h'] || 0;
      const rainStr = rain > 0 ? ` 🌧${rain.toFixed(1)}mm` : '';
      return `${icon} ${label}（${date.slice(5)}）${temp}°C ${desc} 濕${humidity}%${rainStr}`;
    });

    // 自動警示
    const warnings = [];
    for (const item of days) {
      const rain = item.rain?.['3h'] || 0;
      const temp = Math.round(item.main.temp);
      if (rain > 2) warnings.push('☔ 有雨，記得帶雨衣');
      if (temp > 32) warnings.push('🥵 高溫，多補水防中暑');
      if (temp < 12) warnings.push('🧊 低溫，注意保暖');
    }
    const uniqueWarnings = [...new Set(warnings)];

    return lines.join('\n') + (uniqueWarnings.length ? '\n\n⚠️ ' + uniqueWarnings.join('、') : '');
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

// ─── 知識庫查詢 ───────────────────────────────────────────
async function queryKnowledge(text, env) {
  try {
    const rows = await env.SUNBIKE_DB.prepare(
      'SELECT title, content, region, category FROM knowledge_base WHERE enabled=1'
    ).all();
    if (!rows.results || !rows.results.length) return '';
    const t = text.toLowerCase();
    const matched = rows.results.filter(r => {
      const tags = (r.tags || '').toLowerCase();
      const title = (r.title || '').toLowerCase();
      const content = (r.content || '').toLowerCase();
      const region = (r.region || '').toLowerCase();
      return tags.split(',').some(tag => tag.trim() && t.includes(tag.trim()))
        || t.includes(title)
        || t.includes(region)
        || content.split(' ').slice(0,5).some(w => w.length > 1 && t.includes(w));
    });
    if (!matched.length) return '';
    return '【娜美知識庫】\n' + matched.slice(0, 3).map(r =>
      `▸ ${r.title}（${r.region}）\n${r.content}`
    ).join('\n\n');
  } catch(e) { return ''; }
}

async function smartReply(text, env) {
  const yr = new Date().getFullYear();

  // 意圖分類
  const isRaceQuery   = /環法|環西|環義|古典賽|賽況|誰贏|成績|排名|黃衫|粉衫|紅點|Tour de France|Giro|Vuelta|UCI/.test(text);
  const isRouteQuery  = /路線|約騎|爬坡|補給|公路車|幾K|公里|難度|騎行|推薦.*騎|騎.*推薦|哪裡騎|怎麼騎|適合騎/.test(text);
  const isNewsQuery   = /今天|最新|最近|新聞|比賽結果|剛剛|昨天/.test(text);
  const isWeatherQuery= /天氣|下雨|幾度|溫度|氣溫|適合騎車嗎|出發天氣/.test(text);

  // 天氣 → 走天氣 API（由外層 handleNumberKeyword 處理，這裡給提示）
  if (isWeatherQuery) {
    return await claudeHaiku(`${text}（提示：使用者可輸入「4 城市名」查詢即時天氣）`, env);
  }

  // 路線實務 → 先查知識庫，再給 Claude
  if (isRouteQuery) {
    const knowledge = await queryKnowledge(text, env);
    if (knowledge) {
      return await claudeSonnet(text, knowledge, env);
    }
    // 知識庫沒有 → Brave Search 補充
    const sr = await braveSearch(`台灣公路車 ${text}`, env);
    return await claudeSonnet(text, sr, env);
  }

  // 賽事 or 最新消息 → Brave Search
  if (isRaceQuery || isNewsQuery) {
    const sr = await braveSearch(`${yr} ${text}`, env);
    return await claudeSonnet(text, sr, env);
  }

  // 一般聊天 → Claude Haiku 直接回
  return await claudeHaiku(text, env);
}

// 數字關鍵字智慧處理
async function handleNumberKeyword(num, userText, targetId, env, replyToken=null) {
  const reply = async (msg) => {
    if (replyToken) { await lineReply(replyToken, msg, env); replyToken = null; }
    else await linePush(targetId, msg, env);
  };
  const trimmed = userText.trim();
  switch(num) {
    case '4': {
      const city = trimmed.replace(/^4\s*/, '').trim();
      if (!city) { await reply('請輸入城市名稱 😊\n例如：4 台北', env); return; }
      const w5 = await getWeather5Day(city, env);
      if (w5) {
        await reply(`🌤️ ${city} 未來5天天氣預報\n─────────────────\n${w5}\n\n娜美愛你 🚴‍♀️`, env);
      } else {
        await reply(`抱歉～查不到「${city}」的天氣資料 😅\n請確認城市名稱，例如：4 台北 或 4 宜蘭`, env);
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
          msg += (()=>{const c=getBotConfig(env);return `報名請找${c.contact_name||'隊長阿欽'} 😄`})();
          await reply( msg, env);
        } else {
          await reply( '目前沒有排定的約騎行程 🚴‍♀️\n有活動會提前公告，記得關注群組！\n報名找隊長阿欽 😄', env);
        }
      } catch(e) { await reply( '查詢約騎資訊時出錯，請稍後再試 😅', env); }
      break;
    }
    case '6': {
      const yr6 = new Date().getFullYear();
      const sr = await braveSearch(`${yr6}年春季五大古典賽 米蘭聖雷莫 佛萊明赫亥特 巴黎魯貝 列日巴斯托涅 阿姆斯特爾 結果`, env);
      await reply(await claudeSonnet(`請回覆${yr6}年3-4月春季五大古典賽最新賽況和冠軍，用娜美活潑風格，不超過150字`, sr, env), env);
      break;
    }
    case '7': {
      const yr7 = new Date().getFullYear();
      const sr = await braveSearch(`${yr7} Giro d Italia 環義大賽 最新賽況 領騎`, env);
      await reply(await claudeSonnet(`請回覆${yr7}年環義大賽Giro d'Italia最新賽況，用娜美活潑風格，不超過150字`, sr, env), env);
      break;
    }
    case '8': {
      const yr8 = new Date().getFullYear();
      const sr = await braveSearch(`${yr8} 環法前哨賽 Criterium Dauphine Tour Suisse 最新`, env);
      await reply(await claudeSonnet(`請回覆${yr8}年6月環法前哨賽最新賽況，用娜美活潑風格，不超過150字`, sr, env), env);
      break;
    }
    case '9': {
      const yr9 = new Date().getFullYear();
      const sr = await braveSearch(`${yr9} Tour de France 環法大賽 最新賽況 黃衫`, env);
      await reply(await claudeSonnet(`請回覆${yr9}年環法大賽Tour de France最新賽況，用娜美活潑風格，不超過150字`, sr, env), env);
      break;
    }
    case '10': {
      const yr10 = new Date().getFullYear();
      const sr = await braveSearch(`${yr10} Vuelta Espana 環西 世界錦標賽 倫巴底環繞賽 最新`, env);
      await reply(await claudeSonnet(`請回覆${yr10}年8-10月環西、世錦賽、倫巴底最新賽況，用娜美活潑風格，不超過150字`, sr, env), env);
      break;
    }
    case '11': {
      await reply( '歡迎加入陽光車隊！🚴‍♀️\n\n新手資訊請找隊長阿欽 😄\n或直接 @娜美Nami 詢問\n\n陽光車隊歡迎你！❤️', env);
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
  for (const kw of keywords) { if (text.toLowerCase().includes(kw.keyword.toLowerCase())) return kw; }
  return null;
}

function isMentioned(mentionees) {
  return mentionees && mentionees.some(m => m.type === 'user');
}

async function handleKeywordReply(to, kw, userText, env, replyToken=null) {
  console.log('[DEBUG] handleKeywordReply called:', to, kw?.reply_type, kw?._numMatch);
  // 數字觸發特殊處理
  if (kw._numMatch && ['4','5','6','7','8','9','10','11'].includes(kw._numMatch)) {
    await handleNumberKeyword(kw._numMatch, userText, to, env, replyToken);
    return;
  }
  switch(kw.reply_type) {
    case 'claude': if (replyToken) await lineReply(replyToken, await claudeHaiku(userText, env), env); else await linePush(to, await claudeHaiku(userText, env), env); break;
    case 'text': if (replyToken) await lineReply(replyToken, kw.reply_content || '娜美找不到資料 😅', env); else await linePush(to, kw.reply_content || '娜美找不到資料 😅', env); break;
    case 'link': if (replyToken) await lineReply(replyToken, kw.reply_content || '請參考網站', env); else await linePush(to, kw.reply_content || '請參考網站', env); break;
    case 'r2_image':
      if (kw.reply_content === 'stickers/female' || kw.reply_content === 'stickers/male') {
        const num = String(Math.floor(Math.random() * 40) + 1).padStart(2, '0');
        const imgUrl = `${R2_BASE_URL}/${kw.reply_content}/${num}.png`;
        console.log('[DEBUG] r2_image url:', imgUrl);
        if (replyToken) await lineReplyImage(replyToken, imgUrl, env);
        else await linePushImage(to, imgUrl, env);
      } else {
        const encUrl = `${R2_BASE_URL}/${kw.reply_content.split('/').map(s=>encodeURIComponent(s)).join('/')}`;
        if (replyToken) await lineReplyImage(replyToken, encUrl, env);
        else await linePushImage(to, encUrl, env);
      }
      break;
    case 'r2_video':
      const vp = (kw.reply_content || '').split('|');
      await linePushVideo(to, `${R2_BASE_URL}/${vp[0]}`, `${R2_BASE_URL}/${vp[1]||vp[0]}`, env); break;
    case 'sticker':
      const sp = (kw.reply_content || '11537:52002734').split(':');
      await linePushSticker(to, sp[0], sp[1], env); break;
    default: if (replyToken) await lineReply(replyToken, await claudeHaiku(userText, env), env); else await linePush(to, await claudeHaiku(userText, env), env);
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

async function getBotConfig(env) {
  try {
    const val = await env.SUNBIKE_KV.get('bot_config');
    return val ? JSON.parse(val) : {contact_name:'隊長阿欽',bot_name:'娜美 Nami',fallback_msg:'這個要問隊長喔 😄',system_prompt_extra:''};
  } catch(e) { return {contact_name:'隊長阿欽',bot_name:'娜美 Nami',fallback_msg:'這個要問隊長喔 😄',system_prompt_extra:''}; }
}

async function getDefaultHolidayMsg(mm, dd, env) {
  try {
    const row = await env.SUNBIKE_DB.prepare(
      'SELECT message FROM default_holidays WHERE month=? AND day=? AND enabled=1'
    ).bind(parseInt(mm), parseInt(dd)).first();
    return row ? row.message : null;
  } catch(e) { return null; }
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
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Helvetica Neue',sans-serif;background:#111;min-height:100vh;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden}
body::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 80% 60% at 50% 40%,rgba(255,214,0,.15) 0%,transparent 70%)}
.card{background:#1a1a1a;border:1px solid rgba(255,214,0,.2);border-radius:20px;padding:48px 40px;width:360px;box-shadow:0 0 80px rgba(255,214,0,.08);position:relative;z-index:1}
.logo{text-align:center;margin-bottom:32px}
.logo-icon{width:64px;height:64px;background:#FFD600;border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:2rem;margin:0 auto 16px}
h1{color:#FFD600;font-size:1.4rem;font-weight:700;letter-spacing:-.5px}
.sub{color:#666;font-size:.85rem;margin-top:4px}
.field{margin-bottom:16px}
label{display:block;color:#888;font-size:.78rem;font-weight:600;letter-spacing:.05em;text-transform:uppercase;margin-bottom:8px}
input[type=password]{width:100%;padding:13px 16px;background:#222;border:1.5px solid #333;border-radius:10px;font-size:.95rem;color:#fff;outline:none;transition:.2s}
input[type=password]:focus{border-color:#FFD600;background:#242424}
button{width:100%;padding:14px;background:#FFD600;color:#111;border:none;border-radius:10px;font-size:.95rem;font-weight:700;cursor:pointer;letter-spacing:.02em;transition:.15s;margin-top:4px}
button:hover{background:#ffe033;transform:translateY(-1px)}
button:active{transform:translateY(0)}
.error{color:#ff6b6b;text-align:center;margin-bottom:16px;font-size:.85rem;padding:10px;background:rgba(255,107,107,.1);border-radius:8px}
</style></head><body>
<div class="card">
  <div class="logo">
    <div class="logo-icon">🚴‍♀️</div>
    <h1>陽光單車後台</h1>
    <p class="sub">Sunbike Bot Admin v7</p>
  </div>
  ${error ? `<p class="error">${error}</p>` : ''}
  <form method="POST" action="/admin/login">
    <div class="field"><label>管理密碼</label><input type="password" name="password" placeholder="輸入密碼登入" autofocus></div>
    <button type="submit">登入後台 →</button>
  </form>
</div>
</body></html>`;
}

async function dashboardPage(env) {
  const [rides, msgs, bdays, keywords, events, cronRows, groupRows, schedules, morningImgs, knowledgeRows] = await Promise.all([
    env.SUNBIKE_DB.prepare('SELECT * FROM ride_schedule ORDER BY ride_date DESC LIMIT 20').all(),
    env.SUNBIKE_DB.prepare('SELECT * FROM morning_messages ORDER BY id DESC LIMIT 30').all(),
    env.SUNBIKE_DB.prepare('SELECT * FROM member_birthdays ORDER BY birthday').all(),
    env.SUNBIKE_DB.prepare('SELECT * FROM keywords ORDER BY id').all(),
    env.SUNBIKE_DB.prepare('SELECT * FROM special_events ORDER BY event_date').all(),
    env.SUNBIKE_DB.prepare('SELECT * FROM cron_settings ORDER BY id').all(),
    env.SUNBIKE_DB.prepare('SELECT gs.*, gi.group_name as gi_name, gi.created_at as joined_at FROM group_settings gs LEFT JOIN group_ids gi ON gs.group_id = gi.group_id').all(),
    env.SUNBIKE_DB.prepare("SELECT * FROM scheduled_push ORDER BY push_date DESC, push_hour DESC LIMIT 30").all(),
    env.SUNBIKE_DB.prepare("SELECT * FROM morning_images WHERE active=1 ORDER BY id DESC").all(),
    env.SUNBIKE_DB.prepare("SELECT * FROM knowledge_base ORDER BY id DESC LIMIT 100").all(),
  ]);

  const toggle = (id, field, val) => `<input type="checkbox" ${val?'checked':''} onchange="toggleGroup('${id}','${field}',this.checked)" style="width:18px;height:18px;cursor:pointer;accent-color:#FFD600">`;

  const groupSettingRows = (groupRows.results||[]).map(g => {
    const joinedAt = g.joined_at ? g.joined_at.slice(0,16).replace('T',' ') : '—';
    return `<tr>
      <td><input type="text" value="${g.group_name||g.gi_name||'未命名'}" onblur="updateGroupName('${g.group_id}',this.value)" class="inline-input" style="width:100px"></td>
      <td style="font-size:.72rem;color:#888;max-width:130px;word-break:break-all">${g.group_id}</td>
      <td style="font-size:.8rem;color:#888;white-space:nowrap">${joinedAt}</td>
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
      <td><input type="number" value="${c.push_hour_tw}" min="0" max="23" onblur="updateCron('${c.cron_type}',this.value)" class="inline-input" style="width:60px"> 時（台灣）</td>
      <td style="text-align:center"><input type="checkbox" ${c.enabled?'checked':''} onchange="toggleCron('${c.cron_type}',this.checked)" style="width:18px;height:18px;cursor:pointer;accent-color:#FFD600"></td>
    </tr>`).join('');

  const scheduleRows = (schedules.results||[]).map(s => `
    <tr>
      <td>${s.push_date} ${String(s.push_hour).padStart(2,'0')}:00</td>
      <td>${s.group_target==='all'?'全部群組':s.group_target.slice(0,8)+'...'}</td>
      <td><span class="badge">${s.content_type}</span></td>
      <td style="max-width:150px;word-break:break-all;font-size:.82rem">${s.text_content||s.media_path||''}</td>
      <td>${s.repeat_type==='none'?'不重複':s.repeat_type==='daily'?'每天':'每週'}</td>
      <td><span style="color:${s.status==='sent'?'#666':'#FFD600'}">${s.status==='sent'?'已發送':'待發送'}</span></td>
      <td><button class="btn-del" onclick="del('/api/schedules/${s.id}')">刪除</button></td>
    </tr>`).join('');

  const rideRows = (rides.results||[]).map(r => `
  <tr id="ride-row-${r.id}">
    <td>${r.ride_date}</td>
    <td>${r.title||''}</td>
    <td>${r.meeting_place||''}</td>
    <td>${r.meet_time||''}</td>
    <td>${(r.route||'').slice(0,20)}</td>
    <td>${r.weather_city ? `<span class="badge">${r.weather_city}</span>` : '<span style="color:#555">—</span>'}</td>
    <td style="text-align:center"><input type="checkbox" ${r.weather_push?'checked':''} disabled style="accent-color:#FFD600"></td>
    <td style="white-space:nowrap">
      <button class="btn-edit" onclick="editRide(${r.id})">編輯</button>
      <button class="btn-del" onclick="delRide(${r.id})">刪除</button>
    </td>
  </tr>
  <tr id="ride-edit-${r.id}" style="display:none;background:var(--hover-bg)">
    <td colspan="8" style="padding:12px">
      <div class="form-grid" style="margin-bottom:8px">
        <div><label class="form-label">日期</label><input type="date" id="re_date_${r.id}" value="${r.ride_date}"></div>
        <div><label class="form-label">標題</label><input type="text" id="re_title_${r.id}" value="${(r.title||'').replace(/"/g,'&quot;')}"></div>
        <div><label class="form-label">集合地點</label><input type="text" id="re_place_${r.id}" value="${(r.meeting_place||'').replace(/"/g,'&quot;')}"></div>
        <div><label class="form-label">集合時間</label><input type="time" id="re_meet_${r.id}" value="${r.meet_time||''}"></div>
        <div><label class="form-label">天氣推播城市</label><input type="text" id="re_wcity_${r.id}" value="${(r.weather_city||'').replace(/"/g,'&quot;')}"></div>
        <div style="display:flex;align-items:flex-end;padding-bottom:2px"><label style="display:flex;align-items:center;gap:8px;font-size:.88rem;color:var(--text2);cursor:pointer"><input type="checkbox" id="re_wpush_${r.id}" ${r.weather_push?'checked':''} style="width:auto;accent-color:#FFD600"> 啟用天氣推播</label></div>
        <div class="form-full"><label class="form-label">路線</label><input type="text" id="re_route_${r.id}" value="${(r.route||'').replace(/"/g,'&quot;')}"></div>
        <div class="form-full"><label class="form-label">備註</label><textarea id="re_notes_${r.id}" style="min-height:50px">${r.notes||''}</textarea></div>
      </div>
      <button class="btn btn-primary" onclick="saveRide(${r.id})" style="margin-right:8px">儲存</button>
      <button class="btn" onclick="cancelEditRide(${r.id})" style="background:var(--bg3);border:1px solid var(--border2);color:var(--text)">取消</button>
    </td>
  </tr>`).join('');

  const msgRows = (msgs.results||[]).map(m => `
    <tr>
      <td style="max-width:260px;word-break:break-all">
        <span id="msg-text-${m.id}">${m.message}</span>
        <textarea id="msg-edit-${m.id}" style="display:none;width:100%;min-height:60px" class="inline-input">${m.message}</textarea>
      </td>
      <td style="color:#888">${m.used_at||'未使用'}</td>
      <td style="white-space:nowrap">
        <button class="btn-edit" onclick="editMsg(${m.id})">編輯</button>
        <button class="btn-save" id="save-${m.id}" style="display:none" onclick="saveMsg(${m.id})">儲存</button>
        <button class="btn-del" onclick="del('/api/messages/${m.id}')">刪除</button>
      </td>
    </tr>`).join('');

  const knowledgeRowsHtml = (knowledgeRows.results||[]).map(k => `
  <tr id="kb-row-${k.id}">
    <td><span class="badge">${k.category||'路線'}</span></td>
    <td>${k.region||''}</td>
    <td style="font-weight:600">${k.title||''}</td>
    <td style="font-size:.78rem;color:var(--text3);max-width:120px">${k.tags||''}</td>
    <td style="max-width:200px;font-size:.82rem;word-break:break-all">${(k.content||'').slice(0,60)}${(k.content||'').length>60?'…':''}</td>
    <td style="text-align:center"><input type="checkbox" ${k.enabled?'checked':''} onchange="toggleKnowledge(${k.id},this.checked)" style="accent-color:#FFD600;width:18px;height:18px;cursor:pointer"></td>
    <td style="white-space:nowrap">
      <button class="btn-edit" onclick="editKb(${k.id})">編輯</button>
      <button class="btn-del" onclick="delKb(${k.id})">刪除</button>
    </td>
  </tr>
  <tr id="kb-edit-${k.id}" style="display:none;background:var(--hover-bg)">
    <td colspan="7" style="padding:12px">
      <div class="form-grid" style="margin-bottom:8px">
        <div><label class="form-label">分類</label><select id="kbe_cat_${k.id}">
          <option value="路線" ${k.category==='路線'?'selected':''}>路線</option>
          <option value="補給" ${k.category==='補給'?'selected':''}>補給</option>
          <option value="安全" ${k.category==='安全'?'selected':''}>安全注意</option>
          <option value="裝備" ${k.category==='裝備'?'selected':''}>裝備建議</option>
          <option value="賽事" ${k.category==='賽事'?'selected':''}>賽事資訊</option>
          <option value="其他" ${k.category==='其他'?'selected':''}>其他</option>
        </select></div>
        <div><label class="form-label">地區</label><input type="text" id="kbe_region_${k.id}" value="${(k.region||'').replace(/"/g,'&quot;')}"></div>
        <div><label class="form-label">標題</label><input type="text" id="kbe_title_${k.id}" value="${(k.title||'').replace(/"/g,'&quot;')}"></div>
        <div><label class="form-label">Tags</label><input type="text" id="kbe_tags_${k.id}" value="${(k.tags||'').replace(/"/g,'&quot;')}"></div>
        <div class="form-full"><label class="form-label">內容</label><textarea id="kbe_content_${k.id}" style="min-height:80px">${(k.content||'').replace(/</g,'&lt;')}</textarea></div>
      </div>
      <button class="btn btn-primary" onclick="saveKb(${k.id})" style="margin-right:8px">儲存</button>
      <button class="btn" onclick="cancelEditKb(${k.id})" style="background:var(--bg3);border:1px solid var(--border2);color:var(--text)">取消</button>
    </td>
  </tr>`).join('');

  const quotaRes = await fetch('https://api.line.me/v2/bot/message/quota', {headers:{'Authorization':`Bearer ${env.LINE_CHANNEL_ACCESS_TOKEN}`}}).then(r=>r.json()).catch(()=>({value:0}));
  const consumeRes = await fetch('https://api.line.me/v2/bot/message/quota/consumption', {headers:{'Authorization':`Bearer ${env.LINE_CHANNEL_ACCESS_TOKEN}`}}).then(r=>r.json()).catch(()=>({totalUsage:0}));
  const quotaMax = quotaRes.value || 0;
  const quotaUsed = consumeRes.totalUsage || 0;
  const quotaLeft = quotaMax - quotaUsed;
  const quotaColor = quotaLeft <= 20 ? '#ff6b6b' : quotaLeft <= 50 ? '#ffa500' : '#4ade80';
  const quotaPct = Math.min(100,Math.round(quotaUsed/quotaMax*100));

  const botCfgRaw = await env.SUNBIKE_KV.get('bot_config').catch(()=>null);
  const botCfg = botCfgRaw ? JSON.parse(botCfgRaw) : {contact_name:'隊長阿欽',bot_name:'娜美 Nami',fallback_msg:'這個要問隊長喔 😄',system_prompt_extra:''};
  const cfg_contact = botCfg.contact_name||'';
  const cfg_botname = botCfg.bot_name||'';
  const cfg_fallback = botCfg.fallback_msg||'';
  const cfg_extra = botCfg.system_prompt_extra||'';

  const morningImgOptions = (morningImgs.results||[]).map(img => `<option value="${img.r2_path}">${img.filename}</option>`).join('');
  const imgCards = (morningImgs.results||[]).map(img => `
    <div class="img-card">
      <img src="${R2_BASE_URL}/${img.r2_path}" style="width:100%;height:90px;object-fit:cover;border-radius:8px;border:1px solid #333">
      <div style="font-size:.7rem;color:#666;margin-top:4px;text-align:center">${img.filename}</div>
      <button onclick="delImg(${img.id})" class="img-del-btn">×</button>
    </div>`).join('');

  const bdayRows = (bdays.results||[]).map(b => `<tr><td>${b.name}</td><td>${b.birthday}</td><td><button class="btn-del" onclick="del('/api/birthdays/${b.id}')">刪除</button></td></tr>`).join('');

  const kwRows = (keywords.results||[]).map(k => `<tr>
    <td><span style="color:#FFD600;font-weight:600">${k.keyword}</span></td>
    <td><span class="badge">${k.reply_type}</span></td>
    <td style="max-width:180px;word-break:break-all;font-size:.82rem">
      <span id="kw-content-${k.id}">${k.reply_content||'—'}</span>
      ${k.reply_type==='r2_image' ? `<select id="kw-gallery-${k.id}" style="display:none;width:100%;margin-bottom:4px" class="inline-input" onchange="if(this.value){document.getElementById('kw-edit-${k.id}').value=this.value}">
        <option value="">── 從圖庫選取 ──</option>
        ${morningImgOptions}
      </select>` : ''}
      <textarea id="kw-edit-${k.id}" style="display:none;width:100%;min-height:60px" class="inline-input">${k.reply_content||''}</textarea>
    </td>
    <td><span id="kw-desc-${k.id}">${k.description||''}</span>
      <input id="kw-desc-edit-${k.id}" style="display:none;width:100%" class="inline-input" value="${k.description||''}">
    </td>
    <td>${k.enabled?'<span style="color:#4ade80">✓ 啟用</span>':'<span style="color:#666">✗ 停用</span>'}</td>
    <td style="white-space:nowrap">
      <button class="btn-edit" onclick="editKw(${k.id})">編輯</button>
      <button class="btn-save" id="kw-save-${k.id}" style="display:none" onclick="saveKw(${k.id})">儲存</button>
      <button class="btn-del" onclick="del('/api/keywords/${k.id}')">刪除</button>
    </td>
  </tr>`).join('');

  const evRows = (events.results||[]).map(e => `<tr>
    <td>${e.event_date}</td>
    <td><span class="badge">${e.event_type}</span></td>
    <td>${e.title}</td>
    <td><span class="badge badge-gray">${e.content_type}</span></td>
    <td style="max-width:140px;word-break:break-all;font-size:.82rem">
      <span id="ev-content-${e.id}">${e.content||'Claude生成'}</span>
      <div id="ev-edit-${e.id}" style="display:none">
        <select onchange="if(this.value){document.getElementById('ev-path-${e.id}').value=this.value}" class="inline-input" style="width:100%;margin-bottom:4px">
          <option value="">── 從圖庫選取 ──</option>
          ${morningImgOptions}
        </select>
        <input id="ev-path-${e.id}" value="${e.content||''}" class="inline-input" style="width:100%">
      </div>
    </td>
    <td>${e.pre_announce?'<span style="color:#FFD600">✓</span>':'—'}</td>
    <td style="white-space:nowrap">
      <button class="btn-edit" onclick="editEv(${e.id})">編輯</button>
      <button class="btn-save" id="ev-save-${e.id}" style="display:none" onclick="saveEv(${e.id})">儲存</button>
      <button class="btn-del" onclick="del('/api/events/${e.id}')">刪除</button>
    </td>
  </tr>`).join('');

  const groupOptions = (groupRows.results||[]).map(g => `<option value="${g.group_id}">${g.group_name||g.gi_name||'未命名'}</option>`).join('');

  const CSS = `
/* ── 強制亮色（預設） ── */
body.theme-light {
  --bg:       #f5f7fa;
  --bg2:      #ffffff;
  --bg3:      #f0f2f5;
  --border:   #e2e6ea;
  --border2:  #d0d5dd;
  --text:     #1a1a1a;
  --text2:    #555;
  --text3:    #888;
  --input-bg: #ffffff;
  --hover-bg: #f8f9ff;
  --badge-bg: #e8f0fe;
  --badge-c:  #1a56db;
  --toast-bg: #1a1a1a;
  --toast-c:  #fff;
  --shadow:   0 2px 8px rgba(0,0,0,.08);
  --upload-hover: #fffde7;
}
:root {
  --bg:       #f5f7fa;
  --bg2:      #ffffff;
  --bg3:      #f0f2f5;
  --border:   #e2e6ea;
  --border2:  #d0d5dd;
  --text:     #1a1a1a;
  --text2:    #555;
  --text3:    #888;
  --input-bg: #ffffff;
  --hover-bg: #f8f9ff;
  --badge-bg: #e8f0fe;
  --badge-c:  #1a56db;
  --toast-bg: #1a1a1a;
  --toast-c:  #fff;
  --shadow:   0 2px 8px rgba(0,0,0,.08);
  --upload-hover: #fffde7;
}
/* ── 深色模式（只有「隨系統」模式才套用） ── */
@media(prefers-color-scheme:dark){
  body.theme-system {
    --bg:       #0f0f0f;
    --bg2:      #161616;
    --bg3:      #1a1a1a;
    --border:   #222;
    --border2:  #2a2a2a;
    --text:     #e0e0e0;
    --text2:    #aaa;
    --text3:    #666;
    --input-bg: #1e1e1e;
    --hover-bg: #191919;
    --badge-bg: #1e3a5f;
    --badge-c:  #60a5fa;
    --toast-bg: #222;
    --toast-c:  #fff;
    --shadow:   0 2px 8px rgba(0,0,0,.3);
    --upload-hover: #1a1800;
  }
}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Helvetica Neue',Arial,sans-serif;background:var(--bg);color:var(--text);min-height:100vh}

/* ── Topbar ── */
.topbar{background:var(--bg2);border-bottom:1px solid var(--border);padding:0 24px;height:56px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100}
.topbar-brand{display:flex;align-items:center;gap:10px}
.topbar-logo{width:32px;height:32px;background:#FFD600;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:1.1rem}
.topbar-title{font-size:1rem;font-weight:700;color:var(--text);letter-spacing:-.3px}
.topbar-version{font-size:.72rem;color:var(--text3);margin-left:4px}
.topbar-right{display:flex;align-items:center;gap:12px}
.quota-badge{display:flex;align-items:center;gap:6px;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:6px 12px;font-size:.82rem;cursor:pointer;color:var(--text)}
.quota-dot{width:8px;height:8px;border-radius:50%;background:${quotaColor}}
.logout-btn{color:var(--text3);text-decoration:none;font-size:.85rem;padding:6px 12px;border-radius:8px;border:1px solid var(--border2);transition:.15s}
.logout-btn:hover{color:var(--text);border-color:var(--text2)}

/* ── Tab Nav ── */
.tab-nav{background:var(--bg2);border-bottom:1px solid var(--border);padding:0 24px;display:flex;gap:0;overflow-x:auto}
.tab-btn{padding:14px 20px;background:none;border:none;border-bottom:2px solid transparent;color:var(--text3);font-size:.88rem;font-weight:500;cursor:pointer;white-space:nowrap;transition:.15s;display:flex;align-items:center;gap:6px}
.tab-btn:hover{color:var(--text)}
.tab-btn.active{color:#FFD600;border-bottom-color:#FFD600;font-weight:600}
.tab-icon{font-size:1rem}

/* ── Tab Content ── */
.tab-pane{display:none;padding:24px;max-width:1200px;margin:0 auto}
.tab-pane.active{display:block}

/* ── Cards ── */
.card{background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:20px;margin-bottom:20px;box-shadow:var(--shadow)}
.card-title{font-size:.92rem;font-weight:700;color:var(--text);margin-bottom:16px;display:flex;align-items:center;gap:8px}
.card-title::after{content:'';flex:1;height:1px;background:var(--border);margin-left:8px}

/* ── Dashboard stats ── */
.stats-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;margin-bottom:20px}
.stat-card{background:var(--bg3);border:1px solid var(--border);border-radius:10px;padding:16px;text-align:center}
.stat-num{font-size:2rem;font-weight:700;font-variant-numeric:tabular-nums;line-height:1}
.stat-label{font-size:.75rem;color:var(--text3);margin-top:6px;letter-spacing:.03em}
.progress-bar{background:var(--border);border-radius:6px;height:8px;overflow:hidden;margin-top:8px}
.progress-fill{height:100%;border-radius:6px;transition:.3s}

/* ── Forms ── */
.form-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px;margin-bottom:12px}
.form-full{grid-column:1/-1}
input[type=text],input[type=date],input[type=time],input[type=number],textarea,select,.inline-input{
  width:100%;padding:9px 12px;background:var(--input-bg);border:1.5px solid var(--border2);border-radius:8px;
  font-size:.88rem;color:var(--text);outline:none;font-family:inherit;transition:.15s
}
input:focus,textarea:focus,select:focus,.inline-input:focus{border-color:#FFD600}
textarea{resize:vertical;min-height:70px}
select option{background:var(--input-bg)}
label.form-label{display:block;color:var(--text3);font-size:.75rem;font-weight:600;letter-spacing:.05em;text-transform:uppercase;margin-bottom:6px}

/* ── Buttons ── */
.btn{padding:9px 18px;border:none;border-radius:8px;cursor:pointer;font-size:.88rem;font-weight:600;transition:.15s;letter-spacing:.02em}
.btn-primary{background:#FFD600;color:#111}
.btn-primary:hover{background:#ffe033;transform:translateY(-1px)}
.btn-del{background:var(--bg3);color:#e53e3e;border:1px solid var(--border2);padding:4px 10px;border-radius:6px;cursor:pointer;font-size:.8rem;transition:.15s}
.btn-del:hover{background:#e53e3e;color:#fff;border-color:#e53e3e}
.btn-edit{background:var(--bg3);color:#3182ce;border:1px solid var(--border2);padding:4px 10px;border-radius:6px;cursor:pointer;font-size:.8rem;transition:.15s}
.btn-edit:hover{background:#3182ce;color:#fff;border-color:#3182ce}
.btn-save{background:var(--bg3);color:#38a169;border:1px solid var(--border2);padding:4px 10px;border-radius:6px;cursor:pointer;font-size:.8rem;transition:.15s}
.btn-save:hover{background:#38a169;color:#fff}

/* ── Tables ── */
table{width:100%;border-collapse:collapse;font-size:.85rem}
th{padding:10px 12px;text-align:left;font-weight:600;color:var(--text3);border-bottom:1px solid var(--border);font-size:.78rem;letter-spacing:.04em;text-transform:uppercase}
td{padding:10px 12px;border-bottom:1px solid var(--border);vertical-align:middle;color:var(--text2)}
tr:hover td{background:var(--hover-bg)}
.badge{display:inline-block;padding:2px 8px;border-radius:6px;font-size:.75rem;background:var(--badge-bg);color:var(--badge-c);font-weight:600}
.badge-gray{background:var(--bg3);color:var(--text3)}

/* ── Upload area ── */
.upload-area{border:2px dashed var(--border2);border-radius:8px;padding:16px;text-align:center;cursor:pointer;transition:.2s;color:var(--text3);font-size:.88rem}
.upload-area:hover{border-color:#FFD600;color:#FFD600;background:var(--upload-hover)}

/* ── Image grid ── */
.img-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:12px}
.img-card{position:relative}
.img-del-btn{position:absolute;top:4px;right:4px;background:rgba(0,0,0,.6);color:#fff;border:none;border-radius:50%;width:22px;height:22px;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;opacity:0;transition:.15s}
.img-card:hover .img-del-btn{opacity:1}

/* ── Toast ── */
.toast{position:fixed;bottom:24px;right:24px;background:var(--toast-bg);color:var(--toast-c);padding:12px 20px;border-radius:10px;font-size:.88rem;opacity:0;transition:.25s;pointer-events:none;z-index:999;border:1px solid var(--border);backdrop-filter:blur(8px)}
.toast.show{opacity:1}
.hint{font-size:.78rem;color:var(--text3);margin-top:5px}
`;

  return `<!DOCTYPE html><html lang="zh-TW"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>陽光單車後台</title><style>${CSS}</style></head><body>

<!-- Topbar -->
<div class="topbar">
  <div class="topbar-brand">
    <div class="topbar-logo">🚴‍♀️</div>
    <span class="topbar-title">陽光單車後台</span>
    <span class="topbar-version">v7.9</span>
  </div>
  <div class="topbar-right">
    <a href="https://console.anthropic.com/settings/usage" target="_blank" class="quota-badge" style="text-decoration:none" title="查看 Claude API 用量">
      <span>📊</span><span>API用量</span>
    </a>
    <a href="https://claude.ai/settings/usage" target="_blank" class="quota-badge" style="text-decoration:none" title="查看 Claude Pro 用量">
      <span>🤖</span><span>Pro用量</span>
    </a>
    <div class="quota-badge" onclick="refreshQuota()" title="點擊更新">
      <div class="quota-dot" id="quota-dot"></div>
      <span id="quota-text">推播剩餘 <strong id="quota-left">${quotaLeft}</strong> 則</span>
    </div>
    <button id="theme-toggle" onclick="toggleTheme()" title="切換主題" style="background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:6px 12px;font-size:.82rem;cursor:pointer;color:var(--text);display:flex;align-items:center;gap:5px">
      <span id="theme-icon">🌙</span><span id="theme-label">隨系統</span>
    </button>
    <a href="/admin/logout" class="logout-btn">登出</a>
  </div>
</div>

<!-- Tab Nav -->
<div class="tab-nav">
  <button class="tab-btn active" onclick="switchTab('dashboard',this)"><span class="tab-icon">📊</span>儀表板</button>
  <button class="tab-btn" onclick="switchTab('groups',this)"><span class="tab-icon">💬</span>群組管理</button>
  <button class="tab-btn" onclick="switchTab('content',this)"><span class="tab-icon">📝</span>內容管理</button>
  <button class="tab-btn" onclick="switchTab('knowledge',this)"><span class="tab-icon">🧠</span>知識庫</button>
  <button class="tab-btn" onclick="switchTab('system',this)"><span class="tab-icon">⚙️</span>系統設定</button>
</div>

<!-- ═══════════════════════════════════════
     TAB 1：儀表板
═══════════════════════════════════════ -->
<div class="tab-pane active" id="tab-dashboard">

  <div class="card">
    <div class="card-title">🟢 系統狀態</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px">

      <div style="display:flex;flex-direction:column;gap:10px">
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:var(--bg3);border-radius:8px;border:1px solid var(--border)">
          <span style="font-size:.88rem;color:var(--text2)">⚡ Bot 狀態</span>
          <span style="color:#4ade80;font-weight:600;font-size:.88rem">● 運作中</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:var(--bg3);border-radius:8px;border:1px solid var(--border)">
          <span style="font-size:.88rem;color:var(--text2)">🏷️ 目前版本</span>
          <span style="color:#FFD600;font-weight:600;font-size:.88rem">v7.9</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:var(--bg3);border-radius:8px;border:1px solid var(--border)">
          <span style="font-size:.88rem;color:var(--text2)">🌐 網址</span>
          <a href="https://bot.jego3c.com" target="_blank" style="color:#60a5fa;font-size:.85rem;text-decoration:none">bot.jego3c.com</a>
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:10px">
        <div style="padding:10px 14px;background:var(--bg3);border-radius:8px;border:1px solid var(--border)">
          <div style="display:flex;justify-content:space-between;margin-bottom:6px">
            <span style="font-size:.88rem;color:var(--text2)">📤 LINE Push 額度</span>
            <span style="font-weight:600;font-size:.88rem;color:${quotaColor}">${quotaLeft} / ${quotaMax}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width:${quotaPct}%;background:${quotaColor}"></div>
          </div>
          <div style="font-size:.75rem;color:var(--text3);margin-top:4px">每月1日重置</div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:var(--bg3);border-radius:8px;border:1px solid var(--border)">
          <span style="font-size:.88rem;color:var(--text2)">🌅 下次早安推播</span>
          <span style="color:var(--text);font-weight:600;font-size:.88rem">${cronRows.results?.find(c=>c.cron_type==='morning')?.push_hour_tw ?? '—'}:00 台灣</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:var(--bg3);border-radius:8px;border:1px solid var(--border)">
          <span style="font-size:.88rem;color:var(--text2)">🚴 下次約騎提醒</span>
          <span style="color:var(--text);font-weight:600;font-size:.88rem">${cronRows.results?.find(c=>c.cron_type==='ride_day')?.push_hour_tw ?? '—'}:00 台灣</span>
        </div>
      </div>

    </div>
  </div>

  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-num" style="color:${quotaColor}" id="quota-left-big">${quotaLeft}</div>
      <div class="stat-label">推播剩餘則數</div>
      <div class="progress-bar" style="margin-top:10px">
        <div class="progress-fill" style="width:${quotaPct}%;background:${quotaColor}"></div>
      </div>
      <div style="font-size:.72rem;color:#555;margin-top:4px">${quotaUsed} / ${quotaMax}（每月1日重置）</div>
    </div>
    <div class="stat-card">
      <div class="stat-num" style="color:#60a5fa">${(groupRows.results||[]).length}</div>
      <div class="stat-label">管理群組數</div>
    </div>
    <div class="stat-card">
      <div class="stat-num" style="color:#c084fc">${(keywords.results||[]).length}</div>
      <div class="stat-label">關鍵字數量</div>
    </div>
    <div class="stat-card">
      <div class="stat-num" style="color:#fb923c">${(morningImgs.results||[]).length}</div>
      <div class="stat-label">早安圖庫張數</div>
    </div>
    <div class="stat-card">
      <div class="stat-num" style="color:#4ade80">${(msgs.results||[]).length}</div>
      <div class="stat-label">早安語錄則數</div>
    </div>
    <div class="stat-card">
      <div class="stat-num" style="color:#f472b6">${(rides.results||[]).length}</div>
      <div class="stat-label">約騎行程筆數</div>
    </div>
  </div>

  <div class="card">
    <div class="card-title">⏰ 推播時間設定</div>
    <p class="hint" style="margin-bottom:12px">每小時整點觸發，程式自動比對設定時間執行對應任務</p>
    <table>
      <thead><tr><th>任務</th><th>台灣時間</th><th>啟用</th></tr></thead>
      <tbody>${cronSettingRows}</tbody>
    </table>
  </div>

</div>

<!-- ═══════════════════════════════════════
     TAB 2：群組管理
═══════════════════════════════════════ -->
<div class="tab-pane" id="tab-groups">

  <div class="card">
    <div class="card-title">💬 群組列表與權限</div>
    <div style="overflow-x:auto">
    <table>
      <thead><tr><th>群組名稱</th><th>Group ID</th><th>加入時間</th><th>早安</th><th>約騎提醒</th><th>節慶</th><th>生日</th><th>關鍵字</th><th>@娜美</th><th>操作</th></tr></thead>
      <tbody>${groupSettingRows}</tbody>
    </table>
    </div>
  </div>

  <div class="card">
    <div class="card-title">📤 排程推播</div>
    <div class="form-grid">
      <div><label class="form-label">日期</label><input type="date" id="sp_date"></div>
      <div><label class="form-label">時間（台灣）</label><input type="number" id="sp_hour" min="0" max="23" placeholder="0-23"></div>
      <div><label class="form-label">目標群組</label><select id="sp_group"><option value="all">全部群組</option>${groupOptions}</select></div>
      <div><label class="form-label">內容類型</label><select id="sp_type" onchange="updateSpForm()">
        <option value="text">text — 純文字</option>
        <option value="r2_image">r2_image — 圖片</option>
        <option value="r2_video">r2_video — 影片</option>
        <option value="sticker">sticker — LINE貼圖</option>
      </select></div>
      <div><label class="form-label">重複</label><select id="sp_repeat">
        <option value="none">不重複</option>
        <option value="daily">每天</option>
        <option value="weekly">每週</option>
      </select></div>
      <div class="form-full" id="sp_text_area"><label class="form-label">文字內容</label><textarea id="sp_text" placeholder="推播文字內容"></textarea></div>
      <div class="form-full" id="sp_media_area" style="display:none">
        <label class="form-label">圖片/影片</label>
        <div class="upload-area" onclick="document.getElementById('sp_file').click()">📁 點擊上傳到 R2<input type="file" id="sp_file" style="display:none" accept="image/*,video/mp4" onchange="uploadFile(this)"></div>
        <select id="sp_media_select" onchange="if(this.value){document.getElementById('sp_media_path').value=this.value}" style="width:100%;margin:8px 0">
          <option value="">── 從早安圖庫選取 ──</option>${morningImgOptions}
        </select>
        <input type="text" id="sp_media_path" placeholder="或輸入 R2 路徑">
        <textarea id="sp_caption" placeholder="附帶文字說明（選填）" style="margin-top:8px;min-height:50px"></textarea>
      </div>
      <div class="form-full" id="sp_sticker_area" style="display:none">
        <label class="form-label">貼圖ID</label>
        <input type="text" id="sp_sticker_id" placeholder="例: 11537:52002734">
        <p class="hint">參考: 11537:52002734（大心）| 11538:51626494（加油）| 11539:52114110（早安）</p>
      </div>
    </div>
    <button class="btn btn-primary" onclick="addSchedule()">新增排程推播</button>
    <table style="margin-top:16px">
      <thead><tr><th>時間</th><th>群組</th><th>類型</th><th>內容</th><th>重複</th><th>狀態</th><th>操作</th></tr></thead>
      <tbody>${scheduleRows}</tbody>
    </table>
  </div>

</div>

<!-- ═══════════════════════════════════════
     TAB 3：內容管理
═══════════════════════════════════════ -->
<div class="tab-pane" id="tab-content">

  <div class="card">
    <div class="card-title">🎉 特殊節日 / 節氣 / 活動</div>
    <div class="form-grid">
      <div><label class="form-label">日期</label><input type="date" id="ev_date"></div>
      <div><label class="form-label">類型</label><select id="ev_type"><option value="holiday">holiday — 節日</option><option value="solar_term">solar_term — 節氣</option><option value="event">event — 活動</option></select></div>
      <div><label class="form-label">標題</label><input type="text" id="ev_title" placeholder="節日標題"></div>
      <div><label class="form-label">內容類型</label><select id="ev_content_type"><option value="claude">claude — AI自動生成</option><option value="text">text — 固定文字</option><option value="r2_image">r2_image — R2圖片</option></select></div>
      <div style="display:flex;align-items:flex-end;padding-bottom:2px"><label style="display:flex;align-items:center;gap:6px;font-size:.88rem;color:#ccc;cursor:pointer"><input type="checkbox" id="ev_pre" checked style="width:auto;accent-color:#FFD600"> 前一天預告</label></div>
      <div class="form-full"><label class="form-label">內容（claude可留空）</label><textarea id="ev_content" placeholder="內容（claude可留空）"></textarea></div>
    </div>
    <button class="btn btn-primary" onclick="addEvent()">新增節日/節氣</button>
    <table style="margin-top:16px">
      <thead><tr><th>日期</th><th>類型</th><th>標題</th><th>內容類型</th><th>內容</th><th>預告</th><th>操作</th></tr></thead>
      <tbody>${evRows}</tbody>
    </table>
  </div>

  <div class="card">
    <div class="card-title">🔑 關鍵字管理</div>
    <p class="hint" style="margin-bottom:12px">數字 1-3 可上傳R2圖片；4=天氣、5=約騎、6-10=賽事（自動搜尋）、11=新手資訊</p>
    <div class="form-grid">
      <div><label class="form-label">關鍵字</label><input type="text" id="kw_keyword" placeholder="關鍵字"></div>
      <div><label class="form-label">類型</label><select id="kw_type">
        <option value="claude">claude — AI回答</option>
        <option value="text">text — 固定文字</option>
        <option value="link">link — 連結文字</option>
        <option value="r2_image">r2_image — R2圖片</option>
        <option value="r2_video">r2_video — R2影片</option>
        <option value="sticker">sticker — LINE貼圖</option>
      </select></div>
      <div><label class="form-label">說明</label><input type="text" id="kw_desc" placeholder="說明"></div>
      <div class="form-full"><label class="form-label">回覆內容</label>
        <textarea id="kw_content" placeholder="回覆內容（claude可留空）&#10;r2_image: stickers/female（隨機女生）或 stickers/male（隨機男生）&#10;sticker: 套件ID:貼圖ID"></textarea>
      </div>
    </div>
    <button class="btn btn-primary" onclick="addKw()">新增關鍵字</button>
    <table style="margin-top:16px">
      <thead><tr><th>關鍵字</th><th>類型</th><th>回覆內容</th><th>說明</th><th>狀態</th><th>操作</th></tr></thead>
      <tbody>${kwRows}</tbody>
    </table>
  </div>

  <div class="card">
    <div class="card-title">📅 約騎行程</div>
    <div class="form-grid">
      <div><label class="form-label">日期</label><input type="date" id="r_date"></div>
      <div><label class="form-label">標題</label><input type="text" id="r_title" placeholder="標題"></div>
      <div><label class="form-label">集合地點</label><input type="text" id="r_place" placeholder="集合地點"></div>
      <div><label class="form-label">集合時間</label><input type="time" id="r_meet_time"></div>
      <div><label class="form-label">出發時間</label><input type="time" id="r_start_time"></div>
      <div><label class="form-label">天氣推播城市</label><input type="text" id="r_weather_city" placeholder="例：羅東、花蓮（空白=不推播）"></div>
      <div style="display:flex;align-items:flex-end;padding-bottom:2px"><label style="display:flex;align-items:center;gap:8px;font-size:.88rem;color:var(--text2);cursor:pointer"><input type="checkbox" id="r_weather_push" style="width:auto;accent-color:#FFD600"> 啟用天氣預報推播（出發前5天）</label></div>
      <div class="form-full"><label class="form-label">路線</label><input type="text" id="r_route" placeholder="路線"></div>
      <div class="form-full"><label class="form-label">備註</label><textarea id="r_notes" placeholder="備註" style="min-height:50px"></textarea></div>
    </div>
    <button class="btn btn-primary" onclick="addRide()">新增約騎</button>
    <table style="margin-top:16px">
      <thead><tr><th>日期</th><th>標題</th><th>集合地點</th><th>集合時間</th><th>路線</th><th>天氣城市</th><th>天氣推播</th><th>操作</th></tr></thead>
      <tbody>${rideRows}</tbody>
    </table>
  </div>

  <div class="card">
    <div class="card-title">🖼️ 早安圖庫</div>
    <div style="display:flex;gap:12px;margin-bottom:16px;align-items:center">
      <input type="file" id="img_file" accept="image/*" style="flex:1">
      <button class="btn btn-primary" onclick="uploadMorningImg()">上傳早安圖</button>
    </div>
    <div class="img-grid">${imgCards}</div>
  </div>

  <div class="card">
    <div class="card-title">🌅 早安語錄</div>
    <div style="display:flex;gap:12px;margin-bottom:16px">
      <textarea id="msg_text" placeholder="輸入娜美風格早安語錄..." style="flex:1;min-height:70px"></textarea>
      <button class="btn btn-primary" onclick="addMsg()" style="align-self:flex-end;white-space:nowrap">新增語錄</button>
    </div>
    <table><thead><tr><th>語錄內容</th><th>使用日期</th><th>操作</th></tr></thead><tbody>${msgRows}</tbody></table>
  </div>

  <div class="card">
    <div class="card-title">🎂 隊員生日</div>
    <div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap">
      <input type="text" id="b_name" placeholder="隊員名稱" style="flex:1;min-width:120px">
      <input type="date" id="b_date" style="flex:1;min-width:140px">
      <button class="btn btn-primary" onclick="addBday()">新增生日</button>
    </div>
    <table><thead><tr><th>姓名</th><th>生日</th><th>操作</th></tr></thead><tbody>${bdayRows}</tbody></table>
  </div>

</div>

<!-- ═══════════════════════════════════════
     TAB 4：知識庫
═══════════════════════════════════════ -->
<div class="tab-pane" id="tab-knowledge">

  <div class="card">
    <div class="card-title">🧠 娜美知識庫</div>
    <p class="hint" style="margin-bottom:14px">新增路線、補給、安全注意等資料，娜美回答問題時會優先參考這裡。Tags 用逗號分隔，越精確越好。</p>
    <div class="form-grid">
      <div><label class="form-label">分類</label><select id="kb_category">
        <option value="路線">路線</option>
        <option value="補給">補給</option>
        <option value="安全">安全注意</option>
        <option value="裝備">裝備建議</option>
        <option value="賽事">賽事資訊</option>
        <option value="其他">其他</option>
      </select></div>
      <div><label class="form-label">地區</label><input type="text" id="kb_region" placeholder="例：桃園、北台灣、全台"></div>
      <div><label class="form-label">標題</label><input type="text" id="kb_title" placeholder="例：北宜公路"></div>
      <div><label class="form-label">Tags（逗號分隔）</label><input type="text" id="kb_tags" placeholder="例：北宜,宜蘭,爬坡,補給,坪林"></div>
      <div class="form-full"><label class="form-label">內容（盡量詳細，娜美會直接引用）</label>
        <textarea id="kb_content" placeholder="例：北宜公路全長約56公里，起點台北木柵，終點宜蘭市區。主要爬升在坪林段，海拔約440公尺。補給點：坪林7-11（約K28）、礁溪全家（終點前）。注意：下坡彎道多，雨天路滑需減速。適合程度：中進階。" style="min-height:100px"></textarea>
      </div>
    </div>
    <button class="btn btn-primary" onclick="addKnowledge()">新增知識條目</button>
  </div>

  <div class="card">
    <div class="card-title">📋 知識庫列表 <span style="font-weight:400;color:var(--text3);font-size:.82rem">共 ${(knowledgeRows.results||[]).length} 筆</span></div>
    <div style="overflow-x:auto">
    <table>
      <thead><tr><th>分類</th><th>地區</th><th>標題</th><th>Tags</th><th>內容預覽</th><th>啟用</th><th>操作</th></tr></thead>
      <tbody>${knowledgeRowsHtml}</tbody>
    </table>
    </div>
  </div>

</div>

<!-- ═══════════════════════════════════════
     TAB 5：系統設定
═══════════════════════════════════════ -->
<div class="tab-pane" id="tab-system">

  <div class="card">
    <div class="card-title">🤖 Bot 基本設定</div>
    <div style="display:grid;gap:16px;max-width:600px">
      <div><label class="form-label">報名聯絡人</label><input type="text" id="cfg_contact" value="${cfg_contact}"></div>
      <div><label class="form-label">Bot 名稱</label><input type="text" id="cfg_botname" value="${cfg_botname}"></div>
      <div><label class="form-label">預設回覆（不知道時）</label><input type="text" id="cfg_fallback" value="${cfg_fallback}"></div>
      <div><label class="form-label">額外人設（附加到 system prompt）</label><textarea id="cfg_extra" style="min-height:80px">${cfg_extra}</textarea></div>
      <button class="btn btn-primary" onclick="saveBotConfig()" style="max-width:160px">儲存設定</button>
    </div>
  </div>

  <div class="card">
    <div class="card-title">📊 LINE Push 額度詳情</div>
    <div style="display:flex;align-items:center;gap:24px;flex-wrap:wrap">
      <div style="text-align:center">
        <div style="font-size:2.5rem;font-weight:700;color:${quotaColor}" id="quota-left-system">${quotaLeft}</div>
        <div style="font-size:.82rem;color:#666;margin-top:4px">剩餘則數</div>
      </div>
      <div style="text-align:center">
        <div style="font-size:2.5rem;font-weight:700;color:#60a5fa">${quotaUsed}</div>
        <div style="font-size:.82rem;color:#666;margin-top:4px">已使用</div>
      </div>
      <div style="text-align:center">
        <div style="font-size:2.5rem;font-weight:700;color:#555">${quotaMax}</div>
        <div style="font-size:.82rem;color:#666;margin-top:4px">月上限</div>
      </div>
      <div style="flex:1;min-width:200px">
        <div class="progress-bar"><div class="progress-fill" style="width:${quotaPct}%;background:${quotaColor}"></div></div>
        <div style="font-size:.8rem;color:#555;margin-top:6px">每月1日重置</div>
        <button onclick="refreshQuota()" class="btn btn-primary" style="margin-top:10px;padding:6px 14px;font-size:.82rem">🔄 重新整理</button>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="card-title">🔧 系統資訊</div>
    <div style="display:grid;gap:8px;font-size:.88rem;color:#888">
      <div>平台：<span style="color:#ccc">Cloudflare Workers</span></div>
      <div>Bot 帳號：<span style="color:#ccc">@862bfsiu</span></div>
      <div>GitHub：<span style="color:#FFD600">a4376976/sunbike-bot</span></div>
    </div>
  </div>

  <div class="card">
    <div class="card-title">🗺️ 系統架構圖</div>
    <p style="font-size:.88rem;color:var(--text2);margin-bottom:12px">點擊下方按鈕在新視窗開啟完整架構圖，可列印成紙本備存。</p>
    <div style="display:flex;gap:10px;flex-wrap:wrap">
      <a href="https://raw.githack.com/a4376976/sunbike-bot/main/architecture.html" target="_blank"
        class="btn btn-primary" style="text-decoration:none">
        🗺️ 開啟架構圖
      </a>
      <a href="https://github.com/a4376976/sunbike-bot/blob/main/architecture.html" target="_blank"
        class="btn" style="text-decoration:none;background:var(--bg3);border:1px solid var(--border2);color:var(--text)">
        📦 GitHub 原始檔
      </a>
    </div>
  </div>

</div>

<div class="toast" id="toast"></div>

<script>
// ── 主題切換 ──
function toggleTheme(){
  const body = document.body;
  const isSystem = body.classList.contains('theme-system');
  if(isSystem){
    // 切回自動（亮色）
    body.classList.remove('theme-system');
    body.classList.add('theme-light');
    document.getElementById('theme-icon').textContent='🌙';
    document.getElementById('theme-label').textContent='隨系統';
    localStorage.setItem('sb-theme','light');
  } else {
    // 切到隨系統
    body.classList.remove('theme-light');
    body.classList.add('theme-system');
    document.getElementById('theme-icon').textContent='☀️';
    document.getElementById('theme-label').textContent='自動';
    localStorage.setItem('sb-theme','system');
  }
}
// 初始化主題
(function(){
  const saved = localStorage.getItem('sb-theme') || 'light';
  if(saved === 'system'){
    document.body.classList.add('theme-system');
    document.getElementById('theme-icon').textContent='☀️';
    document.getElementById('theme-label').textContent='自動';
  } else {
    document.body.classList.add('theme-light');
  }
})();

// ── Tab switching ──
function switchTab(name, btn) {
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-'+name).classList.add('active');
  btn.classList.add('active');
}

// ── Utils ──
const TOK = '${ADMIN_PASSWORD}';
function showToast(msg,ok=true){const t=document.getElementById('toast');t.textContent=msg;t.style.background=ok?'#1a3a1a':'#3a1a1a';t.style.borderColor=ok?'#4ade80':'#ff6b6b';t.style.color=ok?'#4ade80':'#ff6b6b';t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2500)}
async function api(path,method='GET',body=null){const opts={method,headers:{'Content-Type':'application/json','X-Admin-Token':TOK}};if(body)opts.body=JSON.stringify(body);const r=await fetch(path,opts);return r.json()}
async function del(path){if(!confirm('確定刪除？'))return;const res=await api(path,'DELETE');if(res.ok){showToast('已刪除');location.reload()}else showToast('刪除失敗',false)}

// ── Groups ──
async function toggleGroup(id,field,val){const res=await api('/api/groups/'+encodeURIComponent(id),'PATCH',{field,value:val?1:0});if(res.ok)showToast('已更新');else showToast('更新失敗',false)}
async function updateGroupName(id,name){await api('/api/groups/'+encodeURIComponent(id),'PATCH',{field:'group_name',value:name});showToast('群組名稱已更新')}
async function delGroup(id){if(!confirm('確定刪除此群組設定？'))return;const res=await api('/api/groups/'+encodeURIComponent(id),'DELETE');if(res.ok){showToast('已刪除');location.reload()}}

// ── Cron ──
async function toggleCron(type,val){await api('/api/cron/'+type,'PATCH',{field:'enabled',value:val?1:0});showToast('已更新')}
async function updateCron(type,hour){await api('/api/cron/'+type,'PATCH',{field:'push_hour_tw',value:parseInt(hour)});showToast('推播時間已更新')}

// ── Schedule form ──
function updateSpForm(){const t=document.getElementById('sp_type').value;document.getElementById('sp_text_area').style.display=t==='text'?'':'none';document.getElementById('sp_media_area').style.display=(t==='r2_image'||t==='r2_video')?'':'none';document.getElementById('sp_sticker_area').style.display=t==='sticker'?'':'none'}
async function uploadFile(input){const file=input.files[0];if(!file)return;showToast('上傳中...');const fd=new FormData();fd.append('file',file);const r=await fetch('/api/upload',{method:'POST',headers:{'X-Admin-Token':TOK},body:fd});const res=await r.json();if(res.ok){document.getElementById('sp_media_path').value=res.path;showToast('上傳成功: '+res.path)}else showToast('上傳失敗',false)}
async function addSchedule(){const t=document.getElementById('sp_type').value;const d={push_date:document.getElementById('sp_date').value,push_hour:parseInt(document.getElementById('sp_hour').value),group_target:document.getElementById('sp_group').value,content_type:t,repeat_type:document.getElementById('sp_repeat').value};if(!d.push_date||isNaN(d.push_hour))return showToast('請填寫日期和時間',false);if(t==='text'){d.text_content=document.getElementById('sp_text').value;if(!d.text_content)return showToast('請輸入文字',false);}else if(t==='r2_image'||t==='r2_video'){d.media_path=document.getElementById('sp_media_path').value;d.caption=document.getElementById('sp_caption').value;if(!d.media_path)return showToast('請上傳或輸入路徑',false);}else if(t==='sticker'){d.media_path=document.getElementById('sp_sticker_id').value;if(!d.media_path)return showToast('請輸入貼圖ID',false);}const res=await api('/api/schedules','POST',d);if(res.ok){showToast('新增成功！');location.reload()}else showToast('新增失敗',false)}

// ── Messages ──
function editMsg(id){document.getElementById('msg-text-'+id).style.display='none';document.getElementById('msg-edit-'+id).style.display='block';document.getElementById('save-'+id).style.display='inline-block'}
async function saveMsg(id){const t=document.getElementById('msg-edit-'+id).value.trim();if(!t)return showToast('內容不能為空',false);const res=await api('/api/messages/'+id,'PATCH',{message:t});if(res.ok){showToast('已更新');location.reload()}else showToast('更新失敗',false)}
async function addMsg(){const message=document.getElementById('msg_text').value.trim();if(!message)return showToast('請輸入語錄',false);const res=await api('/api/messages','POST',{message});if(res.ok){showToast('新增成功！');location.reload()}}

// ── Events ──
async function addEvent(){const d={event_date:document.getElementById('ev_date').value,event_type:document.getElementById('ev_type').value,title:document.getElementById('ev_title').value.trim(),content_type:document.getElementById('ev_content_type').value,content:document.getElementById('ev_content').value||null,pre_announce:document.getElementById('ev_pre').checked?1:0};if(!d.event_date||!d.title)return showToast('請填寫日期和標題',false);const res=await api('/api/events','POST',d);if(res.ok){showToast('新增成功！');location.reload()}else showToast('新增失敗',false)}
async function editEv(id){document.getElementById('ev-content-'+id).style.display='none';document.getElementById('ev-edit-'+id).style.display='block';document.getElementById('ev-save-'+id).style.display='inline-block'}
async function saveEv(id){const content=document.getElementById('ev-path-'+id).value.trim();const res=await api('/api/events/'+id,'PATCH',{content:content});if(res.ok){showToast('已更新');location.reload()}else showToast('更新失敗',false)}

// ── Keywords ──
async function addKw(){const d={keyword:document.getElementById('kw_keyword').value.trim(),reply_type:document.getElementById('kw_type').value,reply_content:document.getElementById('kw_content').value||null,description:document.getElementById('kw_desc').value.trim()};if(!d.keyword)return showToast('請輸入關鍵字',false);const res=await api('/api/keywords','POST',d);if(res.ok){showToast('新增成功！');location.reload()}else showToast('新增失敗: '+(res.error||''),false)}
async function editKw(id){document.getElementById('kw-content-'+id).style.display='none';document.getElementById('kw-edit-'+id).style.display='block';const gallery=document.getElementById('kw-gallery-'+id);if(gallery)gallery.style.display='block';document.getElementById('kw-desc-'+id).style.display='none';document.getElementById('kw-desc-edit-'+id).style.display='block';document.getElementById('kw-save-'+id).style.display='inline-block'}
async function saveKw(id){const content=document.getElementById('kw-edit-'+id).value.trim();const desc=document.getElementById('kw-desc-edit-'+id).value.trim();const res=await api('/api/keywords/'+id,'PATCH',{reply_content:content,description:desc});if(res.ok){showToast('已更新');location.reload()}else showToast('更新失敗',false)}

// ── Rides ──
function editRide(id){document.getElementById('ride-edit-'+id).style.display='';document.getElementById('ride-row-'+id).style.opacity='.4'}
function cancelEditRide(id){document.getElementById('ride-edit-'+id).style.display='none';document.getElementById('ride-row-'+id).style.opacity='1'}
async function saveRide(id){
  const d={ride_date:document.getElementById('re_date_'+id).value,title:document.getElementById('re_title_'+id).value,meeting_place:document.getElementById('re_place_'+id).value,meet_time:document.getElementById('re_meet_'+id).value,route:document.getElementById('re_route_'+id).value,notes:document.getElementById('re_notes_'+id).value,weather_city:document.getElementById('re_wcity_'+id).value.trim(),weather_push:document.getElementById('re_wpush_'+id).checked?1:0};
  if(!d.ride_date||!d.meeting_place)return showToast('請填寫日期和集合地點',false);
  const res=await api('/api/rides/'+id,'PATCH',d);
  if(res.ok){
    showToast('已更新 ✅');
    // 原地更新顯示列
    const row=document.getElementById('ride-row-'+id);
    const cells=row.querySelectorAll('td');
    cells[0].textContent=d.ride_date;cells[1].textContent=d.title;cells[2].textContent=d.meeting_place;cells[3].textContent=d.meet_time;cells[4].textContent=(d.route||'').slice(0,20);
    cells[5].innerHTML=d.weather_city?'<span class="badge">'+d.weather_city+'</span>':'<span style="color:#555">—</span>';
    cells[6].innerHTML='<input type="checkbox"'+(d.weather_push?' checked':'')+' disabled style="accent-color:#FFD600">';
    cancelEditRide(id);
  } else showToast('更新失敗',false);
}
async function delRide(id){
  if(!confirm('確定刪除？'))return;
  const res=await api('/api/rides/'+id,'DELETE');
  if(res.ok){showToast('已刪除');document.getElementById('ride-row-'+id).remove();const edit=document.getElementById('ride-edit-'+id);if(edit)edit.remove();}
  else showToast('刪除失敗',false);
}
async function addRide(){const d={ride_date:document.getElementById('r_date').value,title:document.getElementById('r_title').value,meeting_place:document.getElementById('r_place').value,meet_time:document.getElementById('r_meet_time').value,start_time:document.getElementById('r_start_time').value,route:document.getElementById('r_route').value,notes:document.getElementById('r_notes').value,weather_city:document.getElementById('r_weather_city').value.trim(),weather_push:document.getElementById('r_weather_push').checked?1:0};if(!d.ride_date||!d.meeting_place)return showToast('請填寫日期和集合地點',false);const res=await api('/api/rides','POST',d);if(res.ok){showToast('新增成功！');location.reload()}else showToast('新增失敗',false)}

// ── Knowledge ──
function editKb(id){document.getElementById('kb-edit-'+id).style.display='';document.getElementById('kb-row-'+id).style.opacity='.4'}
function cancelEditKb(id){document.getElementById('kb-edit-'+id).style.display='none';document.getElementById('kb-row-'+id).style.opacity='1'}
async function saveKb(id){
  const d={category:document.getElementById('kbe_cat_'+id).value,region:document.getElementById('kbe_region_'+id).value.trim(),title:document.getElementById('kbe_title_'+id).value.trim(),tags:document.getElementById('kbe_tags_'+id).value.trim(),content:document.getElementById('kbe_content_'+id).value.trim()};
  if(!d.title||!d.content)return showToast('請填寫標題和內容',false);
  const res=await api('/api/knowledge/'+id,'PATCH',d);
  if(res.ok){
    showToast('已更新 ✅');
    const row=document.getElementById('kb-row-'+id);
    const cells=row.querySelectorAll('td');
    cells[0].innerHTML='<span class="badge">'+d.category+'</span>';cells[1].textContent=d.region;cells[2].textContent=d.title;cells[3].textContent=d.tags;cells[4].textContent=(d.content||'').slice(0,60)+((d.content||'').length>60?'…':'');
    cancelEditKb(id);
  } else showToast('更新失敗',false);
}
async function delKb(id){
  if(!confirm('確定刪除？'))return;
  const res=await api('/api/knowledge/'+id,'DELETE');
  if(res.ok){showToast('已刪除');document.getElementById('kb-row-'+id).remove();const edit=document.getElementById('kb-edit-'+id);if(edit)edit.remove();}
  else showToast('刪除失敗',false);
}
async function addKnowledge(){const d={category:document.getElementById('kb_category').value,region:document.getElementById('kb_region').value.trim(),title:document.getElementById('kb_title').value.trim(),tags:document.getElementById('kb_tags').value.trim(),content:document.getElementById('kb_content').value.trim()};if(!d.title||!d.content)return showToast('請填寫標題和內容',false);const res=await api('/api/knowledge','POST',d);if(res.ok){showToast('新增成功！');location.reload()}else showToast('新增失敗',false)}
async function toggleKnowledge(id,val){const res=await api('/api/knowledge/'+id,'PATCH',{enabled:val?1:0});if(res.ok)showToast('已更新');else showToast('更新失敗',false)}

// ── Birthdays ──
async function addBday(){const name=document.getElementById('b_name').value.trim(),birthday=document.getElementById('b_date').value;if(!name||!birthday)return showToast('請填寫姓名和生日',false);const res=await api('/api/birthdays','POST',{name,birthday});if(res.ok){showToast('新增成功！');location.reload()}}

// ── Images ──
async function uploadMorningImg(){const f=document.getElementById('img_file').files[0];if(!f)return showToast('請選擇圖片',false);showToast('上傳中...');const fd=new FormData();fd.append('file',f);const r=await fetch('/api/morning-images',{method:'POST',headers:{'X-Admin-Token':TOK},body:fd});const res=await r.json();if(res.ok){showToast('上傳成功！');location.reload()}else showToast('上傳失敗',false)}
async function delImg(id){if(!confirm('確定刪除此圖片？'))return;const res=await api('/api/morning-images','DELETE',{id});if(res.ok){showToast('已刪除');location.reload()}else showToast('刪除失敗',false)}

// ── Bot Config ──
async function saveBotConfig(){const cfg={contact_name:document.getElementById('cfg_contact').value.trim(),bot_name:document.getElementById('cfg_botname').value.trim(),fallback_msg:document.getElementById('cfg_fallback').value.trim(),system_prompt_extra:document.getElementById('cfg_extra').value.trim()};const res=await api('/api/bot-config','POST',cfg);if(res.ok)showToast('設定已儲存！');else showToast('儲存失敗',false)}

// ── Quota refresh ──
async function refreshQuota(){const res=await api('/api/quota','GET');if(res.quota){const max=res.quota.value||0;const used=res.consumption?.totalUsage||0;const left=max-used;const color=left<=20?'#ff6b6b':left<=50?'#ffa500':'#4ade80';document.getElementById('quota-left').textContent=left;document.getElementById('quota-left-big').textContent=left;document.getElementById('quota-left-system').textContent=left;document.getElementById('quota-left-big').style.color=color;document.getElementById('quota-left-system').style.color=color;document.getElementById('quota-dot').style.background=color;showToast('額度已更新')}}
</script></body></html>`;
}
// ─── ROUTER ───────────────────────────────────────────────
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
      if (path === '/api/quota' && method === 'GET') {
        const q = await fetch('https://api.line.me/v2/bot/message/quota', {
          headers: {'Authorization': `Bearer ${env.LINE_CHANNEL_ACCESS_TOKEN}`}
        });
        const c = await fetch('https://api.line.me/v2/bot/message/quota/consumption', {
          headers: {'Authorization': `Bearer ${env.LINE_CHANNEL_ACCESS_TOKEN}`}
        });
        const qj = await q.json();
        const cj = await c.json();
        return Response.json({quota: qj, consumption: cj});
      }
      if (path === '/api/test-push' && method === 'POST') {
        const b = await request.json();
        const res = await fetch('https://api.line.me/v2/bot/message/push', {
          method: 'POST',
          headers: {'Authorization': `Bearer ${env.LINE_CHANNEL_ACCESS_TOKEN}`, 'Content-Type': 'application/json'},
          body: JSON.stringify({to: b.group_id, messages: [{type:'text', text:'🧪 娜美測試推播！時間：' + new Date().toISOString()}]})
        });
        const txt = await res.text();
        return Response.json({ok: res.ok, status: res.status, body: txt});
      }
      if (path === '/api/bot-config' && method === 'POST') {
        const cfg = await request.json();
        await env.SUNBIKE_KV.put('bot_config', JSON.stringify(cfg));
        return Response.json({ok:true});
      }
      if (path === '/api/morning-images' && method === 'DELETE') {
        const { id } = await request.json();
        const img = await env.SUNBIKE_DB.prepare('SELECT r2_path FROM morning_images WHERE id=?').bind(id).first();
        if (img) {
          await env.SUNBIKE_R2.delete(img.r2_path);
          await env.SUNBIKE_DB.prepare('DELETE FROM morning_images WHERE id=?').bind(id).run();
        }
        return Response.json({ok:true});
      }
      if (path === '/api/morning-images' && method === 'POST') {
        const fd = await request.formData();
        const file = fd.get('file');
        if (!file) return Response.json({ok:false,error:'no file'});
        const displayName = file.name;
        const ext = file.name.split('.').pop().toLowerCase();
        const r2path = 'morning/' + Date.now() + '.' + ext;
        await env.SUNBIKE_R2.put(r2path, file.stream(), {httpMetadata:{contentType:file.type}});
        await env.SUNBIKE_DB.prepare('INSERT INTO morning_images (filename,r2_path) VALUES (?,?)').bind(displayName, r2path).run();
        return Response.json({ok:true, path:r2path});
      }
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
      if (path.startsWith('/api/events/') && method === 'PATCH') {
        const id = path.split('/').pop();
        const b = await request.json();
        await env.SUNBIKE_DB.prepare('UPDATE special_events SET content=? WHERE id=?').bind(b.content||null, id).run();
        return Response.json({ok:true});
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
      if (path.startsWith('/api/keywords/') && method === 'PATCH') {
        const id = path.split('/').pop();
        const b = await request.json();
        await env.SUNBIKE_DB.prepare('UPDATE keywords SET reply_content=?, description=? WHERE id=?').bind(b.reply_content, b.description, id).run();
        return Response.json({ok:true});
      }
      if (path.startsWith('/api/keywords/') && method === 'DELETE') {
        await env.SUNBIKE_DB.prepare('DELETE FROM keywords WHERE id=?').bind(path.split('/').pop()).run();
        return Response.json({ok:true});
      }
      if (path === '/api/rides' && method === 'POST') {
        const b = await request.json();
        await env.SUNBIKE_DB.prepare('INSERT INTO ride_schedule (ride_date,title,meeting_place,meet_time,start_time,route,notes,weather_city,weather_push) VALUES (?,?,?,?,?,?,?,?,?)').bind(b.ride_date,b.title||'',b.meeting_place||'',b.meet_time||'',b.start_time||'',b.route||'',b.notes||'',b.weather_city||'',b.weather_push||0).run();
        return Response.json({ok:true});
      }
      if (path.startsWith('/api/rides/') && method === 'PATCH') {
        const id = path.split('/').pop();
        const b = await request.json();
        await env.SUNBIKE_DB.prepare('UPDATE ride_schedule SET ride_date=?,title=?,meeting_place=?,meet_time=?,route=?,notes=?,weather_city=?,weather_push=? WHERE id=?').bind(b.ride_date,b.title||'',b.meeting_place||'',b.meet_time||'',b.route||'',b.notes||'',b.weather_city||'',b.weather_push||0,id).run();
        return Response.json({ok:true});
      }
      if (path.startsWith('/api/rides/') && method === 'DELETE') {
        await env.SUNBIKE_DB.prepare('DELETE FROM ride_schedule WHERE id=?').bind(path.split('/').pop()).run();
        return Response.json({ok:true});
      }
      if (path === '/api/knowledge' && method === 'POST') {
        const b = await request.json();
        await env.SUNBIKE_DB.prepare('INSERT INTO knowledge_base (category,region,title,tags,content) VALUES (?,?,?,?,?)').bind(b.category||'路線',b.region||'全台',b.title,b.tags||'',b.content).run();
        return Response.json({ok:true});
      }
      if (path.startsWith('/api/knowledge/') && method === 'PATCH') {
        const id = path.split('/').pop();
        const b = await request.json();
        if (b.enabled !== undefined) {
          await env.SUNBIKE_DB.prepare('UPDATE knowledge_base SET enabled=? WHERE id=?').bind(b.enabled,id).run();
        } else {
          await env.SUNBIKE_DB.prepare('UPDATE knowledge_base SET category=?,region=?,title=?,tags=?,content=? WHERE id=?').bind(b.category||'路線',b.region||'全台',b.title,b.tags||'',b.content,id).run();
        }
        return Response.json({ok:true});
      }
      if (path.startsWith('/api/knowledge/') && method === 'DELETE') {
        await env.SUNBIKE_DB.prepare('DELETE FROM knowledge_base WHERE id=?').bind(path.split('/').pop()).run();
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
          await lineReply(ev.replyToken, NAMI_INTRO, env);
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
            if (gs.at_reply) await lineReply(ev.replyToken, await smartReply(text, env), env);
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
    console.log('=== SCHEDULED START ===', new Date().toISOString());
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

    // ── 每週日常規天氣推播（從週二開始，5天前觸發）──
    if (cron.morning?.enabled && twHour === Number(cron.morning.push_hour_tw)) {
      const twDay = twDate.getUTCDay(); // 0=日,1=一,...,6=六
      // 計算距下週日幾天
      const daysToSunday = twDay === 0 ? 7 : 7 - twDay;
      if (daysToSunday >= 1 && daysToSunday <= 5) {
        // 是否有特殊約騎覆蓋
        const sundayDate = new Date(twDate.getTime() + daysToSunday * 24 * 3600000).toISOString().slice(0, 10);
        const specialRide = await env.SUNBIKE_DB.prepare(
          'SELECT * FROM ride_schedule WHERE ride_date=? AND weather_push=1 AND weather_city!=\'\'').bind(sundayDate).first();
        if (!specialRide) {
          // 固定練車 → 推桃園天氣
          const w5 = await getWeather5Day('桃園', env);
          if (w5) {
            const dayLabel = daysToSunday === 1 ? '明天' : `還有${daysToSunday}天`;
            const msg = `🚴 週日練車天氣預報（${dayLabel}出發）\n📍 桃園\n─────────────────\n${w5}\n\n娜美提醒你做好準備 ❤️`;
            for (const g of groups) {
              if (g.ride_reminder) await linePush(g.group_id, msg, env);
            }
          }
        }
      }
    }

    // ── 特殊約騎天氣推播（weather_push=1，出發前5天）──
    if (cron.morning?.enabled && twHour === Number(cron.morning.push_hour_tw)) {
      const upcoming = await env.SUNBIKE_DB.prepare(
        'SELECT * FROM ride_schedule WHERE weather_push=1 AND weather_city!=\'\' AND ride_date > ? AND ride_date <= ?'
      ).bind(today, new Date(twDate.getTime() + 5 * 24 * 3600000).toISOString().slice(0, 10)).all();
      for (const ride of (upcoming.results || [])) {
        const rideDate = new Date(ride.ride_date + 'T00:00:00+08:00');
        const daysLeft = Math.round((rideDate - twDate) / (24 * 3600000));
        if (daysLeft < 1 || daysLeft > 5) continue;
        const w5 = await getWeather5Day(ride.weather_city, env);
        if (!w5) continue;
        const dayLabel = daysLeft === 1 ? '明天出發！' : `距出發還有${daysLeft}天`;
        const msg = `🚵 ${ride.title || '約騎'}天氣預報\n📅 出發日：${ride.ride_date}（${dayLabel}）\n📍 目的地：${ride.weather_city}\n─────────────────\n${w5}\n\n娜美愛你們 ❤️🚴‍♀️`;
        for (const g of groups) {
          if (g.ride_reminder) await linePush(g.group_id, msg, env);
        }
      }
    }

    if (cron.morning?.enabled && twHour === Number(cron.morning.push_hour_tw)) {
      const specialEv = await env.SUNBIKE_DB.prepare('SELECT * FROM special_events WHERE event_date=? AND enabled=1').bind(today).first();
      let morningMsg, specialImgUrl = null;
      if (specialEv && specialEv.content_type === 'r2_image') {
        specialImgUrl = `${R2_BASE_URL}/${specialEv.content}`;
        morningMsg = await claudeHaiku(`今天是${specialEv.title}！請用娜美的活潑風格，寫一則給陽光單車車隊的${specialEv.title}祝福，結合騎車主題，不超過100字。`, env);
      } else {
        const specialMsg = specialEv ? await getSpecialEventMsg(today, env) : null;
        const holidayMsg = !specialMsg ? await getDefaultHolidayMsg(mm, dd, env) : null;
        morningMsg = specialMsg || holidayMsg || await getMorningMessage(env);
      }
      const morningImg = specialImgUrl ? null : await env.SUNBIKE_DB.prepare('SELECT r2_path FROM morning_images WHERE active=1 ORDER BY RANDOM() LIMIT 1').first();
      const finalImgUrl = specialImgUrl || (morningImg ? `${R2_BASE_URL}/${morningImg.r2_path}` : null);
      for (const g of groups) {
        if (!g.morning_push) continue;
        if (finalImgUrl) await linePushImageWithCaption(g.group_id, finalImgUrl, morningMsg, env);
        else await linePush(g.group_id, morningMsg, env);
      }
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

    console.log('event_pre check:', cron.event_pre?.enabled, twHour, Number(cron.event_pre?.push_hour_tw), tomorrow);
    if (cron.event_pre?.enabled && twHour === Number(cron.event_pre.push_hour_tw)) {
      const ev = await env.SUNBIKE_DB.prepare('SELECT * FROM special_events WHERE event_date=? AND pre_announce=1 AND enabled=1').bind(tomorrow).first();
      console.log('event_pre ev:', ev?.title, 'groups:', groups.length);
      if (ev) {
        const preMsg = await claudeHaiku(`明天是${ev.title}！請用娜美的活潑風格，寫一則給陽光單車車隊的明天${ev.title}預告，結合騎車主題，不超過80字。`, env);
        console.log('event_pre preMsg:', preMsg?.slice(0,30));
        if (preMsg) {
          const preImgUrl = ev.content_type === 'r2_image' && ev.content
            ? `${R2_BASE_URL}/${ev.content.split('/').map(s=>encodeURIComponent(s)).join('/')}`
            : null;
          for (const g of groups) {
            if (!g.event_push) continue;
            if (preImgUrl) await linePushImageWithCaption(g.group_id, preImgUrl, preMsg, env);
            else await linePush(g.group_id, preMsg, env);
          }
        }
      }
    }
  }
};