// netlify/functions/send-notification.js
const BIBLE_BOOKS = [
  ['Genesis',50],['Exodus',40],['Leviticus',27],['Numbers',36],['Deuteronomy',34],
  ['Joshua',24],['Judges',21],['Ruth',4],['1 Samuel',31],['2 Samuel',24],
  ['1 Kings',22],['2 Kings',25],['1 Chronicles',29],['2 Chronicles',36],
  ['Ezra',10],['Nehemiah',13],['Esther',10],['Job',42],['Psalms',150],
  ['Proverbs',31],['Ecclesiastes',12],['Song of Solomon',8],['Isaiah',66],
  ['Jeremiah',52],['Lamentations',5],['Ezekiel',48],['Daniel',12],['Hosea',14],
  ['Joel',3],['Amos',9],['Obadiah',1],['Jonah',4],['Micah',7],['Nahum',3],
  ['Habakkuk',3],['Zephaniah',3],['Haggai',2],['Zechariah',14],['Malachi',4],
  ['Matthew',28],['Mark',16],['Luke',24],['John',21],['Acts',28],['Romans',16],
  ['1 Corinthians',16],['2 Corinthians',13],['Galatians',6],['Ephesians',6],
  ['Philippians',4],['Colossians',4],['1 Thessalonians',5],['2 Thessalonians',3],
  ['1 Timothy',6],['2 Timothy',4],['Titus',3],['Philemon',1],['Hebrews',13],
  ['James',5],['1 Peter',5],['2 Peter',3],['1 John',5],['2 John',1],
  ['3 John',1],['Jude',1],['Revelation',22]
];
const ALL_CHAPTERS = [];
BIBLE_BOOKS.forEach(([book,chs])=>{for(let c=1;c<=chs;c++)ALL_CHAPTERS.push({book,ch:c});});
const PLAN_START = new Date('2026-08-01T00:00:00Z');

function getBibleReading(dateStr){
  const d=new Date(dateStr+'T00:00:00Z');
  const idx=Math.round((d-PLAN_START)/86400000);
  if(idx<0||idx>364)return null;
  const perDay=Math.floor(1189/365),extra=1189-(perDay*365);
  let startCh=0;
  for(let i=0;i<idx;i++)startCh+=(i<extra?perDay+1:perDay);
  const count=idx<extra?perDay+1:perDay;
  const chapters=[];
  for(let i=0;i<count;i++)if(startCh+i<ALL_CHAPTERS.length)chapters.push(ALL_CHAPTERS[startCh+i]);
  if(!chapters.length)return null;
  let result='',cur=chapters[0].book,s=chapters[0].ch,e=chapters[0].ch;
  for(let i=1;i<chapters.length;i++){
    if(chapters[i].book===cur){e=chapters[i].ch;}
    else{result+=(result?', ':'')+(s===e?`${cur} ${s}`:`${cur} ${s}–${e}`);cur=chapters[i].book;s=chapters[i].ch;e=chapters[i].ch;}
  }
  result+=(result?', ':'')+(s===e?`${cur} ${s}`:`${cur} ${s}–${e}`);
  return result;
}

const BIRTHDAYS=[
  {name:'Pr Soney Chacko',month:10,day:15},{name:'Sr Suji Soney',month:5,day:25},
  {name:'Br Leon Soney',month:8,day:15},{name:'Miss Evana Soney',month:3,day:26},
  {name:'Br Justin Samuel',month:3,day:30},{name:'Sr Melda Easo',month:6,day:9},
  {name:'Br Laji Philip',month:2,day:27},{name:'Sr Shiji Laji',month:5,day:30},
  {name:'Br Joyal Laji',month:1,day:20},{name:'Mstr Jesil Laji',month:5,day:19},
  {name:'Br Anoop',month:7,day:7},{name:'Sr Reena Anoop',month:8,day:25},
  {name:'Br Sam Yohannan',month:9,day:28},{name:'Sr Anina Sunny',month:12,day:9},
  {name:'Miss Juana Sam',month:4,day:29},{name:'Mstr Joel Sam',month:2,day:2},
  {name:'Mstr Josh Sam',month:10,day:14},{name:'Sr Sneha',month:6,day:9},
  {name:'Br Ricky C Mathew',month:8,day:24},{name:'Sr Margret Sebastian',month:7,day:24},
  {name:'Br Derick Mathew Ricky',month:10,day:3},{name:'Br Shinto',month:3,day:2},
  {name:'Sr Sini Shinto',month:9,day:15},{name:'Mstr Juan Shinto',month:1,day:14},
  {name:'Sr Smitha',month:3,day:28},{name:'Mstr Blessen',month:7,day:1},
  {name:'Mstr Baisal',month:7,day:21},{name:'Br Biju George',month:5,day:31},
  {name:'Mstr Zion Justin',month:9,day:28},
];
const ANNIVERSARIES=[
  {name:'Br Laji & Sr Shiji',month:5,day:19},{name:'Pr Soney & Sr Suji',month:8,day:16},
  {name:'Br Anoop & Sr Reena',month:8,day:25},{name:'Br Justin & Sr Melda',month:7,day:4},
  {name:'Br Sam & Sr Anina',month:6,day:11},{name:'Br Shinto & Sr Sini',month:11,day:20},
  {name:'Br Jinu Thomas & Sr Sneha',month:6,day:9},{name:'Br Ricky & Margret',month:12,day:26},
  {name:'Sr Smitha & Biju',month:6,day:25},
];

