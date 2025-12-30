

document.addEventListener("DOMContentLoaded", function () {

    // ------------------------------
    // ------------------------------
    // Grab the form
    // ------------------------------
    const form = document.getElementById('add-indicator-form');
    if (!form) return;  // Exit if form doesn't exist

    // ------------------------------
    // Form submit event
    // ------------------------------
    form.addEventListener('submit', function(e) {
        e.preventDefault();

        // Grab values from form
        const title_eng = document.getElementById('title_eng')?.value.trim() || '';
        const title_amh = document.getElementById('title_amh')?.value.trim() || '';
        const code = document.getElementById('code')?.value.trim() || '';
        const description = document.getElementById('description')?.value.trim() || '';
        const measurement_units = document.getElementById('measurement_units')?.value.trim() || '';
        const frequency = document.getElementById('frequency')?.value || '';
        const source = document.getElementById('source')?.value.trim() || '';
        const methodology = document.getElementById('methodology')?.value.trim() || '';
        const assignedCategoryId = document.getElementById('assigned_category_id')?.value || '';

        const alertEl = document.getElementById('add-indicator-alert');
        alertEl.innerHTML = '';

        // ------------------------------
        // Validation
        // ------------------------------
        if (!title_eng) {
            alertEl.innerHTML = '<div class="text-red-600">Title (English) is required.</div>';
            return;
        }
        if (!assignedCategoryId) {
            alertEl.innerHTML = '<div class="text-red-600">You must be assigned a category before submitting indicators.</div>';
            return;
        }

        // ------------------------------
        // Prepare payload
        // ------------------------------
        const payload = {
            title_eng,
            title_amh,
            code,
            description,
            measurement_units,
            frequency,
            source,
            methodology,
            category_ids: [assignedCategoryId]
        };

        // ------------------------------
        // Send AJAX request
        // ------------------------------
        fetch(submitIndicatorUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify(payload)
        })
        .then(async resp => {
            let data;
            try { 
                data = await resp.json(); 
            } catch {
                data = { error: 'Invalid response from server' };
            }

            if (!resp.ok || data.error) {
                alertEl.innerHTML = `<div class="text-red-600">${data.error || 'Error'}</div>`;
                return;
            }

            alertEl.innerHTML = '<div class="text-green-600">Indicator submitted successfully.</div>';
            setTimeout(() => {
                window.location.href = submissionsListUrl + '?type=indicator';
            }, 1000);
        })
        .catch(err => {
            alertEl.innerHTML = `<div class="text-red-600">${err.message || 'Request failed'}</div>`;
        });

    });

});
