(() => {
  'use strict';

  const SUPABASE_URL = 'https://eazjagzkarvuutxgjekd.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_eqWE0FG39PYSXJRlhh4sRw_psKKFHc_';
  const TABLE = 'travel_data';
  const LOCAL_UPDATED_KEY = 'travelLocalUpdatedAt';
  const DEVICE_KEY = 'travelDeviceId';
  const SUPABASE_STORAGE_PREFIX = 'sb-';
  const SYNC_DELAY = 1200;

  if (!window.supabase?.createClient) {
    console.error('Supabase SDK 未載入');
    return;
  }

  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });

  let session = null;
  let channel = null;
  let syncTimer = null;
  let applyingRemote = false;
  let lastCloudUpdatedAt = null;

  const deviceId = localStorage.getItem(DEVICE_KEY) || crypto.randomUUID();
  localStorage.setItem(DEVICE_KEY, deviceId);

  const syncableKey = (key) => {
    if (!key) return false;
    if (key.startsWith(SUPABASE_STORAGE_PREFIX)) return false;
    if (key.startsWith('weatherCache:')) return false;
    return [
      'buyItems', 'wishItems', 'hiddenFixedItems', 'day6plan',
      'travelSettings', 'expenseItems', 'ticketItems', 'packingItems'
    ].includes(key) || key.startsWith('note:') || key.startsWith('fixedPhoto:') ||
      key.startsWith('fixedTime:') || key.startsWith('check:');
  };

  const collectStorage = () => {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (syncableKey(key)) data[key] = localStorage.getItem(key);
    }
    return data;
  };

  const hasLocalTravelData = () => Object.keys(collectStorage()).length > 0;

  const setStatus = (state, text) => {
    const dot = document.querySelector('#cloudStatusDot');
    const label = document.querySelector('#cloudStatusText');
    if (dot) dot.dataset.state = state;
    if (label) label.textContent = text;
  };

  const toast = (text) => {
    let el = document.querySelector('#cloudToast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'cloudToast';
      el.className = 'cloud-toast';
      document.body.appendChild(el);
    }
    el.textContent = text;
    el.classList.add('show');
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.remove('show'), 2600);
  };

  const openAuth = () => document.querySelector('#cloudAuthModal')?.classList.add('open');
  const closeAuth = () => document.querySelector('#cloudAuthModal')?.classList.remove('open');

  const renderAccount = () => {
    const button = document.querySelector('#cloudAccountButton');
    const email = document.querySelector('#cloudUserEmail');
    const logout = document.querySelector('#cloudLogoutButton');
    const sync = document.querySelector('#cloudSyncButton');
    if (!button) return;
    if (session?.user) {
      button.textContent = '雲端帳號';
      email.textContent = session.user.email || '已登入';
      logout.hidden = false;
      sync.hidden = false;
      setStatus('online', '已連線');
    } else {
      button.textContent = '登入同步';
      email.textContent = '尚未登入';
      logout.hidden = true;
      sync.hidden = true;
      setStatus('offline', '僅本機');
    }
  };

  const applyPayload = (payload, shouldReload = true) => {
    if (!payload?.storage) return;
    applyingRemote = true;
    try {
      const remoteKeys = new Set(Object.keys(payload.storage));
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (syncableKey(key) && !remoteKeys.has(key)) localStorage.removeItem(key);
      }
      Object.entries(payload.storage).forEach(([key, value]) => localStorage.setItem(key, value));
      localStorage.setItem(LOCAL_UPDATED_KEY, String(Date.now()));
    } finally {
      applyingRemote = false;
    }
    if (shouldReload) {
      toast('已收到其他裝置更新，正在重新整理');
      setTimeout(() => location.reload(), 650);
    }
  };

  const uploadCloud = async ({ silent = false } = {}) => {
    if (!session?.user || applyingRemote) return;
    setStatus('syncing', '同步中');
    const payload = {
      version: 2,
      deviceId,
      savedAt: new Date().toISOString(),
      storage: collectStorage()
    };
    const { data, error } = await client
      .from(TABLE)
      .upsert({ user_id: session.user.id, payload }, { onConflict: 'user_id' })
      .select('updated_at')
      .single();
    if (error) {
      console.error(error);
      setStatus('error', '同步失敗');
      if (!silent) toast(`同步失敗：${error.message}`);
      return;
    }
    lastCloudUpdatedAt = data?.updated_at || new Date().toISOString();
    setStatus('online', '已同步');
    if (!silent) toast('已同步到雲端');
  };

  const scheduleUpload = () => {
    if (!session?.user || applyingRemote) return;
    localStorage.setItem(LOCAL_UPDATED_KEY, String(Date.now()));
    clearTimeout(syncTimer);
    syncTimer = setTimeout(() => uploadCloud({ silent: true }), SYNC_DELAY);
    setStatus('syncing', '等待同步');
  };

  const pullCloud = async ({ initial = false } = {}) => {
    if (!session?.user) return;
    setStatus('syncing', '讀取雲端');
    const { data, error } = await client
      .from(TABLE)
      .select('payload,updated_at')
      .eq('user_id', session.user.id)
      .maybeSingle();
    if (error) {
      console.error(error);
      setStatus('error', '讀取失敗');
      toast(`無法讀取雲端：${error.message}`);
      return;
    }
    if (!data) {
      if (hasLocalTravelData()) await uploadCloud({ silent: true });
      else setStatus('online', '雲端尚無資料');
      return;
    }
    lastCloudUpdatedAt = data.updated_at;
    const cloudMs = Date.parse(data.updated_at || 0);
    const localMs = Number(localStorage.getItem(LOCAL_UPDATED_KEY) || 0);
    const cloudDevice = data.payload?.deviceId;
    if (initial && localMs > cloudMs && hasLocalTravelData()) {
      await uploadCloud({ silent: true });
      return;
    }
    if (data.payload?.storage && (cloudDevice !== deviceId || !hasLocalTravelData())) {
      applyPayload(data.payload, false);
      setStatus('online', '已載入雲端');
      if (initial) setTimeout(() => location.reload(), 300);
      return;
    }
    setStatus('online', '已同步');
  };

  const subscribeRealtime = () => {
    if (!session?.user) return;
    if (channel) client.removeChannel(channel);
    channel = client
      .channel(`travel-data-${session.user.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: TABLE,
        filter: `user_id=eq.${session.user.id}`
      }, (message) => {
        const row = message.new;
        if (!row?.payload || row.payload.deviceId === deviceId) return;
        if (row.updated_at === lastCloudUpdatedAt) return;
        lastCloudUpdatedAt = row.updated_at;
        applyPayload(row.payload, true);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setStatus('online', '即時同步');
      });
  };

  const originalSetItem = Storage.prototype.setItem;
  const originalRemoveItem = Storage.prototype.removeItem;
  Storage.prototype.setItem = function(key, value) {
    originalSetItem.call(this, key, value);
    if (this === localStorage && syncableKey(key) && !applyingRemote) scheduleUpload();
  };
  Storage.prototype.removeItem = function(key) {
    originalRemoveItem.call(this, key);
    if (this === localStorage && syncableKey(key) && !applyingRemote) scheduleUpload();
  };

  document.addEventListener('DOMContentLoaded', async () => {
    document.querySelector('#cloudAccountButton')?.addEventListener('click', () => {
      if (session?.user) openAuth(); else openAuth();
    });
    document.querySelector('#cloudModalClose')?.addEventListener('click', closeAuth);
    document.querySelector('#cloudAuthModal')?.addEventListener('click', (e) => {
      if (e.target.id === 'cloudAuthModal') closeAuth();
    });
    document.querySelector('#cloudLoginForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = new FormData(e.currentTarget).get('email')?.trim();
      if (!email) return;
      const button = e.currentTarget.querySelector('button');
      button.disabled = true;
      button.textContent = '寄送中…';
      const redirectTo = `${location.origin}${location.pathname}`;
      const { error } = await client.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo, shouldCreateUser: true }
      });
      button.disabled = false;
      button.textContent = '寄送登入連結';
      if (error) toast(`寄送失敗：${error.message}`);
      else {
        document.querySelector('#cloudLoginMessage').textContent = '登入連結已寄出，請到信箱開啟。';
        toast('登入連結已寄出');
      }
    });
    document.querySelector('#cloudLogoutButton')?.addEventListener('click', async () => {
      await client.auth.signOut();
      closeAuth();
      toast('已登出；本機資料仍保留');
    });
    document.querySelector('#cloudSyncButton')?.addEventListener('click', () => uploadCloud());

    const result = await client.auth.getSession();
    session = result.data.session;
    renderAccount();
    if (session?.user) {
      await pullCloud({ initial: true });
      subscribeRealtime();
    }

    client.auth.onAuthStateChange(async (event, newSession) => {
      session = newSession;
      renderAccount();
      if (event === 'SIGNED_IN' && session?.user) {
        closeAuth();
        await pullCloud({ initial: true });
        subscribeRealtime();
      }
      if (event === 'SIGNED_OUT') {
        if (channel) client.removeChannel(channel);
        channel = null;
      }
    });

    window.addEventListener('online', () => {
      setStatus(session?.user ? 'syncing' : 'offline', session?.user ? '重新連線' : '僅本機');
      if (session?.user) uploadCloud({ silent: true });
    });
    window.addEventListener('offline', () => setStatus('offline', '離線使用'));
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && session?.user) pullCloud();
    });
    setInterval(() => { if (session?.user && navigator.onLine) pullCloud(); }, 60000);
  });
})();
