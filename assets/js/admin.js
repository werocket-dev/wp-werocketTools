/**
 * WeRocket Tools - Admin JavaScript
 */

(function($) {
    'use strict';

    const WeRocketAdmin = {
        init: function() {
            this.bindEvents();
            this.initTooltips();
        },

        bindEvents: function() {
            // Form submission
            $(document).on('submit', '.werocket-module-form', this.handleFormSubmit.bind(this));

            // Module toggle
            $(document).on('change', '.module-toggle', this.handleModuleToggle.bind(this));

            // Day closed toggle
            $(document).on('change', '.day-closed-toggle', this.handleDayClosedToggle.bind(this));
        },

        handleFormSubmit: function(e) {
            e.preventDefault();

            const $form = $(e.target);
            const $button = $form.find('button[type="submit"]');
            const moduleId = $form.data('module');

            $button.addClass('loading');

            $.ajax({
                url: werocketTools.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'werocket_save_settings',
                    nonce: werocketTools.nonce,
                    module_id: moduleId,
                    settings: this.serializeFormData($form)
                },
                success: function(response) {
                    if (response.success) {
                        WeRocketAdmin.showToast(werocketTools.strings.saved, 'success');
                    } else {
                        WeRocketAdmin.showToast(response.data.message || werocketTools.strings.error, 'error');
                    }
                },
                error: function() {
                    WeRocketAdmin.showToast(werocketTools.strings.error, 'error');
                },
                complete: function() {
                    $button.removeClass('loading');
                }
            });
        },

        handleModuleToggle: function(e) {
            const $toggle = $(e.target);
            const moduleId = $toggle.data('module');
            const active = $toggle.is(':checked');

            $.ajax({
                url: werocketTools.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'werocket_toggle_module',
                    nonce: werocketTools.nonce,
                    module_id: moduleId,
                    active: active
                },
                success: function(response) {
                    if (response.success) {
                        // Sync all toggles with same module
                        $('.module-toggle[data-module="' + moduleId + '"]').prop('checked', active);
                        WeRocketAdmin.showToast(response.data.message, 'success');
                    } else {
                        $toggle.prop('checked', !active);
                        WeRocketAdmin.showToast(response.data.message || werocketTools.strings.error, 'error');
                    }
                },
                error: function() {
                    $toggle.prop('checked', !active);
                    WeRocketAdmin.showToast(werocketTools.strings.error, 'error');
                }
            });
        },

        handleDayClosedToggle: function(e) {
            const $toggle = $(e.target);
            const $container = $toggle.closest('.flex');
            const $hoursInputs = $container.find('.day-hours input');

            if ($toggle.is(':checked')) {
                $hoursInputs.prop('disabled', true);
                $container.find('.day-hours').addClass('opacity-50');
            } else {
                $hoursInputs.prop('disabled', false);
                $container.find('.day-hours').removeClass('opacity-50');
            }
        },

        serializeFormData: function($form) {
            const data = {};
            const formArray = $form.serializeArray();

            formArray.forEach(function(item) {
                // Handle nested array notation: settings[key][subkey]
                const matches = item.name.match(/settings\[([^\]]+)\](?:\[([^\]]+)\])?(?:\[([^\]]+)\])?/);

                if (matches) {
                    const key1 = matches[1];
                    const key2 = matches[2];
                    const key3 = matches[3];

                    if (key3) {
                        if (!data[key1]) data[key1] = {};
                        if (!data[key1][key2]) data[key1][key2] = {};
                        data[key1][key2][key3] = item.value;
                    } else if (key2) {
                        if (!data[key1]) data[key1] = {};
                        data[key1][key2] = item.value;
                    } else {
                        data[key1] = item.value;
                    }
                }
            });

            return data;
        },

        showToast: function(message, type) {
            const $toast = $('#werocket-toast');
            const $message = $toast.find('.toast-message');
            const $successIcon = $toast.find('.toast-icon-success');
            const $errorIcon = $toast.find('.toast-icon-error');

            $message.text(message);

            if (type === 'success') {
                $successIcon.removeClass('hidden');
                $errorIcon.addClass('hidden');
            } else {
                $successIcon.addClass('hidden');
                $errorIcon.removeClass('hidden');
            }

            $toast.addClass('show');

            setTimeout(function() {
                $toast.removeClass('show');
            }, 3000);
        },

        initTooltips: function() {
            // Initialize any tooltips if needed
        }
    };

    $(document).ready(function() {
        WeRocketAdmin.init();
    });

})(jQuery);
