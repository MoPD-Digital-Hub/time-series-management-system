$(document).ready(function () {
    let urlPath = window.location.pathname;
    let pathID = urlPath.replace("/user-admin/data_view_indicator_detail/", "").replace("/", "");
    let URL = `/filter_indicator_detail_annual_value/${pathID}`

    const indicatorId = [pathID]


    const contractTable = (data) => {
        AnnualTable(data)
        QuarterTable(data)
        MonthTable(data)

    }

    const AnnualTable = (data) => {

        //table header
        $('[name="tableHead"]').html(
            `
          <tr style="background-color: #40864b;" >
            <th style="width:800px;"  class="text-light" scope="col" >Yearly</th>
            <th style="width:400px;" scope="col" ></th>
              ` +
            data.year.map((year) => { return ` <th scope="col" style="width:110px;"></th>` })
            +
            `
          </tr>

        <tr style="background-color: #9fdfa9;" >
               <th scope="col" >Name</th>
               <th scope="col" >ስም</th>
               ` +
            data.year.map((year) => { return `<th style="font-size:15px;" scope="col">${year.year_EC} E.C </th>` })
            +
            `
         </tr>

          <tr style="background-color: #9fdfa9;" >
               <th scope="col" ></th>
               <th scope="col" ></th>
               ` +
            data.year.map((year) => { return `<th style="font-size:10px;" scope="col">${year.year_GC} G.C </th>` })
            +
            `
         </tr>
            `
        )


        let tableData = indicatorId.map((indicator_id) => {
            let filterIndicator = data.annual_data_value.filter((item) => item.indicator__id === Number(indicator_id))

            //parent indicator
            let row = data.year.map((year) => {
                let getIndicatorValue = filterIndicator.find((item) => item.for_datapoint__year_EC == year.year_EC)
                if (getIndicatorValue) {
                    return `
                    <td>
                        <button 
                            id="${indicator_id}-${year.year_EC}"
                            data-indicator-id="${indicator_id}" 
                            data-value="${getIndicatorValue && getIndicatorValue.performance != null ? Number(getIndicatorValue.performance.toFixed(1)) : "-"} 
                            data-year="${year.year_EC}"
                            data-bs-toggle="modal" 
                            name="btnIndicator" 
                            data-bs-target="#indicatorEditValue" 
                            class="btn btn-block btn-outline-secondary border-0 fw-bold text-dark">
                            ${getIndicatorValue && getIndicatorValue.performance != null ? Number(getIndicatorValue.performance.toFixed(1)) : "-"}
                        </button>
                    </td>
                    `
                } else {
                    return `
                    <td>
                        <button 
                            id="${indicator_id}-${year.year_EC}"
                            data-indicator-id="${indicator_id}"
                            data-year="${year.year_EC}" 
                            data-value="" 
                            data-bs-toggle="modal" 
                            name="btnIndicator" 
                            data-bs-target="#indicatorEditValue" 
                            class="btn btn-block btn-outline-secondary border-0 fw-bold text-dark">
                             - 
                        </button>
                    </td>`
                }
            })

            //child indicator             
            let childDataIndicator = data.indicator_lists.filter(child => child.parent_id == indicator_id)


            let childDataFn = (parent, space = "&nbsp;&nbsp;&nbsp;&nbsp&nbsp;&nbsp;&nbsp;&nbsp") => {
                space += String("&nbsp;&nbsp;&nbsp;&nbsp")

                //child of child indicator
                let childOfChildDataIndicator = data.indicator_lists.filter(child => child.parent_id == Number(parent))


                return childOfChildDataIndicator.map((childOfChild) => {
                    let filterChildOfChildIndicator = data.annual_data_value.filter((item) => item.indicator__id === Number(childOfChild.id))
                    let childRow = data.year.map((year) => {
                        let getIndicatorValue = filterChildOfChildIndicator.find((item) => item.for_datapoint__year_EC == year.year_EC)
                        if (getIndicatorValue) {
                            return `
                            
                            <td>
                                <button
                                    id="${childOfChild.id}-${year.year_EC}" 
                                    data-indicator-id="${childOfChild.id}" 
                                    data-value="${getIndicatorValue && getIndicatorValue.performance != null ? Number(getIndicatorValue.performance.toFixed(1)) : "-"} 
                                    data-year="${year.year_EC}"
                                    data-bs-toggle="modal" 
                                    name="btnIndicator" 
                                    data-bs-target="#indicatorEditValue" 
                                    class="btn btn-block btn-outline-secondary border-0 fw-bold text-dark">
                                    ${getIndicatorValue && getIndicatorValue.performance != null ? Number(getIndicatorValue.performance.toFixed(1)) : "-"}
                                </button>
                            </td>
                            `
                        } else {
                            return `
                            <td>
                                <button 
                                    id="${childOfChild.id}-${year.year_EC}" 
                                    data-indicator-id="${childOfChild.id}" 
                                    data-year="${year.year_EC}"
                                    data-value="" 
                                    data-bs-toggle="modal" 
                                    name="btnIndicator" 
                                    data-bs-target="#indicatorEditValue" 
                                    class="btn btn-block btn-outline-secondary border-0 fw-bold text-dark">
                                    -
                                </button>
                            </td>`
                        }
                    })

                    return `
                    <tr>
                        <td>
                           <div class="row">
                                <div class="col-9">&nbsp;&nbsp;&nbsp;&nbsp ${space}  ${childOfChild.title_ENG}</div>
                                <div class="col-1">
                                    <a 
                                        href="/user-admin/data_view_indicator_update/${childOfChild.id}" 
                                        name="btnAddIndicator" 
                                        data-indicator-id="${indicatorId}"
                                        data-indicator-name-eng="${childOfChild.title_ENG}"
                                        data-indicator-name-amg="${childOfChild.title_AMH}"
                                        class="btn btn-sm btn-outline-primary border-0  pt-1 pb-1" 
                                        data-bs-placement="bottom" 
                                        title="Add new Sub-Indicator"><i class="fas fa-pen"></i></a> 
                                 </div>   
                                <div class="col-1">
                                     <button 
                                         type="button" 
                                         name="btnAddIndicator" 
                                         data-indicator-id="${childOfChild.id}" 
                                         data-bs-toggle="modal" 
                                         data-bs-target="#modalAddNewIndicator" 
                                         class="btn btn-outline-primary border-0  pt-1 pb-1" 
                                         data-bs-placement="bottom" 
                                         title="Add new Sub-Indicator">+</button> 
                                   </div>
                                   <div class="col-1">
                                     <button 
                                         type="button" 
                                         name="btnDeleteIndicator" 
                                         data-indicator-id="${childOfChild.id}"
                                         data-indicator-name="${childOfChild.title_ENG}" 
                                         data-bs-toggle="modal" 
                                         data-bs-target="#modalRemoveIndicator" 
                                         class="btn btn-outline-danger border-0  pt-1 pb-1" 
                                         data-bs-placement="bottom" 
                                         title="Remove Indicator">-</button> 
                                   </div>
                                </div>
                         </td>
                       <td class="">${space}  ${childOfChild.title_AMH}</td> 
                       ${childRow}
                    </tr>
                ${childDataFn(childOfChild.id, space)}
                `
                })
            }

            let childData = childDataIndicator.map((child) => {
                let filterChildIndicator = data.annual_data_value.filter((item) => item.indicator__id === Number(child.id))

                let childRow = data.year.map((year) => {
                    let getIndicatorValue = filterChildIndicator.find((item) => item.for_datapoint__year_EC == year.year_EC)
                    if (getIndicatorValue) {
                        return `
                        <td>
                            <button
                                id="${child.id}-${year.year_EC}"  
                                data-indicator-id="${child.id}" 
                                data-value="${getIndicatorValue && getIndicatorValue.performance != null ? Number(getIndicatorValue.performance.toFixed(1)) : "-"} 
                                data-year="${year.year_EC}"
                                data-bs-toggle="modal" 
                                name="btnIndicator" 
                                data-bs-target="#indicatorEditValue" 
                                class="btn btn-block btn-outline-secondary border-0 fw-bold text-dark">
                                ${getIndicatorValue && getIndicatorValue.performance != null ? Number(getIndicatorValue.performance.toFixed(1)) : "-"}
                            </button>
                        </td>
                        `
                    } else {
                        return `
                        <td> 
                            <button
                                id="${child.id}-${year.year_EC}"  
                                data-indicator-id="${child.id}" 
                                data-year="${year.year_EC}"
                                data-value="" 
                                data-bs-toggle="modal" 
                                name="btnIndicator" 
                                data-bs-target="#indicatorEditValue" 
                                class="btn btn-block btn-outline-secondary border-0 fw-bold text-dark">
                                - 
                            </button>
                        </td>`
                    }
                })

                return `
                <tr>
                    <td class="">
                        <div class="row">
                         <div class="col-9">&nbsp;&nbsp;&nbsp;&nbsp ${filterChildIndicator[0].indicator__title_ENG}</div>
                         <div class="col-1">
                         <a 
                             href="/user-admin/data_view_indicator_update/${filterChildIndicator[0].indicator__id}" 
                             name="btnAddIndicator" 
                             class="btn btn-sm btn-outline-primary border-0  pt-1 pb-1" 
                             data-bs-placement="bottom" 
                             title="Add new Sub-Indicator"><i class="fas fa-pen"></i></a> 
                      </div>    
                         <div class="col-1">
                              <button 
                                  type="button" 
                                  name="btnAddIndicator" 
                                  data-indicator-id="${child.id}"
                                  data-bs-toggle="modal" 
                                  data-bs-target="#modalAddNewIndicator" 
                                  class="btn btn-outline-primary border-0  pt-1 pb-1" 
                                  data-bs-placement="bottom" 
                                  title="Add new Sub-Indicator">+</button> 
                            </div>
                            <div class="col-1">
                              <button 
                                  type="button" 
                                  name="btnDeleteIndicator" 
                                  data-indicator-id="${child.id}"
                                  data-indicator-name="${filterChildIndicator[0].indicator__title_ENG}"
                                  data-bs-toggle="modal" 
                                  data-bs-target="#modalRemoveIndicator" 
                                  class="btn btn-outline-danger border-0  pt-1 pb-1" 
                                  data-bs-placement="bottom" 
                                  title="Remove Indicator">-</button> 
                            </div>
                         </div>
                    </td>
               <td class="">&nbsp;&nbsp;&nbsp;&nbsp ${filterChildIndicator[0].indicator__title_AMH}</td> 
               ${childRow}
            </tr>
            ${childDataFn(child.id)}
            `
            })



            return `
            <tr>
                <td class="fw-bold">
                     <div class="row">
                      <div class="col-9">${filterIndicator[0]?.indicator__title_ENG || 'None'}</div>
                      <div class="col-1">
                         <a 
                             href="/user-admin/data_view_indicator_update/${filterIndicator[0].indicator__id}" 
                             name="btnAddIndicator" 
                             class="btn btn-sm btn-outline-primary border-0  pt-1 pb-1" 
                             data-bs-placement="bottom" 
                             title="Add new Sub-Indicator"><i class="fas fa-pen"></i></a> 
                      </div>   
                      <div class="col-1">
                        <button 
                            type="button" 
                            name="btnAddIndicator" 
                            data-indicator-id="${indicatorId}"
                            data-bs-toggle="modal" 
                            data-bs-target="#modalAddNewIndicator" 
                            class="btn btn-outline-primary border-0  pt-1 pb-1" 
                            data-bs-placement="bottom" 
                            title="Add new Sub-Indicator">+</button> 
                      </div>
                      <div class="col-1">
                        <button 
                            type="button" 
                            name="btnDeleteIndicator" 
                            data-indicator-id="${indicatorId}"
                            data-indicator-name="${filterIndicator[0].indicator__title_ENG}"
                            data-bs-toggle="modal" 
                            data-bs-target="#modalRemoveIndicator" 
                            class="btn btn-outline-danger border-0  pt-1 pb-1" 
                            data-bs-placement="bottom" 
                            title="Remove Indicator">-</button> 
                      </div>
                    </div>
                </td>
               <td class="fw-bold">${filterIndicator[0].indicator__title_AMH}</td> 
               ${row}
            </tr>
            ${childData}
            `

        })

        $('[name="tableBody"]').html(tableData)
    }

    const QuarterTable = (data) => {
        let headerListHtml = ``

        let filterChildHeader = (parent, space = "") => {
            space += String("&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp")
            let children = data.indicator_lists.filter(item => item.parent_id == parent.id)

            for (let child of children) {
                headerListHtml += `
                <th scope="col" class="vertical-text text-start align-middle">${space} ${child.title_ENG} </br> ${space} ${child.title_AMH}
                `
                filterChildHeader(child, space)
            }
        }

        let parentHeader = () => {
            for (let parent of data.indicator_lists.filter(item => item.parent_id == null)) {
                headerListHtml += `
                <th scope="col" class="vertical-text text-start align-middle">${parent.title_ENG} </br> ${parent.title_AMH}
                `
                filterChildHeader(parent)
            }
        }

        parentHeader()

        $('[name="tableHeadQuarter"]').html(
            `
          <tr style="background-color: #40864b;" >
            <th style="width:50px;"  class="text-light" scope="col" >Quarterly</th>
            <th style="width:10px;" scope="col" ></th>
              ` +
            data.indicator_lists.map((indicator) => {
                return ` <th scope="col" style="width:70px;"></th>`
            })
            +
            `
          </tr>

          <tr style="background-color: #9fdfa9;" >
          <th scope="col" class="vertical-text text-start align-middle" >(Year)</th>
          <th scope="col" class="vertical-text text-start align-middle">(Quarter)</th>
            ` +
            headerListHtml
            +
            `
        </tr>
            `
        )

        let tableBody = ''

        for (let year of data.year) {
            let hasYear = false
            let indicatorValue = ''
            for (let quarter of data.quarter) {

                let childBody = (parent, space = "") => {
                    space += String("&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp")
                    let children = data.indicator_lists.filter(item => item.parent_id == parent.id)

                    for (let child of children) {
                        let value = data.quarter_data_value.find((item) => item.for_datapoint__year_EC == year.year_EC && item.for_quarter__number == quarter.number && item.indicator__id == child.id)
                        indicatorValue += `
                        <td> 
                            <button
                                id="${child.id}-${year.year_EC}-${quarter.number}" 
                                data-indicator-id="${child.id}" 
                                data-quarter-id="${quarter.number}" 
                                data-value="${value && value.performance != null ? Number(value.performance.toFixed(1)) : "-"}" 
                                data-year="${year.year_EC}"
                                data-bs-toggle="modal" 
                                name="btnIndicator" 
                                data-bs-target="#indicatorEditValue" 
                                class="btn btn-block btn-outline-secondary border-0 fw-bold text-dark">
                                ${value && value.performance != null ? Number(value.performance.toFixed(1)) : "-"}
                            </button>
                        </td>`
                        childBody(child, space)
                    }
                }

                let parentBody = () => {
                    for (let indicator of data.indicator_lists.filter((item) => item.parent_id == null)) {
                        let value = data.quarter_data_value.find((item) => item.for_datapoint__year_EC == year.year_EC && item.for_quarter__number == quarter.number && item.indicator__id == indicator.id)
                        indicatorValue +=
                            `<td> 
                            <button
                                id="${indicator.id}-${year.year_EC}-${quarter.number}" 
                                data-indicator-id="${indicator.id}" 
                                data-quarter-id="${quarter.number}" 
                                data-value="${value && value.performance != null ? Number(value.performance.toFixed(1)) : "-"}" 
                                data-year="${year.year_EC}"
                                data-bs-toggle="modal" 
                                name="btnIndicator" 
                                data-bs-target="#indicatorEditValue" 
                                class="btn btn-block btn-outline-secondary border-0 fw-bold text-dark">
                                ${value && value.performance != null ? Number(value.performance.toFixed(1)) : "-"}
                            </button>
                        
                        </td>`
                        childBody(indicator)
                    }
                }

                parentBody()



                tableBody += `
                <tr>
                   <th class="text-success" style="${hasYear ? 'font-size: 0;' : ''}" >${year.year_EC + "E.C </br> " + year.year_GC + "G.C"}</th>
                   <th class="text-success">${quarter.title_ENG}</th>
                   ${indicatorValue}
                </tr>
               `
                hasYear = true
                indicatorValue = ''
            }
        }


        $('[name="tableBodyQuarter"]').html(tableBody)
        $('#table_quarter_dataTable').DataTable({
            lengthMenu: [
                [10, 25, 50, -1],
                [10, 25, 50, 'All']
            ]
        });
    }

    const MonthTable = (data) => {
        let headerListHtml = ``

        let filterChildHeader = (parent, space = "") => {
            space += String("&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp")
            let children = data.indicator_lists.filter(item => item.parent_id == parent.id)

            for (let child of children) {
                headerListHtml += `
                <th scope="col" class="vertical-text text-start align-middle">${space} ${child.title_ENG} </br> ${space} ${child.title_AMH}
                `
                filterChildHeader(child, space)
            }
        }

        let parentHeader = () => {
            for (let parent of data.indicator_lists.filter(item => item.parent_id == null)) {
                headerListHtml += `
                <th scope="col" class="vertical-text text-start align-middle">${parent.title_ENG} </br> ${parent.title_AMH}
                `
                filterChildHeader(parent)
            }
        }

        parentHeader()

        $('[name="tableHeadMonth"]').html(
            `
          <tr style="background-color: #40864b;" >
            <th style="width:100px;"  class="text-light" scope="col" >Monthly</th>
            <th style="width:100px;" scope="col" ></th>
              ` +
            data.indicator_lists.map((indicator) => {
                return ` <th scope="col" style="width:70px;"></th>`
            })
            +
            `
          </tr>

          <tr style="background-color: #9fdfa9;" >
          <th scope="col" class="vertical-text text-start align-middle" >(Year)</th>
          <th scope="col" class="vertical-text text-start align-middle">(Month)</th>
            ` +
            headerListHtml
            +
            `
        </tr>
            `
        )

        let tableBody = ''

        for (let year of data.year) {
            let hasYear = false
            let indicatorValue = ''
            for (let month of data.month) {

                let childBody = (parent, space = "") => {
                    space += String("&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp")
                    let children = data.indicator_lists.filter(item => item.parent_id == parent.id)

                    for (let child of children) {
                        let value = data.month_data_value.find((item) => item.for_datapoint__year_EC == year.year_EC && item.for_month__number == month.number && item.indicator__id == child.id)
                        indicatorValue += `
                        <td> 
                            <button
                                id="${child.id}-${year.year_EC}-month-${month.number}" 
                                data-indicator-id="${child.id}" 
                                data-month-id="${month.number}" 
                                data-value="${value && value.performance != null ? Number(value.performance.toFixed(1)) : "-"}" 
                                data-year="${year.year_EC}"
                                data-bs-toggle="modal" 
                                name="btnIndicator" 
                                data-bs-target="#indicatorEditValue" 
                                class="btn btn-block btn-outline-secondary border-0 fw-bold text-dark">
                                ${value && value.performance != null ? Number(value.performance.toFixed(1)) : "-"}
                            </button>
                        </td>`
                        childBody(child, space)
                    }
                }

                let parentBody = () => {
                    for (let indicator of data.indicator_lists.filter((item) => item.parent_id == null)) {
                        let value = data.month_data_value.find((item) => item.for_datapoint__year_EC == year.year_EC && item.for_month__number == month.number && item.indicator__id == indicator.id)
                        indicatorValue +=
                            `<td> 
                            <button
                                id="${indicator.id}-${year.year_EC}-month-${month.number}" 
                                data-indicator-id="${indicator.id}" 
                                data-month-id="${month.number}" 
                                data-value="${value && value.performance != null ? Number(value.performance.toFixed(1)) : "-"}" 
                                data-year="${year.year_EC}"
                                data-bs-toggle="modal" 
                                name="btnIndicator" 
                                data-bs-target="#indicatorEditValue" 
                                class="btn btn-block btn-outline-secondary border-0 fw-bold text-dark">
                                ${value && value.performance != null ? Number(value.performance.toFixed(1)) : "-"}
                            </button>
                        
                        </td>`
                        childBody(indicator)
                    }
                }

                parentBody()



                tableBody += `
                <tr>
                   <th class="text-success" style="${hasYear ? 'font-size: 0;' : ''}" >${year.year_EC + "E.C </br> " + year.year_GC + "G.C"}</th>
                   <th class="text-success">${month.month_AMH} </br> ${month.month_ENG}</th>
                   ${indicatorValue}
                </tr>
               `
                hasYear = true
                indicatorValue = ''
            }
        }


        $('[name="tableBodyMonth"]').html(tableBody)
        $('#table_month_dataTable').DataTable({
            lengthMenu: [
                [10, 25, 50, -1],
                [10, 25, 50, 'All']
            ]
        });
    }

    const fetchTableData = async () => {
        let [loading, response] = await useFetch(URL)
        contractTable(response)
    }




    //handle value button clicked for yearly
    $("[name='tableBody']").on("click", "button[name='btnIndicator']", function () {
        const buttonData = $(this).data()
        $("#IndicatorFormValue").val(buttonData.value)
        $("#form_indicator_id").val(buttonData.indicatorId)
        $("#form_year_id").val(buttonData.year)
        $("#form_quarter_id").val("")
        $("#form_month_id").val("")
    })


    //handle value button clicked for quarterly
    $("[name='tableBodyQuarter']").on("click", "button[name='btnIndicator']", function () {
        const buttonData = $(this).data()
        $("#IndicatorFormValue").val(buttonData.value)
        $("#form_indicator_id").val(buttonData.indicatorId)
        $("#form_year_id").val(buttonData.year)
        $("#form_quarter_id").val(buttonData.quarterId)
        $("#form_month_id").val("")
    })


    //handle value button clicked for month
    $("[name='tableBodyMonth']").on("click", "button[name='btnIndicator']", function () {
        const buttonData = $(this).data()
        $("#IndicatorFormValue").val(buttonData.value)
        $("#form_indicator_id").val(buttonData.indicatorId)
        $("#form_year_id").val(buttonData.year)
        $("#form_quarter_id").val("")
        $("#form_month_id").val(buttonData.monthId)
    })

    //handle add indicator button clicked
    $("[name='tableBody']").on("click", "button[name='btnAddIndicator']", function () {
        const buttonData = $(this).data()
        $("#form_indicator_add_id").val(buttonData.indicatorId)
    })



    fetchTableData()



})