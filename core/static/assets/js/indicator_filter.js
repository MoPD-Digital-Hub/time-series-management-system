$(document).ready(function () {
  let filterIndicator = () => {
    fetch("/user-admin/json-filter-indicator/")
      .then((response) => response.json())
      .then((data) => {
        //Add New indicator
        selectTopicOptions = data.topics.map(
          ({ title_ENG, title_AMH, id, is_deleted }) => {
            if (!is_deleted) {
              return `<option value="${id}">${title_ENG}</option>`;
            }
          }
        );
        let topicOption = document.getElementById("topic_option");
        topicOption.innerHTML =
          `<option >---------</option>` + selectTopicOptions;

        topicOption.addEventListener("change", () => {
          let selectedTopic =
            topicOption.options[topicOption.selectedIndex].value;
          console.log(selectedTopic);

          let categoryOption = data.categories.map(
            ({ name_ENG, name_AMH, id, topic_id, is_deleted }) => {
              if (String(topic_id) === String(selectedTopic)) {
                if (!is_deleted) {
                  return `<option value="${id}">${name_ENG} - ${name_AMH}</option>`;
                } else {
                  return null;
                }
              } else {
                return null;
              }
            }
          );

          document.getElementById("for_category_add").innerHTML =
            `<option value="" selected="">---------</option>` + categoryOption;
          categoryOption = "";
        });

        let titleEnglish = document.getElementById("id_title_ENG");
        let titleAmharic = document.getElementById("id_title_AMH");
        let category = document.getElementById("id_for_category");
        let type = document.getElementById("id_type_of");
        let op_type = document.getElementById("id_operation_type");
        let category_div = document.getElementById("id_category_option");
        let parentContainer = document.querySelector("#list_table_view");
        let is_public_html = document.getElementById("id_is_public")

        //Edit Indicator Function
        let editIndicatorModal = () => {
          let btnEdit = document.getElementsByName("EditIndicator");
          btnEdit.forEach((editIndicator) => {
            editIndicator.addEventListener("click", () => {
              let indicatorId = editIndicator.id;
              category_div.style.display = "block";
              //Selected Indicator
              let selectedIndicator = data.indicators.find(
                (indicator) => String(indicator.id) == String(indicatorId)
              );

              //Selected Category
              let selectCategory = data.categories.find(
                (cat) =>
                  String(cat.id) == String(selectedIndicator.for_category_id)
              );

              //Selected Measurement
              let currentMeasurement = data.measurements.find(
                (measure) =>
                  String(measure.id) == String(selectedIndicator.measurement_id)
              );

              let measurementOptions = "";

              //Child Measurement
              let measurementChild = (parent) => {
                let status = false;

                for (measure of data.measurements) {
                  if (
                    String(measure.parent_id) === String(parent.id) &&
                    !measure.is_deleted
                  ) {
                    for (check of data.measurements) {
                      if (
                        String(measure.id) === String(check.parent_id) &&
                        !measure.is_deleted
                      ) {
                        status = true;
                      }
                    }

                    if (status == true) {
                      measurementOptions += `<optgroup label="${measure.Amount_ENG}">`;
                      measurementChild(measure);
                      measurementOptions += ` </optgroup>`;
                    } else {
                      measurementOptions += `<option value="${measure.id}" >${measure.Amount_ENG}</option>`;
                    }
                  }
                }
              };

              //Parent Measurement
              for (measure of data.measurements) {
                if (!measure.parent_id && !measure.is_deleted) {
                  measurementOptions += `<optgroup label="${measure.Amount_ENG}">`;
                  measurementChild(measure);
                  measurementOptions += ` </optgroup>`;
                }
              }

              measurementOptions =
                `<label class="mt-2">Measurement</label>
                <select name="measurement_form" id="measurement_option_id_select" class="form-select">` +
                measurementOptions +
                `</select>`;
              let measurementHtml = document.getElementById(
                "measurementOptionId"
              );
              measurementHtml.innerHTML = measurementOptions;

              //Assign Measurement
              try {
                document.getElementById("measurement_option_id_select").value =
                  currentMeasurement.id;
              } catch {
                null;
              }

              if (selectedIndicator.title_AMH == null)
                selectedIndicator.title_AmH = "";
              titleEnglish.value = selectedIndicator.title_ENG;
              titleAmharic.value = selectedIndicator.title_AMH;
              if (selectedIndicator.type_of == null) {
                type.value = "yearly";
              } else {
                type.value = selectedIndicator.type_of;
              }
              if (selectedIndicator.op_type == null) {
                op_type = "sum";
              } else {
                op_type.value = selectedIndicator.op_type;
              }
              is_public_html.value = selectedIndicator.is_public
              is_public_html.checked = selectedIndicator.is_public
              category.value = selectCategory.id;
              document.getElementById("id_indicator_id").value = indicatorId;
            });
          });
        };

        //Remove Indicators Function
        let removeIndicatorModal = () => {
          let btnDelete = document.getElementsByName("btnDeleteIndicator");
          btnDelete.forEach((deleteIndicator) => {
            deleteIndicator.addEventListener("click", () => {
              console.log(deleteIndicator.id);
              let approveAnchor = document.getElementById("forRemoveIndicator");
              approveAnchor.setAttribute(
                "href",
                `/user-admin/indicator-delete/${deleteIndicator.id}`
              );
              console.log(approveAnchor);
            });
          });
        };

        //Call for First Time
        editIndicatorModal();
        removeIndicatorModal();

        //Call After table is Changed
        parentContainer.addEventListener("click", (event) => {
          //Edit Indicator re-initializing
          editIndicatorModal();
          //Remove Indicator re-initializing
          removeIndicatorModal();
        });

        selectTopic = data.topics.map(
          ({ title_ENG, title_AMH, id, is_deleted }) => {
            if (!is_deleted) {
              return `
              <li>
                <div class="flex-grow-2 ">
                   <div class="row ">
                      <div class="col-1"> 
                      <input type="radio" value=${id} name="topic_lists" id="topic_list${id}">
                      </div>
                      <div class="col-11">
                      <label for="topic_list${id}" style="font-size: small;" class="mb-0">${title_ENG} - ${title_AMH}</label>
                     </div>
                  </div>
            </li>
              `;
            }
          }
        );
        //apply Button
        let displayApplyButton = document.getElementById("apply_button");

        topicHtml = document.getElementById("topic_list_filter");
        topicHtml.innerHTML = selectTopic.join("");

        topicHtmlList = document.getElementsByName("topic_lists");

        topicHtmlList.forEach((topicRadio) => {
          topicRadio.addEventListener("change", (event) => {
            displayApplyButton.style.display = "none";
            selectedTopicId = event.target.value;

            let selectCategory = data.categories.map(
              ({ name_ENG, name_AMH, id, topic_id, is_deleted }) => {
                if (String(topic_id) === String(selectedTopicId)) {
                  if (!is_deleted) {
                    return `
                    <li>
                    <div class="flex-grow-2 ">
                       <div class="row ">
                          <div class="col-1"> 
                               <input  type="radio" value=${id} name="category_lists" id="category_list${id}">
                          </div>
                          <div class="col-11">
                             <label class="form-label" for="category_list${id}" style="font-size: small;">${name_ENG} - ${name_AMH}</label></div>
                         </div>
                      </div>
                  </li>
                    `;
                  }
                }
              }
            );

            categoryHtml = document.getElementById("category_list_filter");
            categoryHtml.innerHTML = selectCategory.join("");
            categoryHtmlList = document.getElementsByName("category_lists");

            categoryHtmlList.forEach((radioCategory) => {
              radioCategory.addEventListener("change", () => {
                displayApplyButton.style.display = "block";
                displayApplyButton.setAttribute(
                  "href",
                  `/user-admin/indicators-list/${radioCategory.value}`
                );

                // Edit Indicator
                let btnEdit = document.getElementsByName("EditIndicator");
                btnEdit.forEach((editIndicator) => {
                  editIndicator.addEventListener("click", () => {
                    let indicatorId = editIndicator.id;
                    let titleEnglish = document.getElementById("id_title_ENG");
                    let titleAmharic = document.getElementById("id_title_AMH");
                    let category = document.getElementById("id_for_category");

                    let selectedIndicator = data.indicators.find(
                      (indicator) => String(indicator.id) == String(indicatorId)
                    );
                    let selectCategory = data.categories.find(
                      (cat) =>
                        String(cat.id) ==
                        String(selectedIndicator.for_category_id)
                    );
                    if (selectedIndicator.title_AMH == null)
                      selectedIndicator.title_AmH = "";
                    titleEnglish.value = selectedIndicator.title_ENG;
                    titleAmharic.value = selectedIndicator.title_AMH;
                    category.value = selectCategory.id;
                    document.getElementById("id_indicator_id").value;
                  });
                });
              });
            });
          });
        });
      })
      .catch((err) => console.log(err));
  };

  filterIndicator();
});
