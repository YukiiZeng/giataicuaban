// Web Worker - Chạy độc lập ngoài luồng UI trình duyệt
let timer = null;

self.onmessage = function (e) {
    if (e.data.cmd === 'start') {
        if (timer) clearInterval(timer);
        const interval = e.data.interval || 2000; // 2 giây = 1 ngày
        
        timer = setInterval(() => {
            self.postMessage({ type: 'tick' });
        }, interval);
    } else if (e.data.cmd === 'stop') {
        if (timer) {
            clearInterval(timer);
            timer = null;
        }
    }
};