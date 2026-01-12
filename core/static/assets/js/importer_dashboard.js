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
  loadMySubmissions();

  // Mode switching
  $('input[name="entry-mode"]').on("change", function () {
    const mode = $('input[name="entry-mode"]:checked').val();
    const isMultiple = mode === "multiple";

    if (isMultiple) {
      $("#indicator-select-container").show(); // Show it in multiple mode too
      $("#data-indicator").prop("multiple", true);
      if ($(".multi-select-hint").length === 0) {
        $("#data-indicator").after('<div class="form-text mt-1 multi-select-hint">Hold Ctrl (Cmd on Mac) to select multiple indicators.</div>');
      }
      $("#multiple-download-container").show();
      $("#single-download-container").hide();
    } else {
      $("#indicator-select-container").show();
      $("#data-indicator").prop("multiple", false);
      $(".multi-select-hint").remove();
      $("#multiple-download-container").hide();
      $("#single-download-container").show();
    }

    // Clear form fields when mode changes
    $("#data-category").val("").trigger("change");
    $("#data-indicator").empty().append('<option value="">Select a category first</option>');
    $("#data-file").val(""); // Clear file input

    updateDownloadLink();
  }).trigger("change");

  // Type or Mode change triggers link update
  $("#data-kind").on("change", updateDownloadLink);

  // Category change triggers indicator loading and link update
  $("#data-category").on("change", function () {
    const categoryId = $(this).val();
    if (categoryId) {
      loadIndicators(categoryId);
    } else {
      $("#data-indicator").empty().append('<option value="">Select a category first</option>');
    }
    updateDownloadLink();
  });

  // Indicator change triggers link update
  $("#data-indicator").on("change", updateDownloadLink);

  function updateDownloadLink() {
    const kind = $("#data-kind").val();
    const mode = $('input[name="entry-mode"]:checked').val();
    const isMultiple = mode === "multiple";
    const categoryId = $("#data-category").val();
    const indicators = $("#data-indicator").val(); // Array if multiple

    const linkMultiple = $("#download-sample-link-multiple");
    const linkSingle = $("#download-sample-link-single");

    if (isMultiple) {
      if (!categoryId) {
        linkMultiple.addClass("disabled").attr("href", "#").attr("title", "Please select a category first");
      } else {
        linkMultiple.removeClass("disabled").removeAttr("title");
        let url = SAMPLE_TEMPLATE_URL + "?type=" + encodeURIComponent(kind) + "&multiple=1&category_id=" + encodeURIComponent(categoryId);
        if (indicators && Array.isArray(indicators)) {
          indicators.forEach(id => {
            url += "&indicator_ids[]=" + encodeURIComponent(id);
          });
        }
        linkMultiple.attr("href", url);
      }
    } else {
      const indicatorId = Array.isArray(indicators) ? indicators[0] : indicators;
      if (!indicatorId) {
        linkSingle.addClass("disabled").attr("href", "#").attr("title", "Please select an indicator first");
      } else {
        linkSingle.removeClass("disabled").removeAttr("title");
        const url = SAMPLE_TEMPLATE_URL + "?type=" + encodeURIComponent(kind) + "&indicator_id=" + encodeURIComponent(indicatorId);
        linkSingle.attr("href", url);
      }
    }
  }
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

