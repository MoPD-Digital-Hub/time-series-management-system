// -------------------- CSRF Setup --------------------
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === name + "=") {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}
const csrftoken = getCookie("csrftoken");

$.ajaxSetup({
  beforeSend: function (xhr, settings) {
    if (!this.crossDomain) {
      xhr.setRequestHeader("X-CSRFToken", csrftoken);
    }
  },
});

// -------------------- Document Ready --------------------
$(document).ready(function () {
  console.log("Importer dashboard ready");

  loadCategories();
  loadIndicators();
  loadMySubmissions();

  // Sample link updates
  $("#data-kind").on("change", function () {
    const kind = $(this).val();
    const multiple = $('input[name="entry-mode"]:checked').val() === "multiple";
    const url = SAMPLE_TEMPLATE_URL + "?type=" + encodeURIComponent(kind) + (multiple ? "&multiple=1" : "");
    $("#download-sample-link").attr("href", url);
  });

  $('input[name="entry-mode"]').on("change", function () {
    const mode = $('input[name="entry-mode"]:checked').val();
    const kind = $("#data-kind").val();
    const multiple = mode === "multiple";

    // Toggle indicator select required/visibility
    if (multiple) {
      $("#data-indicator").closest(".mb-3").hide();
      $("#data-indicator").prop("required", false).val("");
    } else {
      $("#data-indicator").closest(".mb-3").show();
      $("#data-indicator").prop("required", true);
    }

    const url = SAMPLE_TEMPLATE_URL + "?type=" + encodeURIComponent(kind) + (multiple ? "&multiple=1" : "");
    $("#download-sample-link").attr("href", url);
  }).trigger("change");
});

// -------------------- Load Functions --------------------
function loadCategories() {
  $.get(UNASSIGNED_CATEGORIES_API_URL)
    .done(function (data) {
      const select = $("#indicator-category");
      select.empty().append('<option value="">Select Category</option>');
      data.forEach(function (category) {
        select.append(`<option value="${category.id}">${category.name_ENG}</option>`);
      });
    })
    .fail(function () {
      console.error("Failed to load categories");
    });
}

function loadIndicators() {
  $.get(INDICATOR_SUBMISSIONS_API_URL)
    .done(function (data) {
      const select = $("#data-indicator");
      select.empty();

      const verified = Array.isArray(data) ? data.filter((i) => i.is_verified) : [];
      if (verified.length === 0) {
        select.append(`<option value="">No verified indicators available</option>`);
        $("#data-form button[type=submit]").prop("disabled", true);
      } else {
        verified.forEach(function (indicator) {
          select.append(`<option value="${indicator.id}">${indicator.title_eng} (${indicator.title_amh || "No Category"})</option>`);
        });
        $("#data-form button[type=submit]").prop("disabled", false);
      }
    })
    .fail(function () {
      console.error("Failed to load indicators");
    });
}

function loadMySubmissions() {
  // Indicator submissions
  $.get(DASHBOARD_STATS_URL + "?page_size=10")
    .done(function (data) {
      renderMyIndicatorSubmissions(data.results);
    })
    .fail(function () {
      $("#my-indicator-submissions").html('<p class="text-center text-danger py-4">Failed to load submissions</p>');
    });

  // Data submissions
  $.get(DATA_SUBMISSIONS_API_URL + "?page_size=10")
    .done(function (data) {
      renderMyDataSubmissions(data.results);
    })
    .fail(function () {
      $("#my-data-submissions").html('<p class="text-center text-danger py-4">Failed to load submissions</p>');
    });
}

// -------------------- Render Functions --------------------
function renderMyIndicatorSubmissions(submissions) {
  const container = $("#my-indicator-submissions");
  if (!submissions.length) {
    container.html('<p class="text-center text-muted py-4">No indicator submissions found</p>');
    return;
  }

  let html = '<div class="table-responsive"><table class="table table-hover"><thead><tr><th>Indicator</th><th>Status</th><th>Submitted</th><th>Verified By</th></tr></thead><tbody>';

  submissions.forEach(function (submission) {
    const statusClass = getStatusClass(submission.status);
    const date = new Date(submission.submitted_at).toLocaleDateString();
    const verifiedBy = submission.verified_by_details ? submission.verified_by_details.email : "-";

    html += `<tr>
      <td>${submission.indicator_details.title_eng}</td>
      <td><span class="badge ${statusClass}">${submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}</span></td>
      <td>${date}</td>
      <td>${verifiedBy}</td>
    </tr>`;
  });

  html += "</tbody></table></div>";
  container.html(html);
}

