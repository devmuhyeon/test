/* 고용24 PC 공통 날짜 선택 */
;(function ($) {
    'use strict';

    var trigger = 'button[w24-datepicker], button[data-work24-datepicker]';
    var active;
    var languages = {
        ko: {
            day: '날짜 선택', month: '월 선택', multi: '다중 날짜 선택',
            year: '연도', monthField: '월', prev: '이전', next: '다음',
            today: '오늘', thisMonth: '이번 달', close: '닫기', apply: '적용',
            reset: '초기화', count: '선택한 일수', remove: '삭제',
            days: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'],
            short: ['일', '월', '화', '수', '목', '금', '토'],
            months: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']
        },
        en: {
            day: 'Choose date', month: 'Choose month', multi: 'Choose dates',
            year: 'Year', monthField: 'Month', prev: 'Previous', next: 'Next',
            today: 'Today', thisMonth: 'This month', close: 'Close', apply: 'Apply',
            reset: 'Reset', count: 'Selected days', remove: 'Remove',
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

    function canSelect(state, date) {
        if (date < state.min || date > state.max) return false;
        if (state.monthOnly) return true;
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

    function setup(element) {
        var $trigger = $(element);
        var mode = $trigger.attr('w24-datepicker');
        if (mode === undefined) mode = $trigger.attr('data-work24-datepicker');
        if (mode !== 'month' && mode !== 'multi') mode = 'day';

        var state = $trigger.data('work24Datepicker');
        if (state) return state;

        var lang = $trigger.attr('data-dp-lang') === 'en' ? 'en' : 'ko';
        var $value = $('<input type="hidden">');
        var name = $trigger.attr('data-dp-name');
        if (name) $value.attr('name', name).insertAfter($trigger);

        state = {
            $trigger: $trigger, $value: $value, mode: mode, lang: lang, words: languages[lang],
            monthOnly: mode === 'month', multi: mode === 'multi',
            min: new Date(1900, 0, 1), max: new Date(2100, 11, 31),
            locked: mode === 'multi' ? parse($trigger.attr('data-dp-locked-month'), true) : null,
            disableWeekends: $trigger.attr('data-dp-disable-weekends') === 'true',
            holidays: {},
            label: $trigger.text().replace(/\s+/g, ' ').trim() || languages[lang][mode]
        };

        $.each(dateList($trigger, 'data-dp-holidays').concat(dateList($trigger, 'data-dp-holidays-add')), function (_, value) {
            state.holidays[value] = true;
        });
        $.each(dateList($trigger, 'data-dp-holidays-exclude'), function (_, value) {
            delete state.holidays[value];
        });

        if (state.locked) {
            state.min = state.locked;
            state.max = new Date(state.locked.getFullYear(), state.locked.getMonth() + 1, 0);
        }

        $trigger.data('work24Datepicker', state).attr({
            'aria-haspopup': 'dialog', 'aria-expanded': 'false', lang: lang
        });

        state.$text = $('<span>').appendTo($trigger.empty().addClass('w24dp-trigger'));
        state.$icon = $('<span class="w24dp-icon" aria-hidden="true">').appendTo($trigger);
        var initial = $trigger.attr('data-dp-value') || '';
        var initialValues = initial.split(',');
        var values = $.grep(initialValues, function (value, index) {
            var date = parse(value, state.monthOnly);
            return date && canSelect(state, date) && $.inArray(value, initialValues) === index;
        }).sort();
        setValue(state, state.multi ? values : values.slice(0, 1));
        return state;
    }

    function setValue(state, values) {
        var text = values[0] || (state.monthOnly ? 'YYYY-MM' : 'YYYY-MM-DD');
        if (values.length > 1) {
            text += state.lang === 'ko' ? ' 외 ' + (values.length - 1) + '일' : ' + ' + (values.length - 1) + ' more';
        }
        state.$text.text(text);
        state.$trigger.attr('aria-label', state.label + ' ' + text);
        state.$value.val(values.join(','));
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
        var rect = state.$trigger[0].getBoundingClientRect();
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
        ($date.length ? $date : state.$dialog.find('[data-dp-action="close"]')).trigger('focus');
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

        state.$year.val(year);
        state.$month.val(month);
        var step = state.monthOnly ? 12 : 1;
        state.$prev.prop('disabled', moveMonth(date, -step).getFullYear() < state.min.getFullYear() || !!state.locked);
        state.$next.prop('disabled', moveMonth(date, step).getFullYear() > state.max.getFullYear() || !!state.locked);
        var current = format(state.today, state.monthOnly);
        state.$today.prop('disabled', !canSelect(state, state.today) ||
            format(date, state.monthOnly) === current);

        state.$body.empty();
        var $row;
        for (var i = 0; i < count; i++) {
            if (i % columns === 0) $row = $('<tr>').appendTo(state.$body);
            var item = state.monthOnly ? new Date(year, i, 1) : new Date(year, month, i - start + 1);
            var key = format(item, state.monthOnly);
            var inPeriod = state.monthOnly || item.getMonth() === month;
            var selected = inPeriod && $.inArray(key, state.draft) !== -1;
            var enabled = inPeriod && canSelect(state, item);
            var label = describe(state, item);
            var $cell = $('<td>').appendTo($row);

            if (!inPeriod && state.locked) continue;
            var $item = $('<span class="w24dp-date">')
                .text(state.monthOnly ? (state.lang === 'ko' ? words.months[i] : words.months[i].slice(0, 3)) : item.getDate())
                .appendTo($cell);

            $cell.attr('aria-label', label);
            if (!enabled) {
                $cell.attr('aria-disabled', 'true');
                continue;
            }

            var focused = key === format(date, state.monthOnly);
            $cell.attr({ 'data-dp-date': key, tabindex: focused ? '0' : '-1', 'aria-selected': String(selected) });
            if (key === current) $cell.attr('aria-current', state.monthOnly ? 'true' : 'date');
            if (state.multi && selected && !state.locked) {
                var prev = format(new Date(year, month, item.getDate() - 1), false);
                var next = format(new Date(year, month, item.getDate() + 1), false);
                $cell.toggleClass('w24dp-joined-prev', i % columns !== 0 && item.getDate() > 1 && $.inArray(prev, state.draft) !== -1);
                $cell.toggleClass('w24dp-joined-next', i % columns !== columns - 1 && item.getDate() < new Date(year, month + 1, 0).getDate() && $.inArray(next, state.draft) !== -1);
            }
        }

        if (focusDate) focusCalendar(state);
    }

    function renderSelection(state) {
        if (!state.multi) return;
        state.$count.text(state.draft.length + (state.lang === 'ko' ? '일' : ''));
        state.$list.empty();
        $.each(state.draft, function (_, value) {
            var label = state.lang === 'ko' ? value + ' ' + state.words.remove : state.words.remove + ' ' + value;
            $('<li>').append($('<span>').text(value), button('×', 'remove', label).attr('data-dp-remove', value))
                .appendTo(state.$list);
        });
    }

    function close(state, commit) {
        var previous = state.$value.val();
        if (commit) setValue(state, state.draft);
        active = null;
        $(window).off('.work24Datepicker');
        state.$background.each(function () {
            var old = $(this).data('work24DatepickerBackground');
            if (old.aria === undefined) $(this).removeAttr('aria-hidden');
            else $(this).attr('aria-hidden', old.aria);
            if (!old.inert) $(this).removeAttr('inert');
            $(this).removeData('work24DatepickerBackground');
        });
        state.$layer.remove();
        state.$trigger.attr('aria-expanded', 'false').removeAttr('aria-controls').trigger('focus');
        if (commit && previous !== state.$value.val()) {
            state.$value.trigger('change');
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
        var code = event.which;
        var step = state.monthOnly ? 4 : 7;
        var offset = 0;

        if (code === 13 || code === 32) {
            event.preventDefault();
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
            date = moveMonth(date, (code === 33 ? -1 : 1) * (state.monthOnly || event.shiftKey ? 12 : 1));
        } else return;

        event.preventDefault();
        if (state.monthOnly) date = moveMonth(date, offset);
        else date.setDate(date.getDate() + offset);
        var candidate = clamp(state, date);
        if (!state.monthOnly && !canSelect(state, candidate)) {
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

    function bind(state) {
        state.$layer.on('keydown', function (event) {
            if (event.which === 27) {
                event.preventDefault();
                event.stopPropagation();
                close(state, false);
                return;
            }
            if (event.which === 9) {
                var $stops = state.$dialog.find('button, select, [tabindex="0"]').filter(':visible:not(:disabled)');
                var index = $stops.index(document.activeElement);
                var next = index < 0 ? (event.shiftKey ? $stops.length - 1 : 0) :
                    (index + (event.shiftKey ? -1 : 1) + $stops.length) % $stops.length;
                event.preventDefault();
                $stops.eq(next).trigger('focus');
                return;
            }
            gridKey(state, event);
        }).on('click', '[data-dp-date]', function () {
            state.cursor = parse($(this).attr('data-dp-date'), state.monthOnly);
            select(state, $(this).attr('data-dp-date'));
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
                var amount = (action === 'prev' ? -1 : 1) * (state.monthOnly ? 12 : 1);
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
        state.draft = state.$value.val() ? state.$value.val().split(',') : [];
        state.cursor = clamp(state, parse(state.draft[0], state.monthOnly) || state.today);

        var id = 'w24dp-dialog';
        while (document.getElementById(id) || document.getElementById(id + '-heading')) id += '-1';
        state.$layer = $('<div class="w24dp-layer">').appendTo('body');
        state.$dialog = $('<div class="w24dp-dialog" role="dialog" aria-modal="true">')
            .attr({ id: id, lang: state.lang, 'aria-label': state.label }).appendTo(state.$layer);
        var $main = $('<div class="w24dp-main">').appendTo(state.$dialog);
        var $header = $('<div class="w24dp-header">').appendTo($main);
        var unit = state.monthOnly ? words.year : words.monthField;
        var prevLabel = state.lang === 'ko' ? words.prev + ' ' + (state.monthOnly ? '해' : '달') : words.prev + ' ' + unit.toLowerCase();
        var nextLabel = state.lang === 'ko' ? words.next + ' ' + (state.monthOnly ? '해' : '달') : words.next + ' ' + unit.toLowerCase();
        state.$prev = button('‹', 'prev', prevLabel).appendTo($header);
        state.$year = $('<select>').attr('aria-label', words.year).appendTo($header);
        state.$month = $('<select>').attr('aria-label', words.monthField);
        if (!state.monthOnly) state.$month.appendTo($header);
        state.$next = button('›', 'next', nextLabel).appendTo($header);
        state.$heading = $('<h2 class="w24dp-sr" aria-live="polite" aria-atomic="true">')
            .attr('id', id + '-heading').appendTo($main);

        for (var year = state.min.getFullYear(); year <= state.max.getFullYear(); year++) {
            $('<option>').val(year).text(year + (state.lang === 'ko' ? '년' : '')).appendTo(state.$year);
        }
        $.each(words.months, function (month, label) {
            $('<option>').val(month).text(label).appendTo(state.$month);
        });
        if (state.locked) state.$year.add(state.$month).prop('disabled', true);

        var $grid = $('<table role="grid" class="w24dp-grid">')
            .attr('aria-labelledby', id + '-heading').toggleClass('w24dp-month-grid', state.monthOnly).appendTo($main);
        if (state.multi) $grid.attr('aria-multiselectable', 'true');
        if (!state.monthOnly) {
            var $week = $('<tr>').appendTo($('<thead>').appendTo($grid));
            $.each(words.short, function (index, label) {
                $('<th scope="col">').attr('aria-label', words.days[index]).text(label).appendTo($week);
            });
        }
        state.$body = $('<tbody>').appendTo($grid);
        var $footer = $('<div class="w24dp-footer">').appendTo($main);
        state.$today = button(state.monthOnly ? words.thisMonth : words.today, 'today').appendTo($footer);
        $('<span>').text(format(state.today, state.monthOnly)).appendTo($footer);
        button(words.close, 'close').appendTo($footer);

        if (state.multi) {
            var $side = $('<div class="w24dp-side">').appendTo(state.$dialog);
            var $summary = $('<div class="w24dp-summary" aria-live="polite" aria-atomic="true">').text(words.count).appendTo($side);
            state.$count = $('<strong>').appendTo($summary);
            state.$list = $('<ul class="w24dp-list">').attr('aria-label', words.count).appendTo($side);
            var $actions = $('<div class="w24dp-footer">').appendTo($side);
            state.$reset = button(words.reset, 'reset').appendTo($actions);
            button(words.apply, 'apply').appendTo($actions);
        }

        active = state;
        bind(state);
        renderSelection(state);
        state.$trigger.attr({ 'aria-expanded': 'true', 'aria-controls': id });
        render(state, false);
        position(state);
        focusCalendar(state);
        state.$background = state.$layer.siblings().not('script, style, link').each(function () {
            var $item = $(this);
            $item.data('work24DatepickerBackground', { aria: $item.attr('aria-hidden'), inert: $item.is('[inert]') });
            $item.attr({ 'aria-hidden': 'true', inert: '' });
        });
        $(window).on('resize.work24Datepicker', function () { position(state); });
    }

    $(function () {
        $(trigger).each(function () { setup(this); });
        $(document).on('click.work24Datepicker', trigger, function () {
            if (!active) open(setup(this));
        }).on('focusin.work24Datepicker', function (event) {
            if (active && !$.contains(active.$dialog[0], event.target)) {
                focusCalendar(active);
            }
        });
    });
})(jQuery);
