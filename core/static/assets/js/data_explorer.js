
(function () {
    var selections = { indicators: [] };
    var currentMode = 'annual';
    var currentRequest = null;

    // Helper to get cookie value
    function getCookie(name) {
        const v = document.cookie.match("(^|;)\\s*" + name + "\\s*=\\s*([^;]+)");
        return v ? v.pop() : "";
    }

    // Chunked insertion helper to avoid blocking when appending many rows
    function insertRowsChunked(containerSelector, htmlString, chunkSize = 200, cb) {
        if (!htmlString) {
            $(containerSelector).html('');
            if (typeof cb === 'function') cb();
            return;
        }
        const parts = htmlString.split('</tr>').map(p => p.trim()).filter(Boolean).map(p => p + '</tr>');
        const $container = $(containerSelector);
        $container.html('');
        let i = 0;
        function appendChunk() {
            const end = Math.min(i + chunkSize, parts.length);
            if (i >= end) {
                if (typeof cb === 'function') cb();
                return;
            }
            const chunk = parts.slice(i, end).join('');
            $container.append(chunk);
            i = end;
            if (i < parts.length) setTimeout(appendChunk, 8);
            else if (typeof cb === 'function') cb();
        }
        appendChunk();
    }

    // Dropdown toggle
    function toggleMenu(btnId, menuId) {
        $(btnId).on('click', function (e) {
            e.stopPropagation();
            var $menu = $(menuId);
            $('.absolute.z-10').not($menu).addClass('hidden');
            $menu.toggleClass('hidden');
        });
    }

    toggleMenu('#dd-topic-btn', '#dd-topic');
    toggleMenu('#dd-category-btn', '#dd-category');
    toggleMenu('#dd-ind-btn', '#dd-ind');

    $(document).on('click', function () { $('.absolute.z-10').addClass('hidden'); });
    $('#dd-topic, #dd-category, #dd-ind').on('click', function (e) { e.stopPropagation(); });

    // Select All logic
    $('#topic-select-all').on('change', function () {
        $('#topic-list .topic-checkbox').prop('checked', this.checked).trigger('change');
    });
    $('#category-select-all').on('change', function () {
        $('#category-list .cat-checkbox').prop('checked', this.checked).trigger('change');
    });
    $('#ind-select-all').on('change', function () {
        $('#ind-list .ind-checkbox').prop('checked', this.checked);
    });

    function collectSelection() {
        selections.indicators = [];
        $('#ind-list .ind-checkbox:checked').each(function () {
            selections.indicators.push({
                id: $(this).data('id'),
                title: $(this).data('title')
            });
        });
    }

    // Frequency change 
    $('.data-mode').on('click', function () {
        $('.data-mode').removeClass('btn-primary').addClass('btn-outline-primary');
        $(this).removeClass('btn-outline-primary').addClass('btn-primary');
        currentMode = $(this).data('mode');
        renderTable();
    });

    $('#apply-selection').on('click', function () {
        collectSelection();
        renderTable();
    });

    $('#clear-all').on('click', function () {
        $('input[type=checkbox], input[type=radio]').prop('checked', false);
        selections.indicators = [];
        currentMode = 'annual';
        renderTable();
    });

    function fmt(v) {
        return (v === null || v === undefined || v === '') ? '-' : v;
    }

    function renderTable() {
        if (!selections.indicators.length) {
            $('#explorer-head').html('<tr><th>-</th></tr>');
            $('#explorer-body').html('<tr><td class="text-center py-3">No indicators selected.</td></tr>');
            return;
        }

        var ids = selections.indicators.map(i => i.id);


        if (currentRequest && currentRequest.abort) currentRequest.abort();
        const applyBtn = $('#apply-selection');
        const indicatorsReq = $.ajax({
            url: '/api/indicators-bulk/',
            method: 'POST',
            contentType: 'application/json; charset=utf-8',
            dataType: 'json',
            headers: { 'X-CSRFToken': getCookie('csrftoken') },
            data: JSON.stringify({ records: ids, record_type: currentMode }),
            beforeSend: function () {
                $('#explorer-head').html('<tr><th>Loading...</th></tr>');
                $('#explorer-body').html('<tr><td class="text-center py-3">Loading...</td></tr>');
                try { applyBtn.prop('disabled', true); } catch(e){}
            }
        })
            .done(function (resp) {
                var results = resp.results || [];
                var head = '<tr><th>Year (EC)</th><th>Year (GC)</th>';
                if (currentMode === 'quarterly') head = '<tr><th>Year (EC)</th><th>Year (GC)</th><th>Quarter</th>';
                if (currentMode === 'monthly') head = '<tr><th>Year (EC)</th><th>Year (GC)</th><th>Month</th>';
                if (currentMode === 'weekly') head = '<tr><th>Year (EC)</th><th>Year (GC)</th><th>Week</th>';
                if (currentMode === 'daily') head = '<tr><th>Year (EC)</th><th>Year (GC)</th><th>Gregorian Date</th><th>Ethiopian Date</th>';
                selections.indicators.forEach(i => head += `<th>${i.title}</th>`);
                head += '</tr>';

                var rowsHtml = '';

                if (currentMode === 'annual') {
                    var rowMap = {};
                    results.forEach(r => {
                        (r.all_annual || []).forEach(a => {
                            var key = `${a.year_ec}|${a.year_gc}`;
                            if (!rowMap[key]) rowMap[key] = { year_ec: a.year_ec, year_gc: a.year_gc, values: {} };
                            rowMap[key].values[r.title] = a.value;
                        });
                    });
                    Object.values(rowMap).forEach(r => {
                        rowsHtml += `<tr><td>${fmt(r.year_ec)}</td><td>${fmt(r.year_gc)}</td>`;
                        selections.indicators.forEach(i => rowsHtml += `<td>${fmt(r.values[i.title])}</td>`);
                        rowsHtml += '</tr>';
                    });
                }
                else if (currentMode === 'quarterly') {
                    var rowMap = {};
                    results.forEach(r => {
                        (r.quarterly || []).forEach(q => {
                            var key = `${q.year_ec}|${q.year_gc}|${q.quarter_number}`;
                            if (!rowMap[key]) rowMap[key] = { year_ec: q.year_ec, year_gc: q.year_gc, quarter: q.quarter || 'Q' + q.quarter_number, values: {} };
                            rowMap[key].values[r.title] = q.value;
                        });
                    });
                    Object.values(rowMap).forEach(r => {
                        rowsHtml += `<tr><td>${fmt(r.year_ec)}</td><td>${fmt(r.year_gc)}</td><td>${fmt(r.quarter)}</td>`;
                        selections.indicators.forEach(i => rowsHtml += `<td>${fmt(r.values[i.title])}</td>`);
                        rowsHtml += '</tr>';
                    });
                }
                else if (currentMode === 'monthly') {
                    var rowMap = {};
                    results.forEach(r => {
                        (r.monthly || []).forEach(m => {
                            var key = `${m.year_ec}|${m.year_gc}|${m.month_number}`;
                            if (!rowMap[key]) rowMap[key] = { year_ec: m.year_ec, year_gc: m.year_gc, month: m.month_amh + ' (' + m.month + ')', values: {} };
                            rowMap[key].values[r.title] = m.value;
                        });
                    });
                    Object.values(rowMap).forEach(r => {
                        rowsHtml += `<tr><td>${fmt(r.year_ec)}</td><td>${fmt(r.year_gc)}</td><td>${fmt(r.month)}</td>`;
                        selections.indicators.forEach(i => rowsHtml += `<td>${fmt(r.values[i.title])}</td>`);
                        rowsHtml += '</tr>';
                    });
                }
                else if (currentMode === 'weekly') {
                    var rowMap = {};
                    results.forEach(r => {
                        (r.weekly || []).forEach(w => {
                            var key = `${w.year_ec || ''}|${w.year_gc || ''}|${w.date}`;
                            if (!rowMap[key]) rowMap[key] = { year_ec: w.year_ec, year_gc: w.year_gc, week: w.week_label || ('Week' + (w.week || '')), values: {} };
                            rowMap[key].values[r.title] = w.value;
                        });
                    });
                    Object.values(rowMap).forEach(r => {
                        rowsHtml += `<tr><td>${fmt(r.year_ec)}</td><td>${fmt(r.year_gc)}</td><td>${fmt(r.week)}</td>`;
                        selections.indicators.forEach(i => rowsHtml += `<td>${fmt(r.values[i.title])}</td>`);
                        rowsHtml += '</tr>';
                    });
                }
                else if (currentMode === 'daily') {
                    var rowMap = {};
                    results.forEach(r => {
                        (r.daily || []).forEach(d => {
                            var key = `${d.year_ec || ''}|${d.year_gc || ''}|${d.date}`;
                            if (!rowMap[key]) rowMap[key] = { year_ec: d.year_ec, year_gc: d.year_gc, greg: d.greg_date_formatted || d.date, ethio: d.ethio_date || '', values: {} };
                            rowMap[key].values[r.title] = d.value;
                        });
                    });
                    Object.values(rowMap).forEach(r => {
                        rowsHtml += `<tr><td>${fmt(r.year_ec)}</td><td>${fmt(r.year_gc)}</td><td>${fmt(r.greg)}</td><td>${fmt(r.ethio)}</td>`;
                        selections.indicators.forEach(i => rowsHtml += `<td>${fmt(r.values[i.title])}</td>`);
                        rowsHtml += '</tr>';
                    });
                }

                $('#explorer-head').html(head);
                insertRowsChunked('#explorer-body', rowsHtml || '<tr><td colspan="' + (2 + selections.indicators.length + (currentMode === "daily" ? 2 : currentMode === "weekly" ? 1 : currentMode === "monthly" ? 1 : currentMode === "quarterly" ? 1 : 0)) + '">No data available.</td></tr>');
            })
            .fail(function () {
                $('#explorer-head').html('');
                $('#explorer-body').html('<tr><td class="text-center py-3 text-danger">Failed to load data.</td></tr>');
            })
            .always(function () {
                try { applyBtn.prop('disabled', false); } catch(e){}
                currentRequest = null;
            });
        currentRequest = indicatorsReq;
    }

    renderTable();
})();
