$(document).ready(function () {

    let rowCounter = 0

    const table = (data) => {
        let parentLists = data.indicators?.filter((item) => item.parent_id == null)
        let childLists = (parentId, space) => {
            let childList = data.indicators.filter((item) => item.parent_id == parentId)
            return childList.map((item) => {
                return `
                <tr>
                   <td>${rowCounter + 1}</td>    
                   <td>${space} ${item.title_ENG}</td>
                   <td>${space} ${item.title_AMH}</td>
                   <td>${space} ${item.composite_key}</td>
                   <td></td>
                   <td><button class="btn btn-sm btn-primary btn-block">${item.kpi_characteristics ? item.kpi_characteristics : " None "}</button></td>
                   <td class="text-center">${item.is_dashboard_visible ? ` <i class="fa fa-check text-success"></i>` : `<i class="fa fa-times text-danger"></i>`}</td>
                   <td>${item.is_public ? ` <i class="fa fa-check text-success"></i>` : `<i class="fa fa-times text-danger"></i>`}</td>
                   <td> 
                        <button
                           class="btn btn-danger btn-delete"
                           data-bs-toggle="modal"
                           data-bs-target="#deleteIndicatorModal"
                           data-bs-whatever="@mdo"
                           data-name="${item.title_AMH}"
                           data-id="${item.id}"
                           >-</i>
                         </button>
                         <button
                           class="btn btn-info btn-add"
                           data-bs-toggle="modal"
                           data-bs-target="#addSubIndicator"
                           data-bs-whatever="@mdo"
                           data-id="${item.id}"
                           >+</i>
                         </button>
                        <a class="btn btn-info" href="/user-admin/indicator_details/${item.id}"><i class="fa fa-pen text-white"></i> </a>
               </td>
                </tr>
                ${space += String("&nbsp;&nbsp;&nbsp;&nbsp")}
                ${rowCounter++}
                ${childLists(item.id, space)}
                `
            })
        }

        let tableRow = ''
        if (parentLists?.length == 0) {
            tableRow = `<tr class="text-bold text-center text-danger" ><td colspan="10">No data found</td></tr>`
        } else {
            tableRow = parentLists?.map((item) => {
                return `
                <tr class="text-bold">
                   <td>${rowCounter + 1}</td>    
                   <td>${item.title_ENG}</td>
                   <td>${item.title_AMH}</td>
                   <td>${item.composite_key}</td>
                   <td> ${item.for_category ? item.for_category.slice(0, 2).join(", ") + "..." : " - "} </td>
                   <td><button class="btn btn-sm btn-primary btn-block">${item.kpi_characteristics ? item.kpi_characteristics : " None "}</button></td>
                   <td class="text-center">${item.is_dashboard_visible ? ` <i class="fa fa-check text-success"></i>` : `<i class="fa fa-times text-danger"></i>`}</td>
                   <td>${item.is_public ? ` <i class="fa fa-check text-success"></i>` : `<i class="fa fa-times text-danger"></i>`}</td>
                   <td> 
                        <button
                           class="btn btn-danger btn-delete"
                           data-bs-toggle="modal"
                           data-bs-target="#deleteIndicatorModal"
                           data-bs-whatever="@mdo"
                           data-name="${item.title_AMH}"
                           data-id="${item.id}"
                           >-</i>
                         </button>
                         <button
                           class="btn btn-info btn-add"
                           data-bs-toggle="modal"
                           data-bs-target="#addSubIndicator"
                           data-bs-whatever="@mdo"
                           data-id="${item.id}"
                           >+</i>
                         </button>
                        <a class="btn btn-info" href="/user-admin/indicator_details/${item.id}"><i class="fa fa-pen text-white"></i> </a>
               </td>
                </tr>
                ${rowCounter++}
                ${childLists(item.id, "&nbsp;&nbsp;&nbsp;&nbsp").join("")}
                `
            })
        }

        $("#renderTable").html(tableRow)
    }

    const fetchTableData = async () => {
        let urlPath = window.location.pathname;
        let pathID = urlPath.replace("/user-admin/indicators/", "");
        let [loading,response] = await useFetch(`/indicator-lists/${pathID}`)

        //Hide for category 
        
        $("#addIndicatorForm").parent().find("#id_for_category").hide()
        $("#id_for_category").parent().hide()


        //select default category
        $("#id_for_category").val(pathID)
        $("#addIndicatorForm").parent().find("#id_for_category").val(pathID)


        table(response)
        $(".btn-add").on('click', function() {
            const buttonData = $(this).data()
            $("#subIndicatorId").val(buttonData.id)
          })

        
        //Delete Indicator
       //Event handler that handle on Click to delete
     $(".btn-delete").on('click', function(){
        const buttonData = $(this).data()
        $("#deleteCategoryAnchor").attr("href", `/user-admin/indicator_delete/${buttonData.id}`)
        $("#deleteMessageCategory").html(`Are you sure you want to delete <div> <code> ${buttonData.name}</code>? </div> `)
      })


    }

    fetchTableData()






})