
// Lightweight CSRF helper
function _getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

async function _postSubmissionAction(submissionId, action) {
    if (!submissionId) return;
    const confirmMsg = action === 'approve' ? 'Are you sure you want to approve this submission?' : 'Are you sure you want to decline this submission?';
    if (!confirm(confirmMsg)) return;

    const url = action === 'approve' ? '/user-management/api/approve-submission/' : '/user-management/api/decline-submission/';
    try {
        const resp = await fetch(url, {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': _getCookie('csrftoken')
            },
            body: JSON.stringify({ type: 'indicator', id: submissionId })
        });
        if (!resp.ok) {
            const err = await resp.json().catch(() => ({}));
            alert(err.error || 'Request failed');
            return;
        }
        const data = await resp.json();

        // update row in-place
        const tr = document.querySelector(`tr[data-submission-id="${submissionId}"]`);
        if (!tr) return;

        const statusCell = tr.children[5]; // Indicator(0), Freq(1), Units(2), Metadata(3), SubmittedBy(4), Status(5)

        const status = (data.status || '').toString().toLowerCase();
        const statusBadgeClass = status === 'pending' ? 'bg-warning' : (status === 'approved' ? 'bg-success' : (status === 'declined' ? 'bg-danger' : 'bg-secondary-100 text-secondary-700'));
        const statusIcon = status === 'pending' ? 'fa-clock' : (status === 'approved' ? 'fa-check' : (status === 'declined' ? 'fa-times' : 'fa-info-circle'));
        const statusLabel = status ? (status.charAt(0).toUpperCase() + status.slice(1)) : 'Unknown';
        statusCell.innerHTML = `<span class="badge ${statusBadgeClass}"><i class="fas ${statusIcon} mr-1"></i>${escapeHtml(statusLabel)}</span>`;

        const actionsCell = tr.children[7]; // Actions(7)
        if (actionsCell) {
            actionsCell.querySelectorAll('button').forEach(b => b.remove());
        }

    } catch (err) {
        console.error(err);
        alert('Action failed');
    }
}

function approveSubmission(submissionId) {
    _postSubmissionAction(submissionId, 'approve');
}

function declineSubmission(submissionId) {
    _postSubmissionAction(submissionId, 'decline');
}

async function fetchSubmissionsIfAvailable() {
    const submissionUrl = '/user-management/api/indicator-submissions/';
    try {
        const resp = await fetch(submissionUrl + window.location.search, { credentials: 'same-origin' });
        if (!resp.ok) return; // no submissions API available, do nothing
        const payload = await resp.json();
        const items = Array.isArray(payload.results) ? payload.results : [];
        if (items.length === 0) return;

        const tbody = document.getElementById('submissions-tbody');
        if (!tbody) return;
        tbody.innerHTML = '';

        items.forEach(item => {
            const id = item.id || '';
            const indicator = item.indicator_details || {};
            const title_eng = (indicator.title_eng || 'Untitled').toString();
            const title_amh = indicator.title_amh || '';
            const code = indicator.code || '';
            const frequency = indicator.frequency || '-';
            const units = indicator.measurement_units || '-';
            const description = indicator.description || 'No description';
            const source = indicator.source || '-';

            const submitted_by = item.submitted_by_details || {};
            const submitted_by_name = submitted_by.full_name || '-';
            const submitted_by_email = submitted_by.email || '';
            const status = (item.status || '').toString().toLowerCase();
            const submitted_at = item.submitted_at || null;
            const submittedAtText = submitted_at ? new Date(submitted_at).toLocaleString() : '-';

            const statusBadgeClass = status === 'pending' ? 'bg-warning' : (status === 'approved' ? 'bg-success' : (status === 'declined' ? 'bg-danger' : 'bg-secondary-100 text-secondary-700'));
            const statusIcon = status === 'pending' ? 'fa-clock' : (status === 'approved' ? 'fa-check' : (status === 'declined' ? 'fa-times' : 'fa-info-circle'));
            const statusLabel = status ? (status.charAt(0).toUpperCase() + status.slice(1)) : 'Unknown';

            const tr = document.createElement('tr');
            if (id) tr.setAttribute('data-submission-id', id);

            tr.innerHTML = `
                            <td>
                                <div>
                                    <div class="font-semibold">${escapeHtml(title_eng)}</div>
                                    ${title_amh ? `<div class="text-sm text-gray-500">${escapeHtml(title_amh)}</div>` : ''}
                                    ${code ? `<div class="text-xs font-mono bg-gray-100 inline-block px-1 rounded mt-1">${escapeHtml(code)}</div>` : ''}
                                </div>
                            </td>
                            <td>${escapeHtml(frequency)}</td>
                            <td>${escapeHtml(units)}</td>
                            <td>
                                <div class="max-w-xs">
                                    <div class="text-xs text-gray-500 font-bold uppercase">Description</div>
                                    <div class="text-xs line-clamp-2 mb-1" title="${escapeHtml(description)}">${escapeHtml(description)}</div>
                                    <div class="text-xs text-gray-500 font-bold uppercase">Source</div>
                                    <div class="text-xs truncate" title="${escapeHtml(source)}">${escapeHtml(source)}</div>
                                </div>
                            </td>
                            <td>
                                <div>
                                    <div class="font-medium">${escapeHtml(submitted_by_name)}</div>
                                    <div class="text-sm text-gray-500">${escapeHtml(submitted_by_email)}</div>
                                </div>
                            </td>
                            <td>
                                <span class="badge ${statusBadgeClass}">
                                    <i class="fas ${statusIcon} mr-1"></i>
                                    ${escapeHtml(statusLabel)}
                                </span>
                            </td>
                            <td>${escapeHtml(submittedAtText)}</td>
                            <td>
                                <div class="flex gap-2">
                                    ${status === 'pending' ? `
                                        <button class="btn btn-sm btn-success" onclick="approveSubmission(${id})">
                                            <i class="fas fa-check"></i>
                                        </button>
                                        <button class="btn btn-sm btn-danger" onclick="declineSubmission(${id})">
                                            <i class="fas fa-times"></i>
                                        </button>
                                    ` : ''}
                                </div>
                            </td>
                        `;
            tbody.appendChild(tr);
        });

    } catch (err) {
        console.debug('Submissions fetch failed or not present:', err);
    }
}

// helper to avoid XSS when inserting plain strings into innerHTML
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// mark filter tab active based on URL param "status"
function highlightActiveFilterTab() {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status') || '';
    document.querySelectorAll('[data-status]').forEach(a => {
        const s = a.getAttribute('data-status') || '';
        // reset styles (keep original classes but enforce inactive look)
        a.classList.remove('bg-primary-500', 'text-white', 'bg-yellow-500', 'bg-green-500', 'bg-red-500', 'text-gray-700', 'bg-gray-100', 'hover:bg-gray-200');
        if (s === status) {
            // apply appropriate active color
            if (s === 'pending') a.classList.add('bg-yellow-500', 'text-white');
            else if (s === 'approved') a.classList.add('bg-green-500', 'text-white');
            else if (s === 'declined') a.classList.add('bg-red-500', 'text-white');
            else a.classList.add('bg-primary-500', 'text-white');
        } else {
            a.classList.add('bg-gray-100', 'text-gray-700', 'hover:bg-gray-200');
        }
    });
}

document.addEventListener('DOMContentLoaded', function () {
    highlightActiveFilterTab();
    // attempt to sync with submissions API when available
    fetchSubmissionsIfAvailable();
});

