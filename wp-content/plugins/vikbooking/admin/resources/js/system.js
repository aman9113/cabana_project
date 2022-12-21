/**
 * Joomla Core
 */

function JoomlaCore() {
    // instantiate only once because iframe pages might invoke this method again
    if (!JoomlaCore.instance) {
        // init pagination handler
        this.pagination = new JPagination();
        // init translations handler
        this.JText = new JText();
        // init editors instances
        this.editors = {
            instances: {}
        };

        // register singleton
        JoomlaCore.instance = this;
    }

    return JoomlaCore.instance;
}

JoomlaCore.prototype.checkAll = function(checkbox) {
    // Use :visible selector in order to skip hidden checkboxes.
    // This is helpful to ignore hidden inputs while filtering the list.
    jQuery('#adminForm input[name="cid[]"]:visible').prop('checked', checkbox.checked);
}

JoomlaCore.prototype.isChecked = function(checked) {
    // get toggle-all checkbox
    var allBox = jQuery('#adminForm thead input[type="checkbox"]');

    if (!checked || jQuery('#adminForm input[name="cid[]"]').length != this.hasChecked()) {
        allBox.prop('checked', false);
    } else {
        allBox.prop('checked', true);
    }
}

JoomlaCore.prototype.hasChecked = function() {
    return jQuery('#adminForm input[name="cid[]"]:checked').length;
}

JoomlaCore.prototype.submitform = function(task, form) {
    if (task && form.task) {
        form.task.value = task;
    }

    jQuery(form).submit();
}

JoomlaCore.prototype.submitbutton = function(task) {
    this.submitform(task, document.adminForm);
}

JoomlaCore.prototype.tableOrdering = function(column, direction, task, form) {
    if (form === undefined) {
        form = document.adminForm;
    }

    if (form.filter_order === undefined) {
        var orderInput = document.createElement('input');
        orderInput.type = 'hidden';
        orderInput.name = 'filter_order';

        form.appendChild(orderInput);
    }

    form.filter_order.value = column;

    if (form.filter_order_Dir === undefined) {
        var directionInput = document.createElement('input');
        directionInput.type = 'hidden';
        directionInput.name = 'filter_order_Dir';

        form.appendChild(directionInput);
    }

    form.filter_order_Dir.value = direction;

    this.submitform(task, form);
}

JoomlaCore.getOptions = function(key, def) {
    // load options if they not exists
    if (!JoomlaCore.optionsStorage) {
        JoomlaCore.loadOptions();
    }

    return JoomlaCore.optionsStorage[key] !== undefined ? JoomlaCore.optionsStorage[key] : def;
};

JoomlaCore.loadOptions = function(options) {
    if (!options) {
        var elements = jQuery('script.joomla-options.new');
        var counter = 0;

        for (var i = 0, l = elements.length; i < l; i++) {
            var element = elements[i];
            var str = element.text || element.textContent;
            var option = {};

            try {
                option = JSON.parse(str);
            } catch (err) {
                console.log(err);
            }

            if (option) {
                JoomlaCore.loadOptions(option);
                counter++;
            }

            // mark element as loaded
            jQuery(element).removeClass('new').addClass('loaded');
        }

        if (counter) {
            return;
        }
    }

    // initial loading
    if (!JoomlaCore.optionsStorage) {
        JoomlaCore.optionsStorage = options || {};
    }
    // Merge with existing
    else if (options) {
        for (var p in options) {
            if (options.hasOwnProperty(p)) {
                JoomlaCore.optionsStorage[p] = options[p];
            }
        }
    }
};