function getSpecialEvents(dateStr){
  const[,m,d]=dateStr.split('-').map(Number);
  const items=[];
  BIRTHDAYS.forEach(b=>{if(b.month===m&&b.day===d)items.push(`🎂 ${b.name}`);});
  ANNIVERSARIES.forEach(a=>{if(a.month===m&&a.day===d)items.push(`💍 ${a.name}`);});
  return items;
}

function isDST(date){
  const jan=new Date(date.getFullYear(),0,1).getTimezoneOffset();
  const jul=new Date(date.getFullYear(),6,1).getTimezoneOffset();
  return date.getTimezoneOffset()<Math.max(jan,jul);
}

exports.handler = async (event) => {
  const secret=process.env.CRON_SECRET;
  const incoming=(event.headers&&event.headers['x-cron-secret'])||(event.queryStringParameters&&event.queryStringParameters.secret);
  if(secret&&incoming!==secret)return{statusCode:401,body:'Unauthorised'};
  if(!process.env.VAPID_PUBLIC_KEY||!process.env.VAPID_PRIVATE_KEY)
    return{statusCode:500,body:JSON.stringify({error:'VAPID keys not configured'})};

  const now=new Date();
  const pad=n=>String(n).padStart(2,'0');
  const ukDate=new Date(now.getTime()+(isDST(now)?3600000:0));
  const todayStr=`${ukDate.getUTCFullYear()}-${pad(ukDate.getUTCMonth()+1)}-${pad(ukDate.getUTCDate())}`;

  const reading=getBibleReading(todayStr);
  const specials=getSpecialEvents(todayStr);
  const dayIdx=reading?Math.round((new Date(todayStr+'T00:00:00Z')-PLAN_START)/86400000)+1:null;

  let title,body;
  if(specials.length){title='🎉 IPC Guildford — Today';body=specials.join('\n')+(reading?`\n📖 ${reading}`:'');}
  else{title='📖 IPC Guildford — Daily Reading';body=reading?`${reading}  ·  Day ${dayIdx} of 365`:'Open the calendar';}

  const payload=JSON.stringify({title,body,tag:'daily-reading',renotify:true,data:{url:'/'}});

  // Try both getStore and getDeployStore
  let blobs=[];
  let store;
  try{
    const {getStore}=require('@netlify/blobs');
    store=getStore('push-subscriptions');
    const list=await store.list();
    blobs=list.blobs||[];
    console.log('getStore found',blobs.length,'subscribers');
  }catch(e1){
    console.warn('getStore failed:',e1.message);
    try{
      const {getDeployStore}=require('@netlify/blobs');
      store=getDeployStore('push-subscriptions');
      const list=await store.list();
      blobs=list.blobs||[];
      console.log('getDeployStore found',blobs.length,'subscribers');
    }catch(e2){
      console.error('Both blob stores failed:',e2.message);
      return{statusCode:200,body:JSON.stringify({message:'Blob store unavailable',date:todayStr,reading})};
    }
  }

  if(!blobs.length)return{statusCode:200,body:JSON.stringify({message:'No subscribers yet',date:todayStr,reading})};

  const webpush=require('web-push');
  webpush.setVapidDetails(
    'mailto:'+(process.env.VAPID_EMAIL||'admin@ipcguildford.org'),
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  const results={sent:0,failed:0,removed:0};
  await Promise.all(blobs.map(async({key})=>{
    try{
      const raw=await store.get(key);
      if(!raw)return;
      const sub=JSON.parse(raw);
      await webpush.sendNotification(sub,payload);
      results.sent++;
    }catch(err){
      console.error('Push failed:',err.statusCode,err.message);
      results.failed++;
      if(err.statusCode===410||err.statusCode===404){try{await store.delete(key);results.removed++;}catch{}}
    }
  }));

  console.log('Results:',results);
  return{statusCode:200,body:JSON.stringify({date:todayStr,reading,specials,...results})};
};