function renderMyDataSubmissions(submissions) {
  const container = $("#my-data-submissions");
  if (!submissions.length) {
    container.html('<p class="text-center text-muted py-4">No data submissions found</p>');
    return;
  }

  let html = '<div class="table-responsive"><table class="table table-hover"><thead><tr><th>Indicator</th><th>File</th><th>Status</th><th>Submitted</th><th>Verified By</th></tr></thead><tbody>';

  submissions.forEach(function (submission) {
    const statusClass = getStatusClass(submission.status);
    const date = new Date(submission.submitted_at).toLocaleDateString();
    const verifiedBy = submission.verified_by_details ? submission.verified_by_details.email : "-";
    const fileLink = submission.data_file_url ? `<a href="${submission.data_file_url}" target="_blank">Download</a>` : "No file";

    html += `<tr>
      <td>${submission.indicator_details.title_eng}</td>
      <td>${fileLink}</td>
      <td><span class="badge ${statusClass}">${submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}</span></td>
      <td>${date}</td>
      <td>${verifiedBy}</td>
    </tr>`;
  });

  html += "</tbody></table></div>";
  container.html(html);
}

// -------------------- Utilities --------------------
function getStatusClass(status) {
  switch (status) {
    case "pending": return "bg-warning";
    case "approved": return "bg-success";
    case "declined": return "bg-danger";
    default: return "bg-secondary";
  }
}

function showAlert(message, type = "success") {
  const alertHtml = `<div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  </div>`;
  $("#alert-container").html(alertHtml);

  setTimeout(function () { $(".alert").fadeOut(); }, 5000);
}

// -------------------- Form Submissions --------------------
// Indicator
$("#indicator-form").on("submit", function (e) {
  e.preventDefault();

  const formData = {
    title_eng: $("#indicator-title-eng").val(),
    title_amh: $("#indicator-title-amh").val(),
    category_id: $("#indicator-category").val(),
  };

  $.ajax({
    url: SUBMIT_INDICATOR_URL,
    type: "POST",
    data: formData,
    success: function () {
      showAlert("Indicator submitted successfully! It will be reviewed by category managers.");
      $("#indicator-form")[0].reset();
      loadMySubmissions();
    },
    error: function (xhr) {
      const error = xhr.responseJSON?.error || "Failed to submit indicator";
      showAlert(error, "danger");
    },
  });
});

// Data
$("#data-form").on("submit", function (e) {
  e.preventDefault();

  const mode = $('input[name="entry-mode"]:checked').val();
  const isMultiple = mode === "multiple";
  const indicatorId = $("#data-indicator").val();
  if (!isMultiple && !indicatorId) {
    showAlert("Please select an indicator before submitting.", "danger");
    return;
  }

  const fileInput = $("#data-file")[0];
  const file = fileInput?.files?.[0] || null;

  function doUpload() {
    const formData = new FormData();
    if (!isMultiple) formData.append("indicator_id", indicatorId);
    formData.append("notes", $("#data-notes").val());
    if (file) formData.append("data_file", file);

    $.ajax({
      url: isMultiple ? SUBMIT_BULK_DATA_URL : SUBMIT_DATA_URL,
      type: "POST",
      data: formData,
      processData: false,
      contentType: false,
      success: function (response) {
        if (isMultiple) {
          const created = response.created || 0;
          const updated = response.updated || 0;
          const skipped = response.skipped || 0;
          showAlert(`Bulk import complete. Created: ${created}, Updated: ${updated}, Skipped: ${skipped}`);
        } else {
          showAlert("Data submitted successfully! It will be reviewed by category managers.");
        }
        $("#data-form")[0].reset();
        loadMySubmissions();
        $('input[name="entry-mode"]').trigger("change");
      },
      error: function (xhr) {
        const error = xhr.responseJSON?.error || xhr.responseText || "Failed to submit data";
        showAlert(error, "danger");
      },
    });
  }

  if (file && file.name.toLowerCase().endsWith(".csv")) {
    const reader = new FileReader();
    reader.onload = function (evt) {
      const text = evt.target.result || "";
      const lines = text.split(/\r\n|\n/);
      const headerLine = lines.find(line => line?.trim());
      if (!headerLine) return showAlert("CSV appears empty or malformed (no header found).", "danger");

      const delimiter = headerLine.includes(",") ? "," : headerLine.includes(";") ? ";" : ",";
      const cols = headerLine.split(delimiter).map(c => c.trim().toLowerCase());
      const hasYear = cols.includes("year_ec") || cols.includes("year_gc");
      const hasPerf = cols.includes("performance") || cols.includes("value") || cols.includes("amount");
      const hasIndicator = cols.includes("indicator");
      if (!hasYear || !hasPerf || (isMultiple && !hasIndicator)) {
        return showAlert("CSV missing required columns. Required: year_EC/year_GC, performance/value/amount, and indicator for multiple mode.", "danger");
      }
      doUpload();
    };
    reader.onerror = () => showAlert("Failed to read CSV file for validation.", "danger");
    reader.readAsText(file.slice(0, 64 * 1024), "utf-8");
  } else {
    doUpload();
  }
});
