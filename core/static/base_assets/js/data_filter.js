let catargoryCount = 0;
let catargorySelected = 0;
let databaseCount = 0;
let databaseSelected = 0;
let indicatorcount = 0;
let indicatorSelected = 0;
let yearSelected = 0;
let isdatatable = 0;
let yearcount = 0;
let theSelectedCatagory;
let yearTableList = [];
let tmpData;
let reset;
let isDataFetching = true;
let reversYear = false;

let showLoading = (htmlID) => {
  let lodingHtml = `
  <div class="d-flex align-items-center">
  <strong>Loading...</strong>
  <div class="spinner-border ms-auto" role="status" aria-hidden="true"></div>
</div>
`;
  document.getElementById(`${htmlID}`).innerHTML = lodingHtml;
};
// Function to toggle loading state for the Apply button
function toggleLoadingState(isLoading) {
  let loadingButton = $("#applyButton");
  loadingButton.prop("disabled", isLoading);

  if (isLoading) {
    loadingButton.html(
      `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...`
    );
  } else {
    loadingButton.html(`Apply`);
  }
}

let values = (catId) => {
  return fetch(`/user-json-indicator-value/${catId}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      return data;
    })
    .catch((err) => {
      console.log("Fetch error:", err);
      throw err; // Re-throw the error to propagate it in the promise chain
    });
};

let categories = (topicID) => {
  console.log(topicID);
  return fetch(`/user-list-view-category/${topicID}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      return data;
    })
    .catch((err) => {
      console.log("Fetch error:", err);
      throw err; // Re-throw the error to propagate it in the promise chain
    });
};

