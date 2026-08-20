/* ============================================================
   ভাই বোন ভ্যারাইটিজ স্টোর — App Logic
   ============================================================ */

// ---------- Bengali number helpers ----------
const BN_DIGITS = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
function toBn(num){
  return String(num).replace(/[0-9]/g, d => BN_DIGITS[d]);
}
function money(num){
  num = Math.round(num || 0);
  return '৳' + toBn(num.toLocaleString('en-IN'));
}
function fmtNum(num){ return toBn(Math.round(num||0)); }

function toast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(()=> t.classList.remove('show'), 2200);
}

// ---------- Bengali calendar conversion (reformed civil calendar, Pohela Boishakh fixed on Apr 14) ----------
function isLeapGregorian(y){ return (y%4===0 && y%100!==0) || y%400===0; }
const BN_MONTHS = ['বৈশাখ','জ্যৈষ্ঠ','আষাঢ়','শ্রাবণ','ভাদ্র','আশ্বিন','কার্তিক','অগ্রহায়ণ','পৌষ','মাঘ','ফাল্গুন','চৈত্র'];
function toBengaliDate(date){
  const y = date.getFullYear();
  const refThisYear = new Date(y,3,14);
  let bYear, daysDiff, choitroLeapYear;
  if (date >= refThisYear){
    bYear = y - 593; daysDiff = Math.floor((date - refThisYear)/86400000); choitroLeapYear = y+1;
  } else {
    const refPrev = new Date(y-1,3,14);
    bYear = y - 594; daysDiff = Math.floor((date - refPrev)/86400000); choitroLeapYear = y;
  }
  const dayOfYear = daysDiff + 1;
  const choitroLen = isLeapGregorian(choitroLeapYear) ? 31 : 30;
  const lens = [31,31,31,31,31,30,30,30,30,30,30,choitroLen];
  let remaining = dayOfYear, m=0;
  while(remaining > lens[m]){ remaining -= lens[m]; m++; }
  return `${toBn(remaining)} ${BN_MONTHS[m]}, ${toBn(bYear)}`;
}

// ---------- Hijri calendar conversion (tabular/arithmetic approximation; may vary ±1 day from moon sighting) ----------
const HIJRI_MONTHS = ['মুহাররম','সফর','রবিউল আউয়াল','রবিউস সানি','জমাদিউল আউয়াল','জমাদিউস সানি','রজব','শাবান','রমজান','শাওয়াল','জিলক্বদ','জিলহজ'];
function gregorianToJD(y,m,d){
  const a = Math.floor((14-m)/12), y2=y+4800-a, m2=m+12*a-3;
  return d + Math.floor((153*m2+2)/5) + 365*y2 + Math.floor(y2/4) - Math.floor(y2/100) + Math.floor(y2/400) - 32045;
}
function toHijriDate(date){
  let jd = gregorianToJD(date.getFullYear(), date.getMonth()+1, date.getDate());
  jd = jd - 1948440 + 10632;
  const n = Math.floor((jd-1)/10631);
  jd = jd - 10631*n + 354;
  const j = (Math.floor((10985-jd)/5316))*(Math.floor((50*jd)/17719)) + (Math.floor(jd/5670))*(Math.floor((43*jd)/15238));
  jd = jd - (Math.floor((30-j)/15))*(Math.floor((17719*j)/50)) - (Math.floor(j/16))*(Math.floor((15238*j)/43)) + 29;
  const m = Math.floor((24*jd)/709);
  const d = jd - Math.floor((709*m)/24);
  const y = 30*n + j - 30;
  return `${toBn(d)} ${HIJRI_MONTHS[m-1]}, ${toBn(y)} হিজরি`;
}

const EN_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
function toEnglishDate(date){
  return `${date.getDate()} ${EN_MONTHS[date.getMonth()]}, ${date.getFullYear()}`;
}

function updateClock(){
  const now = new Date();
  document.getElementById('date-en').textContent = toEnglishDate(now);
  document.getElementById('date-bn').textContent = toBengaliDate(now);
  document.getElementById('date-ar').textContent = toHijriDate(now);
  let h = now.getHours(); const ampm = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12;
  const min = String(now.getMinutes()).padStart(2,'0');
  document.getElementById('clock-now').textContent = `${toBn(h)}:${toBn(min)} ${ampm}`;
}

// ---------- Image compression (client-side, keeps Firestore docs small & free of Storage costs) ----------
function compressImage(file, maxDim=360, quality=0.6){
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let w = img.width, h = img.height;
        if (w > h && w > maxDim){ h = Math.round(h * maxDim/w); w = maxDim; }
        else if (h >= w && h > maxDim){ w = Math.round(w * maxDim/h); h = maxDim; }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ---------- Screen / panel navigation ----------
function showScreen(id){
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}
function showApp(){
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('app-shell').classList.add('active');
}
function showPanel(panelId){
  document.querySelectorAll('.screen-panel').forEach(p => p.classList.remove('active'));
  document.getElementById(panelId).classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.panel === panelId));
}
document.querySelectorAll('.back-link').forEach(b => {
  b.addEventListener('click', () => showScreen(b.dataset.back));
});
document.querySelectorAll('.nav-btn').forEach(b => {
  b.addEventListener('click', () => {
    state.inventoryFilter = null;
    showPanel(b.dataset.panel);
    const drawer = document.getElementById('cart-drawer');
    if (drawer) drawer.classList.remove('open');
  });
});

// ---------- App state ----------
const state = {
  shopId: null,
  shopName: '',
  shopAddress: '',
  shopContacts: [],
  shopPhotos: [],
  editingPhotos: [],
  dailyCashAmount: null,
  cashEntries: [],
  companyBills: [], // working copy while modal is open
  staffName: '',
  uid: null,
  products: [],
  sales: [],
  customers: [],
  expenses: [],
  cart: {}, // productId -> {product, qty}
  payMode: 'full',
  inventoryFilter: null, // 'low' or null
};

const SESSION_KEY = 'vbv_session';

// ---------- Firebase init ----------
let db, auth;
function initFirebase(){
  firebase.initializeApp(window.FIREBASE_CONFIG);
  auth = firebase.auth();
  db = firebase.firestore();
}