JoomlaCore.isAdmin = function() {
    return document.location.href.match(/\/wp-admin\//i) ? true : false;
}

/**
 * Pagination
 */

function JPagination(total, limit, start, listener) {

    if (total === undefined) {
        total = 0;
    }

    if (limit === undefined) {
        limit = 0;
    }

    if (start === undefined) {
        start = 0;
    }

    if (listener === undefined) {
        listener = null;
    }

    this.total = total;
    this.limit = limit;
    this.start = start;

    this.listener = listener;

    return this;
}

JPagination.prototype.setTotal = function(total) {
    this.total = total;

    return this;
}

JPagination.prototype.setLimit = function(limit) {
    this.limit = limit;

    return this;
}

JPagination.prototype.setStart = function(start) {
    this.start = start;

    return this;
}

JPagination.prototype.setListener = function(listener) {
    this.listener = listener;

    return this;
}

JPagination.prototype.submit = function() {

    if (this.listener.limitstart === undefined) {
        var limitstart = document.createElement('input');
        limitstart.type = 'hidden';
        limitstart.name = 'limitstart';

        this.listener.appendChild(limitstart);
    }

    if (this.listener.limit === undefined) {
        var limit = document.createElement('input');
        limit.type = 'hidden';
        limit.name = 'limit';

        this.listener.appendChild(limit);
    }

    this.listener.limitstart.value = this.start;
    this.listener.limit.value = this.limit;
    jQuery(this.listener).submit();
}

JPagination.prototype.first = function() {
    this.start = 0;
    this.submit();
}

JPagination.prototype.prev = function() {
    this.start -= this.limit;
    this.submit();
}

JPagination.prototype.next = function() {
    this.start += this.limit;
    this.submit();
}

JPagination.prototype.last = function() {
    this.start = (Math.ceil(this.total / this.limit) - 1) * this.limit;
    this.submit();
}

/**
 * Pagination
 */

function JText() {
    this.strings = {};

    return this;
}

JText.prototype._ = function(key, def) {
    // check for new strings in the optionsStorage, and load them
    var newStrings = JoomlaCore.getOptions('joomla.jtext');

    if (newStrings) {
        this.load(newStrings);

        // Clean up the optionsStorage from useless data
        JoomlaCore.loadOptions({
            'joomla.jtext': null
        });
    }

    def = def === undefined ? '' : def;
    key = key.toUpperCase();

    return this.strings[key] !== undefined ? this.strings[key] : def;
}

JText.prototype.load = function(object) {
    for (var key in object) {
        if (object.hasOwnProperty(key)) {
            this.strings[key.toUpperCase()] = object[key];
        }
    }

    return this;
}

/*
 * FORM VALIDATION
 */

function JFormValidator(form, clazz) {
    this.form = form;

    if (typeof clazz === 'undefined') {
        clazz = 'invalid';
    }

    this.clazz = clazz;
    this.labels = {};

    // prevent the form submission on enter keydown

    jQuery(this.form).on('keyup', function(e) {
        var keyCode = e.keyCode || e.which;

        if (keyCode === 13) {
            e.preventDefault();
            return false;
        }
    });

    this.registerFields('.required');
}

JFormValidator.prototype.isValid = function(input) {
    var val = jQuery(input).val();

    return val !== null && val.length > 0;
}

JFormValidator.prototype.registerFields = function(selector) {

    var _this = this;

    jQuery(this.form).find(selector).on('blur', function() {
        if (_this.isValid(this)) {
            _this.unsetInvalid(this);
        } else {
            _this.setInvalid(this);
        }
    });

    return this;
}

JFormValidator.prototype.unregisterFields = function(selector) {

    jQuery(this.form).find(selector).off('blur')

    return this;
}

JFormValidator.prototype.validate = function(callback) {
    var ok = true;

    var _this = this;

    this.clearInvalidTabPane();

    jQuery(this.form).find('.required:input').each(function() {
        if (_this.isValid(this)) {
            _this.unsetInvalid(this);
        } else {
            _this.setInvalid(this);
            ok = false;

            if (!jQuery(this).is(':visible')) {
                // the input is probably hidden behind
                // an unactive tab pane
                _this.setInvalidTabPane(this);
            }
        }
    });

    if (typeof callback !== 'undefined') {
        ok = callback() && ok;
    }

    return ok;
}

JFormValidator.prototype.setLabel = function(input, label) {
    this.labels[jQuery(input).attr('name')] = label;

    return this;
}

JFormValidator.prototype.getLabel = function(input) {
    var name = jQuery(input).attr('name');

    if (this.labels.hasOwnProperty(name)) {
        return jQuery(this.labels[name]);
    }

    return jQuery(input).closest('.control').children().filter('b,label');
}

JFormValidator.prototype.setInvalid = function(input) {
    jQuery(input).addClass(this.clazz);
    this.getLabel(input).addClass(this.clazz);

    return this;
}

JFormValidator.prototype.unsetInvalid = function(input) {
    jQuery(input).removeClass(this.clazz);
    this.getLabel(input).removeClass(this.clazz);

    return this;
}

JFormValidator.prototype.isInvalid = function(input) {
    return jQuery(input).hasClass(this.clazz);
}

JFormValidator.prototype.clearInvalidTabPane = function() {
    jQuery('ul.nav-tabs li a').removeClass(this.clazz);

    return this;
}

JFormValidator.prototype.setInvalidTabPane = function(input) {
    var pane = jQuery(input).closest('.tab-pane');

    if (pane.length) {
        var id = jQuery(pane).attr('id');
        var link = jQuery('ul.nav-tabs li a[href="#' + id + '"]');

        if (link.length) {
            link.addClass(this.clazz);
        }
    }

    return this;
}

/**
 * TRIGGER JMODAL
 */

function wpOpenJModal(id, href, onShow, onHide) {

    if (onShow !== undefined) {
        jQuery('#jmodal-' + id).on('show', onShow);
    }

    if (onHide !== undefined) {
        jQuery('#jmodal-' + id).on('hide', onHide);
    }

    if (!href) {
        // try to extract url from modal URL input
        href = jQuery('#jmodal-' + id + ' > input[name="url"]').val();
    }

    var hideOnEsc = null;

    // check if the modal can be closed using the ESC button
    if (jQuery('#jmodal-' + id).data('esc') == 1) {
        hideOnEsc = function(event) {
            if (event.keyCode == 27) {
                // close modal when ESC is pressed
                wpCloseJModal(id);
            }
        };

        jQuery(window).on('keydown', hideOnEsc);
    }

    jQuery('#jmodal-' + id).on('hide.bs.modal', function() {
        // we should remove the body only whether it has been loaded asynchronously
        if (href) {
            jQuery(this).find('.modal-body').remove();
        }

        jQuery('#jmodal-' + id).off('show.bs.modal');
        jQuery('#jmodal-' + id).off('hide.bs.modal');

        if (hideOnEsc) {
            // turn off esc handler too after disposing the modal
            jQuery(window).off('keydown', hideOnEsc);
        }
    });

    // trigger "show" event to support external listeners
    jQuery('#jmodal-' + id).modal('show').trigger('show');

    var closeBtn = jQuery('#jmodal-' + id).find('button[data-dismiss]');

    // add workaround to trigger hide|hidden events also when
    // clicking the dismiss button of the modal
    closeBtn.on('click', function() {
        jQuery('#jmodal-' + id).trigger('hide').trigger('hidden').trigger('hide.bs.modal');;
    });

    // hide on backdrop click only in case the modal is dismissable
    if (closeBtn.length || hideOnEsc) {
        jQuery('.modal-backdrop').on('click', function() {
            wpCloseJModal(id);
        });
    }

    if (href) {
        wpAppendModalContent('jmodal-box-' + id, href);
    }
}

function wpCloseJModal(id) {
    if (id.match(/^jmodal-/)) {
        // full ID without "#"
        id = "#" + id;
    } else if (!id.match(/^#jmodal-/)) {
        // modal ID only
        id = "#jmodal-" + id;
    }

    // close modal and trigger hide|hidden events
    jQuery(id).modal('hide').trigger('hide').trigger('hidden').trigger('hide.bs.modal');;
}

function wpAppendModalContent(id, href) {

    var data = {};

    if (typeof href === 'object') {
        data = href.serialize();
        href = 'admin-ajax.php';
    } else if (typeof href === 'string') {
        href = href.replace('index.php', 'admin-ajax.php');
        href = href.replace('admin.php', 'admin-ajax.php');
    }

    setTimeout(function() {

        doAjax(
            href,
            data,
            function(resp) {

                try {
                    resp = JSON.parse(resp);

                    if (Array.isArray(resp)) {
                        resp = resp.shift();
                    }
                } catch (err) {
                    // the response is already plain HTML
                }

                // tries to fix any ID conflict
                resp = makeResponseUnique(resp);

                jQuery('#' + id).html('<div class="modal-body">' + resp + '</div>');

                // route targets for back-end only
                if (JoomlaCore.isAdmin()) {
                    // replaces any index.php with admin.php
                    routePageTargets('#' + id);
                }

                ajaxPreventFormSubmit(id);
            },
            function(resp) {
                alert(Joomla.JText._('CONNECTION_LOST'));
            }
        );

    }, 128 + Math.random() * 512);

}

function makeResponseUnique(resp) {
    resp = resp.replace(/adminForm/g, 'innerAdminForm');

    return resp;
}

function ajaxPreventFormSubmit(id) {
    jQuery('#' + id).find('form').on('submit', function(e) {
        e.preventDefault();

        wpAppendModalContent(id, jQuery(this));

        return false;
    });

    jQuery('#' + id).find('a[target!="_blank"]').filter('a:not([href^="javascript:"],[href^="#"])').on('click', function(e) {
        e.preventDefault();

        wpAppendModalContent(id, jQuery(this).attr('href'));

        return false;
    });
}

function routePageTargets(container) {
    jQuery(container).find('a[href^="index.php"], form[action^="index.php"]').each(function() {
        var attr;

        if (jQuery(this).is('a')) {
            attr = 'href';
        } else {
            attr = 'action';
        }

        var value = jQuery(this).attr(attr);

        jQuery(this).attr(attr, value.replace(/^index\.php/, 'admin.php'));
    });

    jQuery(container).find('button[onclick^="document.location.href"]').each(function() {
        // get current event string
        var onclick = jQuery(this).attr('onclick');
        // replace index.php into admin.php
        onclick = onclick.replace(/index\.php/, 'admin.php');
        // update element attribute
        jQuery(this).attr('onclick', onclick);
    });
}

/**
 * Returns a promise that resolves when the specified instance
 * gets defined.
 *
 * @param 	function  check      The callback to invoke to check whether the instance is ready.
 * @param   mixed     threshold  An optional threshold to estabilish the max number of attempts.
 *
 * @return 	Promise
 */
function __isReady(check, threshold) {
    return new Promise((resolve, reject) => {
        // prepare safe counter
        var count = 0;

        var callback = function() {
            // increase counter
            count++;

            // check whether the instance is ready
            var instance = check();

            if (instance) {
                // object is now ready
                resolve(instance);
            } else {
                if (!threshold || count < Math.abs(threshold)) {
                    // check again
                    setTimeout(callback, 32 + Math.floor(Math.random() * 128));
                } else {
                    // instance not ready
                    reject();
                }
            }
        };

        // check
        callback();
    });
}

/**
 * AJAX UTILS
 */

function normalizePostData(data) {

    if (data === undefined) {
        data = {};
    } else if (Array.isArray(data)) {
        // the form data is serialized @see jQuery.serializeArray()
        var form = data;

        data = {};

        for (var i = 0; i < form.length; i++) {
            // if the field ends with [] it should be an array
            if (form[i].name.endsWith("[]")) {
                // if the field doesn't exist yet, create a new list
                if (!data.hasOwnProperty(form[i].name)) {
                    data[form[i].name] = new Array();
                }

                // append the value to the array
                data[form[i].name].push(form[i].value);
            } else {
                // otherwise overwrite the value (if any)
                data[form[i].name] = form[i].value;
            }
        }
    }

    return data;
}

function doAjax(url, data, success, failure, attempt) {

    var AJAX_MAX_ATTEMPTS = 3;

    if (attempt === undefined) {
        attempt = 1;
    }

    // return same object if data has been already normalized
    data = normalizePostData(data);

    return jQuery.ajax({
        type: 'post',
        url: url,
        data: data
    }).done(function(resp) {

        if (success !== undefined) {
            success(resp);
        }

    }).fail(function(err) {
        // If the error has been raised by a connection failure, 
        // retry automatically the same request. Do not retry if the
        // number of attempts is higher than the maximum number allowed.
        if (attempt < AJAX_MAX_ATTEMPTS && isConnectionLostError(err)) {

            // wait 128 milliseconds before launching the request
            setTimeout(function() {
                // relaunch same action and increase number of attempts by 1
                doAjax(url, data, success, failure, attempt + 1);
            }, 128);

        } else {

            // otherwise raise the failure method
            if (failure !== undefined) {
                failure(err);
            }

        }

        console.log('failure', err);

        if (err.status == 500) {
            console.log(err.responseText);
        }

    });
}

function isConnectionLostError(err) {
    return (
        err.statusText == 'error' &&
        err.status == 0 &&
        (err.readyState == 0 || err.readyState == 4) &&
        (!err.hasOwnProperty('responseText') || err.responseText == '')
    );
}

/**
 * BROWSER BACKWARD COMPATIBILITY
 */

if (!Array.isArray) {
    Array.isArray = function(arg) {
        return Object.prototype.toString.call(arg) === '[object Array]';
    }
}

/**
 * Joomla instance is now available on both admin and site sections.
 * In order to avoid delays with the loading of this class, maybe because of lazy-loading
 * techniques of the Theme with "deferred" scripts, we no longer use inline JS code.
 * 
 * @since 	1.4.0
 */
if (typeof Joomla === 'undefined') {
    var Joomla = new JoomlaCore();
} else {
    // reload options
    JoomlaCore.loadOptions();
}