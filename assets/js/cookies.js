/**
 * WeRocket Tools - Cookie Consent JavaScript
 */

(function() {
    'use strict';

    const COOKIE_NAME = 'werocket_cookie_consent';
    const COOKIE_EXPIRY = 365;

    const WeRocketCookies = {
        settings: window.werocketCookies?.settings || {},
        banner: null,
        modal: null,

        init: function() {
            this.banner = document.getElementById('werocket-cookie-banner');
            this.modal = document.getElementById('werocket-cookie-modal');

            if (!this.banner) return;

            this.bindEvents();

            // Check if consent already given
            if (!this.getConsent()) {
                this.showBanner();
            }
        },

        bindEvents: function() {
            // Accept all
            this.banner.querySelectorAll('[data-action="accept"]').forEach(btn => {
                btn.addEventListener('click', () => this.acceptAll());
            });

            // Reject all
            this.banner.querySelectorAll('[data-action="reject"]').forEach(btn => {
                btn.addEventListener('click', () => this.rejectAll());
            });

            // Customize
            this.banner.querySelectorAll('[data-action="customize"]').forEach(btn => {
                btn.addEventListener('click', () => this.showModal());
            });

            // Close modal
            if (this.modal) {
                this.modal.querySelectorAll('[data-action="close-modal"]').forEach(btn => {
                    btn.addEventListener('click', () => this.hideModal());
                });

                this.modal.querySelector('.werocket-cookie-modal__overlay')?.addEventListener('click', () => this.hideModal());

                // Save preferences
                this.modal.querySelectorAll('[data-action="save-preferences"]').forEach(btn => {
                    btn.addEventListener('click', () => this.savePreferences());
                });
            }
        },

        showBanner: function() {
            this.banner.style.display = 'block';
            setTimeout(() => {
                this.banner.style.opacity = '1';
            }, 10);
        },

        hideBanner: function() {
            this.banner.style.opacity = '0';
            setTimeout(() => {
                this.banner.style.display = 'none';
            }, 300);
        },

        showModal: function() {
            if (this.modal) {
                this.modal.style.display = 'flex';
            }
        },

        hideModal: function() {
            if (this.modal) {
                this.modal.style.display = 'none';
            }
        },

        acceptAll: function() {
            const categories = Object.keys(this.settings.categories || {});
            const consent = {};

            categories.forEach(cat => {
                consent[cat] = true;
            });

            this.setConsent(consent);
            this.hideBanner();
            this.hideModal();
            this.triggerConsentEvent(consent);
        },

        rejectAll: function() {
            const categories = this.settings.categories || {};
            const consent = {};

            Object.keys(categories).forEach(cat => {
                consent[cat] = categories[cat].required || false;
            });

            this.setConsent(consent);
            this.hideBanner();
            this.hideModal();
            this.triggerConsentEvent(consent);
        },

        savePreferences: function() {
            const consent = {};
            const categories = this.settings.categories || {};

            Object.keys(categories).forEach(cat => {
                const checkbox = this.modal.querySelector(`input[name="cookie_category_${cat}"]`);
                consent[cat] = checkbox ? checkbox.checked : categories[cat].required;
            });

            this.setConsent(consent);
            this.hideBanner();
            this.hideModal();
            this.triggerConsentEvent(consent);
        },

        getConsent: function() {
            const cookie = this.getCookie(COOKIE_NAME);
            if (cookie) {
                try {
                    return JSON.parse(cookie);
                } catch (e) {
                    return null;
                }
            }
            return null;
        },

        setConsent: function(consent) {
            this.setCookie(COOKIE_NAME, JSON.stringify(consent), COOKIE_EXPIRY);
        },

        getCookie: function(name) {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) {
                return parts.pop().split(';').shift();
            }
            return null;
        },

        setCookie: function(name, value, days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            const expires = `expires=${date.toUTCString()}`;
            document.cookie = `${name}=${value};${expires};path=/;SameSite=Lax`;
        },

        triggerConsentEvent: function(consent) {
            const event = new CustomEvent('werocket_cookie_consent', {
                detail: { consent: consent }
            });
            document.dispatchEvent(event);

            // Google Analytics / Tag Manager integration
            if (window.gtag && consent.analytics) {
                gtag('consent', 'update', {
                    'analytics_storage': 'granted'
                });
            }

            if (window.gtag && consent.marketing) {
                gtag('consent', 'update', {
                    'ad_storage': 'granted',
                    'ad_user_data': 'granted',
                    'ad_personalization': 'granted'
                });
            }
        },

        hasConsent: function(category) {
            const consent = this.getConsent();
            return consent && consent[category] === true;
        }
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => WeRocketCookies.init());
    } else {
        WeRocketCookies.init();
    }

    // Expose globally for external access
    window.WeRocketCookies = WeRocketCookies;

})();
