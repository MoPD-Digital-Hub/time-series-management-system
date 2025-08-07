let showLoading = (divID) =>{
  document.getElementById(`${divID}`).style.display = 'block'
}

let hideLoading = (divID) =>{
 document.getElementById(`${divID}`).style.display = "none"
}


$(document).ready(function () {
  let urlPath = window.location.pathname;
  let pathID = urlPath.replace("/user-admin/data-list-detail/", "");
  let url = `/user-admin/json-indicator/${pathID}/`;
  
  showLoading('loading_div')
  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      hideLoading('loading_div')
      data.year = data.year.reverse()
      let parentIndicator = data.indicators.find((item) => item.parent == null);

      let currentIndicator = data.indicators.find(
        (indicator) => String(indicator.id) == String(pathID)
      );

      //Edit Measurement
      let currentMeasurement = data.measurements.find(
        (measure) => String(measure.id) == String(currentIndicator.measurement)
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
        `<select name="measurement_form" id="measurement_option_id_select" class="form-select">` +
        measurementOptions +
        `</select>`;
      let measurementHtml = document.getElementById("measurementOptionId");
      measurementHtml.innerHTML = measurementOptions;

      //Assign Measurement
      try {
        document.getElementById("measurement_option_id_select").value =
          currentMeasurement.id;
      } catch {
        null;
      }

      let table = "";

      //Check What Type Indicator is
      //Yearly
      if (String(currentIndicator.type_of) === "yearly") {
        table += `
        <table id="newTable" class="table table-bordered table-responsive m-0 p-0" style="width:100%;">
      <thead>
        <tr>
          <th  style="padding-left: 270px !important;padding-right: 270px !important;" class="ps-5 pe-5">Name</th>`;

        for (let year of data.year) {
          let checkActual = data.indicator_point.find(
            (item) =>
              String(item.for_indicator_id) == String(parentIndicator.id) &&
              String(item.for_datapoint_id) == String(year.id)
          );
          let is_actual = checkActual
            ? checkActual.is_actual
              ? "Actual"
              : "Not Actual"
            : "No Data";

          table += `<th style="font-size: small;" class = "text-center">${
            year.year_EC
          }-E.C </br>${year.year_GC}-G.C  <hr> <button id="${
            checkActual ? checkActual.id : null
          }" yearId = ${
            year.id
          } name="btnEditIsActual" class="btn btn-sm btn-secondary fw-sm" data-bs-toggle="modal" data-bs-target="#isActualModal" > ${is_actual} </button>   </th>`;
        }

        table += `</tr>
                   </thead> 
                  <tbody>`;

        data.indicators.map(
          ({ title_ENG, title_AMH, id, for_category, is_deleted, op_type }) => {
            if (for_category != null && is_deleted == false) {
              let title_amharic = "";
              if (!title_AMH === null) title_amharic = " - " + title_AMH;
              //Table Row Start
              let checkParentHasChild = false;

              for (check of data.indicators) {
                if (
                  String(check.parent_id) === String(id) &&
                  check.is_deleted == false
                ) {
                  checkParentHasChild = true;
                }
              }
              table += `
        <tr>
          <td class="fw-bold">
              <div class="row">
                <div class="col-7">
                    ${title_ENG} ${title_amharic}
                </div>
                <div class="col-2">
                (${op_type})
              </div>
                <div class="col-1">
                  <button type="button" name="btnAddIndicator" indicator_id="${id}" data-bs-toggle="modal"  data-bs-target="#addIndicatorModal"  class="btn btn-outline-primary border-0  pt-1 pb-1" data-bs-toggle="tooltip" data-bs-placement="bottom" title="Add new Sub-Indicator">+</button> 
                </div>
                <div class="col-1">
                  <button type="button" name="btnDeleteIndicator" indicator_id="${id}" data-bs-toggle="modal"  data-bs-target="#removeIndicatorModal"  class="btn btn-outline-danger border-0  pt-1 pb-1" data-bs-toggle="tooltip" data-bs-placement="bottom" title="Remove Indicator">-</button> 
                </div>
               
                
              </div>
          </td>
           `;

              for (year of data.year) {
                let statusData = false;
                if (data.value.length > 0 ){
                  for (value of data.value) {
                    if (
                      String(year.id) === String(value.for_datapoint_id) &&
                      String(id) === String(value.for_indicator_id)
                    ) {
                      if (checkParentHasChild) {
                        if (value.value != null) {
                          table += `<td class="p-0"><button id="${value.id}" value="${value.value}" data-bs-toggle="modal" name="btnIndicator" data-bs-target="#indicatorEditValue" class="btn btn-outline-secondary border-0 ps-5 pe-5 pt-2 pb-2 fw-bold text-dark">${value.value}</button></td>`;
                        } else {
                          table += ` <td class="p-0"><button data-bs-toggle="modal"  id="${id}-${year.id}" name="btnIndicator" data-bs-target="#indicatorEditValue" class="btn btn-outline-secondary border-0 ps-5 pe-5 pt-2 pb-2"> mmm </button></td>`;
                        }
                      } else {
                        table += ` <td class="p-0"><button id="${value.id}" value="${value.value}" data-bs-toggle="modal" name="btnIndicator" data-bs-target="#indicatorEditValue" class="btn btn-outline-secondary border-0 ps-5 pe-5 pt-2 pb-2">${value.value}</button></td>`;
                      }
  
                      statusData = false;
                      break;
                    } else {
                      statusData = true;
                    }
                  }
                }else{
                  if (checkParentHasChild) {
                    table += ` <td class="p-0"><button data-bs-toggle="modal"  id="${id}-${year.id}" name="btnIndicator" data-bs-target="#indicatorEditValue" class="btn btn-outline-secondary border-0 ps-5 pe-5 pt-2 pb-2"> - </button></td>`;
                  } else {
                    table += ` <td class="p-0"><button data-bs-toggle="modal"  id="${id}-${year.id}" name="btnIndicator" data-bs-target="#indicatorEditValue" class="btn btn-outline-secondary border-0 ps-5 pe-5 pt-2 pb-2"> - </button></td>`;
                  }
                }
                if (statusData) {
                  if (checkParentHasChild) {
                    table += `<td class="p-0"><button data-bs-toggle="modal"  id="${id}-${year.id}" name="btnIndicator" data-bs-target="#indicatorEditValue" class="btn btn-outline-secondary border-0 ps-5 pe-5 pt-2 pb-2"> - </button></td>`;
                  } else {
                    table += ` <td class="p-0"><button data-bs-toggle="modal"  id="${id}-${year.id}" name="btnIndicator" data-bs-target="#indicatorEditValue" class="btn btn-outline-secondary border-0 ps-5 pe-5 pt-2 pb-2"> - </button></td>`;
                  }
                }
              }
              table += `</tr>`;
              //Table Row End
              if (checkParentHasChild) {
                for (let indicator of data.indicators) {
                  let checkChildHasChild = false;

                  for (check of data.indicators) {
                    if (
                      String(check.parent_id) === String(indicator.id) &&
                      check.is_deleted == false
                    ) {
                      checkChildHasChild = true;
                    }
                  }

                  if (
                    String(indicator.parent_id) == String(id) &&
                    indicator.is_deleted == false
                  ) {
                    test = true;
                    //Table Row Start
                    table += `
                             <tr>
                               <td class="fw-normal">   
                                   <div class="row">
                                     <div class="col-7">
                                         &nbsp;&nbsp;&nbsp;&nbsp;  ${indicator.title_ENG}
                                     </div>
                                     ${checkChildHasChild ? ` <div class="col-2">
                                     (${indicator.op_type})
                                   </div>` : ' <div class="col-2"></div>'}
                                     <div class="col-1">
                                         <button type="button" name="btnAddIndicator" indicator_id="${indicator.id}" data-bs-toggle="modal"  data-bs-target="#addIndicatorModal"  class="btn btn-outline-primary border-0  pt-1 pb-1" data-bs-toggle="tooltip" data-bs-placement="bottom" title="Add new Sub-Indicator">+</button> 
                                     </div>
                                     <div class="col-1">
                                       <button type="button" name="btnDeleteIndicator" indicator_id="${indicator.id}" data-bs-toggle="modal"  data-bs-target="#removeIndicatorModal"  class="btn btn-outline-danger border-0  pt-1 pb-1" data-bs-toggle="tooltip" data-bs-placement="bottom" title="Remove Indicator">-</button> 
                                     </div>
                                   </div>
                               </td>
                             `;

                    //Child of Child List
                    let table_child_list = (parent, space) => {
                      space += String("&nbsp;&nbsp;&nbsp;&nbsp");
                      let status = false;

                      for (i of data.indicators) {
                        if (
                          String(i.parent_id) === String(parent) &&
                          i.is_deleted == false
                        ) {
                          let checkChildOfChildHasChild = false;
                          for (check of data.indicators) {
                            if (
                              String(check.parent_id) === String(i.id) &&
                              check.is_deleted == false
                            ) {
                              checkChildOfChildHasChild = true;
                            }
                          }
                          status = true;
                          //Table Row Start
                          table += `
                           <tr>
                           <td class="fw-normal">
                             <div class="row">
                               <div class="col-7">
                                 &nbsp;&nbsp;&nbsp;&nbsp; ${space} ${i.title_ENG}
                               </div>
                               ${checkChildOfChildHasChild ? ` <div class="col-2">
                               (${indicator.op_type})
                             </div>` : ' <div class="col-2"></div>'}
                               <div class="col-1">
                                 <button type="button" name="btnAddIndicator" indicator_id="${i.id}" data-bs-toggle="modal"  data-bs-target="#addIndicatorModal"  class="btn btn-outline-primary border-0  pt-1 pb-1" data-bs-toggle="tooltip" data-bs-placement="bottom" title="Add new Sub-Indicator">+</button>
                               </div>
                               <div class="col-1">
                             <button type="button" name="btnDeleteIndicator" indicator_id="${i.id}" data-bs-toggle="modal"  data-bs-target="#removeIndicatorModal"  class="btn btn-outline-danger border-0  pt-1 pb-1" data-bs-toggle="tooltip" data-bs-placement="bottom" title="Remove Indicator">-</button> 
                           </div>
                             </div>
                           </td>`;

                          for (year of data.year) {
                            let statusData = false;
                            if(data.value.length > 0 ){
                              for (value of data.value) {
                                if (
                                  String(year.id) ===
                                    String(value.for_datapoint_id) &&
                                  String(i.id) === String(value.for_indicator_id)
                                ) {
                                  if (checkChildOfChildHasChild) {
                                    if (value.value != null) {
                                      table += ` <td class="p-0"><button id="${value.id}" value="${value.value}" data-bs-toggle="modal" name="btnIndicator" data-bs-target="#indicatorEditValue" class="btn btn-outline-secondary border-0 ps-5 pe-5 pt-2 pb-2">${value.value}</button></td>`;
                                    } else {
                                      table += `<td class="text-center fw-bold"> - </td>`;
                                    }
                                  } else {
                                    if (value.value != null) {
                                      table += `<td class="p-0"><button id="${value.id}" value="${value.value}" data-bs-toggle="modal" name="btnIndicator" data-bs-target="#indicatorEditValue" class="btn btn-outline-secondary border-0 ps-5 pe-5 pt-2 pb-2">${value.value}</button></td>`;
                                    } else {
                                      table += ` <td class="p-0"><button id="${value.id}" value="${value.value}" data-bs-toggle="modal" name="btnIndicator" data-bs-target="#indicatorEditValue" class="btn btn-outline-secondary border-0 ps-5 pe-5 pt-2 pb-2"> - </button></td>`;
                                    }
                                  }
                                  statusData = false;
                                  break;
                                } else {
                                  statusData = true;
                                }
                              }
                            }else{
                              if (checkChildOfChildHasChild) {
                                table += `<td class="p-0"><button data-bs-toggle="modal" name="btnIndicator"  id="${i.id}-${year.id}" data-bs-target="#indicatorEditValue" class="btn btn-outline-secondary border-0 ps-5 pe-5 pt-2 pb-2"> - </button></td>`;
                              } else {
                                table += ` <td class="p-0"><button data-bs-toggle="modal" name="btnIndicator"  id="${i.id}-${year.id}" data-bs-target="#indicatorEditValue" class="btn btn-outline-secondary border-0 ps-5 pe-5 pt-2 pb-2"> - </button></td>`;
                              }
                            }
                            if (statusData) {
                              if (checkChildOfChildHasChild) {
                                table += `<td class="text-center fw-bold"> - </td>`;
                              } else {
                                table += ` <td class="p-0"><button data-bs-toggle="modal" name="btnIndicator"  id="${i.id}-${year.id}" data-bs-target="#indicatorEditValue" class="btn btn-outline-secondary border-0 ps-5 pe-5 pt-2 pb-2"> - </button></td>`;
                              }
                            }
                          }

                          table += `</tr>`;

                          //Table Row End

                          //child.push(`<option value=${i.id}> ${space} ${i.title_ENG} ${i.title_AMH} </option>`)
                          table_child_list(i.id, String(space));
                        }
                      }
                    };

                    //Child List
                    for (year of data.year) {
                      let statusData = false;
                      if(data.value.length > 0){
                        for (value of data.value) {
                          if (
                            String(year.id) === String(value.for_datapoint_id) &&
                            String(indicator.id) ===
                              String(value.for_indicator_id) &&
                            indicator.is_deleted == false
                          ) {
                            if (checkChildHasChild) {
                              if (value.value != null) {
                                table += `<td class="p-0"><button id="${value.id}" value="${value.value}" data-bs-toggle="modal" name="btnIndicator" data-bs-target="#indicatorEditValue" class="btn btn-outline-secondary border-0 ps-5 pe-5 pt-2 pb-2 fw-bold text-dark">${value.value}</button></td>`;
                              } else {
                                table += `<td class="text-center fw-bold"> - </td>`;
                              }
                            } else {
                              if (value.value != null) {
                                table += ` <td class="p-0"><button id="${value.id}" value="${value.value}" data-bs-toggle="modal" name="btnIndicator" data-bs-target="#indicatorEditValue" class="btn btn-outline-secondary border-0 ps-5 pe-5 pt-2 pb-2">${value.value}</button></td>`;
                              } else {
                                table += ` <td class="p-0"><button id="${value.id}" value="${value.value}" data-bs-toggle="modal" name="btnIndicator" data-bs-target="#indicatorEditValue" class="btn btn-outline-secondary border-0 ps-5 pe-5 pt-2 pb-2"> - </button></td>`;
                              }
                            }
                            statusData = false;
                            break;
                          } else {
                            statusData = true;
                          }
                        }
                      }else{
                        if (checkChildHasChild) {
                          table += `<td class="text-center fw-bold"> - </td>`;
                        } else {
                          table += ` <td class="p-0"><button data-bs-toggle="modal" name="btnIndicator"  id="${indicator.id}-${year.id}" data-bs-target="#indicatorEditValue" class="btn btn-outline-secondary border-0 ps-5 pe-5 pt-2 pb-2"> - </button></td>`;
                        }
                      }
                      if (statusData) {
                        if (checkChildHasChild) {
                          table += ` <td class="p-0"><button data-bs-toggle="modal" name="btnIndicator"  id="${indicator.id}-${year.id}" data-bs-target="#indicatorEditValue" class="btn btn-outline-secondary border-0 ps-5 pe-5 pt-2 pb-2"> - </button></td>`;
                        } else {
                          table += ` <td class="p-0"><button data-bs-toggle="modal" name="btnIndicator"  id="${indicator.id}-${year.id}" data-bs-target="#indicatorEditValue" class="btn btn-outline-secondary border-0 ps-5 pe-5 pt-2 pb-2"> - </button></td>`;
                        }
                      }
                    }

                    table += `</tr>`;

                    //Table Row End

                    if (checkChildHasChild) {
                      table_child_list(indicator.id, " ");
                    }
                  }
                }
              }
            }
          }
        );

        $(document).ready(function () {
          $("#newTable").DataTable({
            retrieve: true,
            ordering: false,
            initComplete: function (settings, json) {
              $("#DataTableID").wrap(
                "<div style='overflow:auto; position:relative;'></div>"
              );
            },
            responsive: true,
            paging: true,
            searching: true,
            orderNumber: true,
            lengthMenu: [
              [36, 72, 108, -1],
              ["36 rows", "72 rows", "108 rows", "Show all"],
            ],
            buttons: ["pageLength"],
            columnDefs: [{ width: "100%" }],
            dom: "Bfrtip",
          });
      
        });



      }

      // Monthly
      else if (String(currentIndicator.type_of) === "monthly") {
        table += `
        <style>
                  table.dataTable th {
                    writing-mode: vertical-lr !important;
                    vertical-align: middle !important;
                    transform: rotate(180deg) !important;
                }
                </style>
        <table id="newTable" class="table table-bordered table-responsive m-0 p-0" style="width:100%;">
        <thead>
          <tr class="text-center">
          <th style="padding-left: 100px !important;padding-right: 100px !important;" class="vertical-text border">Year</th>
          <th style="padding-left: 100px !important;padding-right: 100px !important;" class="vertical-text border">Month</th>`;

        if (currentIndicator) {
          let title_amharic = "";
          if (!currentIndicator.title_AMH === null)
            title_amharic = " - " + currentIndicator.title_AMH;

          table += ` <th class="vertical-text border" ">
                        <button type="button" name="btnAddIndicator" indicator_id="${currentIndicator.id}" data-bs-toggle="modal"  data-bs-target="#addIndicatorModal"  class="btn  horizontal-text btn-outline-primary border-0  pt-1 pb-1" data-bs-toggle="tooltip" data-bs-placement="bottom" title="Add new Sub-Indicator">+</button>
                        ${currentIndicator.title_ENG} ${title_amharic} (${currentIndicator.op_type})
                        <div class="horizontal-text">
                           <button type="button" name="btnDeleteIndicator" indicator_id="${currentIndicator.id}" data-bs-toggle="modal"  data-bs-target="#removeIndicatorModal"  class="btn btn-outline-danger border-0  pt-1 pb-1" data-bs-toggle="tooltip" data-bs-placement="bottom" title="Remove Indicator">-</button> 
                           </div>
                      </th>`;

          let childIndicatorList = (parent, space) => {
            space += String("&nbsp;&nbsp;&nbsp;&nbsp");
            let status = false;

            for (let indicator of data.indicators) {
              if (
                String(indicator.parent_id) === String(parent) &&
                indicator.is_deleted == false
              ) {
                test = true;
                table += ` <th class="vertical-text fw-normal border" ">
                              <button type="button" name="btnAddIndicator" indicator_id="${indicator.id}" data-bs-toggle="modal"  data-bs-target="#addIndicatorModal"  class="btn  horizontal-text btn-outline-primary border-0  pt-1 pb-1" data-bs-toggle="tooltip" data-bs-placement="bottom" title="Add new Sub-Indicator">+</button>
                             ${space} ${indicator.title_ENG} ${title_amharic}
                              <div class="horizontal-text">
                                 <button type="button" name="btnDeleteIndicator" indicator_id="${indicator.id}" data-bs-toggle="modal"  data-bs-target="#removeIndicatorModal"  class="btn btn-outline-danger border-0  pt-1 pb-1" data-bs-toggle="tooltip" data-bs-placement="bottom" title="Remove Indicator">-</button> 
                               </div>                
                        </th>`;

                childIndicatorList(indicator.id, String(space));
              }
            }
          };

          //Child List
          for (let indicator of data.indicators) {
            if (
              String(indicator.parent_id) == String(currentIndicator.id) &&
              indicator.is_deleted == false
            ) {
              test = true;
              table += ` <th class="vertical-text fw-normal border" ">
                              <button type="button" name="btnAddIndicator" indicator_id="${indicator.id}" data-bs-toggle="modal"  data-bs-target="#addIndicatorModal"  class="btn  horizontal-text btn-outline-primary border-0  pt-1 pb-1" data-bs-toggle="tooltip" data-bs-placement="bottom" title="Add new Sub-Indicator">+</button>
                              &nbsp;&nbsp; ${indicator.title_ENG} ${title_amharic}
                              <div class="horizontal-text">
                                 <button type="button" name="btnDeleteIndicator" indicator_id="${indicator.id}" data-bs-toggle="modal"  data-bs-target="#removeIndicatorModal"  class="btn btn-outline-danger border-0  pt-1 pb-1" data-bs-toggle="tooltip" data-bs-placement="bottom" title="Remove Indicator">-</button> 
                               </div>
                        </th>`;

              childIndicatorList(indicator.id, " ");
            }
          }
        }

        table += `</tr>
                   </thead>
                <tbody>`;

        //year loop
        for (let year of data.year) {
          let checkYearPrint = false;

          let checkActual = data.indicator_point.find(
            (item) =>
              String(item.for_indicator_id) == String(currentIndicator.id) &&
              String(item.for_datapoint_id) == String(year.id)
          );

          let is_actual = checkActual
            ? checkActual.is_actual
              ? "Actual"
              : "Not Actual"
            : "No Data";

          //month loop
          for (let month of data.month) {
            table += `
            <tr class="text-center">`;

            if (!checkYearPrint) {
              table += `<td style="width: 28%;"  class="border-bottom-0 fw-bold">${
                year.year_EC
              }-E.C : ${year.year_GC}-G.C
              <button id="${checkActual ? checkActual.id : null}" yearId = ${
                year.id
              } name="btnEditIsActual" class="btn btn-sm btn-secondary fw-sm" data-bs-toggle="modal" data-bs-target="#isActualModal" > ${is_actual} </button> 
              </td>`;
            } else {
              table += ` <td class="border-0"><p style="display:none">${year.year_EC}-E.C : ${year.year_GC}-G.C </p></td>`;
            }

            table += `                     
            <td class="fw-bold " style="width: 22%;" >${month.month_AMH}: ${month.month_ENG}</td>`;

            if (currentIndicator) {
              let checkParentHasChild = data.indicators.find(
                (item) =>
                  String(item.parent_id) === String(currentIndicator.id) &&
                  !item.is_deleted
              );

              let currentDataValue = data.value.find((value) => {
                if (
                  String(value.for_month_id) === String(month.id) &&
                  String(value.for_indicator_id) ===
                    String(currentIndicator.id) &&
                  String(value.for_datapoint_id) === String(year.id)
                ) {
                  return value;
                }
              });

              //Print Main Indicator Value
              if (currentDataValue) {
                  table += `<td class="p-0"><button id="${
                    currentDataValue.id
                  }" value="${
                    currentDataValue.value
                  }" data-bs-toggle="modal" name="btnIndicator" data-bs-target="#indicatorEditValue" class="btn btn-outline-secondary border-0 ps-5 pe-5 pt-2 pb-2">${
                    currentDataValue.value ? currentDataValue.value : " - "
                  }</button></td>`;
                
              } else {
                if (checkParentHasChild) {
                  table += ` <td class="p-0"><button data-bs-toggle="modal"  id="${currentIndicator.id}-${year.id}-${month.id}" name="btnIndicator" data-bs-target="#indicatorEditValue" class="btn btn-outline-secondary border-0 ps-5 pe-5 pt-2 pb-2"> - </button></td>`;
                } else {
                  table += ` <td class="p-0"><button data-bs-toggle="modal"  id="${currentIndicator.id}-${year.id}-${month.id}" name="btnIndicator" data-bs-target="#indicatorEditValue" class="btn btn-outline-secondary border-0 ps-5 pe-5 pt-2 pb-2"> - </button></td>`;
                }
              }

              //Filter Only Child Indicator
              let childIndicators = data.indicators.filter(
                (item) =>
                  String(item.parent_id) == String(currentIndicator.id) &&
                  !item.is_deleted
              );

              //Child of Child
              let childIndicatorDataValue = (parent) => {
                let filterChild = data.indicators.filter(
                  (item) =>
                    String(item.parent_id) == String(parent) && !item.is_deleted
                );
                if (filterChild) {
                  for (indicatorList of filterChild) {
                    valueData = data.value.find((value) => {
                      if (
                        String(value.for_month_id) === String(month.id) &&
                        String(value.for_indicator_id) ===
                          String(indicatorList.id) &&
                        String(value.for_datapoint_id) === String(year.id)
                      ) {
                        return value;
                      }
                    });

                    let checkChildHasChild = data.indicators.find(
                      (item) =>
                        String(item.parent_id) === String(indicatorList.id) &&
                        !item.is_deleted
                    );

                    if (valueData) {
                      if (checkChildHasChild) {
                        table += `<td  style="width: 10%"; class="text-center fw-bold"> ${
                          valueData.value ? valueData.value : " - "
                        } </td>`;
                      } else {
                        table += `<td class="p-0"><button id="${
                          valueData.id
                        }" value="${
                          valueData.value
                        }" data-bs-toggle="modal" name="btnIndicator" data-bs-target="#indicatorEditValue" class="btn btn-outline-secondary border-0 ps-5 pe-5 pt-2 pb-2">${
                          valueData.value ? valueData.value : " - "
                        }</button></td>`;
                      }
                    } else {
                      if (checkChildHasChild) {
                        table += ` <td class="p-0"><button data-bs-toggle="modal"  id="${indicatorList.id}-${year.id}-${month.id}" name="btnIndicator" data-bs-target="#indicatorEditValue" class="btn btn-outline-secondary border-0 ps-5 pe-5 pt-2 pb-2"> - </button></td>`;
                      } else {
                        table += ` <td class="p-0"><button data-bs-toggle="modal"  id="${indicatorList.id}-${year.id}-${month.id}" name="btnIndicator" data-bs-target="#indicatorEditValue" class="btn btn-outline-secondary border-0 ps-5 pe-5 pt-2 pb-2"> - </button></td>`;
                      }
                    }
                    childIndicatorDataValue(indicatorList.id);
                  }
                }
              };

              //Child Data
              for (let childIndicator of childIndicators) {
                valueData = data.value.find((value) => {
                  if (
                    String(value.for_month_id) === String(month.id) &&
                    String(value.for_indicator_id) ===
                      String(childIndicator.id) &&
                    String(value.for_datapoint_id) === String(year.id)
                  ) {
                    return value;
                  }
                });

                let checkChildHasChild = data.indicators.find(
                  (item) =>
                    String(item.parent_id) === String(childIndicator.id) &&
                    !item.is_deleted
                );

                if (valueData) {
                  if (checkChildHasChild) {
                    table += `<td class="p-0"><button id="${
                      valueData.id
                    }" value="${
                      valueData.value
                    }" data-bs-toggle="modal" name="btnIndicator" data-bs-target="#indicatorEditValue" class="btn btn-outline-secondary border-0 ps-5 pe-5 pt-2 pb-2">${
                      valueData.value ? valueData.value : " - "
                    }</button></td>`;
                  }
                } else {
                  if (checkChildHasChild) {
                    table += `<td class="p-0"><button data-bs-toggle="modal"  id="${childIndicator.id}-${year.id}-${month.id}" name="btnIndicator" data-bs-target="#indicatorEditValue" class="btn btn-outline-secondary border-0 ps-5 pe-5 pt-2 pb-2"> - </button></td>`;
                  } else {
                    table += ` <td class="p-0"><button data-bs-toggle="modal"  id="${childIndicator.id}-${year.id}-${month.id}" name="btnIndicator" data-bs-target="#indicatorEditValue" class="btn btn-outline-secondary border-0 ps-5 pe-5 pt-2 pb-2"> - </button></td>`;
                  }
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
            initComplete: function (settings, json) {
              $("#DataTableID").wrap(
                "<div style='overflow:auto; position:relative;'></div>"
              );
            },
            responsive: true,
            paging: true,
            searching: true,
            orderNumber: true,
            lengthMenu: [
              [36, 72, 108, -1],
              ["36 rows", "72 rows", "108 rows", "Show all"],
            ],
            buttons: ["pageLength"],
            columnDefs: [{ width: "100%" }, { width: "300px", targets: 0 }],
            dom: "Bfrtip",
          });
        });
      }

      //Quarterly
      else if (String(currentIndicator.type_of) === "quarterly") {
        table += `
        <style>
                  table.dataTable th {
                    writing-mode: vertical-lr !important;
                    vertical-align: middle !important;
                    transform: rotate(180deg) !important;
                }
                </style>
        <table id="newTable" class="table table-responsive table-bordered m-0 p-0" style="width:100%;">
        <thead>
          <tr class="text-center">
          <th style="padding-left: 100px !important;padding-right: 100px !important;"   class="vertical-text border">Year</th>
          <th style="padding-left: 100px !important;padding-right: 100px !important;"   class="vertical-text border">Month</th>`;

        if (currentIndicator) {
          let title_amharic = "";
          if (!currentIndicator.title_AMH === null)
            title_amharic = " - " + currentIndicator.title_AMH;

          table += ` <th class="vertical-text border" ">
                        <button type="button" name="btnAddIndicator" indicator_id="${currentIndicator.id}" data-bs-toggle="modal"  data-bs-target="#addIndicatorModal"  class="btn  horizontal-text btn-outline-primary border-0  pt-1 pb-1" data-bs-toggle="tooltip" data-bs-placement="bottom" title="Add new Sub-Indicator">+</button>
                        ${currentIndicator.title_ENG} ${title_amharic}  (${currentIndicator.op_type})
                        <div class="horizontal-text">
                           <button type="button" name="btnDeleteIndicator" indicator_id="${currentIndicator.id}" data-bs-toggle="modal"  data-bs-target="#removeIndicatorModal"  class="btn btn-outline-danger border-0  pt-1 pb-1" data-bs-toggle="tooltip" data-bs-placement="bottom" title="Remove Indicator">-</button> 
                         </div>
                      </th>`;

          let childIndicatorList = (parent, space) => {
            space += String("&nbsp;&nbsp;&nbsp;&nbsp");
            let status = false;

            for (let indicator of data.indicators) {
              if (
                String(indicator.parent_id) === String(parent) &&
                indicator.is_deleted == false
              ) {
                test = true;
                table += ` <th class="vertical-text fw-normal border" ">
                              <button type="button" name="btnAddIndicator" indicator_id="${indicator.id}" data-bs-toggle="modal"  data-bs-target="#addIndicatorModal"  class="btn  horizontal-text btn-outline-primary border-0  pt-1 pb-1" data-bs-toggle="tooltip" data-bs-placement="bottom" title="Add new Sub-Indicator">+</button>
                             ${space} ${indicator.title_ENG} ${title_amharic}
                              <div class="horizontal-text">
                                 <button type="button" name="btnDeleteIndicator" indicator_id="${indicator.id}" data-bs-toggle="modal"  data-bs-target="#removeIndicatorModal"  class="btn btn-outline-danger border-0  pt-1 pb-1" data-bs-toggle="tooltip" data-bs-placement="bottom" title="Remove Indicator">-</button> 
                               </div>                
                        </th>`;

                childIndicatorList(indicator.id, String(space));
              }
            }
          };

          //Child List
          for (let indicator of data.indicators) {
            if (
              String(indicator.parent_id) == String(currentIndicator.id) &&
              indicator.is_deleted == false
            ) {
              test = true;
              table += ` <th class="vertical-text fw-normal border" ">
                              <button type="button" name="btnAddIndicator" indicator_id="${indicator.id}" data-bs-toggle="modal"  data-bs-target="#addIndicatorModal"  class="btn  horizontal-text btn-outline-primary border-0  pt-1 pb-1" data-bs-toggle="tooltip" data-bs-placement="bottom" title="Add new Sub-Indicator">+</button>
                              &nbsp;&nbsp; ${indicator.title_ENG} ${title_amharic}
                              <div class="horizontal-text">
                                 <button type="button" name="btnDeleteIndicator" indicator_id="${indicator.id}" data-bs-toggle="modal"  data-bs-target="#removeIndicatorModal"  class="btn btn-outline-danger border-0  pt-1 pb-1" data-bs-toggle="tooltip" data-bs-placement="bottom" title="Remove Indicator">-</button> 
                               </div>
                        </th>`;

              childIndicatorList(indicator.id, " ");
            }
          }
        }

        table += `</tr>
                   </thead>
                <tbody>`;

        //year loop
        for (let year of data.year) {
          let checkYearPrint = false;

          let checkActual = data.indicator_point.find(
            (item) =>
              String(item.for_indicator_id) == String(currentIndicator.id) &&
              String(item.for_datapoint_id) == String(year.id)
          );

          let is_actual = checkActual
            ? checkActual.is_actual
              ? "Actual"
              : "Not Actual"
            : "No Data";

          //month loop
          for (let quarter of data.quarter) {
            table += `
            <tr class="text-center">`;

            if (!checkYearPrint) {
              table += `<td style="width: 28%;"  class="border-bottom-0 fw-bold">${
                year.year_EC
              }-E.C : ${year.year_GC}-G.C
              <button id="${checkActual ? checkActual.id : null}" yearId = ${
                year.id
              } name="btnEditIsActual" class="btn btn-sm btn-secondary fw-sm" data-bs-toggle="modal" data-bs-target="#isActualModal" > ${is_actual} </button> 
              </td>`;
            } else {
              table += ` <td class="border-0"></td>`;
            }

            table += `                     
            <td class="fw-bold " style="width: 22%;" >${quarter.title_AMH}: ${quarter.title_ENG}</td>`;

            if (currentIndicator) {
              let checkParentHasChild = data.indicators.find(
                (item) =>
                  String(item.parent_id) === String(currentIndicator.id) &&
                  !item.is_deleted
              );

              let currentDataValue = data.value.find((value) => {
                if (
                  String(value.for_quarter_id) === String(quarter.id) &&
                  String(value.for_indicator_id) ===
                    String(currentIndicator.id) &&
                  String(value.for_datapoint_id) === String(year.id)
                ) {
                  return value;
                }
              });



              //Print Main Indicator Value
              if (currentDataValue) {
                table += `<td class="p-0"><button id="${
                  currentDataValue.id
                }" value="${
                  currentDataValue.value
                }" data-bs-toggle="modal" name="btnIndicator" data-bs-target="#indicatorEditValue" class="btn btn-outline-secondary border-0 ps-5 pe-5 pt-2 pb-2">${
                  currentDataValue.value ? currentDataValue.value : " - "
                }</button></td>`;
              } else {
                if (checkParentHasChild) {
                  table += ` <td class="p-0"><button data-bs-toggle="modal"  id="${currentIndicator.id}-${year.id}-${quarter.id}" name="btnIndicator" data-bs-target="#indicatorEditValue" class="btn btn-outline-secondary border-0 ps-5 pe-5 pt-2 pb-2"> - </button></td>`;
                } else {
                  table += ` <td class="p-0"><button data-bs-toggle="modal"  id="${currentIndicator.id}-${year.id}-${quarter.id}" name="btnIndicator" data-bs-target="#indicatorEditValue" class="btn btn-outline-secondary border-0 ps-5 pe-5 pt-2 pb-2"> - </button></td>`;
                }
              }

              //Filter Only Child Indicator
              let childIndicators = data.indicators.filter(
                (item) =>
                  String(item.parent_id) == String(currentIndicator.id) &&
                  !item.is_deleted
              );

              //Child of Child
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
                        String(value.for_quarter_id) === String(quarter.id) &&
                        String(value.for_indicator_id) ===
                          String(indicatorList.id) &&
                        String(value.for_datapoint_id) === String(year.id)
                      ) {
                        return value;
                      }
                    });

                    let checkChildHasChild = data.indicators.find(
                      (item) =>
                        String(item.parent_id) === String(indicatorList.id) &&
                        !item.is_deleted
                    );

                    if (valueData) {
                      if (checkChildHasChild) {
                        table += `<td  style="width: 10%"; class="text-center fw-bold"> ${
                          valueData.value ? valueData.value : " - "
                        } </td>`;
                      }else{
                        table += `<td class="p-0"><button id="${
                          valueData.id
                        }" value="${
                          valueData.value
                        }" data-bs-toggle="modal" name="btnIndicator" data-bs-target="#indicatorEditValue" class="btn btn-outline-secondary border-0 ps-5 pe-5 pt-2 pb-2">${
                          valueData.value ? valueData.value : " - "
                        }</button></td>`;
                      }
                    } else {
                      if (checkChildHasChild) {
                        table += ` <td class="p-0"><button data-bs-toggle="modal"  id="${indicatorList.id}-${year.id}-${month.id}" name="btnIndicator" data-bs-target="#indicatorEditValue" class="btn btn-outline-secondary border-0 ps-5 pe-5 pt-2 pb-2"> - </button></td>`;
                      } else {
                        table += ` <td class="p-0"><button data-bs-toggle="modal"  id="${indicatorList.id}-${year.id}-${month.id}" name="btnIndicator" data-bs-target="#indicatorEditValue" class="btn btn-outline-secondary border-0 ps-5 pe-5 pt-2 pb-2"> - </button></td>`;
                      }
                    }
                    childIndicatorDataValue(indicatorList.id);
                  }
                }
              };

              //Child Data
              for (let childIndicator of childIndicators) {
                valueData = data.value.find((value) => {
                  if (
                    String(value.for_quarter_id) === String(quarter.id) &&
                    String(value.for_indicator_id) ===
                      String(childIndicator.id) &&
                    String(value.for_datapoint_id) === String(year.id)
                  ) {
                    return value;
                  }
                });

                let checkChildHasChild = data.indicators.find(
                  (item) =>
                    String(item.parent_id) === String(childIndicator.id) &&
                    !item.is_deleted
                );

                if (valueData) {
                  if (checkChildHasChild) {
                    table += `<td class="p-0"><button id="${
                      valueData.id
                    }" value="${
                      valueData.value
                    }" data-bs-toggle="modal" name="btnIndicator" data-bs-target="#indicatorEditValue" class="btn btn-outline-secondary border-0 ps-5 pe-5 pt-2 pb-2">${
                      valueData.value ? valueData.value : " - "
                    }</button></td>`;
                  } else {
                    if (checkChildHasChild) {
                      table += `<td class="p-0"><button data-bs-toggle="modal"  id="${childIndicator.id}-${year.id}-${month.id}" name="btnIndicator" data-bs-target="#indicatorEditValue" class="btn btn-outline-secondary border-0 ps-5 pe-5 pt-2 pb-2"> - </button></td>`;
                    } else {
                      table += ` <td class="p-0"><button data-bs-toggle="modal"  id="${childIndicator.id}-${year.id}-${month.id}" name="btnIndicator" data-bs-target="#indicatorEditValue" class="btn btn-outline-secondary border-0 ps-5 pe-5 pt-2 pb-2"> - </button></td>`;
                    }
                  }
                } else {
                  if (checkChildHasChild) {
                    table += `<td  style="width: 10%"; class="text-center fw-bold">  -  </td>`;
                  } else {
                    table += ` <td class="p-0"><button data-bs-toggle="modal"  id="${childIndicator.id}-${year.id}-${quarter.id}" name="btnIndicator" data-bs-target="#indicatorEditValue" class="btn btn-outline-secondary border-0 ps-5 pe-5 pt-2 pb-2"> - </button></td>`;
                  }
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
            initComplete: function (settings, json) {
              $("#DataTableID").wrap(
                "<div style='overflow:auto; position:relative;'></div>"
              );
            },
            responsive: true,
            paging: true,
            searching: true,
            orderNumber: true,
            lengthMenu: [
              [36, 72, 108, -1],
              ["36 rows", "72 rows", "108 rows", "Show all"],
            ],
            buttons: ["pageLength"],
            columnDefs: [{ width: "100%" }, { width: "300px", targets: 0 }],
            dom: "Bfrtip",
          });
        });
      }

      document.getElementById("tableTest").innerHTML = table;

      let btnIndicator = document.getElementsByName("btnIndicator");

      btnIndicator.forEach((clickableButton) => {
        clickableButton.addEventListener("click", (eventButton) => {
          let target = eventButton.target.getAttribute("id");
          let form1 = document.getElementById("form_1");
          let form2 = document.getElementById("form_2");
          let indicatorInput = document.getElementById("indicator_id");
          let dataPointInput = document.getElementById("data_point_id");
          let monthInput = document.getElementById("month_id");
          let quarterInput = document.getElementById("quarter_id");

          try {
            target = target.split("-");
            let indicatorId = target[0];
            let yearId = target[1];

            if (String(currentIndicator.type_of) == "yearly") {
              if (yearId != undefined) {
                indicatorInput.value = indicatorId;
                dataPointInput.value = yearId;

                form2.style.display = "none";
                form1.style.display = "block";
              } else {
                let value_id = eventButton.target.getAttribute("id");
                let value = eventButton.target.getAttribute("value");
                form1.style.display = "none";
                form2.style.display = "block";
                document.getElementById("data_value").value = value_id;
                let setValue = (document.getElementById(
                  "id_value_form2"
                ).value = value);
              }
            } else if (String(currentIndicator.type_of) == "monthly") {
              if (yearId) {
                indicatorInput.value = indicatorId;
                dataPointInput.value = yearId;
                monthInput.value = target[2];

                form2.style.display = "none";
                form1.style.display = "block";
              } else {
                let value_id = eventButton.target.getAttribute("id");
                let value = eventButton.target.getAttribute("value");
                form1.style.display = "none";
                form2.style.display = "block";
                document.getElementById("data_value").value = value_id;
                document.getElementById("id_value_form2").value = value;
              }
            } else if (String(currentIndicator.type_of) == "quarterly") {
              if (yearId) {
                indicatorInput.value = indicatorId;
                dataPointInput.value = yearId;
                quarterInput.value = target[2];

                form2.style.display = "none";
                form1.style.display = "block";
              } else {
                let value_id = eventButton.target.getAttribute("id");
                let value = eventButton.target.getAttribute("value");
                form1.style.display = "none";
                form2.style.display = "block";
                document.getElementById("data_value").value = value_id;
                document.getElementById("id_value_form2").value = value;
              }
            }
          } catch {
            null;
          }
        });
      });

      //Add Indicator
      let addIndicator = () => {
        let btnAddIndicator = document.getElementsByName("btnAddIndicator");
        btnAddIndicator.forEach((clickableButton) => {
          clickableButton.addEventListener("click", (eventButton) => {
            let indicatorId = eventButton.target.getAttribute("indicator_id");
            document.getElementById("addNewIndicatorId").value = indicatorId;
          });
        });
      };

      //Add Operation
      let addOpration = () => {
        let btnAddOperation = document.getElementsByName("btnOperationAdd");
        btnAddOperation.forEach((clickableButtonOperation) => {
          clickableButtonOperation.addEventListener("click", () => {
            let indicatorId = clickableButtonOperation.getAttribute('indicator_op_id');
            document.getElementById("indicator_operation_id").value = indicatorId;
          });
        });
      };


      let removeIndicator = () => {
        //Remove Indicator
        let btnRemoveIndicator =
          document.getElementsByName("btnDeleteIndicator");
        btnRemoveIndicator.forEach((btn) => {
          btn.addEventListener("click", (eventDelete) => {
            let indicatorId = eventDelete.target.getAttribute("indicator_id");
            document
              .getElementById("forRemoveIndicator")
              .setAttribute(
                "href",
                `/user-admin/indicator-delete/${indicatorId}`
              );
          });
        });
      };

      addOpration();
      addIndicator();
      removeIndicator();
     

      let parentContainer = document.querySelector("#list_table_view");
      parentContainer.addEventListener("click", () => {
        addOpration();
        addIndicator();
        removeIndicator();
       
      });

      //Edit Actual
      let btnActual = document.getElementsByName("btnEditIsActual");
      btnActual.forEach((btn) => {
        btn.addEventListener("click", () => {
          console.log("clicked", btn.id);
          let selectedYearId = btn.getAttribute("yearId");
          let indicatorPoint = data.indicator_point.find(
            (item) => String(item.id) == String(btn.id)
          );

          if (indicatorPoint) {
            if (indicatorPoint.is_actual) {
              document.getElementById("isActualInput").checked = true;
            } else {
              document.getElementById("isActualInput").checked = false;
            }
          }
          console.log(selectedYearId);
          document.getElementById("indicatorYearId").value = selectedYearId;
        });
      });

      // Save pagination state to local storage when the page changes
      $("#newTable").on("page.dt", function () {
        var pageInfo = $("#newTable").DataTable().page.info();
        localStorage.setItem("paginationState", JSON.stringify(pageInfo));
      });

      // Retrieve pagination state from local storage and set the table to the correct page on page load
      $(document).ready(function () {
        var savedPaginationState = localStorage.getItem("paginationState");
        if (savedPaginationState) {
          var pageInfo = JSON.parse(savedPaginationState);
          $("#newTable").DataTable().page(pageInfo.page).draw(false);
        }
      });

      //Calculate Graph
      
      if (currentIndicator.type_of == "yearly") {
        //Filter Date, and values
        data.year = data.year.reverse()
        let minYear = data.new_year[0].year_EC;

        console.log(minYear)

        const data_set = data.new_year.map((year) => {
          const value = data.value.find(
            (value) =>
              String(value.for_indicator_id) === String(currentIndicator.id) &&
              value.for_month_id === null &&
              String(value.for_datapoint_id) === String(year.id) &&
              value.is_deleted == false
          );
          return value ? value.value : null;
        });

        Highcharts.chart("container", {
          chart: {
            type: "area",
          },
          title: {
            text: `${currentIndicator.title_ENG}`,
          },
          xAxis: {
            allowDecimals: false,
            accessibility: {
              rangeDescription: "Range: 1967 to 2015.",
            },
          },
          tooltip: {
            pointFormat: "{series.name}",
          },
          plotOptions: {
            area: {
              pointStart: parseInt(minYear),
              marker: {
                enabled: false,
                symbol: "circle",
                radius: 2,
                states: {
                  hover: {
                    enabled: true,
                  },
                },
              },
            },
          },

          tooltip: {
            pointFormat:
              '<span style="color:{series.color}">{series.name}</span>: <b>{point.y}</b><br/>',
            valueDecimals: 2,
            split: true,
          },
          series: [
            {
              name: `${currentIndicator.title_ENG}`,
              data: data_set,
            },
          ],
        });
      } else if (String(currentIndicator.type_of) == "monthly") {
        data.year = data.year.reverse()
        let childIndicator = data.indicators.filter(
          (item) => String(item.parent_id) == String(currentIndicator.id)
        );

      
        let data_set = []
        if(childIndicator.length > 0){
          for (child of childIndicator) {
            let arr = [];
            for (year of data.year) {
              for (month of data.month) {
                let value = data.value.find(
                  (value) =>
                    String(value.for_indicator_id) == String(child.id) &&
                    value.for_month_id == String(month.id) &&
                    String(value.for_datapoint_id) == String(year.id) &&
                    value.is_deleted == false
                );
                if (value) {
                  arr.push([Date.UTC(parseInt(year.year_EC), parseInt(month.number), 1), parseInt(value.value)]);
                }
              }
            }
            data_set.push({'name' : child.title_ENG, 'data' : arr})
          }
        }else{
          let arr = [];
          for (year of data.year) {
            for (month of data.month) {
              let value = data.value.find(
                (value) =>
                  String(value.for_indicator_id) == String(currentIndicator.id) &&
                  value.for_month_id == String(month.id) &&
                  String(value.for_datapoint_id) == String(year.id) &&
                  value.is_deleted == false
              );
              if (value) {
                arr.push([Date.UTC(parseInt(year.year_EC), parseInt(month.number), 1), parseInt(value.value)]);
              }
            }
          }
          data_set.push({'name' : currentIndicator.title_ENG, 'data' : arr})
        }

     

      

        (async () => {
          /**
           * Create the chart when all data is loaded
           * @return {undefined}
           */
          function createChart(series) {
            Highcharts.stockChart("container", {
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
                pointFormat:
                  '<span style="color:{series.color}">{series.name}</span>: <b>{point.y}</b><br/>',
                valueDecimals: 2,
                split: true,
              },

              series,
            });
          }
          createChart(data_set);
        })();


        
      }else if (String(currentIndicator.type_of) == "quarterly") {
        data.year = data.year.reverse()
        let childIndicator = data.indicators.filter(
          (item) => String(item.parent_id) == String(currentIndicator.id)
        );

      
        let data_set = []
        if(childIndicator.length > 0){
          for (child of childIndicator) {
            let arr = [];
            for (year of data.year) {
              for (quarter of data.quarter) {
                let value = data.value.find(
                  (value) =>
                    String(value.for_indicator_id) == String(child.id) &&
                    value.for_quarter_id == String(quarter.id) &&
                    String(value.for_datapoint_id) == String(year.id) &&
                    value.is_deleted == false
                );
                if (value) {
                  arr.push([Date.UTC(parseInt(year.year_EC), parseInt(quarter.number), 1), parseInt(value.value)]);
                }
              }
            }
            data_set.push({'name' : child.title_ENG, 'data' : arr})
          }
        }else{
          let arr = [];
          for (year of data.year) {
            for (quarter of data.quarter) {
              let value = data.value.find(
                (value) =>
                  String(value.for_indicator_id) == String(currentIndicator.id) &&
                  value.for_quarter_id == String(quarter.id) &&
                  String(value.for_datapoint_id) == String(year.id) &&
                  value.is_deleted == false
              );
              if (value) {
                arr.push([Date.UTC(parseInt(year.year_EC), parseInt(quarter.number), 1), parseInt(value.value)]);
              }
            }
          }
          data_set.push({'name' : currentIndicator.title_ENG, 'data' : arr})
        }


  
     

      

        (async () => {
          /**
           * Create the chart when all data is loaded
           * @return {undefined}
           */
          function createChart(series) {
            Highcharts.stockChart("container", {
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
                pointFormat:
                  '<span style="color:{series.color}">{series.name}</span>: <b>{point.y}</b><br/>',
                valueDecimals: 2,
                split: true,
              },

              series,
            });
          }
          createChart(data_set);
        })();
      }
    })
    .catch((err) => console.log(err));
});