function loadIndicators(categoryId = null) {
  const url = categoryId ? INDICATOR_SUBMISSIONS_API_URL + "?category_id=" + categoryId : INDICATOR_SUBMISSIONS_API_URL;
  $.get(url)
    .done(function (data) {
      const select = $("#data-indicator");
      select.empty();

      if (!categoryId) {
        select.append('<option value="">Select a category first</option>');
        return;
      }

      const verified = Array.isArray(data) ? data.filter((i) => i.is_verified) : [];
      if (verified.length === 0) {
        select.append(`<option value="">No verified indicators in this category</option>`);
        $("#data-form button[type=submit]").prop("disabled", true);
      } else {
        const isMultiple = $('input[name="entry-mode"]:checked').val() === "multiple";
        if (!isMultiple) {
          select.append('<option value="">Select an indicator...</option>');
        }
        verified.forEach(function (indicator) {
          select.append(`<option value="${indicator.id}">${indicator.title_eng} (${indicator.code || "No Code"})</option>`);
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

    let indicatorTitle = submission.indicator_details.title_eng;
    if (submission.indicator === null && submission.data_file) {
      const filename = submission.data_file.split('/').pop();
      indicatorTitle = `Bulk: ${filename}`;
    }

    html += `<tr>
      <td>${indicatorTitle}</td>
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
// Data
$("#data-form").on("submit", function (e) {
  e.preventDefault();

  const mode = $('input[name="entry-mode"]:checked').val();
  const isMultiple = mode === "multiple";
  const indicatorId = $("#data-indicator").val(); // Might be array if multiple
  if (!isMultiple && !indicatorId) {
    showAlert("Please select an indicator before submitting.", "danger");
    return;
  }

  const fileInput = $("#data-file")[0];
  const file = fileInput?.files?.[0] || null;

  if (!file) {
    showAlert("Please select a data file to upload.", "danger");
    return;
  }

  // Show Preview First
  const formData = new FormData();
  formData.append("data_file", file);
  if (!isMultiple) formData.append("indicator_id", Array.isArray(indicatorId) ? indicatorId[0] : indicatorId);

  $.ajax({
    url: PREVIEW_DATA_URL,
    type: "POST",
    data: formData,
    processData: false,
    contentType: false,
    success: function (response) {
      showPreviewModal(response, isMultiple);
    },
    error: function (xhr) {
      const error = xhr.responseJSON?.error || "Failed to generate preview";
      showAlert(error, "danger");
    }
  });

  function showPreviewModal(data, isMultiple) {
    try {
      const modalEl = document.getElementById('previewModal');
      if (!modalEl) return;

      $("#preview-row-count").text(`${data.row_count || 0} rows found`);
      $("#preview-mode-text").text(isMultiple ? "Multiple Entry Mode" : "Single Entry Mode");

      const thead = $("#preview-thead");
      const tbody = $("#preview-tbody");
      thead.empty();
      tbody.empty();

      if (data.preview) {
        if (Array.isArray(data.preview.headers)) {
          data.preview.headers.forEach(h => thead.append(`<th>${h}</th>`));
        }
        if (Array.isArray(data.preview.rows)) {
          data.preview.rows.forEach(row => {
            let tr = "<tr>";
            row.forEach(cell => tr += `<td>${cell || ''}</td>`);
            tr += "</tr>";
            tbody.append(tr);
          });
        }
      }

      $("#preview-warnings").empty();
      if (Array.isArray(data.warnings)) {
        data.warnings.forEach(w => $("#preview-warnings").append(`<p class="text-amber-600 text-xs flex items-center gap-2"><i class="fas fa-exclamation-triangle"></i> ${w}</p>`));
      }

      // One-time click handler for confirmation
      $("#confirm-submit-btn").off("click").on("click", function () {
        modalEl.classList.add('hidden');
        doUpload();
      });

      // Show the custom modal
      modalEl.classList.remove('hidden');

    } catch (err) {
      console.error("Preview Modal Error:", err);
      showAlert("Preview error: " + err.message, "warning");
    }
  }

  function doUpload() {
    const formData = new FormData();
    if (!isMultiple) {
      formData.append("indicator_id", Array.isArray(indicatorId) ? indicatorId[0] : indicatorId);
    } else if (Array.isArray(indicatorId) && indicatorId.length > 0) {
      indicatorId.forEach(id => formData.append("indicator_ids[]", id));
    }

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
          const count = response.indicators_processed || 0;
          const rows = response.rows_validated || 0;
          showAlert(`Bulk submission successful! ${count} pending submissions created for manager approval (${rows} rows validated).`, "success");
        } else {
          showAlert("Data submitted successfully! It will be reviewed by category managers.", "success");
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
});
