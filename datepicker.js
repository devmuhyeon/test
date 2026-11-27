/* 고용24 PC 공통 날짜 선택 */
;(function ($) {
    'use strict';

    // YYYY-MM-DD 형식의 공통 공휴일을 이 목록에 등록합니다.
    var commonHolidays = [];

    var trigger = 'button[w24-datepicker], button[data-work24-datepicker]';
    var active;
    var languages = {
        ko: {
            day: '날짜 선택', month: '월 선택', multi: '다중 날짜 선택', workday: '날짜 선택',
            year: '연도', monthField: '월', prev: '이전', next: '다음',
            today: '오늘', thisMonth: '이번 달', close: '닫기', apply: '적용',
            reset: '초기화', count: '날짜 개수', remove: '삭제',
            days: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'],
            short: ['일', '월', '화', '수', '목', '금', '토'],
            months: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']
        },
        en: {
            day: 'Choose date', month: 'Choose month', multi: 'Choose dates', workday: 'Choose dates',
            year: 'Year', monthField: 'Month', prev: 'Previous', next: 'Next',
            today: 'Today', thisMonth: 'This month', close: 'Close', apply: 'Apply',
            reset: 'Reset', count: 'Selected dates', remove: 'Remove',
            days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            short: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
            months: ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December']
        }
    };

    function pad(number) {
        return number < 10 ? '0' + number : String(number);
    }

    function format(date, monthOnly) {
        var month = date.getFullYear() + '-' + pad(date.getMonth() + 1);
        return monthOnly ? month : month + '-' + pad(date.getDate());
    }

    function parse(value, monthOnly) {
        if (!(monthOnly ? /^\d{4}-\d{2}$/ : /^\d{4}-\d{2}-\d{2}$/).test(value)) return null;
        var parts = value.split('-');
        var date = new Date(+parts[0], +parts[1] - 1, monthOnly ? 1 : +parts[2]);
        return format(date, monthOnly) === value ? date : null;
    }

    function button(text, action, label) {
        var $button = $('<button type="button">').attr('data-dp-action', action).text(text);
        if (label) $button.attr('aria-label', label);
        return $button;
    }

    function dateList($trigger, attribute) {
        var raw = $trigger.attr(attribute) || '';
        return $.grep(raw.split(/[,\s]+/), function (value) { return !!parse(value, false); });
    }

    function buildHolidays($trigger) {
        var holidays = {};
        var dates = commonHolidays.concat(
            dateList($trigger, 'data-dp-holidays'),
            dateList($trigger, 'data-dp-holidays-add')
        );
        $.each(dates, function (_, value) {
            if (parse(value, false)) holidays[value] = true;
        });
        $.each(dateList($trigger, 'data-dp-holidays-exclude'), function (_, value) {
            delete holidays[value];
        });
        return holidays;
    }

    function canSelect(state, date) {
        if (date < state.min || date > state.max) return false;
        if (state.fixedMonth !== null && state.fixedMonth !== undefined && date.getMonth() !== state.fixedMonth) return false;
        if (state.monthOnly || (state.popup && !state.disableWeekends)) return true;
        var weekday = date.getDay();
        if (state.disableWeekends && (weekday === 0 || weekday === 6)) return false;
        return !state.holidays[format(date, false)];
    }

    function findDate(state, date, direction, first, last) {
        var candidate = new Date(+date);
        first = first || state.min;
        last = last || state.max;
        while (candidate >= first && candidate <= last) {
            if (canSelect(state, candidate)) return candidate;
            candidate.setDate(candidate.getDate() + direction);
        }
        return null;
    }

    function configuredYear($trigger, attribute) {
        var value = $trigger.attr(attribute);
        return /^[1-9]\d{3}$/.test(value) ? Number(value) : null;
    }

    function yearBounds($trigger) {
        var min = configuredYear($trigger, 'data-dp-min-year');
        var max = configuredYear($trigger, 'data-dp-max-year');
        return min && max && min > max ? { min: null, max: null } : { min: min, max: max };
    }

    function yearOptions(bounds, year) {
        return {
            min: bounds.min || Math.max(1000, year - 10),
            max: bounds.max || Math.min(9999, year + 10)
        };
    }

    function updateYearOptions(state, year) {
        var range = yearOptions(state.years, year);
        var key = range.min + ':' + range.max;
        if (state.$year.data('yearRange') !== key) {
            state.$year.empty().data('yearRange', key);
            for (var optionYear = range.min; optionYear <= range.max; optionYear++) {
                $('<option>').val(optionYear).text(optionYear + (state.lang === 'ko' ? '년' : '')).appendTo(state.$year);
            }
        }
        state.$year.val(year);
    }

    function setup(element) {
        var $trigger = $(element);
        var mode = $trigger.attr('w24-datepicker');
        if (mode === undefined) mode = $trigger.attr('data-work24-datepicker');
        if (mode === 'multiple') mode = 'multi';
        if (mode !== 'month' && mode !== 'multi' && mode !== 'workday') mode = 'day';
        var workday = mode === 'workday';
        var multi = mode === 'multi' || workday;

        var state = $trigger.data('work24Datepicker');
        if (state) return state;

        var lang = $trigger.attr('data-dp-lang') === 'en' ? 'en' : 'ko';
        var $name = $trigger.children('.blind').first();
        var label = ($name.length ? $name : $trigger).text().replace(/\s+/g, ' ').trim();
        var $display = $trigger.prev('input[type="text"], input:not([type])');
        var generatedInput = !$display.length;
        if (generatedInput) $display = $('<input type="text" class="input_txt">').insertBefore($trigger);
        label = label || $trigger.attr('title');
        if ($display.attr('title') && label) label = $display.attr('title') + ' ' + label;

        var $field = $trigger.parent('.box_ipt, .w24dp_field');
        if (!$field.length) {
            $display.add($trigger).wrapAll('<div class="w24dp_field">');
            $field = $trigger.parent();
        }
        $field.toggleClass('w24dp_field_wide', multi);
        var $value = multi ? $('<input type="hidden">') : $display;
        var countTarget = $trigger.attr('data-dp-count-target');
        var $countScope = $trigger.closest('[data-dp-scope]');
        if (!$countScope.length) $countScope = $trigger.closest('form');
        var disableWeekends = $trigger.attr('data-dp-disable-weekends');
        var displayName = $display.attr('name');
        var name = displayName || $trigger.attr('data-dp-name');
        var initial = $trigger.attr('data-dp-value');
        if (initial === undefined) initial = $display.val();
        if (name && multi) {
            $display.removeAttr('name');
            $value.attr('name', name).insertAfter($trigger);
        } else if (name && !displayName) {
            $display.attr('name', name);
        }

        var years = yearBounds($trigger);
        var monthSetting = $trigger.attr('data-dp-locked-month');
        var absoluteMonth = parse(monthSetting, true);
        var fixedYear = absoluteMonth ? absoluteMonth.getFullYear() : configuredYear($trigger, 'data-dp-locked-year');
        var fixedMonth = absoluteMonth ? absoluteMonth.getMonth() :
            (/^(0?[1-9]|1[0-2])$/.test(monthSetting) ? Number(monthSetting) - 1 : null);
        if (fixedYear) years = { min: fixedYear, max: fixedYear };
        state = {
            $trigger: $trigger, $display: $display, $field: $field, $value: $value, mode: mode, lang: lang, words: languages[lang],
            monthOnly: mode === 'month', multi: multi,
            $countTarget: workday && countTarget ? $countScope.find(countTarget).filter('input').first() : $(),
            years: years,
            min: new Date(years.min || 1000, 0, 1), max: new Date(years.max || 9999, 11, 31),
            fixedYear: fixedYear, fixedMonth: fixedMonth,
            disableWeekends: disableWeekends === undefined ? workday : disableWeekends === 'true',
            popup: multi && $trigger.attr('data-dp-presentation') === 'popup',
            holidays: buildHolidays($trigger),
            label: label || languages[lang][mode]
        };

        if (fixedMonth !== null) {
            state.min = new Date(state.min.getFullYear(), fixedMonth, 1);
            state.max = new Date(state.max.getFullYear(), fixedMonth + 1, 0);
        }

        $trigger.data('work24Datepicker', state).attr({
            'aria-haspopup': 'dialog', 'aria-expanded': 'false', lang: lang
        });

        if (!$name.length) $name = $('<span class="blind">').text(state.label);
        $name.detach();
        $trigger.empty().addClass('btn_calendar w24dp_trigger').append($name);
        if (!$field.is('.box_ipt')) $display.addClass('w24dp_display');
        if (!$display.attr('placeholder')) {
            $display.attr('placeholder', mode === 'month' ? 'YYYY-MM' : 'YYYY-MM-DD');
        }
        var inputId = $display.attr('id');
        var hasLabel = $display.closest('label').length || (inputId && $('label').filter(function () {
            return this.htmlFor === inputId;
        }).length);
        if (!hasLabel && !$display.attr('aria-label') && !$display.attr('aria-labelledby') && !$display.attr('title')) {
            $display.attr('aria-label', state.label);
        }
        var initialValues = initial.split(',');
        var values = $.grep(initialValues, function (value, index) {
            var date = parse(value, state.monthOnly);
            return date && canSelect(state, date) && $.inArray(value, initialValues) === index;
        }).sort();
        if (state.multi || values.length || generatedInput || $trigger.is('[data-dp-value]')) {
            setValue(state, state.multi ? values : values.slice(0, 1));
        } else {
            updateTriggerName(state);
        }
        $display.on('input.work24Datepicker change.work24Datepicker', function () {
            if (state.multi) {
                syncTypedDates(state);
            }
            updateTriggerName(state);
        });
        return state;
    }

    function setValue(state, values) {
        var text = values[0] || '';
        if (values.length > 1) {
            text += state.lang === 'ko' ? ' 외 ' + (values.length - 1) + '일' : ' + ' + (values.length - 1) + ' more';
        }
        state.displaySummary = text;
        state.$display.val(text);
        if (state.multi) state.$display[0].setCustomValidity('');
        updateTriggerName(state);
        if (state.multi) {
            state.summaryValues = values.join(',');
            state.$value.val(state.summaryValues);
        }
        state.$countTarget.val(values.length);
    }

    function syncTypedDates(state) {
        var text = state.$display.val().trim();
        if (state.$display.val() === state.displaySummary) text = state.summaryValues;
        var entries = text ? text.split(/\s*,\s*/) : [];
        var values = $.grep(entries, function (entry) {
            var date = parse(entry, false);
            return date && canSelect(state, date);
        });
        var valid = values.length === entries.length;
        var message = state.lang === 'ko' ?
            '선택할 수 있는 날짜를 YYYY-MM-DD 형식으로 입력하고 쉼표로 구분해 주세요.' :
            'Enter selectable dates in YYYY-MM-DD format, separated by commas.';
        state.$display[0].setCustomValidity(valid ? '' : message);
        var unique = valid ? $.grep(values, function (entry, index) {
            return $.inArray(entry, values) === index;
        }).sort() : [];
        var value = unique.join(',');
        if (state.$value.val() !== value) {
            state.$value.val(value).trigger('change');
            state.$countTarget.val(unique.length).trigger('change');
        }
    }

    function updateTriggerName(state) {
        var text = state.$display.val();
        state.$trigger.attr('aria-label', text ? state.label + ' ' + text : state.label);
    }

    function describe(state, date) {
        var words = state.words;
        var month = words.months[date.getMonth()];
        if (state.lang === 'ko') {
            return date.getFullYear() + '년 ' + month +
                (state.monthOnly ? '' : ' ' + date.getDate() + '일 ' + words.days[date.getDay()]);
        }
        return month + (state.monthOnly ? ' ' : ' ' + date.getDate() + ', ') +
            date.getFullYear() + (state.monthOnly ? '' : ', ' + words.days[date.getDay()]);
    }

    function position(state) {
        if (state.popup) return;
        var rect = state.$field[0].getBoundingClientRect();
        var width = state.$dialog.outerWidth();
        var height = state.$dialog.outerHeight();
        var left = Math.max(8, Math.min(rect.left, document.documentElement.clientWidth - width - 8));
        var top = rect.bottom + 4;
        if (top + height > document.documentElement.clientHeight - 8) {
            top = Math.max(8, rect.top - height - 4);
        }
        state.$dialog.css({ left: left, top: top });
    }

    function clamp(state, date) {
        return date < state.min ? state.min : date > state.max ? state.max : date;
    }

    function moveMonth(date, amount) {
        var target = new Date(date.getFullYear(), date.getMonth() + amount, 1);
        var lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
        target.setDate(Math.min(date.getDate(), lastDay));
        return target;
    }

    function focusCalendar(state) {
        var $date = state.$body.find('[tabindex="0"]');
        var target = ($date.length ? $date : state.$dialog.find('[data-dp-action="close"]'))[0];
        if (target) target.focus();
    }

    function todayButtonDisabled(state, date) {
        var today = state.today;
        var sameYear = date.getFullYear() === today.getFullYear();
        var containsToday = sameYear && (state.monthOnly || date.getMonth() === today.getMonth());
        return containsToday || today < state.min || today > state.max ||
            (state.fixedMonth !== null && today.getMonth() !== state.fixedMonth);
    }

    function render(state, focusDate) {
        var date = state.cursor;
        var year = date.getFullYear();
        var month = date.getMonth();
        if (!canSelect(state, date)) {
            var first = new Date(year, month, 1);
            var last = new Date(year, month + 1, 0);
            var preferred = findDate(state, date, 1, first, last) || findDate(state, date, -1, first, last);
            if (preferred) state.cursor = date = preferred;
        }
        var words = state.words;
        var count = state.monthOnly ? 12 : 7 * Math.ceil(
            (new Date(year, month, 1).getDay() + new Date(year, month + 1, 0).getDate()) / 7
        );
        var columns = state.monthOnly ? 4 : 7;
        var start = new Date(year, month, 1).getDay();
        var period = state.monthOnly ? String(year) + (state.lang === 'ko' ? '년' : '') :
            describe({ words: words, lang: state.lang, monthOnly: true }, date);
        if (state.$heading.text() !== period) state.$heading.text(period);

        updateYearOptions(state, year);
        state.$month.val(month);
        var step = state.monthOnly || state.fixedMonth !== null ? 12 : 1;
        state.$prev.prop('disabled', moveMonth(date, -step).getFullYear() < state.min.getFullYear());
        state.$next.prop('disabled', moveMonth(date, step).getFullYear() > state.max.getFullYear());
        var current = format(state.today, state.monthOnly);
        state.$today.prop('disabled', todayButtonDisabled(state, date));

        state.$body.empty();
        var $row;
        for (var i = 0; i < count; i++) {
            if (i % columns === 0) $row = $('<tr>').appendTo(state.$body);
            var item = state.monthOnly ? new Date(year, i, 1) : new Date(year, month, i - start + 1);
            var key = format(item, state.monthOnly);
            var inPeriod = state.monthOnly || item.getMonth() === month;
            var $cell = $('<td>').appendTo($row);
            if (!inPeriod) continue;

            var enabled = canSelect(state, item);
            var selected = enabled && $.inArray(key, state.draft) !== -1;
            var label = describe(state, item);
            var $item = $('<span class="w24dp_date">')
                .text(state.monthOnly ? (state.lang === 'ko' ? words.months[i] : words.months[i].slice(0, 3)) : (state.popup ? pad(item.getDate()) : item.getDate()))
                .appendTo($cell);

            $cell.attr('aria-label', label);
            if (!enabled) {
                $cell.attr('aria-disabled', 'true');
                continue;
            }

            var focused = key === format(date, state.monthOnly);
            $cell.attr({ 'data-dp-date': key, tabindex: focused ? '0' : '-1', 'aria-selected': String(selected) });
            if (key === current) $cell.attr('aria-current', state.monthOnly ? 'true' : 'date');
            if (!state.monthOnly && selected) {
                var prev = format(new Date(item.getFullYear(), item.getMonth(), item.getDate() - 1), false);
                var next = format(new Date(item.getFullYear(), item.getMonth(), item.getDate() + 1), false);
                $cell.toggleClass('w24dp_joined_prev', i % columns !== 0 &&
                    item.getDate() > 1 && $.inArray(prev, state.draft) !== -1);
                $cell.toggleClass('w24dp_joined_next', i % columns !== columns - 1 && item.getDate() < new Date(year, month + 1, 0).getDate() &&
                    $.inArray(next, state.draft) !== -1);
            }
        }

        if (focusDate) focusCalendar(state);
    }

    function renderSelection(state) {
        if (!state.multi) return;
        state.$count.text((state.popup && state.lang === 'ko' ? '총 ' : '') + state.draft.length + (state.lang === 'ko' ? '일' : ''));
        state.$list.empty();
        $.each(state.draft, function (_, value) {
            var label = state.lang === 'ko' ? value + ' ' + state.words.remove : state.words.remove + ' ' + value;
            $('<li>').append($('<span>').text(value), button('×', 'remove', label).attr('data-dp-remove', value))
                .appendTo(state.$list);
        });
    }

    function close(state, commit, restoreFocus) {
        var previous = state.$value.val();
        if (commit) setValue(state, state.draft);
        active = null;
        $(window).off('.work24Datepicker');
        state.$layer.remove();
        if (state.popup) {
            state.$background.removeAttr('inert');
            if (!commit) state.disableWeekends = state.originalRestriction;
        }
        state.$trigger.attr('aria-expanded', 'false').removeAttr('aria-controls');
        if (restoreFocus !== false) state.$trigger[0].focus();
        if (commit && previous !== state.$value.val()) {
            state.$value.trigger('change');
            if (state.multi) state.$display.trigger('change');
            state.$countTarget.trigger('change');
            state.$trigger.trigger('work24datepicker:change', [state.multi ? state.draft.slice() : state.$value.val()]);
        }
    }

    function select(state, key) {
        if (!state.multi) {
            state.draft = [key];
            close(state, true);
            return;
        }
        var index = $.inArray(key, state.draft);
        if (index === -1) state.draft.push(key);
        else state.draft.splice(index, 1);
        state.draft.sort();
        render(state, true);
        renderSelection(state);
    }

    function gridKey(state, event) {
        var date = parse($(event.target).attr('data-dp-date'), state.monthOnly);
        if (!date) return;
        var code = event.which || event.keyCode;
        var step = state.monthOnly ? 4 : 7;
        var offset = 0;

        if (code === 13 || code === 32) {
            event.preventDefault();
            event.stopPropagation();
            select(state, format(date, state.monthOnly));
            return;
        }
        if (code === 37) offset = -1;
        else if (code === 39) offset = 1;
        else if (code === 38) offset = -step;
        else if (code === 40) offset = step;
        else if (code === 36) offset = -(state.monthOnly ? date.getMonth() % step : date.getDay());
        else if (code === 35) offset = step - 1 - (state.monthOnly ? date.getMonth() % step : date.getDay());
        else if (code === 33 || code === 34) {
            date = moveMonth(date, (code === 33 ? -1 : 1) * (state.monthOnly || state.fixedMonth !== null || event.shiftKey ? 12 : 1));
        } else return;

        event.preventDefault();
        event.stopPropagation();
        if (state.monthOnly) date = moveMonth(date, offset);
        else date.setDate(date.getDate() + offset);
        var candidate = clamp(state, date);
        if ((!state.monthOnly || state.fixedMonth !== null) && !canSelect(state, candidate)) {
            var direction = code === 36 ? 1 : code === 35 ? -1 : (offset < 0 || code === 33 ? -1 : 1);
            var first = code === 36 ? date : null;
            var last = code === 35 ? date : null;
            if (first) last = new Date(first.getFullYear(), first.getMonth(), first.getDate() + 6);
            else if (last) first = new Date(last.getFullYear(), last.getMonth(), last.getDate() - 6);
            candidate = findDate(state, candidate, direction, first, last);
            if (!candidate) return;
        }
        state.cursor = candidate;
        render(state, true);
    }

    function handlePopupKey(state, event) {
        var code = event.which || event.keyCode;
        if (code === 27) {
            event.preventDefault();
            event.stopPropagation();
            close(state, false);
        } else if (code === 9) {
            var $stops = state.$dialog.find('button, select, input, [tabindex="0"]');
            if (!state.popup) $stops = state.$trigger.add($stops);
            $stops = $stops.filter(':visible:not(:disabled)');
            var index = $stops.index(document.activeElement);
            var next = index < 0 ? (event.shiftKey ? $stops.length - 1 : 0) :
                (index + (event.shiftKey ? -1 : 1) + $stops.length) % $stops.length;
            if (!$stops.length) return;
            event.preventDefault();
            event.stopPropagation();
            $stops[next].focus();
        } else {
            gridKey(state, event);
        }
    }

    function bind(state) {
        state.$layer.on('keydown', function (event) {
            handlePopupKey(state, event);
        }).on('click', function (event) {
            event.work24DatepickerInside = true;
        }).on('click', '[data-dp-date]', function () {
            state.cursor = parse($(this).attr('data-dp-date'), state.monthOnly);
            select(state, $(this).attr('data-dp-date'));
        }).on('change', '[data-dp-restriction]', function () {
            state.disableWeekends = this.checked;
            state.draft = $.grep(state.draft, function (key) {
                return canSelect(state, parse(key, false));
            });
            render(state, false);
            renderSelection(state);
        }).on('change', 'select', function () {
            var month = state.monthOnly ? state.cursor.getMonth() : +state.$month.val();
            var amount = (+state.$year.val() - state.cursor.getFullYear()) * 12 + month - state.cursor.getMonth();
            state.cursor = clamp(state, moveMonth(state.cursor, amount));
            render(state, false);
        }).on('click', '[data-dp-action]', function () {
            var action = $(this).attr('data-dp-action');
            if (action === 'close' || action === 'apply') {
                close(state, action === 'apply');
            } else if (action === 'remove' || action === 'reset') {
                var index = state.$list.find('button').index(this);
                var value = $(this).attr('data-dp-remove');
                state.draft = action === 'reset' ? [] : $.grep(state.draft, function (item) { return item !== value; });
                render(state, false);
                renderSelection(state);
                if (action === 'remove') {
                    var $remaining = state.$list.find('button');
                    ($remaining.length ? $remaining.eq(Math.min(index, $remaining.length - 1)) : state.$reset).trigger('focus');
                }
            } else {
                var amount = (action === 'prev' ? -1 : 1) * (state.monthOnly || state.fixedMonth !== null ? 12 : 1);
                state.cursor = clamp(state, action === 'today' ? state.today : moveMonth(state.cursor, amount));
                render(state, action === 'today');
                if (this.disabled) focusCalendar(state);
            }
        });
    }

    function open(state) {
        var words = state.words;
        var now = new Date();
        state.today = new Date(now.getFullYear(), now.getMonth(), state.monthOnly ? 1 : now.getDate());
        if (state.multi) syncTypedDates(state);
        state.originalRestriction = state.disableWeekends;
        var current = state.$value.val();
        var selected = parse(current, state.monthOnly);
        state.draft = state.multi ? (current ? current.split(',') : []) :
            (selected && canSelect(state, selected) ? [current] : []);
        var initial = parse(state.draft[0], state.monthOnly) || state.today;
        if (state.fixedMonth !== null && initial.getMonth() !== state.fixedMonth) {
            initial = new Date(initial.getFullYear(), state.fixedMonth, 1);
        }
        state.cursor = clamp(state, initial);

        var id = 'w24dp_dialog';
        while (document.getElementById(id) || document.getElementById(id + '_heading')) id += '_1';
        state.$layer = $('<div class="w24dp_layer">').appendTo('body');
        state.$dialog = $(state.popup ?
            '<section class="full_pop large w24dp_dialog w24dp_popup" role="dialog" aria-modal="true">' :
            '<div class="w24dp_dialog" role="dialog">')
            .attr({ id: id, lang: state.lang, 'aria-label': state.label })
            .toggleClass('w24dp_month_dialog', state.monthOnly).appendTo(state.$layer);
        var $content = state.$dialog;
        if (state.popup) {
            state.$layer.addClass('w24dp_popup_layer');
            var $head = $('<div class="head">').appendTo(state.$dialog);
            $('<h1 class="h2_sb">').attr('id', id + '_title')
                .text(state.lang === 'ko' ? '근무일 선택' : 'Select workdays').appendTo($head);
            state.$dialog.removeAttr('aria-label').attr('aria-labelledby', id + '_title');
            button('×', 'close', words.close).addClass('closed w24dp_popup_close').appendTo(state.$dialog);
            $content = $('<div class="cont">').appendTo(state.$dialog);
            var $toolbar = $('<div class="w24dp_popup_toolbar">').appendTo($content);
            var $legend = $('<div class="w24dp_legend">').appendTo($toolbar);
            $('<span class="w24dp_legend_available">').text(state.lang === 'ko' ? '선택 가능일' : 'Available').appendTo($legend);
            $('<span class="w24dp_legend_disabled">').text(state.lang === 'ko' ? '선택 불가능일' : 'Unavailable').appendTo($legend);
            var $label = $('<label class="w24dp_restriction">')
                .text(state.lang === 'ko' ? '주말 및 공휴일 선택 제한' : 'Exclude weekends and holidays').appendTo($toolbar);
            $('<input type="checkbox" data-dp-restriction>').prop('checked', state.disableWeekends).appendTo($label);
        }
        var $main = $('<div class="w24dp_main">').appendTo($content);
        var $header = $('<div class="w24dp_header">').appendTo($main);
        var moveByYear = state.monthOnly || state.fixedMonth !== null;
        var unit = moveByYear ? words.year : words.monthField;
        var prevLabel = state.lang === 'ko' ? words.prev + ' ' + (moveByYear ? '해' : '달') : words.prev + ' ' + unit.toLowerCase();
        var nextLabel = state.lang === 'ko' ? words.next + ' ' + (moveByYear ? '해' : '달') : words.next + ' ' + unit.toLowerCase();
        var hideNavigation = state.fixedYear && moveByYear;
        state.$prev = button('‹', 'prev', prevLabel);
        state.$next = button('›', 'next', nextLabel);
        state.$year = $('<select>').attr('aria-label', words.year);
        state.$month = $('<select>').attr('aria-label', words.monthField);
        if (!hideNavigation) state.$prev.appendTo($header);
        if (state.fixedYear) {
            var yearLabel = String(state.fixedYear) + (state.lang === 'ko' ? '년' : '');
            if (state.fixedMonth !== null) {
                yearLabel = state.popup ? state.fixedYear + '. ' + pad(state.fixedMonth + 1) :
                    yearLabel + ' ' + words.months[state.fixedMonth];
            }
            $('<span>').text(yearLabel).appendTo($header);
        } else {
            state.$year.appendTo($header);
            if (state.fixedMonth !== null) $('<span>').text(words.months[state.fixedMonth]).appendTo($header);
        }
        if (!state.monthOnly && state.fixedMonth === null) state.$month.appendTo($header);
        if (!hideNavigation) state.$next.appendTo($header);
        else $header.css('justify-content', 'center');
        state.$heading = $('<h2 class="w24dp_sr" aria-live="polite" aria-atomic="true">')
            .attr('id', id + '_heading').appendTo($main);

        $.each(words.months, function (month, label) {
            $('<option>').val(month).text(label).appendTo(state.$month);
        });

        var $grid = $('<table role="grid" class="w24dp_grid">')
            .attr('aria-labelledby', id + '_heading').toggleClass('w24dp_month_grid', state.monthOnly).appendTo($main);
        if (state.multi) $grid.attr('aria-multiselectable', 'true');
        if (!state.monthOnly) {
            var $week = $('<tr>').appendTo($('<thead>').appendTo($grid));
            $.each(words.short, function (index, label) {
                $('<th scope="col">').attr('aria-label', words.days[index]).text(label).appendTo($week);
            });
        }
        state.$body = $('<tbody>').appendTo($grid);
        state.$today = button(state.monthOnly ? words.thisMonth : words.today, 'today');
        if (!state.popup) {
            var $footer = $('<div class="w24dp_footer">').appendTo($main);
            state.$today.appendTo($footer);
            $('<span>').text(format(state.today, state.monthOnly)).appendTo($footer);
            button(words.close, 'close').appendTo($footer);
        }

        if (state.multi) {
            var $side = $('<div class="w24dp_side">').appendTo($content);
            var countLabel = state.popup && state.lang === 'ko' ? '선택한 근무일' : words.count;
            var $summary = $('<div class="w24dp_summary" aria-live="polite" aria-atomic="true">').text(countLabel).appendTo($side);
            state.$count = $('<strong>').appendTo($summary);
            state.$list = $('<ul class="w24dp_list">').attr('aria-label', countLabel).appendTo($side);
            var $actions = state.popup ?
                $('<div class="box_btn_wrap flex_al_r w24dp_popup_actions">').appendTo($content) :
                $('<div class="w24dp_footer">').appendTo($side);
            state.$reset = button(words.reset, 'reset').prepend($('<span aria-hidden="true">').text('⟲ '))
                .appendTo(state.popup ? $summary : $actions);
            if (state.popup) button(words.close, 'close').addClass('btn big type01 closed').appendTo($actions);
            var $apply = button(words.apply, 'apply').appendTo($actions);
            if (state.popup) $apply.addClass('btn big type01 fill');
        }

        active = state;
        if (state.popup) state.$background = state.$layer.siblings().not('[inert], script, style, link').attr('inert', '');
        bind(state);
        renderSelection(state);
        state.$trigger.attr({ 'aria-expanded': 'true', 'aria-controls': id });
        render(state, false);
        position(state);
        focusCalendar(state);
        $(window).on('resize.work24Datepicker scroll.work24Datepicker', function () { position(state); });
    }

    $(function () {
        $(trigger).each(function () { setup(this); });
        $(document).on('click.work24Datepicker', trigger, function (event) {
            event.work24DatepickerInside = true;
            var state = setup(this);
            if (active === state) {
                close(state, false);
                return;
            }
            if (active && active.multi) {
                focusCalendar(active);
                return;
            }
            if (active) close(active, false, false);
            if (!state.$display.prop('disabled')) open(state);
        }).on('keydown.work24Datepicker', trigger, function (event) {
            if (active && active.$trigger[0] === this) handlePopupKey(active, event);
        }).on('click.work24Datepicker focusin.work24Datepicker', function (event) {
            if (!active || active.multi || event.work24DatepickerInside) return;
            var target = event.target;
            if (target === active.$trigger[0] || $.contains(active.$trigger[0], target) ||
                target === active.$dialog[0] || $.contains(active.$dialog[0], target)) return;
            close(active, false, false);
        });
    });
})(jQuery);
