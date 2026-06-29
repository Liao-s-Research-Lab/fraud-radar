// 防詐資訊(新聞 + 短影音)預載快取 —— app 一開啟就抓,不用等切到該分頁
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from './firebase/firebase';
import API from '../config/api';

let cache = { news: [], videos: [], started: false };
const subs = new Set();
const notify = () => subs.forEach((fn) => fn());

export function getInfoData() {
  return cache;
}

export function subscribeInfo(fn) {
  subs.add(fn);
  return () => subs.delete(fn);
}

// 只跑一次;app 啟動時呼叫
export function loadInfoData() {
  if (cache.started) return;
  cache = { ...cache, started: true };

  (async () => {
    try {
      const r = await fetch(API.news);
      const d = await r.json();
      const news = (Array.isArray(d) ? d : []).slice(0, 8).map((a, i) => ({ id: i, title: a.title, image: a.img, link: a.link }));
      cache = { ...cache, news };
      notify();
    } catch (e) { /* 無網路略過 */ }
  })();

  (async () => {
    try {
      const snap = await getDocs(query(collection(db, 'ShortVideo'), orderBy('Timestamp', 'desc')));
      const videos = [];
      snap.forEach((doc) => { const x = doc.data(); if (x.VideoURL) videos.push({ url: x.VideoURL }); });
      cache = { ...cache, videos };
      notify();
    } catch (e) { /* 無網路略過 */ }
  })();
}
