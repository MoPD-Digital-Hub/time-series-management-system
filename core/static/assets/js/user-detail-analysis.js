
let showLoading = (divID) =>{
  document.getElementById(`${divID}`).style.display = 'block'
}

let hideLoading = (divID) =>{
 document.getElementById(`${divID}`).style.display = "none"
}


$(document).ready(function () {
    let urlPath = window.location.pathname;
    let pathID = urlPath.replace("/detail-analysis/", "");
    let url = `/user-json-indicator/${pathID}/`;

    showLoading('loading_div')
    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        hideLoading('loading_div')
        data.year = data.new_year
        
        let currentIndicator = data.indicators.find((item) => item.parent == null);

        document.getElementById('currentTitleIndicator').innerHTML = currentIndicator.title_ENG
        let table = "";
  
        //Check What Type Indicator is
        //Yearly
        if (String(currentIndicator.type_of) === "yearly") {
          table += `
          <table id="newTable" class="table  table-responsive m-0 p-0" style="width:100%;">
        <thead>
          <tr>
            <th  style="padding-left: 200px !important;padding-right: 200px !important;" class="ps-5 pe-5">Name</th>`;
  
          for (let year of data.year) {
            let checkActual = data.indicator_point.find(
              (item) =>
                String(item.for_indicator_id) == String(parentIndicator.id) &&
                String(item.for_datapoint_id) == String(year.id)
            );
  
            table += `<th style="font-size: small;" class = "border text-center">${
              year.year_EC
            }-E.C </br>${year.year_GC}-G.C </th>`;
          }

          table += `</tr>
                     </thead> 
                    <tbody>`;
  
          data.indicators.map(
            ({ title_ENG, title_AMH, id, for_category, is_deleted }) => {
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
            <td class="border fw-bold border">
                <div class="row">
                  <div class="col-9">
                      ${title_ENG} ${title_amharic}
                  </div>
                </div>
            </td>
             `;
  
                for (year of data.year) {
                  let statusData = false;
                  for (value of data.value) {
                    if (
                      String(year.id) === String(value.for_datapoint_id) &&
                      String(id) === String(value.for_indicator_id)
                    ) {
                      if (checkParentHasChild) {
                        if (value.value != null) {
                          table += `<td class="border text-center fw-bold"> ${value.value} </td>`;
                        } else {
                          table += `<td class="border text-center fw-bold"> - </td>`;
                        }
                      } else {
                        table += `<td class="border text-center fw-bold"> ${value.value} </td>`;
                      }
  
                      statusData = false;
                      break;
                    } else {
                      statusData = true;
                    }
                  }
                  if (statusData) {
                    if (checkParentHasChild) {
                      table += `<td class="border text-center fw-bold"> - </td>`;
                    } else {
                        table += `<td class="border text-center fw-bold"> - </td>`;
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
                                 <td class="border fw-normal">   
                                     <div class="row">
                                       <div class="col-9">
                                           &nbsp;&nbsp;&nbsp;&nbsp;  ${indicator.title_ENG}
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
                             <td class="border fw-normal">
                               <div class="row">
                                 <div class="col-9">
                                   &nbsp;&nbsp;&nbsp;&nbsp; ${space} ${i.title_ENG}
                                 </div>
                               </div>
                             </td>`;
  
                            for (year of data.year) {
                              let statusData = false;
                              for (value of data.value) {
                                if (
                                  String(year.id) ===
                                    String(value.for_datapoint_id) &&
                                  String(i.id) === String(value.for_indicator_id)
                                ) {
                                  if (checkChildOfChildHasChild) {
                                    if (value.value != null) {
                                      table += `<td class="border text-center fw-bold"> ${value.value} </td>`;
                                    } else {
                                      table += `<td class="border text-center fw-bold"> - </td>`;
                                    }
                                  } else {
                                    if (value.value != null) {
                                        table += `<td class="border text-center fw-bold"> ${value.value} </td>`;
                                    } else {
                                        table += `<td class="border text-center fw-bold"> - </td>`;
                                    }
                                  }
                                  statusData = false;
                                  break;
                                } else {
                                  statusData = true;
                                }
                              }
                              if (statusData) {
                                if (checkChildOfChildHasChild) {
                                  table += `<td class="border text-center fw-bold"> - </td>`;
                                } else {
                                   table += `<td class="border text-center fw-bold"> - </td>`;
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
                        for (value of data.value) {
                          if (
                            String(year.id) === String(value.for_datapoint_id) &&
                            String(indicator.id) ===
                              String(value.for_indicator_id) &&
                            indicator.is_deleted == false
                          ) {
                            if (checkChildHasChild) {
                              if (value.value != null) {
                                table += `<td class="border text-center fw-bold"> ${value.value} </td>`;
                              } else {
                                table += `<td class="border text-center fw-bold"> - </td>`;
                              }
                            } else {
                              if (value.value != null) {
                                table += `<td class="border text-center fw-bold"> ${value.value} </td>`;
                              } else {
                                table += `<td class="border text-center fw-bold"> - </td>`;
                              }
                            }
                            statusData = false;
                            break;
                          } else {
                            statusData = true;
                          }
                        }
                        if (statusData) {
                          if (checkChildHasChild) {
                            table += `<td class="border text-center fw-bold"> - </td>`;
                          } else {
                            table += `<td class="border text-center fw-bold"> - </td>`;
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
              buttons: [
                "pageLength",
                "copy",
                {
                  extend: "excelHtml5",
                  text: "Save as Excel",
                  customize: function (xlsx) {
                    var sheet = xlsx.xl.worksheets["sheet1.xml"];
                    $("row:nth-child(2) c", sheet).attr("s", "54");
                  },
                },
                ,
                "print",
              ],
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
          <table id="newTable" class="table table-responsive m-0 p-0" style="width:100%;">
          <thead>
            <tr class="border text-center">
            <th style="padding-left: 100px !important;padding-right: 100px !important;" class="vertical-text border">Year</th>
            <th style="padding-left: 100px !important;padding-right: 100px !important;" class="vertical-text border">Month</th>`;
  
          if (currentIndicator) {
            let title_amharic = "";
            if (!currentIndicator.title_AMH === null)
              title_amharic = " - " + currentIndicator.title_AMH;
  
            table += ` <th class="vertical-text border" ">
                          ${currentIndicator.title_ENG} ${title_amharic}
                          <div class="horizontal-text">
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
                  table += ` <th class="vertical-text fw-normal border">
                               ${space} ${indicator.title_ENG} ${title_amharic}
                                            
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
                                &nbsp;&nbsp; ${indicator.title_ENG} ${title_amharic}
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
            //month loop
            for (let month of data.month) {
              table += `
              <tr class="border text-center">`;
  
              if (!checkYearPrint) {
                table += `<td style="width: 28%;"  class="fw-bold border">${
                  year.year_EC
                }-E.C : ${year.year_GC}-G.C
                </td>`;
              } else {
                table += ` <td class="border"><p> </p></td>`;
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
                  if (checkParentHasChild) {
                    table += `<td  style="width: 10%"; class="border text-center fw-bold"> ${
                      currentDataValue.value ? currentDataValue.value : " - "
                    } </td>`;
                  } else {
                    table += `<td class="p-0 border">${currentDataValue.value ? currentDataValue.value : " - "}</button></td>`;
                  }
                } else {
                  if (checkParentHasChild) {
                    table += `<td  style="width: 10%"; class="border text-center fw-bold">  -  </td>`;
                  } else {
                    table += ` <td class=" border p-0"> - </td>`;
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
                          table += `<td  style="width: 10%"; class="border text-center fw-bold"> ${
                            valueData.value ? valueData.value : " - "
                          } </td>`;
                        } else {
                          table += `<td class=" border p-0"${valueData.value ? valueData.value : " - "}</td>`;
                        }
                      } else {
                        if (checkChildHasChild) {
                          table += `<td  style="width: 10%"; class="border text-center fw-bold">  -  </td>`;
                        } else {
                          table += ` <td class="birder p-0"> - </td>`;
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
                      table += `<td  style="width: 10%"; class="border text-center fw-bold"> ${
                        valueData.value ? valueData.value : " - "
                      } </td>`;
                    } else {
                      table += `<td class=" border p-0">${valueData.value ? valueData.value : " - "}</td>`;
                    }
                  } else {
                    if (checkChildHasChild) {
                      table += `<td  style="width: 10%"; class="border text-center fw-bold">  -  </td>`;
                    } else {
                      table += ` <td class="border p-0"> - </td>`;
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
              buttons: [
                "pageLength",
                "copy",
                {
                  extend: "excelHtml5",
                  text: "Save as Excel",
                  customize: function (xlsx) {
                    var sheet = xlsx.xl.worksheets["sheet1.xml"];
                    $("row:nth-child(2) c", sheet).attr("s", "54");
                  },
                },
                ,
                "print",
              ],
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
          <table id="newTable" class="table ive table-bordered m-0 p-0" style="width:100%;">
          <thead>
            <tr class="border text-center">
            <th style="padding-left: 100px !important;padding-right: 100px !important;"   class="vertical-text border">Year</th>
            <th style="padding-left: 100px !important;padding-right: 100px !important;"   class="vertical-text border">Month</th>`;
  
          if (currentIndicator) {
            let title_amharic = "";
            if (!currentIndicator.title_AMH === null)
              title_amharic = " - " + currentIndicator.title_AMH;
  
            table += ` <th class="vertical-text border" ">
                          <button type="button" name="btnAddIndicator" indicator_id="${currentIndicator.id}" data-bs-toggle="modal"  data-bs-target="#addIndicatorModal"  class="btn  horizontal-text btn-outline-primary border-0  pt-1 pb-1" data-bs-toggle="tooltip" data-bs-placement="bottom" title="Add new Sub-Indicator">+</button>
                          ${currentIndicator.title_ENG} ${title_amharic}
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
                               ${space} ${indicator.title_ENG} ${title_amharic}              
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
                                &nbsp;&nbsp; ${indicator.title_ENG} ${title_amharic}
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
  
            //month loop
            for (let quarter of data.quarter) {
              table += `
              <tr class="border text-center">`;
  
              if (!checkYearPrint) {
                table += `<td style="width: 28%;"  class="border-bottom-0 fw-bold">${
                  year.year_EC
                }-E.C : ${year.year_GC}-G.C
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
                  if (checkParentHasChild) {
                    table += `<td  style="width: 10%"; class="border text-center fw-bold"> ${
                      currentDataValue.value ? currentDataValue.value : " - "
                    } </td>`;
                  } else {
                    table += `<td class="p-0">${currentDataValue.value ? currentDataValue.value : " - "}</td>`;
                  }
                } else {
                  if (checkParentHasChild) {
                    table += `<td  style="width: 10%"; class="border text-center fw-bold">  -  </td>`;
                  } else {
                    table += ` <td class="p-0"> - </button></td>`;
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
                          table += `<td  style="width: 10%"; class="border text-center fw-bold"> ${
                            valueData.value ? valueData.value : " - "
                          } </td>`;
                        } else {
                          table += `<td class="p-0">${valueData.value ? valueData.value : " - "}</td>`;
                        }
                      } else {
                        if (checkChildHasChild) {
                          table += `<td  style="width: 10%"; class="border text-center fw-bold">  -  </td>`;
                        } else {
                          table += ` <td class="p-0"> - </td>`;
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
                      table += `<td  style="width: 10%"; class="border text-center fw-bold"> ${
                        valueData.value ? valueData.value : " - "
                      } </td>`;
                    } else {
                      table += `<td class="p-0">${
                        valueData.value ? valueData.value : " - "
                      }</td>`;
                    }
                  } else {
                    if (checkChildHasChild) {
                      table += `<td  style="width: 10%"; class="border text-center fw-bold">  -  </td>`;
                    } else {
                      table += ` <td class="p-0"> - </td>`;
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
              buttons: [
                "pageLength",
                "copy",
                {
                  extend: "excelHtml5",
                  text: "Save as Excel",
                  customize: function (xlsx) {
                    var sheet = xlsx.xl.worksheets["sheet1.xml"];
                    $("row:nth-child(2) c", sheet).attr("s", "54");
                  },
                },
                ,
                "print",
              ],
              columnDefs: [{ width: "100%" }, { width: "300px", targets: 0 }],
              dom: "Bfrtip",

            });
          });
        }
  
        document.getElementById("tableTest").innerHTML = table;
  

  
        //Calculate Graph
        
        if (currentIndicator.type_of == "yearly") {
          //Filter Date, and values
          data.year = data.year
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
        }
      })
      .catch((err) => console.log(err));
  });
  