let _handler = null;
export function _registerToast(fn) { _handler = fn; }
export function showToast(message, type = 'success') { _handler?.(message, type); }
