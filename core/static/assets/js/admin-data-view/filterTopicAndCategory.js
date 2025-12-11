$(document).ready(function () {
    let URL = "/filter_topic_and_category";
    let indicatorId = [];  //selected indicator ids
    const LOADING_HTML = `
    <div class="d-flex justify-content-center">
        <div class="spinner-border" role="status">
           <span class="visually-hidden">Loading...</span>
        </div>
    </div>
    `

    //request indicator Annual values
    $('#applyFilterButton').on('click', function () {
        $("#tableBody").html(
            `
            <tr>
                <td colspan="7"></td>
            </tr>
            `
        )
        fetchTableData()
    })

    const fetchTableData = async () => {
        const params = new URLSearchParams();
        params.set('indicator_ids', indicatorId.join(','));
        const url = '/filter_indicator_annual_value/?' + params.toString();

        $("#tableLoader").html(LOADING_HTML)

        let response = await axios.get(url)
        console.log(response)
        try {
            contractAnnualTable(response.data)
            contractQuarterTable(response.data)
            contractMonthTable(response.data)
        } catch (error) {
            console.error("Error:", error);
        }
        $("#tableLoader").html("")
    }


    const handleButton = (state) => {
        $('#applyFilterButton').attr("disabled", state);
        state ? $('#applyFilterButton').html(`Select indicator`) : $('#applyFilterButton').html(`Apply`)
    }

    const handleIndicator = async (catId) => {
        $("#indicatorListParent").html(LOADING_HTML)
        let [loading, response] = await useFetch(`/filter_indicator_by_category/${catId}`);
        let indicators = response.indicators

        const selectAllHtml = `
         <div>
            <input type="checkbox"  name="selectAllIndicator" id="selectAllIndicator">
            <label for="selectAllIndicator" class="ms-2">Select All</label>
            <hr />
        </div>
        
        `

        const indicatorLists = indicators.map((item) => {
            return `
            <div class="col-1"> 
               <input type="checkbox" value="${item.id}" name="indicator_lists" id="indicator_list${item.id}">
            </div>
             <div class="col-11">
                 <label for="indicator_list${item.id}" style="font-size: small;" class="mb-0">${item.title_ENG} - ${item.title_AMH}</label>
             </div>           
        `
        })

        $("#indicatorListParent").html(indicatorLists.length > 0 ? selectAllHtml + indicatorLists.join("") : `<p class="text-danger text-center">No indicator found!</p>`)
        //handle indicator on change
        $("#indicatorListParent").on('change', function () {
            indicatorId = []
            $(this).find('input[name="indicator_lists"]:checked').each(function () {
                indicatorId.push($(this).val())
                $("#selectAllIndicator").attr('checked', false)
            });

            //select all if select all button clicked
            if ($("#selectAllIndicator").is(':checked')) {
                indicatorId = []
                $(this).find('input[name="indicator_lists"]').prop('checked', true)
                $(this).find('input[name="indicator_lists"]:checked').each(function () {
                    indicatorId.push($(this).val())
                    $("#selectAllIndicator").attr('checked', false)
                });
                handleButton(false, indicatorId)
            }
            //handle button
            handleButton(false, indicatorId)
        })
    }

    const handleTopic = (topics) => {
        const topicLists = topics.map((item) => {
            return `
            <div class="col-1"> 
                <input type="radio" value="${item.id}" name="topic_lists" id="topic_list${item.id}">
            </div>
            <div class="col-11">
                <label for="topic_list${item.id}" style="font-size: small;" class="mb-0">${item.title_ENG} - ${item.title_AMH}</label>
            </div>           
            `
        })
        $("#topicListParent").html(topicLists)
    }

    const handleCategory = (category, topic_id) => {
        const filterCategory = category.filter((item) => item.topic__id === Number(topic_id))
        const categoryLists = filterCategory.map((item) => {
            return `
            <div class="col-1"> 
               <input type="radio" value="${item.id}" name="category_lists" id="category_list${item.id}">
            </div>
             <div class="col-11">
                 <label for="category_list${item.id}" style="font-size: small;" class="mb-0">${item.name_ENG} - ${item.name_AMH}</label>
             </div>           
        `
        })

        $("#categoryListParent").html(categoryLists.length > 0 ? categoryLists : `<p class="text-danger text-center">No category found!</p>`)

        //handle category on change
        $("#categoryListParent").on('change', function () {
            let categoryId = $(this).find('input[name="category_lists"]:checked').val();
            let categoryName = category.find((item) => item.id == categoryId).name_ENG
            $("#categoryName").text(categoryName)
            handleIndicator(categoryId)
            handleButton(true)
        })


    }


    const handleAccordion = (data) => {
        handleTopic(data.topics)
        //handle topic on change
        $("#topicListParent").on('change', function () {
            //handle topic on change and clear indicator
            $("#indicatorListParent").html(`<p class="text-danger text-center">Please Select Category</p>`)
            let topic_id = $(this).find('input[name="topic_lists"]:checked').val();
            let topicName = data.topics.find((item) => item.id == topic_id).title_ENG
            $("#topicName").text(topicName)
            handleButton(true)
            handleCategory(data.categories, topic_id)
        })
    }

    const fetchTopicAndCategory = async () => {

        $("#topicListParent").html(LOADING_HTML)
        let [loading, response] = await useFetch(URL);
        loadingTopic = loading
        handleAccordion(response)

    }

    fetchTopicAndCategory()




    /// Table
    const contractAnnualTable = (data) => {
        $('[name="tableHead"]').html(
            `
          <tr style="background-color: #40864b;" >
            <th style="width:300px;"  class="text-light" scope="col" >Yearly</th>
            <th style="width:300px;" scope="col" ></th>
              ` +
            data.year.map((year) => { return ` <th scope="col" style="width:300px;"></th>` })
            +
            `
          </tr>

        <tr style="background-color: #9fdfa9;" >
               <th scope="col" >Name</th>
               <th scope="col" >ስም</th>
               ` +
            data.year.map((year) => { return ` <th scope="col">${year.year_EC} E.C </th>` })
            +
            `
         </tr>

          <tr style="background-color: #9fdfa9;" >
               <th scope="col" ></th>
               <th scope="col" ></th>
               ` +
            data.year.map((year) => { return ` <th scope="col">${year.year_GC} G.C </th>` })
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
                    <td>${getIndicatorValue && getIndicatorValue.performance != null ? Number(getIndicatorValue.performance.toFixed(1)) : "-"}</td>
                    `
                } else {
                    return `<td> - </td>`
                }
            })

            //child indicator
            let childDataIndicator = data.indicator_lists.filter(child => child.parent_id == indicator_id)
            let childDataFn = (parent, space = "&nbsp;&nbsp;&nbsp;&nbsp&nbsp;&nbsp;&nbsp;&nbsp") => {
                space += String("&nbsp;&nbsp;&nbsp;&nbsp")

                let childOfChildDataIndicator = data.indicator_lists.filter(child => child.parent_id == Number(parent))


                return childOfChildDataIndicator.map((childOfChild) => {
                    let filterChildOfChildIndicator = data.annual_data_value.filter((item) => item.indicator__id === Number(childOfChild.id))
                    let childRow = data.year.map((year) => {
                        let getIndicatorValue = filterChildOfChildIndicator.find((item) => item.for_datapoint__year_EC == year.year_EC)
                        if (getIndicatorValue) {
                            return `
                            <td>${getIndicatorValue && getIndicatorValue.performance != null ? Number(getIndicatorValue.performance.toFixed(1)) : "-"}</td>
                            `
                        } else {
                            return `<td> - </td>`
                        }
                    })

                    return `
                <tr>
                   <td class="">${space}  ${childOfChild.title_ENG}</td> 
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
                        <td>${getIndicatorValue && getIndicatorValue.performance != null ? Number(getIndicatorValue.performance.toFixed(1)) : "-"}</td>
                        `
                    } else {
                        return `<td> - </td>`
                    }
                })

                return `
            <tr>
               <td class="">&nbsp;&nbsp;&nbsp;&nbsp ${child.title_ENG}</td> 
               <td class="">&nbsp;&nbsp;&nbsp;&nbsp ${child.title_AMH}</td> 
               ${childRow}
            </tr>
            ${childDataFn(child.id)}
            `
            })



            return `
            <tr>
            
               <td class="fw-bold text-success">${filterIndicator[0]?.indicator__title_ENG || filterIndicator[0]?.indicator__title_AMH } <a href="/user-admin/data_view_indicator_detail/${filterIndicator[0]?.indicator__id}/"> <i class="fas fa-eye float-end"></i> </a></td> 
               <td class="fw-bold"> <a href="/user-admin/data_view_indicator_detail/${filterIndicator[0]?.indicator__id}/">${filterIndicator[0]?.indicator__title_AMH}</a></td> 
               ${row}
            </tr>
            ${childData}
            `

        })

        $('[name="tableBody"]').html(tableData)


    }



    // Quarter
    const contractQuarterTable = (data) => {


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
            <th style="width:100px;"  class="text-light" scope="col" >Quarterly</th>
            <th style="width:100px;" scope="col" ></th>
            <th style="width:50px;" scope="col" ></th>
              ` +
            data.indicator_lists.map((indicator) => {
                return ` <th scope="col" style="width:70px;"></th>`
            })
            +
            `
          </tr>

          <tr style="background-color: #9fdfa9;" >
          <th scope="col" class="vertical-text text-start align-middle" >(Year-EC)</th>
           <th scope="col" class="vertical-text text-start align-middle" >(Year-GC)</th>
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
                        indicatorValue += `<td> ${value && value.performance != null ? Number(value.performance.toFixed(1)) : "-"}</td>`
                        childBody(child, space)
                    }
                }

                let parentBody = () => {
                    for (let indicator of data.indicator_lists.filter((item) => item.parent_id == null)) {
                        let value = data.quarter_data_value.find((item) => item.for_datapoint__year_EC == year.year_EC && item.for_quarter__number == quarter.number && item.indicator__id == indicator.id)
                        indicatorValue += `<td> ${value && value.performance != null ? Number(value.performance.toFixed(1)) : "-"}</td>`
                        childBody(indicator)
                    }
                }

                parentBody()



                tableBody += `
                <tr>
                   <th class="text-success" style="${hasYear ? 'font-size: 0;' : ''}" >${year.year_EC}</th>
                   <th class="text-success" style="${hasYear ? 'font-size: 0;' : ''}" >${year.year_GC}</th>
                   <th class="text-success">${quarter.title_ENG}</th>
                   ${indicatorValue}
                </tr>
               `
                hasYear = true
                indicatorValue = ''
            }
        }


        $('[name="tableBodyQuarter"]').html(tableBody)

    }


    //Month
    const contractMonthTable = (data) => {
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
            <th style="width:150px;"  class="text-light" scope="col" >Monthly</th>
            <th style="width:150px;" scope="col" ></th>
            <th style="width:200px;" scope="col" ></th>
              ` +
            data.indicator_lists.map((indicator) => {
                return ` <th scope="col" style="width:70px;"></th>`
            })
            +
            `
          </tr>

          <tr style="background-color: #9fdfa9;" >
          <th scope="col" class="vertical-text text-start align-middle" >(Year E.C)</th>
          <th scope="col" class="vertical-text text-start align-middle" >(Year G.C)</th>
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
                        indicatorValue += `<td> ${value && value.performance != null ? Number(value.performance.toFixed(1)) : "-"}</td>`
                        childBody(child, space)
                    }
                }

                let parentBody = () => {
                    for (let indicator of data.indicator_lists.filter((item) => item.parent_id == null)) {
                        let value = data.month_data_value.find((item) => item.for_datapoint__year_EC == year.year_EC && item.for_month__number == month.number && item.indicator__id == indicator.id)
                        indicatorValue += `<td> ${value && value.performance != null ? Number(value.performance.toFixed(1)) : "-"}</td>`
                        childBody(indicator)
                    }
                }

                parentBody()



                tableBody += `
                <tr>
                   <th class="text-success" >${hasYear ? "" : year.year_EC}</th>
                   <th class="text-success" >${hasYear ? "" : year.year_GC}</th>
                   <th class="text-success">${month.month_AMH} (${month.month_ENG})</th>
                   ${indicatorValue}
                </tr>
               `
                hasYear = true
                indicatorValue = ''
            }
        }


        $('[name="tableBodyMonth"]').html(tableBody)


    }



})