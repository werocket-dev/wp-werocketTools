/* WeRocket Tools — Clic & Collect (checkout) */
(function ($) {
    'use strict';

    if (typeof window.WR_CC === 'undefined') return;
    var CC = window.WR_CC;
    var DAY_KEYS = ['sun','mon','tue','wed','thu','fri','sat'];

    var rootEl = null;
    var $wrapper = null,
        $location = null, $locationInfo = null,
        $fieldDate = null, $calTitle = null, $calGrid = null, $calWeekdays = null,
        $dateInput = null, $selectedDate = null,
        $fieldTime = null, $slots = null, $slotsEmpty = null, $timeInput = null,
        $leadHelp = null;
    var injected = false, saveTimer = null;
    var calendarMonth = null; // Date pointant sur le premier du mois affiché

    function init() {
        // Pose les variables CSS de personnalisation sur l'élément racine.
        var root = document.documentElement.style;
        root.setProperty('--wr-cc-accent', CC.config.accent || '#0F766E');
        root.setProperty('--wr-cc-accent-text', CC.config.accentText || '#FFFFFF');
        root.setProperty('--wr-cc-panel-bg', CC.config.panelBg || '#FAF8F4');
        root.setProperty('--wr-cc-panel-border', CC.config.panelBorder || '#E7E1D5');
        root.setProperty('--wr-cc-text', CC.config.textColor || '#1F2A37');

        if ($('.wr-cc-wrapper').not('.wr-cc-wrapper-block').length) {
            mountFromExistingDom();
            return;
        }
        watchBlockCheckout();
    }

    function mountFromExistingDom() {
        bindRefs($('.wr-cc-wrapper').not('.wr-cc-wrapper-block').get(0));
        if (!rootEl) return;
        configureUi();
        applyVisibilityLegacy();
        attachEvents();
        restoreSelection();

        // Sur updated_checkout, WC re-rend INTÉGRALEMENT le bloc order_review,
        // ce qui détruit notre <tr class="wr-cc-wrapper"> et le remplace par
        // une copie fraîche (rendue par le hook woocommerce_review_order_after_shipping)
        // avec style="display:none;". Notre $wrapper cached devient alors un
        // noeud orphelin et toggle(visible) n'a aucun effet sur le DOM visible.
        //
        // → On re-bind toutes les références si l'élément en DOM a changé.
        $(document.body).on('updated_checkout updated_shipping_method', function () {
            var fresh = $('.wr-cc-wrapper').not('.wr-cc-wrapper-block').get(0);
            if (fresh && fresh !== rootEl) {
                bindRefs(fresh);
                configureUi();
                attachEvents();
                restoreSelection();
            }
            applyVisibilityLegacy();
        });
    }

    function watchBlockCheckout() {
        var obs = new MutationObserver(tryInjectInBlock);
        obs.observe(document.body, { childList: true, subtree: true });
        tryInjectInBlock();
    }

    function tryInjectInBlock() {
        var ccInput = findCcRadioInput();
        if (!ccInput) {
            if (injected && rootEl) hideWrapper();
            return;
        }
        var container = findShippingMethodsContainer(ccInput);
        if (!container) return;

        if (!injected) {
            var tpl = document.getElementById('wr-cc-fields-template');
            if (!tpl || !tpl.content) return;
            var node = tpl.content.firstElementChild.cloneNode(true);
            if (!node) return;
            container.parentNode.insertBefore(node, container.nextSibling);
            bindRefs(node);
            if (!rootEl) return;
            configureUi();
            attachEvents();
            restoreSelection();
            injected = true;
        }
        applyVisibilityBlock(ccInput);
    }

    function findCcRadioInput() {
        var radios = document.querySelectorAll('input[type="radio"]');
        for (var i = 0; i < radios.length; i++) {
            var r = radios[i];
            if (r.value && r.value.indexOf(CC.shippingMethodId) !== -1) return r;
            if (r.dataset && r.dataset.shippingMethod && r.dataset.shippingMethod.indexOf(CC.shippingMethodId) !== -1) return r;
            var label = r.closest('label');
            if (label && label.textContent && label.textContent.indexOf(CC.config.title || 'Clic & Collect') !== -1) return r;
        }
        return null;
    }

    function findShippingMethodsContainer(ccInput) {
        var selectors = [
            '.wp-block-woocommerce-checkout-shipping-methods-block',
            '.wc-block-checkout__shipping-method',
            '.wc-block-components-shipping-rates-control',
            'fieldset',
        ];
        for (var i = 0; i < selectors.length; i++) {
            var c = ccInput.closest(selectors[i]);
            if (c) return c;
        }
        return ccInput.parentNode;
    }

    function bindRefs(wrapper) {
        rootEl = wrapper;
        $wrapper = $(wrapper);
        $location = $wrapper.find('#wr_cc_location');
        $locationInfo = $wrapper.find('#wr_cc_location_info');
        $fieldDate = $wrapper.find('#wr_cc_field_date');
        $calTitle = $wrapper.find('#wr_cc_cal_title');
        $calGrid = $wrapper.find('#wr_cc_cal_grid');
        $calWeekdays = $wrapper.find('.wr-cc-cal-weekdays');
        $dateInput = $wrapper.find('#wr_cc_date');
        $selectedDate = $wrapper.find('#wr_cc_selected_date');
        $fieldTime = $wrapper.find('#wr_cc_field_time');
        $slots = $wrapper.find('#wr_cc_slots');
        $slotsEmpty = $wrapper.find('#wr_cc_slots_empty');
        $timeInput = $wrapper.find('#wr_cc_time');
        $leadHelp = $wrapper.find('#wr_cc_lead_help');
    }

    function configureUi() {
        if (!$location || !$location.length) return;
        populateLocations();
        renderWeekdaysHeader();
        if (CC.config.minLeadTimeHours > 0) {
            $leadHelp.text((CC.i18n.leadHelp || '%d h').replace('%d', CC.config.minLeadTimeHours));
        }
    }

    function renderWeekdaysHeader() {
        var days = CC.i18n.weekdaysShort || ['lun','mar','mer','jeu','ven','sam','dim'];
        var html = '';
        for (var i = 0; i < days.length; i++) {
            html += '<span>' + escapeHtml(days[i]) + '</span>';
        }
        $calWeekdays.html(html);
    }

    function restoreSelection() {
        if (CC.current && CC.current.location) {
            $location.val(CC.current.location);
            onLocationChange();
            if (CC.current.date) {
                setDate(CC.current.date, false);
                if (CC.current.time) {
                    $timeInput.val(CC.current.time);
                    refreshSlots(false);
                }
            }
        }
    }

    function attachEvents() {
        $location.on('change', function () { onLocationChange(); pushSession(); });

        $wrapper.on('click', '.wr-cc-cal-nav', function () {
            var dir = parseInt(this.getAttribute('data-dir'), 10) || 0;
            if (!calendarMonth) return;
            calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + dir, 1);
            renderCalendar();
        });

        $wrapper.on('click', '.wr-cc-day[data-iso]', function () {
            if (this.classList.contains('is-disabled')) return;
            setDate(this.getAttribute('data-iso'), true);
        });

        $wrapper.on('click', '.wr-cc-slot', function () {
            if (this.classList.contains('is-disabled')) return;
            $wrapper.find('.wr-cc-slot').removeClass('is-active').attr('aria-checked','false');
            this.classList.add('is-active');
            this.setAttribute('aria-checked','true');
            $timeInput.val(this.getAttribute('data-time'));
            pushSession();
        });
    }

    function applyVisibilityLegacy() {
        // WooCommerce rend la shipping method différemment selon le nombre de
        // méthodes dispo :
        //   - Plusieurs méthodes → <input type="radio" name="shipping_method[0]">
        //   - UNE seule méthode  → <input type="hidden" name="shipping_method[0]">
        // Le selector :checked ne matche pas les hidden inputs → wrapper restait
        // caché en prod quand seul Click & Collect était configuré.
        var $selected = $('input[name^="shipping_method"]:checked');
        if (!$selected.length) {
            // Fallback : input hidden (cas "unique méthode de livraison")
            $selected = $('input[name^="shipping_method"][type="hidden"]').first();
        }
        var val = $selected.val() || '';
        var visible = val.indexOf(CC.shippingMethodId) === 0;
        $wrapper.toggle(visible);
    }
    function applyVisibilityBlock(ccInput) {
        if (!rootEl) return;
        rootEl.style.display = ccInput.checked ? '' : 'none';
    }
    function hideWrapper() { if (rootEl) rootEl.style.display = 'none'; }

    function populateLocations() {
        $location.find('option:not(:first)').remove();
        CC.locations.forEach(function (loc) {
            $location.append($('<option/>').val(loc.id).text(loc.name));
        });
    }

    function getLocation(id) {
        for (var i = 0; i < CC.locations.length; i++) {
            if (CC.locations[i].id === id) return CC.locations[i];
        }
        return null;
    }

    function onLocationChange() {
        var loc = getLocation($location.val());
        $dateInput.val('');
        $timeInput.val('');
        $selectedDate.attr('hidden', true).text('');
        $fieldDate.attr('hidden', !loc);
        $fieldTime.attr('hidden', true);
        $slots.empty();
        $slotsEmpty.attr('hidden', true);
        $locationInfo.attr('hidden', true).empty();

        if (!loc) return;

        if (loc.address || loc.phone || loc.email) {
            var html = '<strong>' + escapeHtml(loc.name) + '</strong>';
            if (loc.address) html += '<span>' + escapeHtml(loc.address).replace(/\n/g, '<br>') + '</span>';
            if (loc.phone) html += '<span class="wr-cc-loc-line">📞 ' + escapeHtml(loc.phone) + '</span>';
            if (loc.email) html += '<span class="wr-cc-loc-line">✉ ' + escapeHtml(loc.email) + '</span>';
            $locationInfo.html(html).removeAttr('hidden');
        }

        var firstAvail = findFirstAvailableDate(loc);
        if (firstAvail) {
            calendarMonth = new Date(firstAvail.getFullYear(), firstAvail.getMonth(), 1);
        } else {
            var now = new Date();
            calendarMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        }
        renderCalendar();
    }

    function setDate(iso, doPush) {
        $dateInput.val(iso);
        var loc = getLocation($location.val());
        if (loc) {
            var d = parseDate(iso);
            if (d.getMonth() !== calendarMonth.getMonth() || d.getFullYear() !== calendarMonth.getFullYear()) {
                calendarMonth = new Date(d.getFullYear(), d.getMonth(), 1);
            }
        }
        renderCalendar();
        var formatted = formatPrettyDate(iso);
        var tpl = CC.i18n.pickupOn || 'Retrait le %s';
        $selectedDate.text(tpl.replace('%s', formatted)).removeAttr('hidden');
        $fieldTime.attr('hidden', false);
        refreshSlots(true);
        if (doPush) pushSession();
    }

    function refreshSlots(resetTime) {
        var loc = getLocation($location.val());
        var iso = $dateInput.val();
        $slots.empty();
        $slotsEmpty.attr('hidden', true);
        if (!loc || !iso) { $fieldTime.attr('hidden', true); return; }

        var slots = computeAvailableSlots(loc, iso);
        var current = $timeInput.val();
        if (!slots.length) {
            $slotsEmpty.removeAttr('hidden');
            if (resetTime) $timeInput.val('');
            return;
        }
        var matched = false;
        slots.forEach(function (t) {
            var active = (t === current);
            if (active) matched = true;
            var btn = $('<button/>', {
                type: 'button',
                'class': 'wr-cc-slot' + (active ? ' is-active' : ''),
                role: 'radio',
                'aria-checked': active ? 'true' : 'false',
                'data-time': t,
                text: t,
            });
            $slots.append(btn);
        });
        if (!matched && resetTime) {
            $timeInput.val('');
        }
    }

    function renderCalendar() {
        if (!calendarMonth) return;
        var loc = getLocation($location.val());
        var months = CC.i18n.months || [];
        var label = (months[calendarMonth.getMonth()] || '') + ' ' + calendarMonth.getFullYear();
        $calTitle.text(label);

        // Premier jour à afficher (lundi de la semaine du 1er du mois)
        var first = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
        var startOffset = (first.getDay() + 6) % 7; // lundi = 0
        var gridStart = new Date(first);
        gridStart.setDate(first.getDate() - startOffset);

        var today = new Date();
        var todayIso = toIso(today);
        var selectedIso = $dateInput.val();

        var html = '';
        // Toujours 6 lignes pour stabilité visuelle
        for (var i = 0; i < 42; i++) {
            var d = new Date(gridStart);
            d.setDate(gridStart.getDate() + i);
            var iso = toIso(d);
            var inMonth = d.getMonth() === calendarMonth.getMonth();
            var classes = ['wr-cc-day'];
            if (!inMonth) classes.push('is-out');
            if (iso === todayIso) classes.push('is-today');
            if (iso === selectedIso) classes.push('is-selected');

            var state = dayState(loc, d);
            if (state === 'past') classes.push('is-disabled', 'is-past');
            else if (state === 'closed') classes.push('is-disabled', 'is-closed');
            else if (state === 'unavailable') classes.push('is-disabled');
            else classes.push('is-available');

            var aria = inMonth ? formatPrettyDate(iso) : '';
            html += '<button type="button" class="' + classes.join(' ') + '"'
                + ' data-iso="' + iso + '"'
                + (aria ? ' aria-label="' + escapeAttr(aria) + '"' : '')
                + (classes.indexOf('is-disabled') !== -1 ? ' tabindex="-1"' : '')
                + '>'
                + '<span>' + d.getDate() + '</span>'
                + '</button>';
        }
        $calGrid.html(html);
    }

    /**
     * Renvoie 'available' | 'unavailable' | 'closed' | 'past'
     */
    function dayState(loc, d) {
        var today = startOfDay(new Date());
        var sod = startOfDay(d);
        if (sod < today) return 'past';
        var maxDate = new Date(today);
        maxDate.setDate(maxDate.getDate() + CC.config.maxDaysAhead);
        if (sod > maxDate) return 'unavailable';
        if (!loc) return 'unavailable';
        var iso = toIso(d);
        if ((loc.closedDates || []).indexOf(iso) !== -1) return 'closed';
        var sched = loc.schedule[DAY_KEYS[d.getDay()]];
        if (!sched || !sched.enabled || !sched.slots || !sched.slots.length) return 'closed';
        var slots = computeAvailableSlots(loc, iso);
        if (CC.config.requireTimeSlot && !slots.length) return 'unavailable';
        return 'available';
    }

    function findFirstAvailableDate(loc) {
        var today = startOfDay(new Date());
        for (var i = 0; i <= CC.config.maxDaysAhead; i++) {
            var d = new Date(today);
            d.setDate(d.getDate() + i);
            if (dayState(loc, d) === 'available') return d;
        }
        return null;
    }

    function computeAvailableSlots(loc, iso) {
        var dayKey = DAY_KEYS[parseDate(iso).getDay()];
        var sched = loc.schedule[dayKey];
        if (!sched || !sched.enabled || !sched.slots.length) return [];
        var step = Math.max(5, CC.config.slotIntervalMin || 30);
        var minLead = CC.config.minLeadTimeHours || 0;
        var now = new Date();
        var earliestTs = now.getTime() + minLead * 3600 * 1000;
        var out = [];
        sched.slots.forEach(function (slot) {
            var startM = toMinutes(slot.start), endM = toMinutes(slot.end);
            for (var m = startM; m < endM; m += step) {
                var hh = pad(Math.floor(m / 60)), mm = pad(m % 60);
                var label = hh + ':' + mm;
                var dt = parseDateTime(iso, label);
                if (dt.getTime() < earliestTs) continue;
                out.push(label);
            }
        });
        return out;
    }

    function pushSession() {
        if (!CC.ajaxUrl) return;
        if (saveTimer) clearTimeout(saveTimer);
        saveTimer = setTimeout(function () {
            var payload = {
                action: 'wr_cc_update_session',
                nonce: CC.nonce,
                location: ($location && $location.val()) || '',
                date: ($dateInput && $dateInput.val()) || '',
                time: ($timeInput && $timeInput.val()) || ''
            };
            $.post(CC.ajaxUrl, payload, function () {
                $(document.body).trigger('update_checkout');
            });
        }, 220);
    }

    function formatPrettyDate(iso) {
        var d = parseDate(iso);
        var wd = (CC.i18n.weekdaysLong || [])[(d.getDay() + 6) % 7] || '';
        var month = (CC.i18n.months || [])[d.getMonth()] || '';
        return (wd + ' ' + d.getDate() + ' ' + month + ' ' + d.getFullYear()).trim();
    }

    function startOfDay(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
    function toIso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
    function parseDate(iso) {
        var p = iso.split('-');
        return new Date(parseInt(p[0],10), parseInt(p[1],10) - 1, parseInt(p[2],10));
    }
    function parseDateTime(iso, hhmm) {
        var d = parseDate(iso); var t = hhmm.split(':');
        d.setHours(parseInt(t[0],10), parseInt(t[1],10), 0, 0); return d;
    }
    function toMinutes(hhmm) { var p = hhmm.split(':'); return parseInt(p[0],10) * 60 + parseInt(p[1],10); }
    function pad(n) { return n < 10 ? '0' + n : '' + n; }
    function escapeHtml(s) {
        return String(s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }
    function escapeAttr(s) { return escapeHtml(s); }

    $(init);
})(jQuery);