function todayKey(){
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function genCode(){
  return String(Math.floor(100000 + Math.random() * 900000));
}

// ---------- Boot sequence ----------
async function boot(){
  initFirebase();
  auth.onAuthStateChanged(async (user) => {
    if (!user){
      try { await auth.signInAnonymously(); }
      catch(e){ console.error(e); toast('ইন্টারনেট সংযোগ পরীক্ষা করুন'); }
      return;
    }
    state.uid = user.uid;
    const saved = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    if (saved && saved.shopId && saved.staffName){
      state.shopId = saved.shopId;
      state.staffName = saved.staffName;
      const shopDoc = await db.collection('shops').doc(state.shopId).get();
      if (shopDoc.exists){
        state.shopName = shopDoc.data().name;
        enterShop();
        return;
      } else {
        localStorage.removeItem(SESSION_KEY);
      }
    }
    showScreen('screen-welcome');
  });
}

function enterShop(){
  document.getElementById('topbar-staffname').textContent = state.staffName;
  showApp();
  showPanel('panel-dashboard');
  attachListeners();
  updateClock();
  clearInterval(window._clockTimer);
  window._clockTimer = setInterval(updateClock, 30000);
}

// ---------- Onboarding events ----------
document.getElementById('btn-goto-create').addEventListener('click', () => showScreen('screen-create'));
document.getElementById('btn-goto-join').addEventListener('click', () => showScreen('screen-join'));

document.getElementById('btn-create-shop').addEventListener('click', async () => {
  const shopName = document.getElementById('input-shop-name').value.trim();
  const ownerName = document.getElementById('input-owner-name').value.trim();
  const address = document.getElementById('input-shop-address').value.trim();
  const errEl = document.getElementById('create-error');
  errEl.textContent = '';
  if (!shopName || !ownerName){ errEl.textContent = 'দোকানের নাম ও আপনার নাম দিন'; return; }

  const btn = document.getElementById('btn-create-shop');
  btn.disabled = true; btn.textContent = 'তৈরি হচ্ছে…';
  try{
    if (!auth.currentUser) await auth.signInAnonymously();
    let code = genCode();
    // ensure uniqueness (retry a couple times just in case)
    for (let i=0;i<3;i++){
      const existing = await db.collection('shops').doc(code).get();
      if (!existing.exists) break;
      code = genCode();
    }
    await db.collection('shops').doc(code).set({
      name: shopName,
      address: address || '',
      ownerUid: auth.currentUser.uid,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    await db.collection('shops').doc(code).collection('members').doc(auth.currentUser.uid).set({
      name: ownerName, role: 'owner', joinedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    state.shopId = code; state.shopName = shopName; state.staffName = ownerName; state.uid = auth.currentUser.uid;
    localStorage.setItem(SESSION_KEY, JSON.stringify({shopId: code, staffName: ownerName}));

    document.getElementById('invite-code-display').textContent = toBn(code);
    openModal('modal-invite');
  } catch(e){
    console.error(e);
    errEl.textContent = 'সমস্যা হয়েছে, আবার চেষ্টা করুন। ইন্টারনেট সংযোগ পরীক্ষা করুন।';
  } finally {
    btn.disabled = false; btn.textContent = 'দোকান তৈরি করুন';
  }
});
document.getElementById('btn-invite-ok').addEventListener('click', () => { closeModals(); enterShop(); });

document.getElementById('btn-join-shop').addEventListener('click', async () => {
  const codeRaw = document.getElementById('input-join-code').value.trim();
  const code = codeRaw.replace(/[০-৯]/g, d => String(BN_DIGITS.indexOf(d)));
  const staffName = document.getElementById('input-staff-name').value.trim();
  const errEl = document.getElementById('join-error');
  errEl.textContent = '';
  if (!/^\d{6}$/.test(code) || !staffName){ errEl.textContent = '৬ সংখ্যার সঠিক কোড ও আপনার নাম দিন'; return; }

  const btn = document.getElementById('btn-join-shop');
  btn.disabled = true; btn.textContent = 'যোগ দেওয়া হচ্ছে…';
  try{
    if (!auth.currentUser) await auth.signInAnonymously();
    const shopDoc = await db.collection('shops').doc(code).get();
    if (!shopDoc.exists){ errEl.textContent = 'এই কোডে কোনো দোকান পাওয়া যায়নি'; return; }
    await db.collection('shops').doc(code).collection('members').doc(auth.currentUser.uid).set({
      name: staffName, role: 'staff', joinedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    state.shopId = code; state.shopName = shopDoc.data().name; state.staffName = staffName; state.uid = auth.currentUser.uid;
    localStorage.setItem(SESSION_KEY, JSON.stringify({shopId: code, staffName}));
    enterShop();
  } catch(e){
    console.error(e);
    errEl.textContent = 'সমস্যা হয়েছে, আবার চেষ্টা করুন। ইন্টারনেট সংযোগ পরীক্ষা করুন।';
  } finally {
    btn.disabled = false; btn.textContent = 'যোগ দিন';
  }
});

// ---------- Modal helpers ----------
function openModal(id){
  document.getElementById('modal-overlay').classList.add('open');
  document.querySelectorAll('.modal').forEach(m => m.classList.remove('open'));
  document.getElementById(id).classList.add('open');
}
function closeModals(){
  document.getElementById('modal-overlay').classList.remove('open');
  document.querySelectorAll('.modal').forEach(m => m.classList.remove('open'));
}
document.getElementById('modal-overlay').addEventListener('click', (e) => {
  if (e.target.id === 'modal-overlay') closeModals();
});
document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', closeModals));

// ---------- Firestore live listeners ----------
function shopRef(){ return db.collection('shops').doc(state.shopId); }

function attachListeners(){
  shopRef().onSnapshot(doc => {
    if (!doc.exists) return;
    const d = doc.data();
    state.shopName = d.name || '';
    state.shopAddress = d.address || '';
    state.shopContacts = Array.isArray(d.contacts) ? d.contacts : [];
    state.shopPhotos = Array.isArray(d.ownerPhotos) ? d.ownerPhotos : [];
    document.getElementById('topbar-shopname').textContent = state.shopName;
    document.getElementById('shop-info-name').textContent = state.shopName;
    document.getElementById('shop-info-address').textContent = state.shopAddress || 'ঠিকানা যোগ করতে ✎ চাপুন';
    const photosEl = document.getElementById('shop-info-photos');
    photosEl.innerHTML = '';
    state.shopPhotos.forEach(src => {
      const img = document.createElement('img');
      img.className = 'owner-photo-thumb'; img.src = src;
      photosEl.appendChild(img);
    });
    const contactsEl = document.getElementById('shop-info-contacts');
    contactsEl.innerHTML = '';
    state.shopContacts.forEach(c => {
      if (!c.phone) return;
      const row = document.createElement('div');
      row.className = 'contact-chip';
      row.innerHTML = `<span class="cname">${c.name || 'নাম্বার'}:</span><span>${c.phone}</span>`;
      contactsEl.appendChild(row);
    });
  });

  shopRef().collection('products').orderBy('name').onSnapshot(snap => {
    state.products = snap.docs.map(d => ({id: d.id, ...d.data()}));
    renderInventory(); renderPOSGrid(); renderDashboard();
  }, err => handleSyncError(err));

  shopRef().collection('sales').orderBy('createdAt', 'desc').limit(200).onSnapshot(snap => {
    state.sales = snap.docs.map(d => ({id: d.id, ...d.data()}));
    renderDashboard();
  }, err => handleSyncError(err));

  shopRef().collection('customers').orderBy('name').onSnapshot(snap => {
    state.customers = snap.docs.map(d => ({id: d.id, ...d.data()}));
    renderLedger(); renderCustomerSelect(); renderDashboard();
  }, err => handleSyncError(err));

  shopRef().collection('expenses').orderBy('createdAt', 'desc').limit(200).onSnapshot(snap => {
    state.expenses = snap.docs.map(d => ({id: d.id, ...d.data()}));
    renderExpenses();
  }, err => handleSyncError(err));

  shopRef().collection('dailyCash').doc(todayKey()).onSnapshot(doc => {
    state.dailyCashAmount = doc.exists ? doc.data().amount : null;
    renderDailyCashCard();
  }, err => handleSyncError(err));

  shopRef().collection('dailyCash').doc(todayKey()).collection('entries').orderBy('createdAt', 'desc').onSnapshot(snap => {
    state.cashEntries = snap.docs.map(d => ({id: d.id, ...d.data()}));
    renderDailyCashCard();
  }, err => handleSyncError(err));

  shopRef().collection('companyBills').orderBy('createdAt', 'desc').limit(200).onSnapshot(snap => {
    state.companyBills = snap.docs.map(d => ({id: d.id, ...d.data()}));
    renderCompanyBills();
  }, err => handleSyncError(err));

  document.getElementById('sync-dot').classList.remove('offline');
  document.getElementById('sync-label').textContent = 'সিঙ্ক হচ্ছে';
}
function handleSyncError(err){
  console.error(err);
  document.getElementById('sync-dot').classList.add('offline');
  document.getElementById('sync-label').textContent = 'সংযোগ নেই';
}
window.addEventListener('online', () => { document.getElementById('sync-dot').classList.remove('offline'); document.getElementById('sync-label').textContent='সিঙ্ক হচ্ছে'; });
window.addEventListener('offline', () => { document.getElementById('sync-dot').classList.add('offline'); document.getElementById('sync-label').textContent='সংযোগ নেই'; });

function renderContactRows(contacts){
  const list = document.getElementById('esf-contacts-list');
  list.innerHTML = '';
  const rows = contacts.length ? contacts : [{name:'', phone:''}];
  rows.forEach(c => addContactRow(c.name, c.phone));
}
function addContactRow(name='', phone=''){
  const list = document.getElementById('esf-contacts-list');
  const row = document.createElement('div');
  row.className = 'contact-edit-row';
  row.innerHTML = `
    <input type="text" class="field-input contact-name" placeholder="কার নাম্বার (যেমনঃ মালিক)" value="${name}">
    <input type="text" class="field-input contact-phone" placeholder="০১৭xxxxxxxx" value="${phone}">
    <button class="contact-remove-btn" type="button">✕</button>`;
  row.querySelector('.contact-remove-btn').addEventListener('click', () => row.remove());
  list.appendChild(row);
}
document.getElementById('btn-add-contact-row').addEventListener('click', () => addContactRow());

function renderPhotoGrid(){
  const grid = document.getElementById('esf-photo-grid');
  grid.innerHTML = '';
  state.editingPhotos.forEach((src, idx) => {
    const wrap = document.createElement('div');
    wrap.className = 'photo-thumb-wrap';
    wrap.innerHTML = `<img src="${src}"><button class="photo-thumb-remove" type="button">✕</button>`;
    wrap.querySelector('.photo-thumb-remove').addEventListener('click', () => {
      state.editingPhotos.splice(idx,1); renderPhotoGrid();
    });
    grid.appendChild(wrap);
  });
}
document.getElementById('btn-add-photo').addEventListener('click', () => {
  if (state.editingPhotos.length >= 6){ toast('সর্বোচ্চ ৬টি ছবি যোগ করা যাবে'); return; }
  document.getElementById('esf-photo-input').click();
});
document.getElementById('esf-photo-input').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  try{
    const dataUrl = await compressImage(file);
    state.editingPhotos.push(dataUrl);
    renderPhotoGrid();
  } catch(err){ console.error(err); toast('ছবি প্রসেস করতে সমস্যা হয়েছে'); }
});

document.getElementById('btn-edit-shop-info').addEventListener('click', () => {
  document.getElementById('esf-name').value = state.shopName;
  document.getElementById('esf-address').value = state.shopAddress;
  renderContactRows(state.shopContacts);
  state.editingPhotos = [...state.shopPhotos];
  renderPhotoGrid();
  openModal('modal-edit-shop');
});
document.getElementById('btn-save-shop-info').addEventListener('click', async () => {
  const name = document.getElementById('esf-name').value.trim();
  const address = document.getElementById('esf-address').value.trim();
  if (!name){ toast('দোকানের নাম দিন'); return; }
  const contacts = [];
  document.querySelectorAll('#esf-contacts-list .contact-edit-row').forEach(row => {
    const cName = row.querySelector('.contact-name').value.trim();
    const cPhone = row.querySelector('.contact-phone').value.trim();
    if (cPhone) contacts.push({ name: cName, phone: cPhone });
  });
  const btn = document.getElementById('btn-save-shop-info');
  btn.disabled = true; btn.textContent = 'সংরক্ষণ হচ্ছে…';
  try{
    await shopRef().update({ name, address, contacts, ownerPhotos: state.editingPhotos });
    closeModals(); toast('তথ্য হালনাগাদ করা হয়েছে');
  } catch(e){
    console.error(e);
    if (e && e.message && e.message.includes('exceeds')) toast('ছবিগুলো একসাথে বেশি বড়, কিছু ছবি বাদ দিয়ে আবার চেষ্টা করুন');
    else toast('সমস্যা হয়েছে');
  } finally { btn.disabled = false; btn.textContent = 'সংরক্ষণ করুন'; }
});

function cashTopupTotal(){ return state.cashEntries.filter(e=>e.type==='topup').reduce((a,e)=>a+(e.amount||0),0); }
function cashBillTotal(){ return state.cashEntries.filter(e=>e.type==='bill').reduce((a,e)=>a+(e.amount||0),0); }

function renderDailyCashCard(){
  const labelEl = document.getElementById('daily-cash-label');
  const valueEl = document.getElementById('daily-cash-value');
  if (state.dailyCashAmount === null){
    labelEl.textContent = 'আজকের ক্যাশ (সকালের) লিখতে ট্যাপ করুন';
    valueEl.textContent = '';
  } else {
    const balance = state.dailyCashAmount + cashTopupTotal() - cashBillTotal();
    labelEl.textContent = 'ক্যাশে এখন থাকার কথা (বিস্তারিত দেখতে ট্যাপ করুন)';
    valueEl.textContent = money(balance);
  }
}

document.getElementById('daily-cash-card').addEventListener('click', () => {
  if (state.dailyCashAmount === null){
    document.getElementById('dc-modal-title').textContent = 'আজকের ক্যাশ';
    document.getElementById('dc-amount').value = '';
    openModal('modal-daily-cash');
  } else {
    renderCashDetail();
    openModal('modal-cash-detail');
  }
});
document.getElementById('btn-save-daily-cash').addEventListener('click', async () => {
  const amount = Number(document.getElementById('dc-amount').value) || 0;
  const btn = document.getElementById('btn-save-daily-cash');
  btn.disabled = true; btn.textContent = 'সংরক্ষণ হচ্ছে…';
  try{
    await shopRef().collection('dailyCash').doc(todayKey()).set({
      amount, staffName: state.staffName, createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    closeModals(); toast('আজকের ক্যাশ সংরক্ষণ করা হয়েছে');
  } catch(e){ console.error(e); toast('সমস্যা হয়েছে'); }
  finally{ btn.disabled=false; btn.textContent='সংরক্ষণ করুন'; }
});

function renderCashDetail(){
  const opening = state.dailyCashAmount || 0;
  const topup = cashTopupTotal();
  const bills = cashBillTotal();
  document.getElementById('cashd-opening').textContent = money(opening);
  document.getElementById('cashd-topup').textContent = money(topup);
  document.getElementById('cashd-bills').textContent = money(bills);
  document.getElementById('cashd-balance').textContent = money(opening + topup - bills);

  const list = document.getElementById('cashd-entries');
  list.innerHTML = '';
  if (!state.cashEntries.length){
    list.innerHTML = '<p class="empty-note">আজ এখনো কোনো যোগ/বিল হয়নি</p>';
  } else {
    state.cashEntries.forEach(e => {
      const div = document.createElement('div');
      div.className = 'list-card';
      const time = e.createdAt && e.createdAt.toDate ? e.createdAt.toDate().toLocaleTimeString('bn-BD',{hour:'2-digit',minute:'2-digit'}) : '';
      const title = e.type === 'topup' ? (e.note || 'অতিরিক্ত ক্যাশ যোগ') : `${e.companyName || 'কোম্পানি'} বিল`;
      div.innerHTML = `
        <div class="list-card-main">
          <span class="list-card-title">${title}</span>
          <span class="list-card-sub">${time} · ${e.staffName||''}</span>
        </div>
        <span class="list-card-value ${e.type==='topup'?'ok':'due'}">${e.type==='topup'?'+':'−'}${money(e.amount)}</span>`;
      div.addEventListener('click', async () => {
        if (!confirm(`"${title}" - ${money(e.amount)} এন্ট্রিটা মুছে ফেলবেন?`)) return;
        try{
          await shopRef().collection('dailyCash').doc(todayKey()).collection('entries').doc(e.id).delete();
          if (e.type === 'bill'){
            // Also unlink from the company bill doc if this entry was created from one
            const match = state.companyBills.find(b => b.cashEntryId === e.id);
            if (match) await shopRef().collection('companyBills').doc(match.id).update({ cashEntryId: firebase.firestore.FieldValue.delete(), cashEntryDateKey: firebase.firestore.FieldValue.delete() }).catch(()=>{});
          }
          toast('মুছে ফেলা হয়েছে');
        } catch(err){ console.error(err); toast('সমস্যা হয়েছে'); }
      });
      list.appendChild(div);
    });
  }
}
document.getElementById('btn-edit-opening').addEventListener('click', () => {
  document.getElementById('dc-modal-title').textContent = 'সকালের ক্যাশ বদলান';
  document.getElementById('dc-amount').value = state.dailyCashAmount ?? '';
  openModal('modal-daily-cash');
});
document.getElementById('btn-open-add-topup').addEventListener('click', () => {
  document.getElementById('topup-amount').value = '';
  document.getElementById('topup-note').value = '';
  openModal('modal-topup');
});
document.getElementById('btn-save-topup').addEventListener('click', async () => {
  const amount = Number(document.getElementById('topup-amount').value) || 0;
  const note = document.getElementById('topup-note').value.trim();
  if (amount <= 0){ toast('সঠিক পরিমাণ দিন'); return; }
  const btn = document.getElementById('btn-save-topup');
  btn.disabled = true; btn.textContent = 'যোগ হচ্ছে…';
  try{
    await shopRef().collection('dailyCash').doc(todayKey()).set({ staffName: state.staffName }, { merge: true });
    await shopRef().collection('dailyCash').doc(todayKey()).collection('entries').add({
      type: 'topup', amount, note, staffName: state.staffName, createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    closeModals(); toast('ক্যাশ যোগ করা হয়েছে');
  } catch(e){ console.error(e); toast('সমস্যা হয়েছে'); }
  finally{ btn.disabled=false; btn.textContent='যোগ করুন'; }
});

// ============================================================
// DASHBOARD
// ============================================================
function isToday(ts){
  if (!ts || !ts.toDate) return false;
  const d = ts.toDate(); const n = new Date();
  return d.getFullYear()===n.getFullYear() && d.getMonth()===n.getMonth() && d.getDate()===n.getDate();
}
function renderDashboard(){
  const todaySales = state.sales.filter(s => isToday(s.createdAt));
  const todayTotal = todaySales.reduce((a,s)=>a+(s.totalAmount||0),0);
  const todayDue = todaySales.reduce((a,s)=>a+(s.dueAmount||0),0);
  const totalDue = state.customers.reduce((a,c)=>a+(c.totalDue||0),0);
  const lowStock = state.products.filter(p => (p.stock ?? 0) <= (p.lowStockAlert ?? 0));

  document.getElementById('stat-today-sales').textContent = money(todayTotal);
  document.getElementById('stat-today-due').textContent = money(todayDue);
  document.getElementById('stat-total-due').textContent = money(totalDue);
  document.getElementById('stat-low-stock').textContent = fmtNum(lowStock.length);

  const recentEl = document.getElementById('recent-sales-list');
  recentEl.innerHTML = '';
  if (!state.sales.length){
    recentEl.innerHTML = '<p class="empty-note">এখনো কোনো বিক্রয় হয়নি</p>';
  } else {
    state.sales.slice(0,8).forEach(s => {
      const div = document.createElement('div');
      div.className = 'list-card';
      const time = s.createdAt && s.createdAt.toDate ? s.createdAt.toDate().toLocaleTimeString('bn-BD',{hour:'2-digit',minute:'2-digit'}) : '';
      div.innerHTML = `
        <div class="list-card-main">
          <span class="list-card-title">${s.customerName || 'নগদ কাস্টমার'}</span>
          <span class="list-card-sub">${(s.items||[]).length} টি পণ্য · ${s.staffName||''} · ${time}</span>
        </div>
        <span class="list-card-value ${s.dueAmount>0?'due':'ok'}">${money(s.totalAmount)}</span>`;
      recentEl.appendChild(div);
    });
  }

  const lowEl = document.getElementById('low-stock-list');
  lowEl.innerHTML = '';
  if (!lowStock.length){
    lowEl.innerHTML = '<p class="empty-note">সব পণ্যের স্টক ঠিক আছে</p>';
  } else {
    lowStock.forEach(p => {
      const div = document.createElement('div');
      div.className = 'list-card';
      div.innerHTML = `
        <div class="list-card-main">
          <span class="list-card-title">${p.name}</span>
          <span class="badge badge-low">কম স্টক</span>
        </div>
        <span class="list-card-value due">${fmtNum(p.stock)} ${p.unit||''}</span>`;
      div.addEventListener('click', () => openProductModal(p));
      lowEl.appendChild(div);
    });
  }
}

document.getElementById('stat-low-stock-card').addEventListener('click', () => {
  state.inventoryFilter = 'low';
  showPanel('panel-inventory');
  renderInventory();
});

// ============================================================
// INVENTORY
// ============================================================
function renderInventory(){
  const q = (document.getElementById('inventory-search').value||'').trim();
  const list = document.getElementById('inventory-list');
  list.innerHTML = '';
  let filtered = state.products.filter(p => p.name.includes(q));
  if (state.inventoryFilter === 'low'){
    filtered = filtered.filter(p => (p.stock ?? 0) <= (p.lowStockAlert ?? 0));
  }

  const filterBar = document.getElementById('inventory-filter-bar');
  if (state.inventoryFilter === 'low'){
    filterBar.style.display = 'flex';
  } else {
    filterBar.style.display = 'none';
  }

  if (!filtered.length){ list.innerHTML = '<p class="empty-note">কোনো পণ্য পাওয়া যায়নি</p>'; return; }
  filtered.forEach(p => {
    const low = (p.stock ?? 0) <= (p.lowStockAlert ?? 0);
    const div = document.createElement('div');
    div.className = 'list-card';
    div.innerHTML = `
      <div class="list-card-main">
        <span class="list-card-title">${p.name}</span>
        <span class="list-card-sub">খুচরা ${money(p.retailPrice)} · পাইকারি ${money(p.wholesalePrice)}</span>
        <span class="badge ${low?'badge-low':'badge-ok'}">${low?'কম স্টক':'স্টক ঠিক আছে'}</span>
      </div>
      <span class="list-card-value">${fmtNum(p.stock)} ${p.unit||''}</span>`;
    div.addEventListener('click', () => openProductModal(p));
    list.appendChild(div);
  });
}
document.getElementById('inventory-search').addEventListener('input', renderInventory);
document.getElementById('btn-clear-inventory-filter').addEventListener('click', () => {
  state.inventoryFilter = null; renderInventory();
});

let editingProductId = null;
document.getElementById('btn-add-product').addEventListener('click', () => openProductModal(null));
function openProductModal(p){
  editingProductId = p ? p.id : null;
  document.getElementById('modal-product-title').textContent = p ? 'পণ্য সম্পাদনা করুন' : 'নতুন পণ্য';
  document.getElementById('pf-name').value = p ? p.name : '';
  document.getElementById('pf-unit').value = p ? p.unit : '';
  document.getElementById('pf-retail-price').value = p ? p.retailPrice : '';
  document.getElementById('pf-wholesale-price').value = p ? p.wholesalePrice : '';
  document.getElementById('pf-wholesale-threshold').value = p ? p.wholesaleThreshold : '';
  document.getElementById('pf-stock').value = p ? p.stock : '';
  document.getElementById('pf-low-stock').value = p ? p.lowStockAlert : '';
  document.getElementById('pf-cost-price').value = p ? (p.costPrice||'') : '';
  document.getElementById('btn-delete-product').style.display = p ? 'block' : 'none';
  openModal('modal-product');
}
document.getElementById('btn-save-product').addEventListener('click', async () => {
  const name = document.getElementById('pf-name').value.trim();
  const unit = document.getElementById('pf-unit').value.trim();
  const retailPrice = Number(document.getElementById('pf-retail-price').value) || 0;
  const wholesalePrice = Number(document.getElementById('pf-wholesale-price').value) || 0;
  const wholesaleThreshold = Number(document.getElementById('pf-wholesale-threshold').value) || 0;
  const stock = Number(document.getElementById('pf-stock').value) || 0;
  const lowStockAlert = Number(document.getElementById('pf-low-stock').value) || 0;
  const costPrice = Number(document.getElementById('pf-cost-price').value) || 0;
  if (!name){ toast('পণ্যের নাম দিন'); return; }
  const data = { name, unit, retailPrice, wholesalePrice, wholesaleThreshold, stock, lowStockAlert, costPrice };
  try{
    if (editingProductId){
      await shopRef().collection('products').doc(editingProductId).update(data);
    } else {
      data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      await shopRef().collection('products').add(data);
    }
    closeModals(); toast('সংরক্ষণ করা হয়েছে');
  } catch(e){ console.error(e); toast('সমস্যা হয়েছে, আবার চেষ্টা করুন'); }
});
document.getElementById('btn-delete-product').addEventListener('click', async () => {
  if (!editingProductId) return;
  if (!confirm('আপনি কি নিশ্চিত এই পণ্যটি মুছে ফেলতে চান?')) return;
  try{ await shopRef().collection('products').doc(editingProductId).delete(); closeModals(); toast('পণ্য মুছে ফেলা হয়েছে'); }
  catch(e){ console.error(e); toast('সমস্যা হয়েছে'); }
});

// ============================================================
// POS
// ============================================================
function unitPriceFor(p, qty){
  if (p.wholesaleThreshold && qty >= p.wholesaleThreshold && p.wholesalePrice){
    return { price: p.wholesalePrice, type: 'পাইকারি' };
  }
  return { price: p.retailPrice, type: 'খুচরা' };
}
function renderPOSGrid(){
  const q = (document.getElementById('pos-search').value||'').trim();
  const grid = document.getElementById('pos-product-grid');
  grid.innerHTML = '';
  const filtered = state.products.filter(p => p.name.includes(q));
  filtered.forEach(p => {
    const out = (p.stock ?? 0) <= 0;
    const cartQty = state.cart[p.id] ? state.cart[p.id].qty : 0;
    const {price} = unitPriceFor(p, cartQty + 1);
    const div = document.createElement('button');
    div.className = 'pos-product-card' + (out ? ' out-of-stock':'');
    div.disabled = out;
    div.innerHTML = `
      <span class="pos-name">${p.name}</span>
      <span class="pos-price">${money(price)}/${p.unit||''}</span>
      <span class="pos-stock">স্টকে ${fmtNum(p.stock)} ${p.unit||''}</span>`;
    div.addEventListener('click', () => addToCart(p));
    grid.appendChild(div);
  });
}
document.getElementById('pos-search').addEventListener('input', renderPOSGrid);

function addToCart(p){
  if (!state.cart[p.id]) state.cart[p.id] = { product: p, qty: 0 };
  if (state.cart[p.id].qty + 1 > (p.stock||0)){ toast('পর্যাপ্ত স্টক নেই'); return; }
  state.cart[p.id].qty += 1;
  renderCart(); renderPOSGrid();
  document.getElementById('cart-drawer').classList.add('open');
}
function changeCartQty(id, delta){
  const item = state.cart[id];
  if (!item) return;
  const newQty = item.qty + delta;
  if (newQty <= 0){ delete state.cart[id]; }
  else if (newQty > (item.product.stock||0)){ toast('পর্যাপ্ত স্টক নেই'); return; }
  else { item.qty = newQty; }
  renderCart(); renderPOSGrid();
}
function cartTotal(){
  return Object.values(state.cart).reduce((sum, item) => {
    const {price} = unitPriceFor(item.product, item.qty);
    return sum + price * item.qty;
  }, 0);
}
function renderCart(){
  const items = Object.entries(state.cart);
  const count = items.reduce((a,[,i])=>a+i.qty,0);
  document.getElementById('cart-count').textContent = `${toBn(count)} টি পণ্য`;
  const total = cartTotal();
  document.getElementById('cart-total').textContent = money(total);

  const itemsEl = document.getElementById('cart-items');
  itemsEl.innerHTML = '';
  if (!items.length){
    itemsEl.innerHTML = '<p class="empty-note">কার্ট খালি — পণ্যে ট্যাপ করুন</p>';
  }
  items.forEach(([id, item]) => {
    const {price, type} = unitPriceFor(item.product, item.qty);
    const row = document.createElement('div');
    row.className = 'cart-item';
    row.innerHTML = `
      <span class="cart-item-name">${item.product.name} <span style="color:var(--ink-soft);font-size:11.5px;">(${type})</span></span>
      <span class="cart-item-qty">
        <button class="qty-btn" data-act="minus">−</button>
        <span>${toBn(item.qty)}</span>
        <button class="qty-btn" data-act="plus">+</button>
      </span>
      <span class="cart-item-total">${money(price*item.qty)}</span>`;
    row.querySelector('[data-act="minus"]').addEventListener('click', () => changeCartQty(id,-1));
    row.querySelector('[data-act="plus"]').addEventListener('click', () => changeCartQty(id,1));
    itemsEl.appendChild(row);
  });

  updatePaymentSummary();
}
document.getElementById('cart-handle').addEventListener('click', () => {
  document.getElementById('cart-drawer').classList.toggle('open');
});

function renderCustomerSelect(){
  const sel = document.getElementById('cart-customer-select');
  const current = sel.value;
  sel.innerHTML = '<option value="">নগদ কাস্টমার (নাম ছাড়া)</option><option value="__new__">+ নতুন কাস্টমারের নাম লিখুন</option>';
  state.customers.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id; opt.textContent = c.name + (c.totalDue>0 ? ` (বাকি ${money(c.totalDue)})` : '');
    sel.appendChild(opt);
  });
  sel.value = current;
}
document.getElementById('cart-customer-select').addEventListener('change', (e) => {
  const isNew = e.target.value === '__new__';
  document.getElementById('cart-new-customer-name').style.display = isNew ? 'block' : 'none';
  document.getElementById('cart-new-customer-phone').style.display = isNew ? 'block' : 'none';
  if (!isNew){
    document.getElementById('cart-new-customer-name').value = '';
    document.getElementById('cart-new-customer-phone').value = '';
  }
});

document.querySelectorAll('.pay-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.pay-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    state.payMode = btn.dataset.pay;
    document.getElementById('partial-amount-wrap').style.display = state.payMode==='partial' ? 'block':'none';
    updatePaymentSummary();
  });
});
document.getElementById('cart-partial-amount').addEventListener('input', updatePaymentSummary);

function updatePaymentSummary(){
  const total = cartTotal();
  let paid = 0;
  if (state.payMode === 'full') paid = total;
  else if (state.payMode === 'due') paid = 0;
  else paid = Math.min(Number(document.getElementById('cart-partial-amount').value)||0, total);
  const due = total - paid;
  document.getElementById('cart-summary-total').textContent = money(total);
  document.getElementById('cart-summary-paid').textContent = money(paid);
  document.getElementById('cart-summary-due').textContent = money(due);
}

document.getElementById('btn-confirm-sale').addEventListener('click', async () => {
  const items = Object.entries(state.cart);
  if (!items.length){ toast('কার্টে কোনো পণ্য নেই'); return; }
  const total = cartTotal();
  let paid = state.payMode==='full' ? total : state.payMode==='due' ? 0 : Math.min(Number(document.getElementById('cart-partial-amount').value)||0, total);
  const due = total - paid;
  const custSel = document.getElementById('cart-customer-select').value;
  let customer = null;
  let newCustomerData = null;
  if (custSel === '__new__'){
    const newName = document.getElementById('cart-new-customer-name').value.trim();
    const newPhone = document.getElementById('cart-new-customer-phone').value.trim();
    if (!newName){ toast('কাস্টমারের নাম লিখুন'); return; }
    const existingMatch = findExistingCustomerByName(newName);
    if (existingMatch){
      // Same customer already exists — add this due to their existing record instead of duplicating
      customer = existingMatch;
    } else {
      newCustomerData = { name: newName, phone: newPhone, totalDue: 0, createdAt: firebase.firestore.FieldValue.serverTimestamp() };
    }
  } else if (custSel){
    customer = state.customers.find(c => c.id === custSel);
  }
  if (due > 0 && !customer && !newCustomerData){ toast('বাকি রাখতে হলে একজন কাস্টমার বাছাই বা নাম লিখুন'); return; }

  const btn = document.getElementById('btn-confirm-sale');
  btn.disabled = true; btn.textContent = 'সংরক্ষণ হচ্ছে…';
  try{
    const saleItems = items.map(([id,item]) => {
      const {price, type} = unitPriceFor(item.product, item.qty);
      return { productId:id, name:item.product.name, qty:item.qty, unitPrice:price, priceType:type, total: price*item.qty };
    });
    const batch = db.batch();

    // If a brand-new customer name was typed, create that customer doc now
    // (set totalDue directly here — a separate update in the same batch would
    // conflict since Firestore batches can't write to the same doc twice)
    if (newCustomerData){
      const newCustRef = shopRef().collection('customers').doc();
      batch.set(newCustRef, { ...newCustomerData, totalDue: due });
      customer = { id: newCustRef.id, name: newCustomerData.name };
    }

    const saleRef = shopRef().collection('sales').doc();
    batch.set(saleRef, {
      items: saleItems, totalAmount: total, paidAmount: paid, dueAmount: due,
      customerId: customer ? customer.id : null, customerName: customer ? customer.name : null,
      staffName: state.staffName, staffUid: state.uid,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    items.forEach(([id,item]) => {
      batch.update(shopRef().collection('products').doc(id), { stock: firebase.firestore.FieldValue.increment(-item.qty) });
    });
    if (customer && due > 0){
      if (!newCustomerData){
        // existing customer: safe to increment since we haven't written to this doc yet in this batch
        batch.update(shopRef().collection('customers').doc(customer.id), { totalDue: firebase.firestore.FieldValue.increment(due) });
      }
      const txRef = shopRef().collection('customers').doc(customer.id).collection('transactions').doc();
      batch.set(txRef, { type:'sale', amount: due, note: `বিক্রয় - ${saleItems.length} পণ্য`, staffName: state.staffName, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
    }
    await batch.commit();
    state.cart = {};
    document.getElementById('cart-drawer').classList.remove('open');
    document.getElementById('cart-partial-amount').value = '';
    document.querySelectorAll('.pay-btn').forEach(b=>b.classList.remove('active'));
    document.querySelector('.pay-btn[data-pay="full"]').classList.add('active');
    state.payMode = 'full';
    document.getElementById('cart-customer-select').value = '';
    document.getElementById('cart-new-customer-name').value = '';
    document.getElementById('cart-new-customer-name').style.display = 'none';
    document.getElementById('cart-new-customer-phone').value = '';
    document.getElementById('cart-new-customer-phone').style.display = 'none';
    renderCart(); renderPOSGrid();
    toast('বিক্রয় সম্পন্ন হয়েছে');
  } catch(e){ console.error(e); toast('সমস্যা হয়েছে, আবার চেষ্টা করুন'); }
  finally{ btn.disabled=false; btn.textContent='বিক্রয় নিশ্চিত করুন'; }
});

// ============================================================
// CUSTOMER LEDGER
// ============================================================
function renderLedger(){
  const q = (document.getElementById('ledger-search').value||'').trim();
  const list = document.getElementById('ledger-list');
  list.innerHTML = '';
  const filtered = state.customers.filter(c => c.name.includes(q));
  if (!filtered.length){ list.innerHTML = '<p class="empty-note">কোনো কাস্টমার পাওয়া যায়নি</p>'; return; }
  filtered.forEach(c => {
    const div = document.createElement('div');
    div.className = 'list-card';
    div.innerHTML = `
      <div class="list-card-main">
        <span class="list-card-title">${c.name}</span>
        <span class="list-card-sub">${c.phone||'নম্বর নেই'}${c.address ? ' · '+c.address : ''}</span>
      </div>
      <span class="list-card-value ${c.totalDue>0?'due':'ok'}">${money(c.totalDue||0)}</span>`;
    div.addEventListener('click', () => openCustomerDetail(c));
    list.appendChild(div);
  });
}
function findExistingCustomerByName(name){
  const norm = (name||'').trim().toLowerCase();
  if (!norm) return null;
  return state.customers.find(c => (c.name||'').trim().toLowerCase() === norm) || null;
}

document.getElementById('ledger-search').addEventListener('input', renderLedger);
document.getElementById('btn-add-customer').addEventListener('click', () => openModal('modal-customer'));
document.getElementById('btn-save-customer').addEventListener('click', async () => {
  const name = document.getElementById('cf-name').value.trim();
  const phone = document.getElementById('cf-phone').value.trim();
  const address = document.getElementById('cf-address').value.trim();
  const initialDue = Number(document.getElementById('cf-initial-due').value) || 0;
  if (!name){ toast('কাস্টমারের নাম দিন'); return; }
  const btn = document.getElementById('btn-save-customer');
  btn.disabled = true; btn.textContent = 'সংরক্ষণ হচ্ছে…';
  try{
    const existing = findExistingCustomerByName(name);
    if (existing){
      // Same customer already exists — merge instead of duplicating
      const updates = {};
      if (phone && !existing.phone) updates.phone = phone;
      if (address && !existing.address) updates.address = address;
      if (initialDue > 0) updates.totalDue = firebase.firestore.FieldValue.increment(initialDue);
      if (Object.keys(updates).length) await shopRef().collection('customers').doc(existing.id).update(updates);
      if (initialDue > 0){
        await shopRef().collection('customers').doc(existing.id).collection('transactions').add({
          type:'sale', amount: initialDue, note:'পূর্বের বাকি যোগ হয়েছে', staffName: state.staffName, createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
      }
      toast(`"${name}" আগে থেকেই আছে — বাকি যোগ করা হয়েছে`);
    } else {
      const newRef = await shopRef().collection('customers').add({ name, phone, address, totalDue: initialDue, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
      if (initialDue > 0){
        await shopRef().collection('customers').doc(newRef.id).collection('transactions').add({
          type:'sale', amount: initialDue, note:'প্রাথমিক বাকি', staffName: state.staffName, createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
      }
      toast('কাস্টমার যোগ করা হয়েছে');
    }
    document.getElementById('cf-name').value=''; document.getElementById('cf-phone').value='';
    document.getElementById('cf-address').value=''; document.getElementById('cf-initial-due').value='';
    closeModals();
  } catch(e){ console.error(e); toast('সমস্যা হয়েছে'); }
  finally{ btn.disabled=false; btn.textContent='সংরক্ষণ করুন'; }
});

let activeCustomerId = null;
function openCustomerDetail(c){
  activeCustomerId = c.id;
  document.getElementById('cd-name').textContent = c.name;
  document.getElementById('cd-contact').textContent = [c.phone, c.address].filter(Boolean).join(' · ') || 'যোগাযোগের তথ্য নেই';
  document.getElementById('cd-due').textContent = money(c.totalDue||0);
  openModal('modal-customer-detail');
  shopRef().collection('customers').doc(c.id).collection('transactions').orderBy('createdAt','desc').limit(50).get().then(snap => {
    const el = document.getElementById('cd-transactions');
    el.innerHTML = '';
    if (snap.empty){ el.innerHTML = '<p class="empty-note">কোনো লেনদেন নেই</p>'; return; }
    snap.forEach(d => {
      const t = d.data();
      const div = document.createElement('div');
      div.className = 'list-card';
      const date = t.createdAt && t.createdAt.toDate ? t.createdAt.toDate().toLocaleDateString('bn-BD') : '';
      div.innerHTML = `
        <div class="list-card-main">
          <span class="list-card-title">${t.note || (t.type==='payment' ? 'জমা' : 'বাকি')}</span>
          <span class="list-card-sub">${date} · ${t.staffName||''}</span>
        </div>
        <span class="list-card-value ${t.type==='payment'?'ok':'due'}">${t.type==='payment'?'−':'+'}${money(t.amount)}</span>`;
      el.appendChild(div);
    });
  });
}
document.getElementById('btn-collect-payment').addEventListener('click', () => { openModal('modal-collect'); });
document.getElementById('btn-add-due').addEventListener('click', () => {
  document.getElementById('add-due-amount').value = '';
  document.getElementById('add-due-note').value = '';
  document.getElementById('add-due-date').value = new Date().toISOString().slice(0,10);
  openModal('modal-add-due');
});
document.getElementById('btn-confirm-add-due').addEventListener('click', async () => {
  const amount = Number(document.getElementById('add-due-amount').value) || 0;
  const dateStr = document.getElementById('add-due-date').value;
  const note = document.getElementById('add-due-note').value.trim();
  if (amount <= 0){ toast('সঠিক পরিমাণ দিন'); return; }
  if (!dateStr){ toast('তারিখ দিন'); return; }
  const btn = document.getElementById('btn-confirm-add-due');
  btn.disabled = true; btn.textContent = 'যোগ হচ্ছে…';
  try{
    const [yy,mm,dd] = dateStr.split('-').map(Number);
    const chosenDate = new Date(yy, mm-1, dd, new Date().getHours(), new Date().getMinutes());
    const batch = db.batch();
    batch.update(shopRef().collection('customers').doc(activeCustomerId), { totalDue: firebase.firestore.FieldValue.increment(amount) });
    const txRef = shopRef().collection('customers').doc(activeCustomerId).collection('transactions').doc();
    batch.set(txRef, {
      type: 'sale', amount, note: note || 'নতুন বাকি',
      staffName: state.staffName,
      createdAt: firebase.firestore.Timestamp.fromDate(chosenDate),
    });
    await batch.commit();
    closeModals(); toast('বাকি যোগ করা হয়েছে');
  } catch(e){ console.error(e); toast('সমস্যা হয়েছে'); }
  finally{ btn.disabled=false; btn.textContent='যোগ করুন'; }
});
document.getElementById('btn-confirm-collect').addEventListener('click', async () => {
  const amount = Number(document.getElementById('collect-amount').value) || 0;
  if (amount <= 0){ toast('সঠিক পরিমাণ দিন'); return; }
  try{
    const batch = db.batch();
    batch.update(shopRef().collection('customers').doc(activeCustomerId), { totalDue: firebase.firestore.FieldValue.increment(-amount) });
    const txRef = shopRef().collection('customers').doc(activeCustomerId).collection('transactions').doc();
    batch.set(txRef, { type:'payment', amount, note:'টাকা জমা', staffName: state.staffName, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
    await batch.commit();
    document.getElementById('collect-amount').value='';
    closeModals(); toast('জমা সংরক্ষণ করা হয়েছে');
  } catch(e){ console.error(e); toast('সমস্যা হয়েছে'); }
});

// ============================================================
// EXPENSES
// ============================================================
function isThisMonth(ts){
  if (!ts || !ts.toDate) return false;
  const d = ts.toDate(); const n = new Date();
  return d.getFullYear()===n.getFullYear() && d.getMonth()===n.getMonth();
}
function renderExpenses(){
  const monthTotal = state.expenses.filter(e=>isThisMonth(e.createdAt)).reduce((a,e)=>a+(e.amount||0),0);
  document.getElementById('stat-month-expense').textContent = money(monthTotal);
  const list = document.getElementById('expenses-list');
  list.innerHTML = '';
  if (!state.expenses.length){ list.innerHTML = '<p class="empty-note">এখনো কোনো খরচ যোগ হয়নি</p>'; return; }
  state.expenses.forEach(e => {
    const div = document.createElement('div');
    div.className = 'list-card';
    const date = e.createdAt && e.createdAt.toDate ? e.createdAt.toDate().toLocaleDateString('bn-BD') : '';
    div.innerHTML = `
      <div class="list-card-main">
        <span class="list-card-title">${e.category}</span>
        <span class="list-card-sub">${e.note||''} · ${date} · ${e.staffName||''}</span>
      </div>
      <span class="list-card-value due">${money(e.amount)}</span>`;
    div.addEventListener('click', async () => {
      if (!confirm(`"${e.category}" - ${money(e.amount)} খরচের এন্ট্রিটা মুছে ফেলবেন?`)) return;
      try{ await shopRef().collection('expenses').doc(e.id).delete(); toast('মুছে ফেলা হয়েছে'); }
      catch(err){ console.error(err); toast('সমস্যা হয়েছে'); }
    });
    list.appendChild(div);
  });
}
document.getElementById('btn-add-expense').addEventListener('click', () => openModal('modal-expense'));
document.getElementById('btn-save-expense').addEventListener('click', async () => {
  const category = document.getElementById('ef-category').value;
  const amount = Number(document.getElementById('ef-amount').value) || 0;
  const note = document.getElementById('ef-note').value.trim();
  if (amount <= 0){ toast('সঠিক পরিমাণ দিন'); return; }
  try{
    await shopRef().collection('expenses').add({ category, amount, note, staffName: state.staffName, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
    document.getElementById('ef-amount').value=''; document.getElementById('ef-note').value='';
    closeModals(); toast('খরচ যোগ করা হয়েছে');
  } catch(e){ console.error(e); toast('সমস্যা হয়েছে'); }
});

// ============================================================
// COMPANY BILLS (log of payments made to suppliers/companies)
// ============================================================
document.querySelectorAll('.expense-tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.expense-tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const isCompany = btn.dataset.etab === 'company';
    document.getElementById('expense-tab-general').style.display = isCompany ? 'none' : 'block';
    document.getElementById('expense-tab-company').style.display = isCompany ? 'block' : 'none';
  });
});

function renderCompanyBills(){
  const monthTotal = state.companyBills.filter(b=>isThisMonth(b.createdAt)).reduce((a,b)=>a+(b.amount||0),0);
  document.getElementById('stat-month-company-bill').textContent = money(monthTotal);
  const list = document.getElementById('company-bills-list');
  list.innerHTML = '';
  if (!state.companyBills.length){ list.innerHTML = '<p class="empty-note">এখনো কোনো কোম্পানির বিল যোগ হয়নি</p>'; return; }
  state.companyBills.forEach(b => {
    const div = document.createElement('div');
    div.className = 'list-card';
    const date = b.createdAt && b.createdAt.toDate ? b.createdAt.toDate().toLocaleDateString('bn-BD') : '';
    div.innerHTML = `
      <div class="list-card-main">
        <span class="list-card-title">${b.companyName}</span>
        <span class="list-card-sub">${b.note||''} · ${date} · ${b.staffName||''}</span>
      </div>
      <span class="list-card-value due">${money(b.amount)}</span>`;
    div.addEventListener('click', async () => {
      if (!confirm(`"${b.companyName}" - ${money(b.amount)} বিলের এন্ট্রিটা মুছে ফেলবেন?`)) return;
      try{
        await shopRef().collection('companyBills').doc(b.id).delete();
        if (b.cashEntryId && b.cashEntryDateKey){
          await shopRef().collection('dailyCash').doc(b.cashEntryDateKey).collection('entries').doc(b.cashEntryId).delete().catch(()=>{});
        }
        toast('মুছে ফেলা হয়েছে');
      } catch(err){ console.error(err); toast('সমস্যা হয়েছে'); }
    });
    list.appendChild(div);
  });
}
document.getElementById('btn-add-company-bill').addEventListener('click', () => {
  document.getElementById('cb-company-name').value = '';
  document.getElementById('cb-amount').value = '';
  document.getElementById('cb-note').value = '';
  document.getElementById('cb-date').value = new Date().toISOString().slice(0,10);
  openModal('modal-company-bill');
});
document.getElementById('btn-save-company-bill').addEventListener('click', async () => {
  const companyName = document.getElementById('cb-company-name').value.trim();
  const amount = Number(document.getElementById('cb-amount').value) || 0;
  const dateStr = document.getElementById('cb-date').value;
  const note = document.getElementById('cb-note').value.trim();
  const fromCash = document.getElementById('cb-from-cash').checked;
  if (!companyName){ toast('কোম্পানির নাম দিন'); return; }
  if (amount <= 0){ toast('সঠিক পরিমাণ দিন'); return; }
  const btn = document.getElementById('btn-save-company-bill');
  btn.disabled = true; btn.textContent = 'সংরক্ষণ হচ্ছে…';
  try{
    let createdAt = firebase.firestore.FieldValue.serverTimestamp();
    const dateKey = dateStr || todayKey();
    if (dateStr){
      const [yy,mm,dd] = dateStr.split('-').map(Number);
      const now = new Date();
      createdAt = firebase.firestore.Timestamp.fromDate(new Date(yy, mm-1, dd, now.getHours(), now.getMinutes()));
    }
    const billRef = await shopRef().collection('companyBills').add({ companyName, amount, note, staffName: state.staffName, createdAt });
    if (fromCash){
      await shopRef().collection('dailyCash').doc(dateKey).set({ staffName: state.staffName }, { merge: true });
      const entryRef = await shopRef().collection('dailyCash').doc(dateKey).collection('entries').add({
        type: 'bill', amount, companyName, note, staffName: state.staffName, createdAt,
      });
      await billRef.update({ cashEntryId: entryRef.id, cashEntryDateKey: dateKey });
    }
    closeModals(); toast('বিল যোগ করা হয়েছে');
  } catch(e){ console.error(e); toast('সমস্যা হয়েছে'); }
  finally{ btn.disabled=false; btn.textContent='সংরক্ষণ করুন'; }
});

// ---------- Register service worker ----------
if ('serviceWorker' in navigator){
  window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(()=>{}); });
}

// ---------- Prevent accidental value changes when scrolling over a focused number field ----------
document.addEventListener('wheel', () => {
  if (document.activeElement && document.activeElement.type === 'number'){
    document.activeElement.blur();
  }
}, { passive: true });

boot();
