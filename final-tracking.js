// Auto refresh tracking
setInterval(() => {
    if (typeof updateTrackingDisplay === 'function') {
        updateTrackingDisplay();
    }
}, 2000);