let indicators = (catID) => {
  console.log(catID);
  return fetch(`/user-list-view-indicator/${catID}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      return data;
    })
    .catch((err) => {
      console.log("Fetch error:", err);
      throw err; // Re-throw the error to propagate it in the promise chain
    });
};

function resetFilters() {
  // Reset the checkboxes
  $('input[name="yearListsCheckBox"]').prop("checked", false);

  // Reset the slider values
  document.getElementById("value1").innerText = 0;
  document.getElementById("value2").innerText = 1;

  // Reset the slider range
  var slider = document.getElementById("slider-distance");
  if (slider) {
    // Set the initial values of the slider
    slider.value = 0;

    // Trigger the 'input' event to update the slider and its associated elements
    var inputEvent = new Event("input", {
      bubbles: true,
      cancelable: true,
    });
    slider.dispatchEvent(inputEvent);

    // Reset the CSS styles of the slider manually
    var rangeElement = slider.querySelector(".range");
    var thumbElements = slider.querySelectorAll(".thumb");
    var signEelemnts = slider.querySelectorAll(".sign");
    var inv1 = document.querySelector(".inverse-left");
    var inv2 = document.querySelector(".inverse-right");
    document.getElementById("in1").value = 0;
    document.getElementById("in2").value = 1;

    if (rangeElement && thumbElements.length === 2) {
      rangeElement.style.left = "0%";
      rangeElement.style.right = "99%";
      thumbElements[0].style.left = "0%";
      thumbElements[1].style.left = "1%";
      signEelemnts[0].style.left = "0%";
      signEelemnts[1].style.left = "1%";
      inv1.style.width = "70%";
      inv2.style.width = "70%";
    }
  }

  // Reset the price values
  document.getElementById("min-price").innerText = 0;
  document.getElementById("max-price").innerText = 0;
}

function resetCss() {
  // Reset the slider values
  document.getElementById("value1").innerText = 0;
  document.getElementById("value2").innerText = 1;

  // Reset the slider range
  var slider = document.getElementById("slider-distance");
  if (slider) {
    // Set the initial values of the slider
    slider.value = 0;

    // Trigger the 'input' event to update the slider and its associated elements
    var inputEvent = new Event("input", {
      bubbles: true,
      cancelable: true,
    });
    slider.dispatchEvent(inputEvent);

    // Reset the CSS styles of the slider manually
    var rangeElement = slider.querySelector(".range");
    var thumbElements = slider.querySelectorAll(".thumb");
    var signEelemnts = slider.querySelectorAll(".sign");
    var inv1 = document.querySelector(".inverse-left");
    var inv2 = document.querySelector(".inverse-right");
    document.getElementById("in1").value = 0;
    document.getElementById("in2").value = 1;

    if (rangeElement && thumbElements.length === 2) {
      rangeElement.style.left = "0%";
      rangeElement.style.right = "99%";
      thumbElements[0].style.left = "0%";
      thumbElements[1].style.left = "1%";
      signEelemnts[0].style.left = "0%";
      signEelemnts[1].style.left = "1%";
      inv1.style.width = "70%";
      inv2.style.width = "70%";
    }
  }

  // Reset the price values
  document.getElementById("min-price").innerText = 0;
  document.getElementById("max-price").innerText = 0;
}

function updateCheckboxes() {
  let yearCheckboxes = document.getElementsByName("yearListsCheckBox");
  let selectAllYear = document.getElementById("select_all_year_filter");
  // Clear existing entries in yearTableList
  yearTableList = [];

  let checkedYears = [];

  yearCheckboxes.forEach((checkbox, index) => {
    let yearData = tmpData.year.find((y) => y.id.toString() === checkbox.value);
    if (yearData && !yearData.is_interval) {
      // Check if the checkbox falls within the slider range
      let checkboxValue = (index / (yearCheckboxes.length - 1)) * 100;
      let sliderValue1 = parseInt(document.getElementById("value1").innerText);
      let sliderValue2 = parseInt(document.getElementById("value2").innerText);
      let isCheckboxInSliderRange =
        checkboxValue >= sliderValue1 && checkboxValue <= sliderValue2;

      // Update the checked status of the checkbox
      checkbox.checked = isCheckboxInSliderRange;

      // Add checked years to the array
      if (checkbox.checked) {
        checkedYears.push(yearData.year_EC);
        yearTableList.push([yearData.id, yearData.year_EC, yearData.year_GC]);
      }
    }
  });

  // Uncheck the "Select All" checkbox
  if (selectAllYear) {
    selectAllYear.checked = false;
  }

  // Find the minimum and maximum checked years
  let minYear = checkedYears.length > 0 ? Math.min(...checkedYears) : 0;
  let maxYear = checkedYears.length > 0 ? Math.max(...checkedYears) : 0;

  // Update the displayed year range
  document.getElementById("min-price").innerText = minYear;
  document.getElementById("max-price").innerText = maxYear;

  yearTableList = yearTableList.reverse();
}

function updateFilterSelection(reset = false) {
  if (isDataFetching) {
    toggleLoadingState(true);
  } else {
    toggleLoadingState(false);
  }
  var isFilterSelected = true;
  $(".card").show();

  // Hide data display section by default
  $(".data-display").hide();

  var applyButtonExists = $("#applyButton").length > 0;

  // Check if at least one filter submenu is selected from each filter option
  $(".accordion .accordion-item").each(function () {
    var filterOption = $(this);
    var filterOptionName = filterOption.find("strong").text();
    var filterSubmenu = filterOption.find(".filter-submenu");

    // Check if reset is requested, and reset filters
    if (reset) {
      resetFilters();
      reset = false;
      return;
    }

    // Check if at least one checkbox is checked in the indicator_list_filter_body
    var indicatorFilterBody = $("#indicator_list_filter_body");
    if (
      indicatorFilterBody.find('input[type="checkbox"]:checked').length === 0
    ) {
      isFilterSelected = false;
    }

    // Check if at least one checkbox or radio button is checked in the filter submenu
    var filterOptionSelection = $(
      '#filterSelections .filter-option-selection:contains("' +
        filterOptionName +
        '")'
    );
    var filterOptionCheckmark = filterOptionSelection.find(
      ".filter-option-checkmark"
    );

    if (
      filterSubmenu.find('input[type="checkbox"]:checked').length === 0 &&
      filterSubmenu.find('input[type="radio"]:checked').length === 0
    ) {
      // Remove the checkmark on the card
      filterOptionCheckmark.empty(); // Clear the checkmark content
      isFilterSelected = false;
    } else {
      // Add the checkmark on the card
      filterOptionCheckmark.html('<span class="bi bi-check check"></span>'); // Add the checkmark content
    }
  });

  // Create and append new apply button to the #button div if all filters are selected and the button doesn't exist
  if (isFilterSelected && !applyButtonExists) {
    var applyButton = $("<button>")
      .attr("id", "applyButton")
      .addClass("btn text-white mt-3")
      .text("Apply")
      .css("background-color", "#009b77");
    $("#button").append(applyButton);
  }

  // Remove the apply button from the #button div if not all filters are selected and the button exists
  if (!isFilterSelected && applyButtonExists) {
    $("#applyButton").remove();
  }

  // Reset counts to zero
  yearcount = 0;

  yearcount = $('input[name="yearListsCheckBox"]:checked').length;

  // Update the UI or perform any other actions based on the counts
  // Only update if the length is greater than 0 and the count has changed
  if ($('input[name="category_lists"]:checked').length == 0) {
    document.getElementById("seriesAvailableBadge").innerHTML = 0;
    document.getElementById("yearAvailableBadge").innerHTML = 0;
  }

  // Store the previous counts
  const prevCatargoryCount = catargorySelected;
  const prevDatabaseCount = databaseSelected;
  const prevIndicatorCount = indicatorSelected;
  const prevYearCount = yearSelected;

  // Reset counts to zero
  catargorySelected = 0;
  databaseSelected = 0;
  indicatorSelected = 0;
  yearSelected = 0;

  // Update the counts based on the selected filter submenu items
  catargorySelected = $('input[name="category_lists"]:checked').length;
  databaseSelected = $('input[name="topic_lists"]:checked').length;
  indicatorSelected = $('input[name="indicator_lists"]:checked').length;
  yearSelected = $('input[name="yearListsCheckBox"]:checked').length;

  if (catargorySelected == 0) {
    document.getElementById("search_attr1").style.display = "none";
    document.getElementById("indicator_list_filter_header").innerHTML =
      ' <p class="text-danger">Please Select Category</p>';
    document.getElementById("indicator_list_filter_body").innerHTML = "";
    document.getElementById("indicator_list_filter_select_all").innerHTML = "";
  }
  if (databaseSelected == 0) {
    document.getElementById("search_attr").style.display = "none";
    reset = true;
    document.getElementById("Year_list_filter").innerHTML =
      ' <p class="text-danger">Please Select Indicator </p>';
    document.getElementById("indicator_list_filter_header").innerHTML =
      ' <p class="text-danger">Please Select Category</p>';
    document.getElementById("indicator_list_filter_body").innerHTML = "";
    document.getElementById("indicator_list_filter_select_all").innerHTML = "";
  }
  if (indicatorSelected === 0) {
    reset = true;
    document.getElementById("search_attr3").style.display = "none";
    document.getElementById("Year_list_filter").innerHTML =
      ' <p class="text-danger">Please Select Indicator </p>';
    document.getElementById("yearAvailableBadge").innerHTML = 0;
  }

  // Only update if the length is greater than 0 and the count has changed
  if (prevCatargoryCount !== catargorySelected || catargorySelected > 0) {
    document.getElementById("categorySelectedBadge").innerHTML =
      catargorySelected;
  }

  if (prevDatabaseCount !== databaseSelected || databaseSelected > 0) {
    document.getElementById("databaseSelectedBadge").innerHTML =
      databaseSelected;
  }

  if (prevIndicatorCount !== indicatorSelected || indicatorSelected > 0) {
    document.getElementById("seriesSelectedBadge").innerHTML =
      indicatorSelected;
  }

  if (prevYearCount !== yearSelected || yearSelected > 0) {
    document.getElementById("yearSelectedBadge").innerHTML = yearSelected;
  }
}

function filterData() {
  toggleLoadingState(true);
  showLoading("topic_list_filter");
  $.ajax({
    url: "/user-json/",
    type: "GET",
    dataType: "json",
    success: function (data) {
      tmpData = data;
      let table = "";
      let indicatorSelectedType = "yearly";
      let indicatorHtmlSelectAll = document.getElementById(
        "indicator_list_filter_select_all"
      );
      let displayNone = (element) => {
        element.style.display = "none";
      };
      let displayBlock = (element) => {
        element.style.display = "block";
      };

      //Return Selected Year
      let searchTermYear = "";

      //-------------------------- Function to create a filter item for year -----------------------------
      // Function to update the year filter based on the search term
      function updateYearFilter(searchTerm) {
        searchTermYear = searchTerm;

        // Check if there are no results and display a message
        let yearListBody = document.getElementById("Year_list_filter");
        let filteredYearCheckboxes = yearListBody.querySelectorAll(
          'input[name="yearListsCheckBox"]:checked'
        );

        if (searchTerm === "" && filteredYearCheckboxes.length === 0) {
          // If the search term is empty and there are no selected checkboxes, display recent year buttons
          let recentYearButtonsStyle = searchTermYear ? "display: none;" : "";
          var viewRecentYear =
            '<p class="m-0 mb-1 fw-bold">View Recent Year</p>' +
            '<div class="filter-submenu mb-2" style="' +
            recentYearButtonsStyle +
            '">' +
            '  <button class="ms-1 btn btn-outline-primary text-primary bg-white" id="last_5_year">5</button>' +
            '  <button class="ms-1 btn btn-outline-primary text-primary bg-white" id="last_10_year">10</button>' +
            '  <button class="ms-1 btn btn-outline-primary text-primary bg-white" id="last_15_year">15</button>' +
            '  <button class="ms-1 btn btn-outline-primary text-primary bg-white" id="last_20_year">20</button>' +
            "</div>";
          yearListBody.innerHTML = viewRecentYear;
          // Call the yearList function to display all years
          yearList();
        } else {
          // If there is a search term or selected checkboxes, call yearList function
          yearList();
        }
      }

      // Function to create an individual year checkbox
      function createYearCheckbox(id, year_EC, year_GC) {
        return `
          <li>
            <div class="flex-grow-2 filter-submenu"">
              <div class="row ">
                <div class="col-1"> 
                  <input type="checkbox" value=${id} name="yearListsCheckBox" id="yearList${id}">
                </div>
                <div class="col-11">
                  <label class="form-label" for="yearList${id}" style="font-size: small;">${year_EC} E.C - ${year_GC} G.C</label>
                </div>
              </div>
            </div>
          </li>
        `;
      }

      //--------------------------End of  Function to create a filter item for Topic -----------------------------
      let yearList = () => {
        yearTableList = [];
        let recentYearButtonClick = false;
        //Year list
        let selectYear = data.year
          .map(({ id, year_EC, year_GC, is_interval }) => {
            if (
              !is_interval &&
              year_EC.toLowerCase().includes(searchTermYear.toLowerCase())
            ) {
              // Call your existing function to create the year checkbox
              return createYearCheckbox(id, year_EC, year_GC);
            }
          })
          .reverse();

        let selectYearAll = `
          <li>
            <div class="flex-grow-2 filter-submenu"">
              <div class="row ">
                <div class="col-1"> 
                  <input class='form-check' type="checkbox"  id="select_all_year_filter">
                </div>
                <div class="col-11">
                  <label class="form-label" for="select_all_year_filter" style="font-size: small;">Select All</label></div>
              </div>
              <hr>
            </div>
          </li>
        `;

        // Check if the search term is empty to determine whether to hide the recent year buttons
        let recentYearButtonsStyle = searchTermYear ? "display: none;" : "";

        var viewRecentYear =
          '<p class="m-0 mb-1 fw-bold" style="' +
          recentYearButtonsStyle +
          '">View Recent Year</p>' +
          '<div class="filter-submenu mb-2" style="' +
          recentYearButtonsStyle +
          '">' +
          '  <button class="ms-1 btn btn-outline-primary text-primary bg-white" id="last_5_year">5</button>' +
          '  <button class="ms-1 btn btn-outline-primary text-primary bg-white" id="last_10_year">10</button>' +
          '  <button class="ms-1 btn btn-outline-primary text-primary bg-white" id="last_15_year">15</button>' +
          '  <button class="ms-1 btn btn-outline-primary text-primary bg-white" id="last_20_year">20</button>' +
          "</div>";

        let yearHtml = document.getElementById("Year_list_filter");
        yearHtml.innerHTML =
          viewRecentYear + selectYearAll + selectYear.join("");

        let selectAllYear = document.getElementById("select_all_year_filter");

        selectAllYear.addEventListener("change", () => {
          reset = false;
          resetCss();
          let yearListCheckAll =
            document.getElementsByName("yearListsCheckBox");

          if (selectAllYear.checked) {
            yearTableList = data.year
              .filter(({ id, year_EC, year_GC, is_interval }) => {
                return (
                  !is_interval &&
                  year_EC.toLowerCase().includes(searchTermYear.toLowerCase())
                );
              })
              .map(({ id, year_EC, year_GC }) => [id, year_EC, year_GC]);
            yearListCheckAll.forEach((eventYear) => {
              eventYear.checked = true;
            });
          } else {
            yearTableList = [];
            yearListCheckAll.forEach((eventYear) => {
              eventYear.checked = false;
            });
          }
        });

        let yearListCheckAll = document.getElementsByName("yearListsCheckBox");

        document
          .querySelectorAll(
            "#last_5_year, #last_10_year, #last_15_year, #last_20_year"
          )
          .forEach(function (button) {
            reset = false;
            button.addEventListener("click", function () {
              console.log("called here at last_5_year");
              reversYear = true;
              resetCss();
              recentYearButtonClick = true;
              var yearsToShow = parseInt(this.textContent, 10);
              var yearCheckboxes = document.querySelectorAll(
                'input[name="yearListsCheckBox"]'
              );
              yearCheckboxes.forEach(function (checkbox, index) {
                checkbox.checked = index < yearsToShow;
              });
              yearCheckboxes[0].dispatchEvent(
                new Event("change", { bubbles: true })
              ); // Batch change events
              yearTableList = Array.from(yearCheckboxes)
                .filter(function (checkbox) {
                  return checkbox.checked;
                })
                .map(function (checkedCheckbox) {
                  var yearData = data.year.find(
                    (y) => y.id.toString() === checkedCheckbox.value
                  );
                  return yearData && !yearData.is_interval
                    ? [yearData.id, yearData.year_EC, yearData.year_GC]
                    : null;
                })
                .filter(Boolean);
            });
          });

        // Selected Year
        yearListCheckAll.forEach((yearCheckBox) => {
          yearCheckBox.addEventListener("change", (eventYearCheckBox) => {
            console.log("called here at yearCheckBox");
            resetCss();

            if (eventYearCheckBox.target.checked) {
              for (let checkedYear of data.year) {
                if (
                  !checkedYear.is_interval &&
                  String(yearCheckBox.value) === String(checkedYear.id)
                ) {
                  if (
                    yearTableList.find(
                      (item) => String(item[0]) == String(checkedYear.id)
                    )
                  ) {
                    continue;
                  } else {
                    yearTableList.push([
                      checkedYear.id,
                      checkedYear.year_EC,
                      checkedYear.year_GC,
                    ]);
                  }
                }
              }
            } else {
              selectAllYear.checked = false;
              try {
                for (let checkedYear of data.year) {
                  if (
                    !checkedYear.is_interval &&
                    String(yearCheckBox.value) === String(checkedYear.id)
                  ) {
                    let valueToCheck = [
                      checkedYear.id,
                      checkedYear.year_EC,
                      checkedYear.year_GC,
                    ];
                    for (let i = 0; i < yearTableList.length; i++) {
                      if (
                        String(yearTableList[i][0]) === String(valueToCheck[0])
                      ) {
                        yearTableList.splice(i, 1);
                      }
                    }
                  }
                }
              } catch {
                // Handle the catch block accordingly
                console.error("Error handling");
              }
            }

            // Sort Year by Ethiopian Calender
            yearTableList.sort((a, b) => (a[1] > b[1] ? 1 : -1));
          });
        });
      };

      // Event listener for the year search input
      document
        .getElementById("filterYearSearch")
        .addEventListener("input", function (event) {
          var searchTerm = event.target.value;
          updateYearFilter(searchTerm);
        });

      // Process topics
      databaseCount = 0;
      var selectTopic = data.topics
        .map(function (topic) {
          if (topic.is_deleted === false) {
            databaseCount += 1;
            return (
              '<div class="filter-submenu flex-grow-2">' +
              '  <input type="radio" value="' +
              topic.id +
              '" name="topic_lists" id="topic_list' +
              topic.id +
              '">' +
              '  <label for="topic_list' +
              topic.id +
              '" style="font-size: small;" class="mb-0">' +
              topic.title_ENG +
              " - " +
              topic.title_AMH +
              "</label>" +
              "</div>"
            );
          }
        })
        .join("");

      $("#topic_list_filter").html(selectTopic);

      //-------------------------- Function to create a filter item for topic -----------------------------
      // Function to create a filter item for topics
      function createFilterItemTopic(topic) {
        return (
          '<div class="filter-submenu flex-grow-2">' +
          '  <input type="radio" value="' +
          topic.id +
          '" name="topic_lists" id="topic_list' +
          topic.id +
          '">' +
          '  <label for="topic_list' +
          topic.id +
          '" style="font-size: small;" class="mb-0">' +
          topic.title_ENG +
          " - " +
          topic.title_AMH +
          "</label>" +
          "</div>"
        );
      }

      function updateTopicBadge(count) {
        document.getElementById("databaseAvailableBadge").innerHTML = count;
      }

      // Function to update the topics filter based on the search term
      function updateFilterTopic(searchTerm) {
        // Check if data.topics is defined and is an array
        if (data.topics && Array.isArray(data.topics)) {
          var filteredTopics = data.topics.filter(function (topic) {
            return (
              topic.is_deleted === false &&
              (topic.title_ENG
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
                topic.title_AMH
                  .toLowerCase()
                  .includes(searchTerm.toLowerCase()))
            );
          });

          var topicListBody = document.getElementById("topic_list_filter");

          if (filteredTopics.length === 0) {
            // Display a message indicating no data found
            topicListBody.innerHTML =
              '<div class="filter-submenu flex-grow-2"><p class="text-info text-center">No data found</p></div>';
          } else {
            // Populate the list with filtered topics
            var selectTopic = filteredTopics
              .map(createFilterItemTopic)
              .join("");
            topicListBody.innerHTML = selectTopic;
          }

          updateTopicBadge(filteredTopics.length);
        } else {
          console.error("Error: data.topics is not defined or is not an array");
        }
      }

      // Function to sort Topics A-Z
      function sortAZTopic() {
        if (data && data.topics && Array.isArray(data.topics)) {
          var sortedTopics = data.topics
            .filter((topic) => topic.is_deleted === false)
            .sort((a, b) => a.title_ENG.localeCompare(b.title_ENG));

          var selectTopic = sortedTopics.map(createFilterItemTopic).join("");
          document.getElementById("topic_list_filter").innerHTML = selectTopic;
        } else {
          console.error("Error: data.topics is not defined or is not an array");
        }
      }

      // Function to sort Topics Z-A
      function sortZATopic() {
        if (data && data.topics && Array.isArray(data.topics)) {
          var sortedTopics = data.topics
            .filter((topic) => topic.is_deleted === false)
            .sort((a, b) => b.title_ENG.localeCompare(a.title_ENG));

          var selectTopic = sortedTopics.map(createFilterItemTopic).join("");
          document.getElementById("topic_list_filter").innerHTML = selectTopic;
        } else {
          console.error("Error: data.topics is not defined or is not an array");
        }
      }
      // Event listener for the search input
      document
        .getElementById("filterDatabaseSearch")
        .addEventListener("input", function (event) {
          var searchTerm = event.target.value;
          updateFilterTopic(searchTerm);
          updateFilterSelection(reset);
        });
      $(document).on("change", 'input[type="radio"]', function () {
        updateFilterSelection();
      });
      // Event listeners for sorting buttons
      document
        .getElementById("sortAZDatabase")
        .addEventListener("click", sortAZTopic);
      document
        .getElementById("sortZADatabase")
        .addEventListener("click", sortZATopic);

      //--------------------------End of Function to create a filter item for topic -----------------------------

      document.getElementById("databaseAvailableBadge").innerHTML =
        databaseCount;
      $(document).on("change", 'input[name="topic_lists"]', function (event) {
        reset = true;
        updateFilterSelection(reset);
        document.getElementById("serach_atrr").style.display = "block";
        // document.getElementById('search_attr').style.display = 'block'
        var selectedTopicId = event.target.value;
        document.getElementById("Year_list_filter").innerHTML =
          ' <p class="text-danger">Please Select Indicator </p>';
        document.getElementById("indicator_list_filter_header").innerHTML =
          ' <p class="text-danger">Please Select Category</p>';
        document.getElementById("indicator_list_filter_body").innerHTML = "";
        document.getElementById("indicator_list_filter_select_all").innerHTML =
          "";
        isDataFetching = true;

        async function fetchCategoryData() {
          try {
            showLoading("category_list_filter");
            let categoriesLists = await categories(selectedTopicId);
            data.categories = categoriesLists;
            // Process categories
            catargoryCount = 0;
            var selectCategory = data.categories
              .map(function (category) {
                if (
                  String(category.topic_id) === String(selectedTopicId) &&
                  category.is_deleted === false
                ) {
                  catargoryCount += 1;
                  return (
                    '<div class="filter-submenu">' +
                    '  <input type="radio" value="' +
                    category.id +
                    '" name="category_lists" id="category_list' +
                    category.id +
                    '">' +
                    '  <label class="form-label" for="category_list' +
                    category.id +
                    '" style="font-size: small;">' +
                    category.name_ENG +
                    " - " +
                    category.name_AMH +
                    "</label>" +
                    "</div>"
                  );
                }
                return "";
              })
              .join("");
            document.getElementById("categoryAvailableBadge").innerHTML =
              catargoryCount;

            $("#category_list_filter").html(selectCategory);

            //-------------------------- Function to create a filter item for cataggory -----------------------------
            function createFilterItem(category) {
              return (
                '<div class="filter-submenu">' +
                '  <input type="radio" value="' +
                category.id +
                '" name="category_lists" id="category_list' +
                category.id +
                '">' +
                '  <label class="form-label" for="category_list' +
                category.id +
                '" style="font-size: small;">' +
                category.name_ENG +
                " - " +
                category.name_AMH +
                "</label>" +
                "</div>"
              );
            }

            // Function to update the filter based on the search term
            function updateFilter(searchTerm) {
              var filteredCategories = data.categories.filter(function (
                category
              ) {
                return (
                  String(category.topic_id) === String(selectedTopicId) &&
                  category.is_deleted === false &&
                  category.name_ENG
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase())
                );
              });

              var categoryListBody = document.getElementById(
                "category_list_filter"
              );

              if (filteredCategories.length === 0) {
                // Display a message indicating no data found
                categoryListBody.innerHTML =
                  '<div class="filter-submenu"><p class="text-info text-center">No data found</p></div>';
              } else {
                // Populate the list with filtered categories
                var selectCategory = filteredCategories
                  .map(createFilterItem)
                  .join("");
                categoryListBody.innerHTML = selectCategory;
              }

              updateFilterSelection(reset);
            }

            // Function to sort categories A-Z
            function sortAZ() {
              var sortedCategories = data.categories
                .filter(
                  (category) =>
                    String(category.topic_id) === String(selectedTopicId) &&
                    category.is_deleted === false
                )
                .sort((a, b) => a.name_ENG.localeCompare(b.name_ENG));

              var selectCategory = sortedCategories
                .map(createFilterItem)
                .join("");
              document.getElementById("category_list_filter").innerHTML =
                selectCategory;
              updateFilterSelection(reset);
            }

            // Function to sort categories Z-A
            function sortZA() {
              var sortedCategories = data.categories
                .filter(
                  (category) =>
                    String(category.topic_id) === String(selectedTopicId) &&
                    category.is_deleted === false
                )
                .sort((a, b) => b.name_ENG.localeCompare(a.name_ENG));

              var selectCategory = sortedCategories
                .map(createFilterItem)
                .join("");
              document.getElementById("category_list_filter").innerHTML =
                selectCategory;
              updateFilterSelection(reset);
            }

            // Event listener for the search input
            document
              .getElementById("filterSearch")
              .addEventListener("input", function (event) {
                var searchTerm = event.target.value;
                updateFilter(searchTerm);
                updateFilterSelection(reset);
              });

            // Event listeners for sorting buttons
            document
              .getElementById("sortAZ")
              .addEventListener("click", sortAZ, updateFilterSelection);
            document
              .getElementById("sortZA")
              .addEventListener("click", sortZA, updateFilterSelection);

            //--------------------------End of Function to create a filter item for catagory -----------------------------

            $(document).on(
              "change",
              'input[name="category_lists"]',
              function (eventCategory) {
                reset = true;
                updateFilterSelection();
                document.getElementById("search_attr1").style.display = "block";
                document.getElementById(
                  "indicator_list_filter_header"
                ).innerHTML =
                  ' <p class="text-danger">Please Select Category</p>';
                document.getElementById(
                  "indicator_list_filter_body"
                ).innerHTML = "";

                let selectedCategoryId = eventCategory.target.value;

                //Fetch Values
                isDataFetching = true;
                async function fecthindicator() {
                  try {
                    showLoading("indicator_list_filter_header");
                    let indicatorsList = await indicators(selectedCategoryId);
                    data.indicators = indicatorsList;

                    let selectYearIndicator = [];
                    let selectQuarterlyIndicator = [];
                    let selectMonthlyIndicator = [];
                    theSelectedCatagory = data.categories.find(
                      (item) => String(item.id) == String(selectedCategoryId)
                    );
                    $(document).on(
                      "change",
                      'input[name="category_lists"]',
                      function () {
                        updateFilterSelection();
                      }
                    );
                    //Yearly Indicator
                    data.indicators.map(
                      ({
                        title_ENG,
                        title_AMH,
                        id,
                        for_category_id,
                        is_deleted,
                        type_of,
                      }) => {
                        if (
                          String(for_category_id) ===
                            String(selectedCategoryId) &&
                          is_deleted == false
                        ) {
                          let title_amharic = "";

                          if (!title_AMH == null) {
                            title_amharic = " - " + title_AMH;
                          }

                          if (String(type_of) == "yearly") {
                            selectYearIndicator.push(
                              `
                              <li>
                              <div class="flex-grow-2 filter-submenu"">
                                <div class="row ">
                                    <div class="col-1"> 
                                        <input  type="checkbox" value=${id} name="indicator_lists" id="indicator_list${id}">
                                    </div>
                                    <div class="col-11">
                                      <label class="form-label" for="indicator_list${id}" style="font-size: small;">${title_ENG} ${title_amharic}</label></div>
                                  </div>
                                </div>
                              </div>
                            </li>
                              `
                            );
                          } else if (String(type_of) == "quarterly") {
                            selectQuarterlyIndicator.push(
                              `
                              <li>
                              <div class="flex-grow-2 filter-submenu"">
                                <div class="row ">
                                    <div class="col-1"> 
                                        <input  type="checkbox" value=${id} name="indicator_lists" id="indicator_list${id}">
                                    </div>
                                    <div class="col-11">
                                      <label class="form-label" for="indicator_list${id}" style="font-size: small;">${title_ENG} ${title_amharic}</label></div>
                                  </div>
                                </div>
                              </div>
                            </li>
                              `
                            );
                          } else if (String(type_of) == "monthly") {
                            selectMonthlyIndicator.push(
                              `
                              <li>
                              <div class="flex-grow-2 filter-submenu"">
                                <div class="row ">
                                    <div class="col-1"> 
                                        <input  type="checkbox" value=${id} name="indicator_lists" id="indicator_list${id}">
                                    </div>
                                    <div class="col-11">
                                      <label class="form-label" for="indicator_list${id}" style="font-size: small;">${title_ENG} ${title_amharic}</label></div>
                                  </div>
                                </div>
                              </div>
                            </li>
                              `
                            );
                          }
                        }
                      }
                    );
                    //needed
                    $(document).on(
                      "change",
                      '.filter-submenu input[type="checkbox"], .filter-submenu input[type="radio"]',
                      function () {
                        updateFilterSelection(reset);
                      }
                    );

                    let indicator_type = ` 
                        <div class="row fw-bold" id=options_for_Type>
                            <div class="col">
                                Yr <span class="badge bg-danger">${selectYearIndicator.length}</span>:  <input type="radio"  checked name="indicator_type_input" value="yearly" id=""> 
                            </div>
                            <div class="col">
                                Qr <span class="badge bg-danger">${selectQuarterlyIndicator.length}</span>:  <input type="radio" name="indicator_type_input" value="quarterly" id=""> 
                            </div>
                            <div class="col">
                                  Mon <span class="badge bg-danger">${selectMonthlyIndicator.length}</span>:  <input type="radio" name="indicator_type_input" value="monthly" id=""> 
                            </div>
                        </div>
            
                        <hr class="pt-1">
                        `;

                    let selectAll = `
                              <li id="select_all_ind">
                                <div class="flex-grow-2 filter-submenu"">
                                  <div class="row ">
                                      <div class="col-1"> 
                                          <input class='form-check' type="checkbox"  id="select_all">
                                      </div>
                                      <div class="col-11">
                                        <label class="form-label" for="select_all" style="font-size: small;">Select All</label></div>
                                    </div>
                                    <hr>
                                  </div>
                                </div>
                              </li>
                              `;

                    //Select-all Button for Indicator
                    let selectAllIndicator =
                      document.getElementById("select_all");
                    let selectedIndictorId = [];

                    let indicatorHtmlHeader = document.getElementById(
                      "indicator_list_filter_header"
                    );
                    let indicatorHtmlBody = document.getElementById(
                      "indicator_list_filter_body"
                    );

                    let indicatorListCheckAll =
                      document.getElementsByName("indicator_lists");
                    //indicator list HTML
                    let indicatorHtmlList =
                      document.getElementsByName("indicator_lists");
                    indicatorHtmlSelectAll.innerHTML = selectAll;
                    selectAllIndicator = document.getElementById("select_all");

                    if (
                      selectYearIndicator.length == 0 &&
                      selectQuarterlyIndicator.length == 0 &&
                      selectMonthlyIndicator.length == 0
                    ) {
                      reset = true;
                      indicatorHtmlHeader.innerHTML =
                        '<p class="text-danger">Please select Another Category, No data Found! </p>';
                      indicatorHtmlBody.innerHTML = "";
                      document.getElementById("search_attr1").style.display =
                        "none";
                      document.getElementById("select_all_ind").style.display =
                        "none";
                      document.getElementById(
                        "seriesAvailableBadge"
                      ).innerHTML = 0;
                      updateFilterSelection((reset = true));
                    } else {
                      indicatorHtmlHeader.innerHTML = indicator_type;

                      if (selectYearIndicator.length == 0) {
                        indicatorHtmlBody.innerHTML =
                          '<p class="text-danger">Please select Another Time Series, No data Found! </p>';
                        displayNone(indicatorHtmlSelectAll);
                      } else {
                        indicatorHtmlBody.innerHTML =
                          selectYearIndicator.join("");
                        displayBlock(indicatorHtmlSelectAll);
                      }

                      let selectedIndicatorType = document.getElementsByName(
                        "indicator_type_input"
                      );

                      selectedIndicatorType.forEach((type) => {
                        type.addEventListener("change", () => {
                          table = "";
                          document.getElementById(
                            "Year_list_filter"
                          ).innerHTML =
                            ' <p class="text-danger">Please Select Indicator</p>';
                          reset = true;
                          if (String(type.value) == "yearly") {
                            indicatorSelectedType = "yearly";
                            if (selectYearIndicator.length == 0) {
                              displayNone(indicatorHtmlSelectAll);
                              indicatorHtmlBody.innerHTML =
                                '<p class="text-danger">Please select Another Time Series, No data Found! </p>';
                            } else {
                              displayBlock(indicatorHtmlSelectAll);
                              indicatorHtmlBody.innerHTML =
                                selectYearIndicator.join("");
                            }
                          } else if (String(type.value) == "quarterly") {
                            indicatorSelectedType = "quarterly";
                            if (selectQuarterlyIndicator.length == 0) {
                              displayNone(indicatorHtmlSelectAll);
                              indicatorHtmlBody.innerHTML =
                                '<p class="text-danger">Please select Another Time Series, No data Found! </p>';
                            } else {
                              displayBlock(indicatorHtmlSelectAll);
                              indicatorHtmlBody.innerHTML =
                                selectQuarterlyIndicator.join("");
                            }
                          } else if (String(type.value) == "monthly") {
                            indicatorSelectedType = "monthly";
                            if (selectMonthlyIndicator.length == 0) {
                              displayNone(indicatorHtmlSelectAll);
                              indicatorHtmlBody.innerHTML =
                                '<p class="text-danger">Please select Another Time Series, No data Found! </p>';
                            } else {
                              displayBlock(indicatorHtmlSelectAll);
                              indicatorHtmlBody.innerHTML =
                                selectMonthlyIndicator.join("");
                            }
                          }

                          // Unselect the 'Select All' button
                          selectAllIndicator.checked = false;
                          selectedIndictorId = []; // Reinitialized the Array
                          indicatorHtmlList.forEach((indicatorCheckBox) => {
                            indicatorCheckBox.addEventListener(
                              "change",
                              (eventIndicator) => {
                                resetCss();
                                if (eventIndicator.target.checked) {
                                  selectedIndictorId.push(
                                    eventIndicator.target.value
                                  );
                                } else {
                                  selectedIndictorId =
                                    selectedIndictorId.filter(
                                      (id) => id !== eventIndicator.target.value
                                    );
                                }

                                // Update the 'Select All' checkbox state based on individual checkboxes
                                selectedIndictorId.checked =
                                  indicatorHtmlList.length ===
                                  selectedIndictorId.length;

                                // Update the year checkboxes based on selected indicators
                                yearList();
                              }
                            );
                          });
                        });
                      });

                      if (
                        $('input[name="category_lists"]:checked').length > 0
                      ) {
                        let allIndicators = selectYearIndicator.concat(
                          selectQuarterlyIndicator,
                          selectMonthlyIndicator
                        );
                        indicatorcount = allIndicators.length;
                        document.getElementById(
                          "seriesAvailableBadge"
                        ).innerHTML = indicatorcount;
                        updateFilterSelection();
                      } else {
                        document.getElementById(
                          "seriesAvailableBadge"
                        ).innerHTML = 0;
                      }
                    }

                    // Function to update the indicator filter based on the search term and indicator type
                    function updateIndicatorFilter(searchTerm) {
                      var filteredIndicators = data.indicators.filter(function (
                        indicator
                      ) {
                        return (
                          String(indicator.for_category_id) ===
                            String(selectedCategoryId) &&
                          indicator.is_deleted === false &&
                          indicator.title_ENG
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase()) &&
                          String(indicator.type_of) === indicatorSelectedType
                        );
                      });

                      var selectIndicators = filteredIndicators
                        .map(createIndicatorItem)
                        .join("");
                      document.getElementById(
                        "indicator_list_filter_body"
                      ).innerHTML = selectIndicators;
                    }

                    //-------------------------- Function to create a filter item for Indicator -----------------------------
                    let searchTerm = ""; // Declare searchTerm globally

                    // Function to handle indicator type change
                    function handleIndicatorTypeChange(newType) {
                      // Clear the search input when the indicator type changes
                      document.getElementById("filterIndicatorSearch").value =
                        "";
                      // Update the current indicator type
                      indicatorSelectedType = newType;
                      console.log("called");
                      updateFilterSelection();
                    }

                    // Function to update the indicator filter based on the search term and indicator type
                    function updateIndicatorFilter(searchTerm) {
                      // Clear the 'Select All' checkbox when performing a search
                      selectAllIndicator.checked = false;
                      selectedIndictorId = [];

                      var filteredIndicators = data.indicators.filter(function (
                        indicator
                      ) {
                        return (
                          String(indicator.for_category_id) ===
                            String(selectedCategoryId) &&
                          indicator.is_deleted === false &&
                          indicator.title_ENG
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase()) &&
                          String(indicator.type_of) === indicatorSelectedType
                        );
                      });

                      var indicatorListBody = document.getElementById(
                        "indicator_list_filter_body"
                      );

                      if (filteredIndicators.length === 0) {
                        // Display a message indicating no data found
                        indicatorListBody.innerHTML =
                          '<li class="text-info text-center">No data found</li>';
                      } else {
                        // Populate the list with filtered indicators
                        var selectIndicators = filteredIndicators
                          .map(createIndicatorItem)
                          .join("");
                        indicatorListBody.innerHTML = selectIndicators;
                      }

                      // Event listener for the 'Select All' checkbox
                      selectAllIndicator.addEventListener("change", () => {
                        document.getElementById("search_attr3").style.display =
                          "block";
                        if (selectAllIndicator.checked) {
                          indicatorListCheckAll.forEach((event) => {
                            event.checked = true;
                            if (!selectedIndictorId.includes(event.value)) {
                              selectedIndictorId.push(event.value);
                            }
                          });
                        } else {
                          indicatorListCheckAll.forEach((event) => {
                            event.checked = false;
                          });
                          selectedIndictorId = []; // Clear the array when 'Select All' is unchecked
                        }

                        // Update the year checkboxes based on selected indicators
                        yearList();
                      });

                      indicatorHtmlList.forEach((indicatorCheckBox) => {
                        indicatorCheckBox.addEventListener(
                          "change",
                          (eventIndicator) => {
                            document.getElementById(
                              "search_attr3"
                            ).style.display = "block";
                            if (eventIndicator.target.checked) {
                              selectedIndictorId.push(
                                eventIndicator.target.value
                              );
                            } else {
                              selectedIndictorId = selectedIndictorId.filter(
                                (id) => id !== eventIndicator.target.value
                              );
                            }

                            // Update the 'Select All' checkbox state based on individual checkboxes
                            selectedIndictorId.checked =
                              indicatorHtmlList.length ===
                              selectedIndictorId.length;

                            // Update the year checkboxes based on selected indicators
                            yearList();
                          }
                        );
                      });
                      updateFilterSelection();
                    }

                    // Function to sort indicators A-Z
                    function sortAZIndicator() {
                      var sortedIndicators = data.indicators
                        .filter(
                          (indicator) =>
                            String(indicator.for_category_id) ===
                              String(selectedCategoryId) &&
                            indicator.is_deleted === false
                        )
                        .sort((a, b) => a.title_ENG.localeCompare(b.title_ENG));

                      var selectIndicators = sortedIndicators
                        .map(createIndicatorItem)
                        .join("");
                      document.getElementById(
                        "indicator_list_filter_body"
                      ).innerHTML = selectIndicators;
                      updateFilterSelection();
                      indicatorHtmlList.forEach((indicatorCheckBox) => {
                        indicatorCheckBox.addEventListener(
                          "change",
                          (eventIndicator) => {
                            if (eventIndicator.target.checked) {
                              selectedIndictorId.push(
                                eventIndicator.target.value
                              );
                            } else {
                              selectedIndictorId = selectedIndictorId.filter(
                                (id) => id !== eventIndicator.target.value
                              );
                            }

                            // Update the 'Select All' checkbox state based on individual checkboxes
                            selectedIndictorId.checked =
                              indicatorHtmlList.length ===
                              selectedIndictorId.length;

                            // Update the year checkboxes based on selected indicators
                            yearList();
                          }
                        );
                      });
                    }

                    // Function to sort indicators Z-A
                    function sortZAIndicator() {
                      var sortedIndicators = data.indicators
                        .filter(
                          (indicator) =>
                            String(indicator.for_category_id) ===
                              String(selectedCategoryId) &&
                            indicator.is_deleted === false
                        )
                        .sort((a, b) => b.title_ENG.localeCompare(a.title_ENG));

                      var selectIndicators = sortedIndicators
                        .map(createIndicatorItem)
                        .join("");
                      document.getElementById(
                        "indicator_list_filter_body"
                      ).innerHTML = selectIndicators;
                      indicatorHtmlList.forEach((indicatorCheckBox) => {
                        indicatorCheckBox.addEventListener(
                          "change",
                          (eventIndicator) => {
                            if (eventIndicator.target.checked) {
                              selectedIndictorId.push(
                                eventIndicator.target.value
                              );
                            } else {
                              selectedIndictorId = selectedIndictorId.filter(
                                (id) => id !== eventIndicator.target.value
                              );
                            }

                            // Update the 'Select All' checkbox state based on individual checkboxes
                            selectedIndictorId.checked =
                              indicatorHtmlList.length ===
                              selectedIndictorId.length;

                            // Update the year checkboxes based on selected indicators
                            yearList();
                          }
                        );
                      });
                      updateFilterSelection();
                    }
                    // Function to create an indicator filter item
                    function createIndicatorItem(indicator) {
                      let title_amharic = indicator.title_AMH
                        ? " - " + indicator.title_AMH
                        : "";
                      updateFilterSelection();
                      return `
                          <li>
                              <div class="flex-grow-2 filter-submenu">
                                  <div class="row">
                                      <div class="col-1">
                                          <input type="checkbox" value=${indicator.id} name="indicator_lists" id="indicator_list${indicator.id}">
                                      </div>
                                      <div class="col-11">
                                          <label class="form-label" for="indicator_list${indicator.id}" style="font-size: small;">${indicator.title_ENG} ${title_amharic}</label>
                                      </div>
                                  </div>
                              </div>
                          </li>`;
                    }
                    // Event listener for the indicator search input
                    document
                      .getElementById("filterIndicatorSearch")
                      .addEventListener("input", function (event) {
                        var searchTerm = event.target.value;
                        updateIndicatorFilter(searchTerm);
                      });
                    // Event listeners for indicator type radio buttons
                    document
                      .getElementById("options_for_Type")
                      .addEventListener("change", function (event) {
                        if (event.target.name === "indicator_type_input") {
                          handleIndicatorTypeChange(event.target.value);
                        }
                        updateFilterSelection();
                      });
                    // Event listeners for sorting buttons for indicators
                    document
                      .getElementById("sortAZIndicator")
                      .addEventListener(
                        "click",
                        sortAZIndicator,
                        updateFilterSelection
                      );
                    document
                      .getElementById("sortZAIndicator")
                      .addEventListener(
                        "click",
                        sortZAIndicator,
                        updateFilterSelection
                      );

                    //--------------------------End of  Function to create a filter item for indicator -----------------------------

                    // Event listener for the 'Select All' checkbox
                    selectAllIndicator.addEventListener("change", () => {
                      document.getElementById("search_attr3").style.display =
                        "block";
                      if (selectAllIndicator.checked) {
                        resetCss();
                        indicatorListCheckAll.forEach((event) => {
                          event.checked = true;
                          if (!selectedIndictorId.includes(event.value)) {
                            selectedIndictorId.push(event.value);
                          }
                        });
                      } else {
                        indicatorListCheckAll.forEach((event) => {
                          event.checked = false;
                        });
                        selectedIndictorId = []; // Clear the array when 'Select All' is unchecked
                      }

                      // Update the year checkboxes based on selected indicators
                      yearList();
                    });

                    // Event listener for individual checkboxes
                    indicatorHtmlList.forEach((indicatorCheckBox) => {
                      indicatorCheckBox.addEventListener(
                        "change",
                        (eventIndicator) => {
                          resetCss();
                          document.getElementById(
                            "search_attr3"
                          ).style.display = "block";
                          if (eventIndicator.target.checked) {
                            selectedIndictorId.push(
                              eventIndicator.target.value
                            );
                          } else {
                            selectedIndictorId = selectedIndictorId.filter(
                              (id) => id !== eventIndicator.target.value
                            );
                          }

                          // Update the 'Select All' checkbox state based on individual checkboxes
                          selectAllIndicator.checked =
                            indicatorHtmlList.length ===
                            selectedIndictorId.length;

                          // Update the year checkboxes based on selected indicators
                          yearList();
                        }
                      );
                    });

                    $(document).on(
                      "change",
                      '.filter-submenu input[type="checkbox"], .filter-submenu input[type="radio"]',
                      function () {
                        if (indicatorSelected > 0) {
                          document.getElementById(
                            "yearAvailableBadge"
                          ).innerHTML = data.year.length;
                        } else {
                          document.getElementById(
                            "yearAvailableBadge"
                          ).innerHTML = 0;
                        }
                      }
                    );

                    if ($('input[name="category_lists"]:checked').length == 0) {
                      reset = true;
                      document.querySelector(".indicator_filter").innerHTML =
                        ' <p class="text-danger">Please Select Category</p>';
                      document.getElementById("Year_list_filter").innerHTML =
                        ' <p class="text-danger">Please Select Indicator</p>';
                    }

                    //Fetch Values
                    async function fetchDataAndUpdate() {
                      try {
                        console.log("called");
                        let value = await values(selectedCategoryId);
                        data.value = value;
                        isDataFetching = false;
                        console.log("finished");

                        updateFilterSelection();
                      } catch (error) {
                        console.error("Error:", error);
                      }
                    }
                    fetchDataAndUpdate();
                    //Display Data with Apply Button
                    $("#button").on("click", "#applyButton", function () {
                      // Hide filter selection card
                      $(".card").hide();

                      // Show data display section
                      $("#dataDisplay").show();
                      // Show table
                      $("#table-container").show();
                      let table_card = document.getElementById("table_card");
                      table_card.style.display = "block";
                      let list_table =
                        document.getElementById("list_table_view");
                      list_table.style.display = "block";

                      // Reverse the yearTableList array if reversYear is true
                      if (reversYear) {
                        console.log("year reversed");
                        yearTableList = yearTableList.reverse();
                        reversYear = false;
                      }

                      // Hide chart
                      $("#chart").hide();
                      $("#map").hide();
                      $("#display_chart").hide();

                      $("#displayOptions a:nth-child(1)").addClass("active");
                      $("#displayOptions a:nth-child(2)").removeClass("active");

                      table = "";

                      let dataListViewTable =
                        document.getElementById("list_table_view");
                      //Type Year Table
                      let typeYearTable = () => {
                        table += `
                                                        <table id="newTable" class="table  m-0 p-0">
                                                        <thead>
                                                          <tr>
                                                            <th class="ps-5 pe-5">Name</th>`;

                        for (let i of yearTableList) {
                          table += `<th class="border bg-white " style="font-size: small; class="white-space: nowrap;  ">${i[1]}-E.C </br>${i[2]}<span>-G.C</span></th>`;
                        }

                        table += `</tr>
                                                                  </thead>
                                                              <tbody>
                                                        `;

                        //let indicatorList = data.indicators.filter((item)=>String(item.for_category_id) === String(selectedCategoryId) && selectedIndictorId.includes(String(item.id)) && item.is_deleted == false)
                        data.indicators.map(
                          ({
                            title_ENG,
                            title_AMH,
                            id,
                            for_category_id,
                            is_deleted,
                            measurement__Amount_ENG,
                          }) => {
                            if (String(for_category_id) === String(selectedCategoryId) && selectedIndictorId.includes(String(id)) && is_deleted == false) {
                              console.log();
                              let title_amharic = "";
                              if (!title_AMH === null)
                                title_amharic = " - " + title_AMH;

                              let measure = "";
                              if (
                                measurement__Amount_ENG !== null &&
                                measurement__Amount_ENG !== undefined
                              ) {
                                measure = "(" + measurement__Amount_ENG + ")";
                              }

                              //Table Row Start
                              table += `
                                                          <tr>
                                                            <td class="border" style="width: auto; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                                                <div class="row">
                                                                  <div class="col-10">
                                                                    <p style="font-size: small;" white-space: nowrap; class="d-block fw-bold text-dark">${title_ENG} ${title_amharic} <span class="measurement-text" style="color: red;">${measure}</span></p>
                                                                  </div>
                                                                </div>
                                                            </td>`;

                              for (j of yearTableList) {
                                let statusData = false;
                                for (k of data.value) {
                                  if (
                                    String(j[0]) ===
                                      String(k.for_datapoint_id) &&
                                    String(id) === String(k.for_indicator_id)
                                  ) {
                                    table += `<td class="border bg-white" >${k.value}</td>`;
                                    statusData = false;
                                    break;
                                  } else {
                                    statusData = true;
                                  }
                                }
                                if (statusData) {
                                  table += `<td class="border bg-white " > - </td>`;
                                }
                              }

                              table += `</tr>`;

                              //Table Row End

                              let table_child_list = (
                                parent,
                                title_ENG,
                                space
                              ) => {
                                space += String("&nbsp;&nbsp;&nbsp;&nbsp");
                                let status = false;

                                for (i of data.indicators) {
                                  if (
                                    String(i.parent_id) === String(parent) &&
                                    i.is_deleted == false
                                  ) {
                                    status = true;
                                    //Table Row Start
                                    table += `
                                                          <tr>
                                                            <td class="border bg-white " style="width: auto; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                                              <a>
                                                                <h6 class="mb-1">
                                                                  <p style="font-size: small;" class="d-block white-space: nowrap; text-dark fw-normal ps-2 ">${space} ${i.title_ENG} </p>
                                                                </h6>
                                                              </a>
                                                            </td>`;

                                    for (j of yearTableList) {
                                      let statusData = false;
                                      for (k of data.value) {
                                        if (
                                          String(j[0]) ===
                                            String(k.for_datapoint_id) &&
                                          String(i.id) ===
                                            String(k.for_indicator_id)
                                        ) {
                                          table += `<td class="border bg-white ">${k.value}</td>`;
                                          statusData = false;
                                          break;
                                        } else {
                                          statusData = true;
                                        }
                                      }
                                      if (statusData) {
                                        table += `<td class="border bg-white " > - </td>`;
                                      }
                                    }

                                    table += `</tr>`;

                                    //Table Row End
                                    table_child_list(
                                      i.id,
                                      i.title_ENG,
                                      String(space)
                                    );
                                  }
                                }
                                return status;
                              };

                              //Child Lists
                              for (let indicator of data.indicators) {
                                if (
                                  String(indicator.parent_id) == String(id) &&
                                  indicator.is_deleted == false
                                ) {
                                  test = true;
                                  //li.push(`<optgroup label="${title_ENG}">`)

                                  //Table Row Start
                                  table += `
                                                        <tr>
                                                          <td class="border bg-white " style="width: auto; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                                            <a>
                                                              <h6 class="mb-1">
                                                                <p style="font-size: small;" class="d-block white-space: nowrap; text-dark  fw-normal"> &nbsp;&nbsp; ${indicator.title_ENG}  </p>
                                                              </h6>
                                                            </a>
                                                          </td>`;

                                  for (j of yearTableList) {
                                    let statusData = false;
                                    for (k of data.value) {
                                      if (
                                        String(j[0]) ===
                                          String(k.for_datapoint_id) &&
                                        String(indicator.id) ===
                                          String(k.for_indicator_id)
                                      ) {
                                        table += `<td class="border bg-white ">${k.value}</td>`;
                                        statusData = false;
                                        break;
                                      } else {
                                        statusData = true;
                                      }
                                    }
                                    if (statusData) {
                                      table += `<td class="border bg-white "> - </td>`;
                                    }
                                  }

                                  table += `</tr>`;

                                  //Table Row End

                                  //li.push(`<option value=${indicator.id}>${indicator.title_ENG} ${indicator.title_AMH} </option>`)
                                  table_child_list(
                                    indicator.id,
                                    indicator.title_ENG,
                                    " "
                                  );
                                  //li.push(child)
                                  // li.push('</optgroup>')
                                }
                              }
                              return null;
                            }
                          }
                        );

                        table += `</tbody> </table>`;

                        $(document).ready(function () {
                          $("#newTable").DataTable({
                            retrieve: true,
                            ordering: false,
                            scrollX: true,
                            responsive: true,
                            paging: true,
                            searching: true,
                            orderNumber: true,
                            lengthMenu: [
                              [10, 25, 50, -1],
                              ["10 rows", "25 rows", "50 rows", "Show all"],
                            ],
                            columnDefs: [
                              { width: "100%" },
                              { width: "200px", targets: 0 },
                            ],
                            dom: "Bfrtip",
                            buttons: [
                              "pageLength",
                              "excel",
                              "csv",
                              "pdf",
                              "print",
                            ],
                            drawCallback: function (settings) {
                              // Add color to columns (excluding first column) after each draw
                              $("#newTable tbody tr td:not(:first-child)").css(
                                "background-color",
                                "#f2f2f2"
                              );
                            },
                          });
                        });
                      };

                      //Type Month table
                      let typeMonthTable = () => {
                        table += `
                                                  <style>
                                                  table.dataTable th {
                                                    writing-mode: vertical-lr !important;
                                                    vertical-align: middle !important;
                                                    transform: rotate(180deg) !important;
                                                }
                                                </style>
                                                  <table id="newTable" class="table  table-responsive m-0 p-0" style="width:100%;">
                                                  <thead>
                                                    <tr class="text-center">
                                                    <th style="padding-left: 100px !important;padding-right: 100px !important;" class=" border">Year</th>
                                                    <th style="padding-left: 100px !important;padding-right: 100px !important;" class=" border">Month</th>`;

                        let filterIndicators = data.indicators.filter(
                          (item) =>
                            String(item.for_category_id) ===
                              String(selectedCategoryId) &&
                            selectedIndictorId.includes(String(item.id)) &&
                            item.is_deleted == false
                        );
                        for (filterIndicator of filterIndicators) {
                          let title_amharic = "";
                          if (!filterIndicator.title_AMH === null)
                            title_amharic = " - " + filterIndicator.title_AMH;
                           console.log(" filterIndicator",  filterIndicator)
                          let measure = "";
                          if (filterIndicator.Amount_ENG !== null) {
                            measure = "(" + filterIndicator.Amount_ENG + ")";
                          }

                          table += ` <th class="vertical-text border" ">
                                                        <p " class="fw-bold text-dark p-0 m-0">${filterIndicator.title_ENG} ${title_amharic}  <span class="measurement-text" style="color: red;">${measure}</span></p>
                                                        </th>`;

                          let childIndicatorList = (parent, space) => {
                            space += String("&nbsp;&nbsp;&nbsp;&nbsp");
                            let status = false;

                            for (let indicator of data.indicators) {
                              if (
                                String(indicator.parent_id) ===
                                  String(parent) &&
                                indicator.is_deleted == false
                              ) {
                                test = true;
                                table += `
                                                              <th class="vertical-text fw-normal border" >${space} ${indicator.title_ENG} </th>
                                                              `;

                                childIndicatorList(indicator.id, String(space));
                              }
                            }
                          };
                          //Child List
                          for (let indicator of data.indicators) {
                            if (
                              String(indicator.parent_id) ==
                                String(filterIndicator.id) &&
                              indicator.is_deleted == false
                            ) {
                              test = true;
                              table += `
                                                            <th class="vertical-text fw-normal border">&nbsp;&nbsp;  ${indicator.title_ENG} </th>
                                                            `;

                              childIndicatorList(indicator.id, " ");
                            }
                          }
                        }

                        table += `</tr>
                                                  </thead>`;

                        table += `<tbody>`;

                        //year loop
                        for (let year of yearTableList) {
                          let checkYearPrint = false;

                          //month loop
                          for (let month of data.month) {
                            table += `
                                                      <tr class="text-center">`;

                            if (!checkYearPrint) {
                              table += `<td class="border fw-bold">${year[1]} E.C - ${year[2]} G.C</td>`;
                            } else {
                              table += `<td class="border"></td>`;
                            }

                            table += `                     
                                                      <td class="fw-bold border" >${month.month_AMH}: ${month.month_ENG}</td>`;

                            //Filter parent indicators
                            let indicatorsObject = data.indicators.filter(
                              (item) =>
                                String(item.for_category_id) ===
                                  String(selectedCategoryId) &&
                                selectedIndictorId.includes(String(item.id)) &&
                                item.is_deleted == false
                            );

                            for (let indicatorObj of indicatorsObject) {
                              let currentDataValue = data.value.find((item) => {
                                if (
                                  String(item.for_month_id) ===
                                    String(month.id) &&
                                  String(item.for_indicator_id) ===
                                    String(indicatorObj.id) &&
                                  String(item.for_datapoint_id) ===
                                    String(year[0])
                                ) {
                                  return item;
                                }
                              });

                              //Print Main Indicator Value
                              table += `<td class="border bg-white fw-bold";> ${
                                currentDataValue
                                  ? currentDataValue.value
                                  : " - "
                              } </td>`;

                              //Filter Only Child Indicator
                              let childIndicators = data.indicators.filter(
                                (item) =>
                                  String(item.parent_id) ==
                                    String(indicatorObj.id) && !item.is_deleted
                              );

                              let childIndicatorDataValue = (parent) => {
                                let filterChild = data.indicators.filter(
                                  (item) =>
                                    String(item.parent_id) == String(parent) &&
                                    item.is_deleted == false
                                );
                                if (filterChild) {
                                  for (indicatorList of filterChild) {
                                    valueData = data.value.find((value) => {
                                      if (
                                        String(value.for_month_id) ===
                                          String(month.id) &&
                                        String(value.for_indicator_id) ===
                                          String(indicatorList.id) &&
                                        String(value.for_datapoint_id) ===
                                          String(year[0])
                                      ) {
                                        return value;
                                      }
                                    });

                                    if (valueData) {
                                      table += `<td class="bg-white border" > ${valueData.value} </td>`;
                                    } else {
                                      table += `<td class="bg-white border"> - </td>`;
                                    }
                                    childIndicatorDataValue(indicatorList.id);
                                  }
                                }
                              };

                              for (let childIndicator of childIndicators) {
                                valueData = data.value.find((value) => {
                                  if (
                                    String(value.for_month_id) ===
                                      String(month.id) &&
                                    String(value.for_indicator_id) ===
                                      String(childIndicator.id) &&
                                    String(value.for_datapoint_id) ===
                                      String(year[0])
                                  ) {
                                    return value;
                                  }
                                });

                                if (valueData) {
                                  table += `<td class="bg-white border"> ${valueData.value} </td>`;
                                } else {
                                  table += `<td class="bg-white border"> - </td>`;
                                }

                                //Call Child
                                childIndicatorDataValue(childIndicator.id);
                              }
                            }
                            table += `
                                                    </tr>`;

                            checkYearPrint = true;
                          }
                        }
                        table += `</tbody>`;

                        $(document).ready(function () {
                          $("#newTable").DataTable({
                            columnDefs: [{ width: 900, targets: 0 }],
                            retrieve: true,
                            ordering: false,
                            responsive: true,
                            paging: true,
                            searching: true,
                            orderNumber: true,
                            lengthMenu: [
                              [36, 72, 108, -1],
                              ["36 rows", "72 rows", "108 rows", "Show all"],
                            ],
                            buttons: [
                              "pageLength",
                              "copy",
                              {
                                extend: "excelHtml5",
                                text: "Save as Excel",
                                customize: function (xlsx) {
                                  var sheet = xlsx.xl.worksheets["sheet1.xml"];
                                  $("row:nth-child(2) c", sheet).attr(
                                    "s",
                                    "54"
                                  );
                                },
                              },
                              ,
                              "print",
                            ],
                            drawCallback: function (settings) {
                              // Add color to columns (excluding first column) after each draw
                              $(
                                "#newTable tbody tr td:not(:first-child):not(:nth-child(2))"
                              ).css("background-color", "#f2f2f2");
                            },
                            dom: "Bfrtip",
                          });
                        });
                      };

                      //Type Quarter table
                      let typeQuarterTable = () => {
                        table += `
                                                      <style>
                                                      table.dataTable th {
                                                        writing-mode: vertical-lr !important;
                                                        vertical-align: middle !important;
                                                        transform: rotate(180deg) !important;
                                                    }
                                                  </style>
                                                  <table id="newTable" class="table  table-responsive m-0 p-0" style="width:100%">
                                                  <thead>
                                                    <tr class="text-center">
                                                    <th style="padding-left: 100px !important;padding-right: 100px !important;" class="vertical-text border">Year</th>
                                                    <th style="padding-left: 100px !important;padding-right: 100px !important;" class="vertical-text border">Month</th>`;

                        let filterIndicators = data.indicators.filter(
                          (item) =>
                            String(item.for_category_id) ===
                              String(selectedCategoryId) &&
                            selectedIndictorId.includes(String(item.id)) &&
                            item.is_deleted == false
                        );
                        for (filterIndicator of filterIndicators) {
                          let title_amharic = "";
                          if (!filterIndicator.title_AMH === null)
                            title_amharic = " - " + filterIndicator.title_AMH;

                          let measure = "";
                          if (filterIndicator.measurement__Amount_ENG !== null) {
                            measure = "(" + filterIndicator.measurement__Amount_ENG + ")";
                          }

                          table += ` <th class="vertical-text  border" ">
                                                        <p" class="fw-bold text-dark p-0 m-0">${filterIndicator.title_ENG} ${title_amharic}  <span class="measurement-text" style="color: red;">${measure}</span></p>
                                                        </th>`;

                          let childIndicatorList = (parent, space) => {
                            space += String("&nbsp;&nbsp;&nbsp;&nbsp");
                            let status = false;

                            for (let indicator of data.indicators) {
                              if (
                                String(indicator.parent_id) ===
                                  String(parent) &&
                                indicator.is_deleted == false
                              ) {
                                test = true;
                                table += `
                                                              <th class="vertical-text fw-normal border" >${space} ${indicator.title_ENG} </th>
                                                              `;

                                childIndicatorList(indicator.id, String(space));
                              }
                            }
                          };
                          //Child List
                          for (let indicator of data.indicators) {
                            if (
                              String(indicator.parent_id) ==
                                String(filterIndicator.id) &&
                              indicator.is_deleted == false
                            ) {
                              test = true;
                              table += `
                                                            <th class="vertical-text fw-normal border" >&nbsp;&nbsp;  ${indicator.title_ENG} </th>
                                                            `;

                              childIndicatorList(indicator.id, " ");
                            }
                          }
                        }

                        table += `</tr>
                                                  </thead>`;

                        table += `<tbody>`;

                        //year loop
                        for (let year of yearTableList) {
                          let checkYearPrint = false;

                          //month loop
                          for (let quarter of data.quarter) {
                            table += `
                                                      <tr class="text-center">`;

                            if (!checkYearPrint) {
                              table += `<td style="width: 28%;"  class=" fw-bold">${year[1]} E.C - ${year[2]} G.C</td>`;
                            } else {
                              table += ` <td class="border"></td>`;
                            }

                            table += `                     
                                                      <td class="fw-bold" style="width: 22%;" >${quarter.title_ENG}: ${quarter.title_AMH}</td>`;

                            //Filter parent indicators
                            let indicatorsObject = data.indicators.filter(
                              (item) =>
                                String(item.for_category_id) ===
                                  String(selectedCategoryId) &&
                                selectedIndictorId.includes(String(item.id)) &&
                                item.is_deleted == false
                            );

                            for (let indicatorObj of indicatorsObject) {
                              let currentDataValue = data.value.find((item) => {
                                if (
                                  String(item.for_quarter_id) ===
                                    String(quarter.id) &&
                                  String(item.for_indicator_id) ===
                                    String(indicatorObj.id) &&
                                  String(item.for_datapoint_id) ===
                                    String(year[0])
                                ) {
                                  return item;
                                }
                              });

                              //Print Main Indicator Value
                              table += `<td class="fw-bold"  style="width: 10%";> ${
                                currentDataValue
                                  ? currentDataValue.value
                                  : " - "
                              } </td>`;

                              //Filter Only Child Indicator
                              let childIndicators = data.indicators.filter(
                                (item) =>
                                  String(item.parent_id) ==
                                  String(indicatorObj.id)
                              );

                              let childIndicatorDataValue = (parent) => {
                                let filterChild = data.indicators.filter(
                                  (item) =>
                                    String(item.parent_id) == String(parent) &&
                                    item.is_deleted == false
                                );
                                if (filterChild) {
                                  for (indicatorList of filterChild) {
                                    valueData = data.value.find((value) => {
                                      if (
                                        String(value.for_month_id) ===
                                          String(month.id) &&
                                        String(value.for_indicator_id) ===
                                          String(indicatorList.id) &&
                                        String(value.for_datapoint_id) ===
                                          String(year[0])
                                      ) {
                                        return value;
                                      }
                                    });

                                    if (valueData) {
                                      table += `<td> ${valueData.value} </td>`;
                                    } else {
                                      table += `<td> - </td>`;
                                    }
                                    childIndicatorDataValue(indicatorList.id);
                                  }
                                }
                              };

                              for (let childIndicator of childIndicators) {
                                valueData = data.value.find((value) => {
                                  if (
                                    String(value.for_quarter_id) ===
                                      String(quarter.id) &&
                                    String(value.for_indicator_id) ===
                                      String(childIndicator.id) &&
                                    String(value.for_datapoint_id) ===
                                      String(year[0])
                                  ) {
                                    return value;
                                  }
                                });

                                if (valueData) {
                                  table += `<td> ${valueData.value} </td>`;
                                } else {
                                  table += `<td> - </td>`;
                                }

                                //Call Child
                                childIndicatorDataValue(childIndicator.id);
                              }
                            }
                            table += `
                                                    </tr>`;

                            checkYearPrint = true;
                          }
                        }
                        table += `</tbody>`;

                        $(document).ready(function () {
                          $("#newTable").DataTable({
                            retrieve: true,
                            ordering: false,
                            responsive: true,
                            paging: true,
                            searching: true,
                            orderNumber: true,
                            lengthMenu: [
                              [24, 50, 100, -1],
                              ["24 rows", "50 rows", "100 rows", "Show all"],
                            ],
                            buttons: [
                              "pageLength",
                              "copy",
                              {
                                extend: "excelHtml5",
                                text: "Save as Excel",
                                customize: function (xlsx) {
                                  var sheet = xlsx.xl.worksheets["sheet1.xml"];
                                  $("row:nth-child(2) c", sheet).attr(
                                    "s",
                                    "54"
                                  );
                                },
                              },
                              ,
                              "print",
                            ],
                            drawCallback: function (settings) {
                              // Add color to columns (excluding first column) after each draw
                              $(
                                "#newTable tbody tr td:not(:first-child):not(:nth-child(2))"
                              ).css("background-color", "#f2f2f2");
                            },
                            dom: "Bfrtip",
                          });
                        });
                      };

                      if (String(indicatorSelectedType) == "yearly") {
                        typeYearTable();
                      } else if (String(indicatorSelectedType) == "monthly") {
                        typeMonthTable();
                      } else if (String(indicatorSelectedType) == "quarterly") {
                        typeQuarterTable();
                      }

                      dataListViewTable.innerHTML = table;
                      table = "";
                    });

                    //make the second button in display-option div display chart when clicked
                    $("#displayOptions a:nth-child(2)").click(function () {
                      // Show chart
                      $(".data-display #display_chart").show();
                      let carddisplay =
                        document.getElementById("chart_display");
                      carddisplay.style.display = "block";
                      // Hide table
                      $(".data-display #table-container").hide();
                      $(".data-display #main-card").hide();
                      // $(".data-display #map").hide();

                      // Trigger click event on the "Bar" button
                      $("#bar_btn").trigger("click");
                      // Set the display property of the select dropdown to 'block'
                      $(".indicatorDropdown").css("display", "block");

                      // Set chart button active
                      $("#displayOptions a:nth-child(2)").addClass("active");
                      $("#displayOptions a:nth-child(1)").removeClass("active");
                      // $("#displayOptions a:nth-child(3)").removeClass("active");

                      $(document).ready(function () {
                        document.getElementById("titleForCatagory").innerHTML =
                          theSelectedCatagory.name_ENG;
                        const labelElement =
                          document.getElementById("select_label");
                        const selectElement =
                          document.querySelector(".indicatorDropdown");

                        let years = [];
                        yearTableList.forEach((element) => {
                          years.push(parseInt(element[1]));
                        });

                        if (indicatorSelectedType === "yearly") {
                          let area_main = document.getElementById("main_area");
                          area_main.style.display = "block";
                          // const datasetDropdown = document.getElementById('drop');
                          // datasetDropdown.style.display = 'none'
                          let incicator_drop1 =
                            document.getElementById("drop_two");
                          incicator_drop1.style.display = "none";
                          let incicator_drop3 =
                            document.getElementById("drop_three");
                          incicator_drop3.style.display = "none";
                          // let datasetDropdown1 = document.getElementById('drop_second')
                          // datasetDropdown1.style.display = 'none'

                          document.getElementById(
                            "bar-chart-canvas1"
                          ).style.display = "none";
                          document.getElementById(
                            "series-chart-canvas1"
                          ).style.display = "none";
                          document.getElementById(
                            "line-chart-canvas1"
                          ).style.display = "none";

                          document.getElementById(
                            "bar-chart-canvas"
                          ).style.display = "block";
                          document.getElementById(
                            "series-chart-canvas"
                          ).style.display = "block";
                          document.getElementById(
                            "line-chart-canvas"
                          ).style.display = "block";

                          document.getElementById(
                            "bar-chart-canvas2"
                          ).style.display = "none";
                          document.getElementById(
                            "series-chart-canvas2"
                          ).style.display = "none";
                          document.getElementById(
                            "line-chart-canvas2"
                          ).style.display = "none";

                          // Clear existing charts
                          Highcharts.charts.forEach((chart) => {
                            if (chart) {
                              chart.destroy();
                            }
                          });

                          // Show loading indicator
                          const loadingIndicator =
                            document.getElementById("loadingIndicator");
                          if (loadingIndicator) {
                            loadingIndicator.style.display = "block";
                          }
                          // Hide tab content
                          const tabContent =
                            document.querySelector(".tab-content");
                          if (tabContent) {
                            tabContent.style.display = "none";
                          }

                          // Add event listeners to all nav links
                          const navLinks =
                            document.querySelectorAll(".nav-link");
                          navLinks.forEach((navLink) => {
                            navLink.addEventListener("click", function () {
                              // Toggle the visibility of the label and select elements
                              if (labelElement && selectElement) {
                                // Check if the clicked nav link is the "Area" nav link
                                const isAreaNavLink = this.id === "area";

                                labelElement.style.display = isAreaNavLink
                                  ? "none"
                                  : "block";
                                selectElement.style.display = isAreaNavLink
                                  ? "none"
                                  : "block";
                              }
                              // datasetDropdown.style.display = 'none'
                              incicator_drop3.style.display =
                                this.id === "bar_btn" ||
                                this.id === "series_btn" ||
                                this.id === "line_btn"
                                  ? "none"
                                  : "none";
                              // datasetDropdown1.style.display = (this.id === 'bar_btn' || this.id === 'series_btn' || this.id === 'line_btn') ? 'none' : 'none';
                            });
                          });

                          // Example: Simulate an asynchronous operation (replace this with your actual chart loading logic)
                          setTimeout(() => {
                            // Hide tab content
                            const tabContent =
                              document.querySelector(".tab-content");
                            if (tabContent) {
                              tabContent.style.display = "block";
                            }

                            // Extract data for the chart
                            let chartData = [];
                            let indicators = [];

                            // Filter indicators based on selectedIndictorId
                            let selectedIndicators = data.indicators.filter(
                              ({ id, for_category_id, is_deleted }) => {
                                return (
                                  String(for_category_id) ===
                                    String(selectedCategoryId) &&
                                  selectedIndictorId.includes(String(id)) &&
                                  !is_deleted
                                );
                              }
                            );

                            selectedIndicators.forEach(({ title_ENG, id }) => {
                              let indicatorData = {
                                name: title_ENG,
                                data: [],
                              };

                              for (let j of yearTableList) {
                                let statusData = false;
                                for (let k of data.value) {
                                  if (
                                    String(j[0]) ===
                                      String(k.for_datapoint_id) &&
                                    String(id) === String(k.for_indicator_id)
                                  ) {
                                    indicatorData.data.push({
                                      x: `${j[1]}-E.C`,
                                      y: parseFloat(k.value),
                                    });
                                    statusData = false;
                                    break;
                                  } else {
                                    statusData = true;
                                  }
                                }
                                if (statusData) {
                                  indicatorData.data.push({
                                    x: `${j[1]}-E.C`,
                                    y: null,
                                  });
                                }
                              }

                              chartData.push(indicatorData);
                              indicators.push({ id, title_ENG });
                            });

                            // Convert data to JSON
                            let jsonData = {
                              indicators: indicators,
                              chartData: chartData,
                            };

                            // Select all elements with the class "indicatorDropdown"
                            const dropdowns =
                              document.querySelectorAll(`.indicatorDropdown`);

                            // Iterate over each dropdown and update its options
                            dropdowns.forEach((dropdown) => {
                              dropdown.innerHTML = "";
                            });

                            dropdowns.forEach((dropdown, index) => {
                              dropdown.innerHTML = ""; // Clear existing options
                              indicators.forEach(({ id, title_ENG }, i) => {
                                const option = document.createElement("option");
                                option.value = id;
                                option.text = title_ENG;
                                dropdown.appendChild(option);

                                // Set the first option as selected by default
                                if (i === 0) {
                                  option.selected = true;
                                }
                              });

                              // if (indicatorSelectedType == '') {
                              // Add event listener to the dropdown
                              dropdown.addEventListener("change", function () {
                                const selectedIndictorId = this.value;
                                // Find the selected indicator in jsonData.indicators
                                const selectedIndicator =
                                  jsonData.indicators.find(
                                    (indicator) =>
                                      indicator.id ===
                                      Number(selectedIndictorId)
                                  );

                                if (selectedIndicator) {
                                  // Find the selected indicator's data in jsonData.chartData
                                  const selectedChartData =
                                    jsonData.chartData.find(
                                      (chartItem) =>
                                        chartItem.name ===
                                        selectedIndicator.title_ENG
                                    );

                                  if (
                                    selectedChartData &&
                                    selectedChartData.data
                                  ) {
                                    // Pass the index to identify the correct chart
                                    draw(selectedChartData.data);
                                  } else {
                                    console.error(
                                      "Selected indicator data is undefined in jsonData.chartData."
                                    );
                                  }
                                } else {
                                  console.error(
                                    "Selected indicator is undefined."
                                  );
                                }
                              });
                              // }

                              // Trigger change event on the first dropdown
                              if (index === 0) {
                                dropdown.dispatchEvent(new Event("change"));
                              }
                            });

                            function areachart(alldata) {
                              let allyears = [];
                              let input = document.getElementById("play-range");
                              for (let i of yearTableList) {
                                allyears.push(i[1]);
                              }
                              // Find the minimum and maximum values in allyears array
                              const minYear = Math.min(...allyears);
                              const maxYear = Math.max(...allyears);

                              // Set the min and max attributes of the input range
                              input.min = minYear;
                              input.max = maxYear;

                              const btn =
                                  document.getElementById("play-pause-button"),
                                startYear = minYear,
                                endYear = maxYear;

                              // General helper functions
                              const arrToAssociative = (arr) => {
                                const tmp = {};
                                arr.forEach((item) => {
                                  tmp[item[0]] = item[1];
                                });

                                return tmp;
                              };

                              // ================================== first chart =================================
                              const formatRevenue = [];
                              const chart = Highcharts.chart(
                                "area-chart-canvas",
                                {
                                  chart: {
                                    events: {
                                      load: function () {
                                        const annotations = this.annotations;

                                        if (
                                          annotations &&
                                          annotations[0] &&
                                          annotations[0].labels
                                        ) {
                                          const labels = annotations[0].labels;

                                          // Check if the label with id 'vinyl-label' exists
                                          const vinylLabel = labels.find(
                                            (a) =>
                                              a.options.id === "vinyl-label"
                                          );
                                          if (
                                            vinylLabel &&
                                            vinylLabel.graphic
                                          ) {
                                            vinylLabel.graphic.attr({
                                              rotation: -20,
                                            });
                                          }

                                          // Check if the label with id 'cassettes-label' exists
                                          const cassettesLabel = labels.find(
                                            (a) =>
                                              a.options.id === "cassettes-label"
                                          );
                                          if (
                                            cassettesLabel &&
                                            cassettesLabel.graphic
                                          ) {
                                            cassettesLabel.graphic.attr({
                                              rotation: 20,
                                            });
                                          }
                                        }
                                      },
                                    },
                                    type: "area",
                                    marginTop: 100,
                                    animation: {
                                      duration: 700,
                                      easing: (t) => t,
                                    },
                                  },
                                  title: {
                                    text: "All indicators Values",
                                  },
                                  xAxis: {
                                    categories:
                                      alldata[0] && alldata[0].data
                                        ? alldata[0].data.map(
                                            (point) => point.x
                                          )
                                        : [],
                                    labels: {
                                      rotation: -45,
                                      formatter: function () {
                                        return this.value;
                                      },
                                    },
                                  },
                                  yAxis: {
                                    reversedStacks: false,
                                    title: {
                                      text: "values",
                                    },
                                    labels: {
                                      format: "{text}",
                                    },
                                  },
                                  tooltip: {
                                    split: true,
                                    headerFormat:
                                      '<span style="font-size: 1.2em">{point.x}</span>',
                                    pointFormat:
                                      "{series.name}: <b>{point.y:,.1f} </b> ({point.percentage:.1f}%)",
                                    crosshairs: true,
                                  },
                                  plotOptions: {
                                    area: {
                                      stacking: "normal",
                                      pointStart: startYear,
                                      marker: {
                                        enabled: false,
                                      },
                                    },
                                  },
                                  annotations: [
                                    {
                                      labelOptions: {
                                        borderWidth: 0,
                                        backgroundColor: undefined,
                                        verticalAlign: "middle",
                                        allowOverlap: true,
                                        style: {
                                          pointerEvents: "none",
                                          opacity: 0,
                                          transition: "opacity 500ms",
                                        },
                                      },
                                      labels: [
                                        // Annotation labels
                                      ],
                                    },
                                  ],
                                  responsive: {
                                    rules: [
                                      // Responsive rules
                                    ],
                                  },
                                  series: alldata.map((item) => ({
                                    type: "area",
                                    name: item.name,
                                    data: item.data.map((point) => ({
                                      x: point.x,
                                      y: point.y,
                                    })),
                                  })),
                                }
                              );

                              function pause(button) {
                                button.title = "play";
                                button.className = "fa fa-play";
                                clearTimeout(chart.sequenceTimer);
                                chart.sequenceTimer = undefined;
                              }

                              function update() {
                                if (
                                  !alldata ||
                                  !alldata.length ||
                                  !alldata[0] ||
                                  !alldata[0].data
                                ) {
                                  console.error(
                                    "alldata, alldata[0], or alldata[0].data is undefined."
                                  );
                                  return;
                                }

                                const series = chart.series,
                                  labels =
                                    chart.annotations &&
                                    chart.annotations[0] &&
                                    chart.annotations[0].labels,
                                  selectedYear = parseInt(input.value, 10),
                                  yearIndex = selectedYear - startYear;

                                if (yearIndex >= alldata[0].data.length) {
                                  // Stop the timer if we reach the end of the available data
                                  pause(btn);
                                  return;
                                }

                                // Replace null values with 0
                                alldata.forEach((item) => {
                                  item.data.forEach((point) => {
                                    if (point.y === null) {
                                      point.y = 0;
                                    }
                                  });
                                });

                                // Check if the chart is already initialized
                                if (!chart.sequenceTimer) {
                                  // Perform the initial update
                                  if (series && series.length) {
                                    for (let i = 0; i < series.length; i++) {
                                      // Check if alldata[i] is defined and has a 'data' property
                                      if (alldata[i] && alldata[i].data) {
                                        const seriesData = alldata[
                                          i
                                        ].data.slice(0, yearIndex + 1);
                                        series[i].setData(seriesData, false);
                                      } else {
                                        console.error(
                                          `alldata[${i}] or alldata[${i}].data is undefined.`
                                        );
                                      }
                                    }
                                  } else {
                                    console.error(
                                      "Series is undefined or has a length of 0."
                                    );
                                  }
                                }

                                // If slider moved forward in time
                                if (yearIndex > alldata[0].data.length - 1) {
                                  const remainingYears =
                                    yearIndex - alldata[0].data.length + 1;
                                  for (let i = 0; i < series.length; i++) {
                                    for (
                                      let j = alldata[0].data.length;
                                      j < selectedYear;
                                      j++
                                    ) {
                                      series[i].addPoint(
                                        { x: alldata[i].data[j].x, y: 0 },
                                        false
                                      );
                                    }
                                  }
                                }

                                // Add current year
                                if (series && series.length) {
                                  for (let i = 0; i < series.length; i++) {
                                    const currentData =
                                      alldata[i].data[yearIndex];
                                    if (currentData && currentData.x) {
                                      const match = currentData.x.match(/\d+/g); // Extract numeric values
                                      const currentYear = match
                                        ? parseInt(match[0], 10)
                                        : null;

                                      const newY = currentData.y;
                                      series[i].addPoint(
                                        { x: currentYear, y: newY },
                                        false
                                      );
                                    }
                                  }
                                }

                                labels.forEach((label) => {
                                  if (
                                    label.options.point &&
                                    label.options.point.x
                                  ) {
                                    label.graphic.css({
                                      opacity:
                                        (selectedYear >=
                                          label.options.point.x) |
                                        0,
                                    });
                                  }
                                });

                                chart.redraw();

                                input.value = selectedYear + 1;

                                if (selectedYear >= endYear) {
                                  // Auto-pause
                                  pause(btn);
                                }
                              }

                              function play(button) {
                                // Reset slider at the end
                                if (input.value >= endYear) {
                                  input.value = startYear;
                                }

                                button.title = "pause";
                                button.className = "fa fa-pause";

                                chart.sequenceTimer = setInterval(function () {
                                  const selectedYear = parseInt(
                                    input.value,
                                    10
                                  );
                                  const yearIndex = selectedYear - startYear;

                                  // Check if the year index is within the available range
                                  if (
                                    alldata[0] &&
                                    alldata[0].data &&
                                    yearIndex < alldata[0].data.length
                                  ) {
                                    update();
                                  } else {
                                    // Stop the timer if we reach the end of the available data
                                    pause(button);
                                  }
                                }, 800);
                              }

                              btn.addEventListener("click", function () {
                                if (chart.sequenceTimer) {
                                  pause(this);
                                } else {
                                  play(this);
                                }
                              });

                              play(btn);

                              // Trigger the update on the range bar click.
                              input.addEventListener("input", update);
                            }

                            area_btn = document.getElementById("area");
                            area_btn.addEventListener("click", function () {
                              const areaChartContainer =
                                document.getElementById("area-chart-canvas");
                              if (areaChartContainer) {
                                // Destroy the existing chart
                                Highcharts.charts.forEach((chart) => {
                                  if (
                                    chart &&
                                    chart.renderTo === areaChartContainer
                                  ) {
                                    chart.destroy();
                                  }
                                });

                                // Draw the new chart
                                areachart(jsonData.chartData);
                              } else {
                                console.error(
                                  'Element with id "area-chart-canvas" not found.'
                                );
                              }
                            });

                            function draw(chartdata) {
                              const dropdown =
                                document.querySelector(".indicatorDropdown");
                              const selectedIndicatorName =
                                dropdown.options[dropdown.selectedIndex].text;
                              // ================================================ second chart =======================================
                              Highcharts.chart("series-chart-canvas", {
                                chart: {
                                  zoomType: "x",
                                },
                                title: {
                                  text: selectedIndicatorName,
                                  align: "left",
                                },
                                subtitle: {
                                  text:
                                    document.ontouchstart === undefined
                                      ? "Click and drag in the plot area to zoom in"
                                      : "Pinch the chart to zoom in",
                                  align: "left",
                                },
                                xAxis: {
                                  type: "category",
                                  labels: {
                                    step: 1,
                                  },
                                  accessibility: {
                                    rangeDescription: `Range: ${
                                      chartdata[0].x
                                    } to ${chartdata[chartdata.length - 1].x}`,
                                  },
                                  pointStart: chartdata[0].x,
                                  pointInterval: 1,
                                },
                                legend: {
                                  enabled: false,
                                },
                                plotOptions: {
                                  area: {
                                    fillColor: {
                                      linearGradient: {
                                        x1: 0,
                                        y1: 0,
                                        x2: 0,
                                        y2: 1,
                                      },
                                      stops: [
                                        [0, Highcharts.getOptions().colors[0]],
                                        [
                                          1,
                                          Highcharts.color(
                                            Highcharts.getOptions().colors[0]
                                          )
                                            .setOpacity(0)
                                            .get("rgba"),
                                        ],
                                      ],
                                    },
                                    marker: {
                                      radius: 2,
                                    },
                                    lineWidth: 1,
                                    states: {
                                      hover: {
                                        lineWidth: 1,
                                      },
                                    },
                                    threshold: null,
                                  },
                                },
                                series: [
                                  {
                                    type: "area",
                                    name: selectedIndicatorName,
                                    data: chartdata.map((item) => [
                                      item.x,
                                      item.y !== null ? item.y : 0,
                                    ]),
                                  },
                                ],
                              });

                              //==================================================== third chart===================================================
                              Highcharts.chart("line-chart-canvas", {
                                title: {
                                  text: selectedIndicatorName,
                                  align: "left",
                                },
                                xAxis: {
                                  accessibility: {
                                    rangeDescription: `Range: ${
                                      chartdata[0].x
                                    } to ${chartdata[chartdata.length - 1].x}`,
                                  },
                                  categories: chartdata.map((item) => item.x),
                                },
                                tooltip: {
                                  formatter: function () {
                                      return '<b>' + this.series.name + '</b><br/>' +
                                          this.x + ': ' + this.y;
                                  }
                              },
                                legend: {
                                  layout: "vertical",
                                  align: "right",
                                  verticalAlign: "middle",
                                },
                                series: [
                                  {
                                    name: selectedIndicatorName,
                                    data: chartdata.map((item) =>
                                      item.y !== null ? item.y : 0
                                    ),
                                  },
                                ],
                                responsive: {
                                  rules: [
                                    {
                                      condition: {
                                        maxWidth: 500,
                                      },
                                      chartOptions: {
                                        legend: {
                                          layout: "horizontal",
                                          align: "center",
                                          verticalAlign: "bottom",
                                        },
                                      },
                                    },
                                  ],
                                },
                              });

                              // ======================================= fourth chart create a line chart ==============================
                              // Replace null values with 0
                              const modifiedData = chartdata.map((item) => ({
                                x: item.x,
                                y: item.y !== null ? item.y : 0,
                              }));

                              if (modifiedData.length === 0) {
                                console.error(
                                  "No valid data points to display."
                                );
                                return;
                              }

                              // Check if the dropdown element is found
                              if (dropdown) {
                                Highcharts.chart("bar-chart-canvas", {
                                  chart: {
                                    type: "column",
                                  },
                                  title: {
                                    text: selectedIndicatorName, // Set the title to the selected indicator name
                                  },
                                  xAxis: {
                                    categories: modifiedData.map(
                                      (item) => item.x
                                    ),
                                    // Other xAxis configurations...
                                  },
                                  tooltip: {
                                    formatter: function () {
                                        return '<b>' + this.series.name + '</b><br/>' +
                                            this.x + ': ' + this.y;
                                    }
                                },
                                  series: [
                                    {
                                      name: selectedIndicatorName,
                                      data: modifiedData.map((item) => item.y),
                                    },
                                  ],
                                });
                              } else {
                                console.error("Dropdown element not found.");
                              }
                            }

                            // Hide loading indicator after a delay (simulating data fetching)
                            const loadingIndicator =
                              document.getElementById("loadingIndicator");
                            if (loadingIndicator) {
                              loadingIndicator.style.display = "none";
                            }
                          }, 2000); // Adjust the delay as needed
                        } else if (indicatorSelectedType === "monthly") {
                          let initial2  = false
                          let area_main = document.getElementById("main_area");
                          area_main.style.display = "none";
                          let incicator_drop1 =
                            document.getElementById("drop_first");
                          incicator_drop1.style.display = "none";
                          let incicator_drop2 =
                            document.getElementById("drop_two");
                          incicator_drop2.style.display = "block";
                          let incicator_drop3 =
                            document.getElementById("drop_three");
                          incicator_drop3.style.display = "none";

                          document.getElementById(
                            "bar-chart-canvas"
                          ).style.display = "none";
                          document.getElementById(
                            "series-chart-canvas"
                          ).style.display = "none";
                          document.getElementById(
                            "line-chart-canvas"
                          ).style.display = "none";

                          document.getElementById(
                            "bar-chart-canvas2"
                          ).style.display = "none";
                          document.getElementById(
                            "series-chart-canvas2"
                          ).style.display = "none";
                          document.getElementById(
                            "line-chart-canvas2"
                          ).style.display = "none";

                          document.getElementById(
                            "bar-chart-canvas1"
                          ).style.display = "block";
                          document.getElementById(
                            "series-chart-canvas1"
                          ).style.display = "block";
                          document.getElementById(
                            "line-chart-canvas1"
                          ).style.display = "block";

                          const navLinks =
                            document.querySelectorAll(".nav-link");

                          navLinks.forEach((navLink) => {
                            navLink.addEventListener("click", function () {
                              // Toggle the visibility of the label and select elements
                              if (labelElement && selectElement) {
                                // Check if the clicked nav link is the "Area" nav link
                                const isAreaNavLink = this.id === "area";

                                labelElement.style.display = isAreaNavLink
                                  ? "none"
                                  : "block";
                                selectElement.style.display = isAreaNavLink
                                  ? "none"
                                  : "block";
                              }
                              // Show/hide the second dropdown based on the selected chart type
                              incicator_drop2.style.display =
                                this.id === "line_btn" ? "none" : "none";
                              incicator_drop2.style.display =
                                this.id === "bar_btn" ||
                                this.id === "series_btn"
                                  ? "block"
                                  : "none";
                              incicator_drop1.style.display =
                                this.id === "bar_btn" ||
                                this.id === "series_btn" ||
                                this.id === "line_btn"
                                  ? "none"
                                  : "none";
                              incicator_drop3.style.display =
                                this.id === "bar_btn" ||
                                this.id === "series_btn" ||
                                this.id === "line_btn"
                                  ? "none"
                                  : "none";
                            });
                          });

                          // Show loading indicator
                          const loadingIndicator =
                            document.getElementById("loadingIndicator");
                          if (loadingIndicator) {
                            loadingIndicator.style.display = "block";
                          }

                          // Hide tab content
                          const tabContent =
                            document.querySelector(".tab-content");
                          if (tabContent) {
                            tabContent.style.display = "none";
                          }

                          // Process the data as needed
                          let chartData = [];
                          let indicators = [];

                          // Filter indicators based on selectedIndictorId
                          let selectedIndicators = data.indicators.filter(
                            ({ id, for_category_id, is_deleted }) => {
                              return (
                                String(for_category_id) ===
                                  String(selectedCategoryId) &&
                                selectedIndictorId.includes(String(id)) &&
                                !is_deleted
                              );
                            }
                          );

                          selectedIndicators.forEach(({ title_ENG, id }) => {
                            indicators.push({ id, title_ENG });
                          });
                          // Select all elements with the class "indicatorDropdown"
                          const dropdowns =
                            document.querySelectorAll(`.indicatorDropdown1`);
                          dropdowns.forEach((dropdown, index) => {
                            dropdown.innerHTML = ""; // Clear existing options
                            indicators.forEach(({ title_ENG }, i) => {
                              const option = document.createElement("option");
                              option.value = title_ENG;
                              option.text = title_ENG;
                              dropdown.appendChild(option);

                              // Set the first option as selected by default
                              if (i === 0) {
                                option.selected = true;
                              }
                            });
                          });

                          (async () => {
                            /**
                             * Create the chart when all data is loaded
                             * @return {undefined}
                             */
                            async function bar_chart1(indc_name, chartdata) {
                              const datasetData1 =
                                chartdata.find(
                                  (dataset) => dataset.name === indc_name
                                )?.data || [];
                              // create the chart
                              Highcharts.stockChart("bar-chart-canvas1", {
                                chart: {
                                  alignTicks: false,
                                },

                                rangeSelector: {
                                  selected: 1,
                                },

                                title: {
                                  text: theSelectedCatagory.title_ENG,
                                },
                                events: {
                                  load: function () {
                                    hideLoadingIndicator();
                                  },
                                },

                                series: [
                                  {
                                    type: "column",
                                    name: indc_name,
                                    data: datasetData1,
                                    dataGrouping: {
                                      units: [
                                        [
                                          "week", // unit name
                                          [1], // allowed multiples
                                        ],
                                        ["month", [1, 2, 3, 4, 6]],
                                      ],
                                    },
                                  },
                                ],
                              });
                            }

                            async function draw_line1(
                              selectedIndicator,
                              chartData
                            ) {
                              console.log("clalled line chart");
                              const datasetData =
                                chartData.find(
                                  (dataset) =>
                                    dataset.name === selectedIndicator
                                )?.data || [];
                              // Create the chart
                              Highcharts.stockChart("series-chart-canvas1", {
                                rangeSelector: {
                                  selected: 0,
                                },
                                title: {
                                  text: theSelectedCatagory.title_ENG,
                                },
                                tooltip: {
                                  style: {
                                    width: "200px",
                                  },
                                  valueDecimals: 4,
                                  shared: true,
                                },
                                events: {
                                  load: function () {
                                    hideLoadingIndicator();
                                  },
                                },
                                yAxis: {
                                  title: {
                                    text: "Exchange rate",
                                  },
                                },
                                series: [
                                  {
                                    name: selectedIndicator,
                                    data: datasetData,
                                    id: "dataseries",
                                  },
                                ],
                              });
                            }

                            function createChart1(series) {
                              console.log("called");
                              Highcharts.stockChart("line-chart-canvas1", {
                                rangeSelector: {
                                  selected: 4,
                                },

                                yAxis: {
                                  labels: {
                                    format: "{#if (gt value 0)}+{/if}{value}%",
                                  },
                                  plotLines: [
                                    {
                                      value: 0,
                                      width: 2,
                                      color: "silver",
                                    },
                                  ],
                                },
                                events: {
                                  load: function () {
                                    hideLoadingIndicator();
                                  },
                                },
                                plotOptions: {
                                  series: {
                                    label: {
                                      connectorAllowed: false,
                                    },
                                  },
                                },

                                tooltip: {
                                  pointFormat:
                                    '<span style="color:{series.color}">{series.name}</span>: <b>{point.y}</b><br/>',
                                  valueDecimals: 2,
                                  split: true,
                                },
                                series,
                              });
                            }

                            async function updateChartData1() {
                              console.log("calld update data");
                              // Use AJAX or fetch to get data from the server based on the selected indicator
                              try {
                                const response = await fetch(
                                  `/user-json-filter-month/${selectedCategoryId}/`
                                );
                                const data = await response.json();

                                // Process the data as needed
                                chartData = [];
                                if (Array.isArray(data)) {
                                  data.forEach((category) => {
                                    let arr = [];
                                    category.data.forEach((dataPoint) => {
                                      const dataPointYear = parseInt(
                                        dataPoint[0][0]
                                      );

                                      if (years.includes(dataPointYear)) {
                                        arr.push([
                                          Date.UTC(
                                            dataPoint[0][0],
                                            dataPoint[0][1] - 1,
                                            dataPoint[0][2]
                                          ),
                                          dataPoint[1],
                                        ]);
                                      }
                                    });
                                    chartData.push({
                                      name: category.name,
                                      data: arr,
                                    });
                                  });

                                  const selectedIndicator = $(
                                    ".indicatorDropdown1"
                                  ).val();

                                  createChart1(chartData);
                                  bar_chart1(selectedIndicator, chartData);
                                  draw_line1(selectedIndicator, chartData);
                                } else {
                                  console.error(
                                    "Invalid or missing data format in the response."
                                  );
                                }
                              } catch (error) {
                                console.error("Error fetching data:", error);
                              } finally {
                                // Hide loading indicator after data is loaded (whether successful or not)
                                const loadingIndicator =
                                  document.getElementById("loadingIndicator");
                                if (loadingIndicator) {
                                  loadingIndicator.style.display = "none";
                                }
                                // Hide tab content
                                const tabContent =
                                  document.querySelector(".tab-content");
                                if (tabContent) {
                                  tabContent.style.display = "block";
                                }
                              }
                            }

                            $(".indicatorDropdown1").off('change').on('change', function () {
                              console.log("change from main");
                              updateChartData1();
                          });
                          

                            // Initial load with the first indicator (assuming the first indicator is selected by default)
                            const initialIndicator = $(
                              ".indicatorDropdown1"
                            ).val();

                            // Further check and update as needed
                            if (initialIndicator && initial2 == false) {
                              console.log("called intalization")
                              initial2 = true
                              $(".indicatorDropdown1").change(); // Manually trigger change event
                            } else {
                              console.error(
                                "Initial indicator is not valid or not set correctly."
                              );
                              // Handle the situation where the initial indicator is not valid or not set correctly.
                            }
                          })();
                        } else {
                          let area_main = document.getElementById("main_area");
                          area_main.style.display = "none";
                          let incicator_drop1 =
                            document.getElementById("drop_first");
                          incicator_drop1.style.display = "none";
                          let incicator_drop2 =
                            document.getElementById("drop_two");
                          incicator_drop2.style.display = "none";
                          let incicator_drop3 =
                            document.getElementById("drop_three");
                          incicator_drop3.style.display = "block";
                          let initial1 = false

                          document.getElementById(
                            "bar-chart-canvas"
                          ).style.display = "none";
                          document.getElementById(
                            "series-chart-canvas"
                          ).style.display = "none";
                          document.getElementById(
                            "line-chart-canvas"
                          ).style.display = "none";

                          document.getElementById(
                            "bar-chart-canvas1"
                          ).style.display = "none";
                          document.getElementById(
                            "series-chart-canvas1"
                          ).style.display = "none";
                          document.getElementById(
                            "line-chart-canvas1"
                          ).style.display = "none";

                          document.getElementById(
                            "bar-chart-canvas2"
                          ).style.display = "block";
                          document.getElementById(
                            "series-chart-canvas2"
                          ).style.display = "block";
                          document.getElementById(
                            "line-chart-canvas2"
                          ).style.display = "block";

                          // Show loading indicator
                          const loadingIndicator =
                            document.getElementById("loadingIndicator");
                          if (loadingIndicator) {
                            loadingIndicator.style.display = "block";
                          }
                          // Hide tab content
                          const tabContent =
                            document.querySelector(".tab-content");
                          if (tabContent) {
                            tabContent.style.display = "none";
                          }

                          const navLinks =
                            document.querySelectorAll(".nav-link");
                          navLinks.forEach((navLink) => {
                            navLink.addEventListener("click", function () {
                              // Toggle the visibility of the label and select elements
                              if (labelElement && selectElement) {
                                // Check if the clicked nav link is the "Area" nav link
                                const isAreaNavLink = this.id === "area";

                                labelElement.style.display = isAreaNavLink
                                  ? "none"
                                  : "block";
                                selectElement.style.display = isAreaNavLink
                                  ? "none"
                                  : "block";
                              }
                              // Show/hide the second dropdown based on the selected chart type
                              incicator_drop3.style.display =
                                this.id === "line_btn" ? "none" : "none";
                              incicator_drop3.style.display =
                                this.id === "bar_btn" ||
                                this.id === "series_btn"
                                  ? "block"
                                  : "none";
                              incicator_drop1.style.display =
                                this.id === "bar_btn" ||
                                this.id === "series_btn" ||
                                this.id === "line_btn"
                                  ? "none"
                                  : "none";
                              incicator_drop2.style.display =
                                this.id === "bar_btn" ||
                                this.id === "series_btn" ||
                                this.id === "line_btn"
                                  ? "none"
                                  : "none";
                              // datasetDropdown1.style.display = (this.id === 'bar_btn' || this.id === 'series_btn' || this.id === 'line_btn') ? 'none' : 'none';
                            });
                          });

                          // Process the data as needed
                          let chartData = [];
                          let indicators = [];

                          // Filter indicators based on selectedIndictorId
                          let selectedIndicators = data.indicators.filter(
                            ({ id, for_category_id, is_deleted }) => {
                              return (
                                String(for_category_id) ===
                                  String(selectedCategoryId) &&
                                selectedIndictorId.includes(String(id)) &&
                                !is_deleted
                              );
                            }
                          );

                          selectedIndicators.forEach(({ title_ENG, id }) => {
                            indicators.push({ id, title_ENG });
                          });

                          // Select all elements with the class "indicatorDropdown"
                          const dropdowns =
                            document.querySelectorAll(`.indicatorDropdown2`);
                          dropdowns.forEach((dropdown, index) => {
                            dropdown.innerHTML = ""; // Clear existing options
                            indicators.forEach(({ id, title_ENG }, i) => {
                              const option = document.createElement("option");
                              option.value = title_ENG;
                              option.text = title_ENG;
                              dropdown.appendChild(option);

                              // Set the first option as selected by default
                              if (i === 0) {
                                option.selected = true;
                              }
                            });
                          });

                          (async () => {
                            /**
                             * Create the chart when all data is loaded
                             * @return {undefined}
                             */
                            async function bar_chart2(indc_name, data) {
                              const datasetData1 =
                                data.find(
                                  (dataset) => dataset.name === indc_name
                                )?.data || [];

                              // create the chart
                              Highcharts.stockChart("bar-chart-canvas2", {
                                chart: {
                                  alignTicks: false,
                                },

                                rangeSelector: {
                                  selected: 1,
                                },

                                title: {
                                  text: theSelectedCatagory.title_ENG,
                                },
                                tooltip: {
                                  style: {
                                    width: "200px",
                                  },
                                  valueDecimals: 4,
                                  shared: true,
                                  formatter: function () {
                                    const point = this.points[0];
                                    const value = point.point.options.quarter;
    
                                    let quarter;

                                    switch (value) {
                                      case 1:
                                        quarter = "1";
                                        break;
                                      case 4:
                                        quarter = "2";
                                        break;
                                      case 7:
                                        quarter = "3";
                                        break;
                                      case 10:
                                        quarter = "4";
                                        break;
                                      default:
                                        quarter = "Unknown Quarter";
                                    }

                                    return `<span style="color:${point.color}">${point.series.name}</span>: <b>${point.point.options.y}</b><br/>
                              Quarter: ${quarter}`;
                                  },
                                },

                                series: [
                                  {
                                    type: "column",
                                    name: indc_name,
                                    data: datasetData1,
                                    dataGrouping: {
                                      units: [
                                        [
                                          "week", // unit name
                                          [1], // allowed multiples
                                        ],
                                        ["month", [1, 2, 3, 4, 6]],
                                      ],
                                    },
                                  },
                                ],
                              });
                            }

                            async function draw_line2(
                              selectedIndicator,
                              chartData,
                              selectedDataset
                            ) {
                              console.log('clalled line')
                              const datasetData =
                                chartData.find(
                                  (dataset) =>
                                    dataset.name === selectedIndicator
                                )?.data || [];

                              // Create the chart
                              Highcharts.stockChart("series-chart-canvas2", {
                                rangeSelector: {
                                  selected: 0,
                                },
                                title: {
                                  text: theSelectedCatagory.title_ENG,
                                },
                                tooltip: {
                                  style: {
                                    width: "200px",
                                  },
                                  valueDecimals: 4,
                                  shared: true,
                                  formatter: function () {
                                    const point = this.points[0];
                                    const value = point.point.options.quarter;
                                    let quarter;

                                    switch (value) {
                                      case 1:
                                        quarter = "1";
                                        break;
                                      case 4:
                                        quarter = "2";
                                        break;
                                      case 7:
                                        quarter = "3";
                                        break;
                                      case 10:
                                        quarter = "4";
                                        break;
                                      default:
                                        quarter = "Unknown Quarter";
                                    }

                                    return `<span style="color:${point.color}">${point.series.name}</span>: <b>${point.point.options.y}</b><br/>
                              Quarter: ${quarter}`;
                                  },
                                },
                                yAxis: {
                                  title: {
                                    text: "Exchange rate",
                                  },
                                },
                                series: [
                                  {
                                    name: selectedDataset,
                                    data: datasetData,
                                    id: "dataseries",
                                  },
                                ],
                              });
                            }

                            // Function to create the chart
                            function createChart2(series) {
                              // // Calling to create a new dropdown menu from the dataset names on a single indicator selected
                              // createDatasetDropdown(series);

                              Highcharts.stockChart("line-chart-canvas2", {
                                rangeSelector: {
                                  selected: 4,
                                },

                                yAxis: {
                                  labels: {
                                    format: "{#if (gt value 0)}+{/if}{value}%",
                                  },
                                  plotLines: [
                                    {
                                      value: 0,
                                      width: 2,
                                      color: "silver",
                                    },
                                  ],
                                },

                                plotOptions: {
                                  series: {
                                    label: {
                                      connectorAllowed: false,
                                    },
                                  },
                                },
                                tooltip: {
                                  formatter: function () {
                                    const point = this.points[0];
                                    const quarter = point.point.options.quarter;

                                    switch (quarter) {
                                      case 1:
                                        return `<span style="color:${point.color}">${point.series.name}</span>: <b>${point.y}</b><br/>Quarter: 1`;
                                      case 4:
                                        return `<span style="color:${point.color}">${point.series.name}</span>: <b>${point.y}</b><br/>Quarter:  2`;
                                      case 7:
                                        return `<span style="color:${point.color}">${point.series.name}</span>: <b>${point.y}</b><br/>Quarter:  3`;
                                      case 10:
                                        return `<span style="color:${point.color}">${point.series.name}</span>: <b>${point.y}</b><br/>Quarter:  4`;
                                      default:
                                        return `<span style="color:${point.color}">${point.series.name}</span>: <b>${point.y}</b><br/>Quarter: Unknown Quarter`;
                                    }
                                  },
                                  valueDecimals: 2,
                                  shared: true,
                                },

                                series,
                              });
                            }

                            // Function to fetch and update data based on the selected indicator
                            async function updateChartData2() {
                              try {
                                // Use AJAX or fetch to get data from the server based on the selected indicator
                                const response = await fetch(
                                  `/user-json-filter-quaarter/${selectedCategoryId}/`
                                );
                                const data = await response.json();

                                // Process the data as needed
                                chartData = [];
                                if (Array.isArray(data)) {
                                  data.forEach((category) => {
                                    let arr = [];
                                    category.data.forEach((dataPoint) => {
                                      const quarterValue = dataPoint[0][1];
                                      arr.push({
                                        x: Date.UTC(
                                          dataPoint[0][0],
                                          quarterValue - 1,
                                          dataPoint[0][2]
                                        ),
                                        y: dataPoint[1],
                                        quarter: quarterValue,
                                      });
                                    });
                                    chartData.push({
                                      name: category.name,
                                      data: arr,
                                    });
                                  });

                                  const selectedIndicator = $(
                                    ".indicatorDropdown2"
                                  ).val();
                                  bar_chart2(selectedIndicator, chartData);
                                  draw_line2(selectedIndicator, chartData);
                                  // Call the createChart function with the updated data
                                  createChart2(chartData);
                                } else {
                                  console.error(
                                    "Invalid or missing data format in the response."
                                  );
                                }
                              } catch (error) {
                                console.error("Error fetching data:", error);
                              } finally {
                                // Hide loading indicator after data is loaded (whether successful or not)
                                const loadingIndicator =
                                  document.getElementById("loadingIndicator");
                                if (loadingIndicator) {
                                  loadingIndicator.style.display = "none";
                                }
                                // Hide tab content
                                const tabContent =
                                  document.querySelector(".tab-content");
                                if (tabContent) {
                                  tabContent.style.display = "block";
                                }
                              }
                            }

                            $(".indicatorDropdown2").off('change').on('change', function () {
                              console.log("change from main");
                              updateChartData2();
                          });
                            // Initial load with the first indicator (assuming the first indicator is selected by default)
                            const initialIndicator = $(
                              ".indicatorDropdown2"
                            ).val();

                            // Further check and update as needed
                            if (initialIndicator && initial1 == false) {
                              initial1 = true
                              $(".indicatorDropdown2").change(); // Manually trigger change event
                            } else {
                              console.error(
                                "Initial indicator is not valid or not set correctly."
                              );
                              // Handle the situation where the initial indicator is not valid or not set correctly.
                            }
                          })();
                        }
                      });
                    });
                    //End Indicator table
                    indicatorSelectedType = "yearly";
                  } catch (error) {
                    console.error("Error:", error);
                  }
                }
                fecthindicator();
              }
            );
            //end
          } catch (error) {
            console.error("Error:", error);
          }
        }
        fetchCategoryData();
      });
    },
    error: function (jqXHR, textStatus, errorThrown) {
      console.error("Error fetching data: " + textStatus, errorThrown);
    },
  });
}

