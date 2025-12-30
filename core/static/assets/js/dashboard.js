$(function () {
    
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            document.cookie.split(';').forEach(cookie => {
                cookie = cookie.trim();
                if (cookie.startsWith(name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                }
            });
        }
        return cookieValue;
    }
    const csrftoken = getCookie('csrftoken');

    $.ajaxSetup({
        beforeSend: function (xhr, settings) {
            if (!this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });

    loadDashboardStats();
    loadRecentSubmissions();

    function loadDashboardStats() {
        $.get(DASHBOARD_STATS_URL, function (data) {
            $('#total-users-count').text(data.total_users);
            $('#active-users-count').text(data.active_users);
            $('#category-managers-count').text(data.category_managers);
            $('#importers-count').text(data.importers);
            $('#pending-indicator-submissions-count').text(data.pending_indicator_submissions);
            $('#pending-data-submissions-count').text(data.pending_data_submissions);
        });
    }

    function loadRecentSubmissions() {
        $.get(`${RECENT_SUBMISSIONS_URL}?limit=5`, function (data) {
            renderRecentIndicatorSubmissions(data.indicator_submissions);
            renderRecentDataSubmissions(data.data_submissions);
        });
    }

    // ------------------------
    // Recent Indicator Submissions
    // ------------------------
    function renderRecentIndicatorSubmissions(submissions) {
        const $container = $('#recent-indicator-submissions');
        if (!submissions.length) {
            $container.html('<p class="text-gray-500 text-center py-4">No recent indicator submissions</p>');
            return;
        }

        let html = '<div class="space-y-3">';
        $.each(submissions, function (_, submission) {
            const statusClass = getStatusClass(submission.status);
            const date = new Date(submission.submitted_at).toLocaleString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });

            html += `
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-gray-900 truncate">
                            ${submission.indicator_details.title_eng}
                        </p>
                        <p class="text-xs text-gray-500">
                            by ${submission.submitted_by_details.email} • ${date}
                        </p>
                    </div>
                    <span class="px-2 py-1 text-xs font-semibold rounded-full ${statusClass}">
                        ${submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                    </span>
                </div>
            `;
        });
        html += '</div>';
        $container.html(html);
    }

    // ------------------------
    // Recent Data Submissions
    // ------------------------
    function renderRecentDataSubmissions(submissions) {
        const $container = $('#recent-data-submissions');
        if (!submissions.length) {
            $container.html('<p class="text-gray-500 text-center py-4">No recent data submissions</p>');
            return;
        }

        let html = '<div class="space-y-3">';
        $.each(submissions, function (_, submission) {
            const statusClass = getStatusClass(submission.status);
            const date = new Date(submission.submitted_at).toLocaleString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });

            html += `
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-gray-900 truncate">
                            ${submission.indicator_details.title_eng}
                        </p>
                        <p class="text-xs text-gray-500">
                            by ${submission.submitted_by_details.email} • ${date}
                        </p>
                    </div>
                    <span class="px-2 py-1 text-xs font-semibold rounded-full ${statusClass}">
                        ${submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                    </span>
                </div>
            `;
        });
        html += '</div>';
        $container.html(html);
    }

    // ------------------------
    // Status Checker
    // ------------------------
    function getStatusClass(status) {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'approved': return 'bg-green-100 text-green-800';
            case 'declined': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }

});
