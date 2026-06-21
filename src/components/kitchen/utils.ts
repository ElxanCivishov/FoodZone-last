import { Order } from "@/types";

const MIN_NOTIFICATION_SECONDS = 5;
const MAX_PENDING_NEW_ORDER_SOUNDS = 1;

let isNewOrderSoundPlaying = false;
let pendingNewOrderSounds: number[] = [];

function notificationLength(seconds?: number) {
  return Math.max(MIN_NOTIFICATION_SECONDS, seconds ?? MIN_NOTIFICATION_SECONDS);
}

function createAudioContext() {
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  return new AudioCtx() as AudioContext;
}

function playNewOrderSoundNow(seconds?: number) {
  try {
    const ctx = createAudioContext();
    const length = notificationLength(seconds);

    // Realistic bell tone: fundamental + non-harmonic overtones
    function bell(
      freq: number,
      startTime: number,
      duration: number,
      vol: number,
    ) {
      const partials: [number, number][] = [
        [1, 1.0],
        [2.756, 0.5],
        [5.404, 0.25],
        [8.933, 0.1],
      ];
      partials.forEach(([ratio, weight]) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq * ratio;
        osc.connect(gain);
        gain.connect(ctx.destination);
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(vol * weight, startTime + 0.008);
        gain.gain.exponentialRampToValueAtTime(
          0.0001,
          startTime + duration * (ratio === 1 ? 1 : 0.5),
        );
        osc.start(startTime);
        osc.stop(startTime + duration);
      });
    }

    // A major arpeggio: A4 -> C#5 -> E5 (pleasant ascending chime)
    const t = ctx.currentTime;
    for (let offset = 0; offset < length; offset += 1.55) {
      bell(440.0, t + offset, 1.35, 0.2);
      bell(554.37, t + offset + 0.24, 1.35, 0.2);
      bell(659.25, t + offset + 0.48, 1.75, 0.24);
    }

    setTimeout(() => ctx.close(), Math.ceil((length + 1.5) * 1000));
    return length;
  } catch {}
  return 0;
}

function drainNewOrderSoundQueue() {
  if (isNewOrderSoundPlaying) return;
  const next = pendingNewOrderSounds.shift();
  if (!next) return;

  isNewOrderSoundPlaying = true;
  const length = playNewOrderSoundNow(next);
  setTimeout(
    () => {
      isNewOrderSoundPlaying = false;
      drainNewOrderSoundQueue();
    },
    Math.ceil((length + 0.35) * 1000),
  );
}

export function playNewOrderSound(seconds?: number) {
  const next = notificationLength(seconds);
  if (pendingNewOrderSounds.length > 0) {
    pendingNewOrderSounds[0] = Math.max(pendingNewOrderSounds[0], next);
  } else {
    pendingNewOrderSounds.push(next);
  }
  pendingNewOrderSounds = pendingNewOrderSounds.slice(
    -MAX_PENDING_NEW_ORDER_SOUNDS,
  );
  drainNewOrderSoundQueue();
}

export function printOrder(order: Order) {
  const tableNum = order.table?.number ?? order.tableId.slice(-4);
  const win = window.open(
    "",
    "_blank",
    "width=320,height=600,toolbar=0,menubar=0",
  );
  if (!win) return;
  win.document.write(`<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Courier New',monospace;font-size:12px;padding:10px;width:280px}
.c{text-align:center}.b{font-weight:bold}
hr{border:none;border-top:1px dashed #000;margin:6px 0}
.row{display:flex;justify-content:space-between;margin:2px 0}
.sm{font-size:10px;color:#555;padding-left:8px;margin:2px 0}
</style></head><body>
<div class="c b" style="font-size:18px">FoodZone</div>
<div class="c" style="margin:2px 0">Masa ${tableNum}</div>
<div class="c b">#${order.orderNumber}</div>
<div class="c sm">${new Date().toLocaleString()}</div>
<hr/>
${order.items
  .map(
    (i) => `
<div class="row"><span class="b">${i.quantity}×</span><span style="padding-left:6px">${i.product?.name ?? i.productId}</span></div>
${i.specialNote ? `<div class="sm">* ${i.specialNote}</div>` : ""}
${(i as any).extras?.length ? `<div class="sm">+ ${((i as any).extras as any[]).map((e: any) => e.name).join(", ")}</div>` : ""}
`,
  )
  .join("")}
<hr/>
${order.specialRequest ? `<div class="b sm">⚠ ${order.specialRequest}</div><hr/>` : ""}
<div class="row b"><span>Ödəniş:</span><span>${order.paymentMethod === "cash" ? "Nağd" : order.paymentMethod === "card" ? "Kart" : "Online"}</span></div>
</body></html>`);
  win.document.close();
  setTimeout(() => {
    win.focus();
    win.print();
  }, 300);
}

export function groupByProduct(orders: Order[]) {
  const map = new Map<
    string,
    { name: string; qty: number; tables: string[]; notes: string[] }
  >();
  orders.forEach((order) => {
    const tbl = String(order.table?.number ?? order.tableId.slice(-4));
    order.items.forEach((item) => {
      const existing = map.get(item.productId) ?? {
        name: item.product?.name ?? item.productId,
        qty: 0,
        tables: [] as string[],
        notes: [] as string[],
      };
      existing.qty += item.quantity;
      if (!existing.tables.includes(tbl)) existing.tables.push(tbl);
      if (item.specialNote && !existing.notes.includes(item.specialNote))
        existing.notes.push(item.specialNote);
      map.set(item.productId, existing);
    });
  });
  return [...map.values()].sort((a, b) => b.qty - a.qty);
}