$(document).ready(function () {
  filterData();

  // Initialize the filter selection card
  jQuery(document).on(
    "change",
    '.filter-submenu input[type="checkbox"], .filter-submenu input[type="radio"]',
    function () {
      $(".card").show();
      // Hide data display section by default
      $(".data-display").hide();

      updateFilterSelection();
    }
  );

  $(".card").show();
  // Hide data display section by default
  $(".data-display").hide();

  //collpase button
  $("#toggleButton").click(function () {
    $("#filterColumn").toggleClass("d-none");
    $("#dataColumn").toggleClass("col-md-8 col-lg-12");
  });

  //make the first button in display-option div display table when clicked
  $("#displayOptions a:nth-child(1)").click(function () {
    // Show table
    $(".data-display #table-container").show();
    $("#display_chart").hide();

    // Hide chart
    $(".data-display #chart").hide();
    $(".data-display #map").hide();

    // Set table button active
    $("#displayOptions a:nth-child(1)").addClass("active");
    $("#displayOptions a:nth-child(2)").removeClass("active");
    $("#displayOptions a:nth-child(3)").removeClass("active");
  });

  // Add event listener to table button to be active color
  $("#tableButton").click(function () {
    // Show table
    $(".data-display #table-container").show();

    // Hide chart
    $(".data-display #chart").hide();
    $(".data-display #map").hide();

    // Set table button active
    $("#tableButton").addClass("active");
    $("#chartButton").removeClass("active");
    $("#mapbutton").removeClass("active");
  });

  // Add event listener to chart button to be active color
  $("#chartButton").click(function () {
    // Show chart
    $(".data-display #chart").show();

    // Hide table
    $(".data-display #table-container").hide();
    $(".data-display #map").hide();

    // Set chart button active
    $("#chartButton").addClass("active");
    $("#tableButton").removeClass("active");
    $("#mapbutton").removeClass("active");
  });

  const snippets = document.querySelectorAll(".snippet");

  for (let i = 0; i < snippets.length; i++) {
    snippets[i].addEventListener("mouseleave", clearTooltip);
    snippets[i].addEventListener("blur", clearTooltip);
  }

  function showTooltip(el, msg) {
    el.setAttribute("class", "snippet tooltip");
    el.setAttribute("aria-label", msg);
  }

  function clearTooltip(e) {
    e.currentTarget.setAttribute("class", "snippet");
    e.currentTarget.removeAttribute("aria-label");
  }

  const clipboardSnippets = new ClipboardJS(".snippet", {
    text: (trigger) => trigger.getAttribute("data-title"),
  });

  clipboardSnippets.on("success", (e) => {
    e.clearSelection();
    showTooltip(e.trigger, "Copied!");
  });

  clipboardSnippets.on("error", (e) => {
    showTooltip(e.trigger, "Copy failed!");
  });
});
