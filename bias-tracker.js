const axios = require('axios');

const MARKET_ID = '1.243994950';
const EVENT_ID = '34338087';
const JSESSIONID = 'D2F4857EC5AFC05731B3550622559DFF.player35';

let previous = {
  'Royal Challengers Bengaluru': { back: 0, lay: 0 },
  'Sunrisers Hyderabad': { back: 0, lay: 0 }
};

let cumulative = {
  'Royal Challengers Bengaluru': 0,
  'Sunrisers Hyderabad': 0
};

function formatAmount(amount) {
  if (amount >= 1e7) return `₹${(amount / 1e7).toFixed(2)} Cr`;
  if (amount >= 1e5) return `₹${(amount / 1e5).toFixed(2)} L`;
  if (amount >= 1e3) return `₹${(amount / 1e3).toFixed(1)}K`;
  return `₹${amount.toFixed(2)}`;
}

async function fetchBias() {
  try {
    const res = await axios.post(
      'https://bkqincap.skyexch.art/exchange/member/playerService/queryFullMarkets',
      new URLSearchParams({
        eventId: EVENT_ID,
        marketId: MARKET_ID,
        selectionTs: -1,
        isGetRunnerMetadata: true,
        queryPass: JSESSIONID
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Accept': 'application/json, text/javascript, */*; q=0.01',
          'Origin': 'https://bvincap.skyexch.art',
          'Referer': 'https://bvincap.skyexch.art/',
          'Cookie': `JSESSIONID=${JSESSIONID}`
        }
      }
    );

    // DEBUG LOG
    if (!res.data || typeof res.data !== 'object') {
      throw new Error('Invalid response type — possibly blocked or HTML received.');
    }

    const selections = res.data?.market?.selections || [];

    if (!selections.length) {
      console.log('⚠️ Warning: No selections found. Check session or IP block.');
      console.log('📦 Response Snapshot:', JSON.stringify(res.data).slice(0, 300));
      return;
    }

    const skyMatchedVolume = res.data.market.totalMatched || 0;

    const getSizes = (team) => {
      const sel = selections.find(s => s.runnerName === team);
      return {
        back: sel?.availableToBack?.[0]?.size || 0,
        lay: sel?.availableToLay?.[0]?.size || 0
      };
    };

    const teams = ['Royal Challengers Bengaluru', 'Sunrisers Hyderabad'];
    let totalBiasVolume = 0;
    const extract = {};

    teams.forEach(team => {
      const current = getSizes(team);
      const deltaBack = Math.max(current.back - previous[team].back, 0);
      const deltaLay = Math.max(current.lay - previous[team].lay, 0);
      const extractValue = deltaBack + deltaLay;

      cumulative[team] += extractValue;
      previous[team] = current;
      extract[team] = extractValue;
      totalBiasVolume += cumulative[team];
    });

    const rcbPercent = totalBiasVolume ? (cumulative['Royal Challengers Bengaluru'] / totalBiasVolume * 100).toFixed(1) : 0;
    const srhPercent = totalBiasVolume ? (cumulative['Sunrisers Hyderabad'] / totalBiasVolume * 100).toFixed(1) : 0;
    const coverage = skyMatchedVolume ? (totalBiasVolume / skyMatchedVolume * 100).toFixed(2) : 0;

    console.clear();
    console.log(`\n📊 RockHits Bias Monitor - LIVE`);
    teams.forEach(team => {
      const percent = team === 'Royal Challengers Bengaluru' ? rcbPercent : srhPercent;
      console.log(`\n🏏 ${team}`);
      console.log(`New Extract: ${formatAmount(extract[team])}`);
      console.log(`Total Till Now: ${formatAmount(cumulative[team])} (${percent}%)`);
    });
    console.log(`\n📌 Combined Bias Volume: ${formatAmount(totalBiasVolume)}`);
    console.log(`📌 Sky Matched Volume: ${formatAmount(skyMatchedVolume)}`);
    console.log(`🧠 Coverage: ${coverage}%`);

  } catch (err) {
    console.error('❌ Error fetching bias:', err.message);
  }
}

(function loop() {
  fetchBias();
  const delay = 2000 + Math.floor(Math.random() * 600);
  setTimeout(loop, delay);
})();
