/**
 * Remote Assist - Cursor Position Transform Utility
 * 
 * Bu modül, farklı ekran boyutları arasında imleç pozisyonunu doğru şekilde
 * dönüştürmek için kullanılır.
 */

class CursorTransform {
	constructor() {
		this.adminScreenSize = null;
		this.userScreenSize = null;
		this.scaleX = 1;
		this.scaleY = 1;
		this.offsetX = 0;
		this.offsetY = 0;
	}

	/**
	 * Admin ekran boyutunu ayarla
	 * @param {Object} size - { width: number, height: number }
	 */
	setAdminScreenSize(size) {
		this.adminScreenSize = {
			width: size.width || window.innerWidth,
			height: size.height || window.innerHeight
		};
		this.calculateScale();
	}

	/**
	 * Kullanıcı ekran boyutunu ayarla
	 * @param {Object} size - { width: number, height: number }
	 */
	setUserScreenSize(size) {
		this.userScreenSize = {
			width: size.width || window.innerWidth,
			height: size.height || window.innerHeight
		};
		this.calculateScale();
	}

	/**
	 * Ölçek faktörlerini hesapla
	 * 
	 * Doğrudan ölçekleme kullanıyoruz - her ekran boyutunda aynı yerde
	 * durması için X ve Y eksenlerini ayrı ayrı ölçekliyoruz.
	 */
	calculateScale() {
		if (!this.adminScreenSize || !this.userScreenSize) {
			return;
		}

		// X ve Y eksenlerini ayrı ayrı ölçekle
		// Bu sayede admin'in ekranında bir butonun üzerine geldiğinde,
		// kullanıcının ekranında da aynı butonun üzerinde olur
		this.scaleX = this.userScreenSize.width / this.adminScreenSize.width;
		this.scaleY = this.userScreenSize.height / this.adminScreenSize.height;

		// Offset yok - doğrudan ölçekleme kullanıyoruz
		this.offsetX = 0;
		this.offsetY = 0;
	}

	/**
	 * Admin koordinatlarını kullanıcı koordinatlarına dönüştür
	 * @param {Object} adminCoords - { x: number, y: number }
	 * @returns {Object} - { x: number, y: number }
	 */
	transformAdminToUser(adminCoords) {
		if (!this.adminScreenSize || !this.userScreenSize) {
			return adminCoords;
		}

		// Ölçekle ve offset ekle
		const userX = (adminCoords.x * this.scaleX) + this.offsetX;
		const userY = (adminCoords.y * this.scaleY) + this.offsetY;

		return {
			x: Math.round(userX),
			y: Math.round(userY)
		};
	}

	/**
	 * Kullanıcı koordinatlarını admin koordinatlarına dönüştür
	 * @param {Object} userCoords - { x: number, y: number }
	 * @returns {Object} - { x: number, y: number }
	 */
	transformUserToAdmin(userCoords) {
		if (!this.adminScreenSize || !this.userScreenSize) {
			return userCoords;
		}

		// Offset'i çıkar ve ters ölçekle
		const adminX = (userCoords.x - this.offsetX) / this.scaleX;
		const adminY = (userCoords.y - this.offsetY) / this.scaleY;

		return {
			x: Math.round(adminX),
			y: Math.round(adminY)
		};
	}

	/**
	 * Mevcut ekran boyutunu al
	 * @returns {Object} - { width: number, height: number }
	 */
	getCurrentScreenSize() {
		return {
			width: window.innerWidth,
			height: window.innerHeight
		};
	}

	/**
	 * Ekran boyutunu güncelle (resize event için)
	 */
	updateScreenSize(isAdmin = false) {
		const size = this.getCurrentScreenSize();
		if (isAdmin) {
			this.setAdminScreenSize(size);
		} else {
			this.setUserScreenSize(size);
		}
	}
}

// Global instance
if (typeof window !== 'undefined') {
	window.CursorTransform = CursorTransform;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
	module.exports = CursorTransform;
}

