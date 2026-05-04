/**
 * Remote Assist - Main Module
 * 
 * Admin ve kullanıcı arasında imleç pozisyonunu senkronize eder
 */

// CursorTransform sınıfını kullan
let cursorTransform = null;

// Socket.io veya realtime bağlantısı (Frappe'nin realtime sistemini kullan)
let socket = null;
let isConnected = false;
let isAdmin = false;

/**
 * Modülü başlat
 */
function initRemoteAssist() {
	cursorTransform = new CursorTransform();
	
	// Ekran boyutunu al
	const screenSize = cursorTransform.getCurrentScreenSize();
	
	// Frappe realtime bağlantısını kur
	if (typeof frappe !== 'undefined' && frappe.realtime) {
		socket = frappe.realtime;
		setupRealtimeListeners();
	}
}

/**
 * Realtime event listener'larını kur
 */
function setupRealtimeListeners() {
	// Admin tarafı - mousemove event'ini dinle
	if (isAdmin) {
		document.addEventListener('mousemove', handleAdminMouseMove);
		window.addEventListener('resize', handleResize);
		
		// İlk ekran boyutunu gönder
		sendScreenSize();
	} else {
		// Kullanıcı tarafı - admin'in imlecini göster
		socket.on('remote_assist_cursor_move', handleUserCursorMove);
		socket.on('remote_assist_screen_size', handleAdminScreenSize);
		window.addEventListener('resize', handleResize);
		
		// Kullanıcı ekran boyutunu gönder
		sendScreenSize();
	}
}

/**
 * Admin tarafında mouse hareketini işle
 */
function handleAdminMouseMove(event) {
	if (!isConnected) return;
	
	const coords = {
		x: event.clientX,
		y: event.clientY
	};
	
	// Ekran boyutu ile birlikte gönder
	socket.emit('remote_assist_cursor_move', {
		x: coords.x,
		y: coords.y,
		screenSize: cursorTransform.getCurrentScreenSize()
	});
}

/**
 * Kullanıcı tarafında admin imlecini göster
 */
function handleUserCursorMove(data) {
	if (!cursorTransform || !data) return;
	
	// Admin ekran boyutunu güncelle (eğer gönderilmişse)
	if (data.screenSize) {
		cursorTransform.setAdminScreenSize(data.screenSize);
	}
	
	// Koordinatları dönüştür
	const userCoords = cursorTransform.transformAdminToUser({
		x: data.x,
		y: data.y
	});
	
	// İmleci göster (custom cursor element)
	showCursor(userCoords.x, userCoords.y);
}

/**
 * Admin ekran boyutunu al
 */
function handleAdminScreenSize(data) {
	if (cursorTransform && data) {
		cursorTransform.setAdminScreenSize(data);
	}
}

/**
 * Ekran boyutunu gönder
 */
function sendScreenSize() {
	if (!socket) return;
	
	const screenSize = cursorTransform.getCurrentScreenSize();
	
	if (isAdmin) {
		socket.emit('remote_assist_admin_screen_size', screenSize);
	} else {
		socket.emit('remote_assist_user_screen_size', screenSize);
	}
}

/**
 * Resize event handler
 */
function handleResize() {
	cursorTransform.updateScreenSize(isAdmin);
	sendScreenSize();
}

/**
 * İmleci ekranda göster
 */
let cursorElement = null;

function showCursor(x, y) {
	// İmleç elementi yoksa oluştur
	if (!cursorElement) {
		cursorElement = document.createElement('div');
		cursorElement.id = 'remote-assist-cursor';
		cursorElement.style.cssText = `
			position: fixed;
			width: 20px;
			height: 20px;
			border: 2px solid #007bff;
			border-radius: 50%;
			background: rgba(0, 123, 255, 0.3);
			pointer-events: none;
			z-index: 999999;
			transform: translate(-50%, -50%);
			transition: transform 0.05s ease-out;
		`;
		document.body.appendChild(cursorElement);
	}
	
	// Pozisyonu güncelle
	cursorElement.style.left = x + 'px';
	cursorElement.style.top = y + 'px';
}

/**
 * İmleci gizle
 */
function hideCursor() {
	if (cursorElement) {
		cursorElement.style.display = 'none';
	}
}

/**
 * Bağlantıyı başlat
 */
function startConnection(adminUser, targetUser) {
	isAdmin = true;
	isConnected = true;
	initRemoteAssist();
}

/**
 * Bağlantıyı kabul et
 */
function acceptConnection() {
	isAdmin = false;
	isConnected = true;
	initRemoteAssist();
}

/**
 * Bağlantıyı reddet
 */
function rejectConnection() {
	if (socket) {
		socket.emit('remote_assist_rejected');
	}
}

/**
 * Bağlantıyı kapat
 */
function closeConnection() {
	isConnected = false;
	
	if (isAdmin) {
		document.removeEventListener('mousemove', handleAdminMouseMove);
	} else {
		hideCursor();
		if (cursorElement) {
			cursorElement.remove();
			cursorElement = null;
		}
	}
	
	window.removeEventListener('resize', handleResize);
}

// Export functions
if (typeof window !== 'undefined') {
	window.RemoteAssist = {
		init: initRemoteAssist,
		startConnection: startConnection,
		acceptConnection: acceptConnection,
		rejectConnection: rejectConnection,
		closeConnection: closeConnection
	};
}

// Auto-init if frappe is available
if (typeof frappe !== 'undefined') {
	frappe.ready(function() {
		// Modül otomatik başlatılabilir veya manuel olarak başlatılabilir
		// initRemoteAssist();
	});
}

