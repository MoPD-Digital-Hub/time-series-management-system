$(document).ready(function () {
  let url = `/user-admin/json-filter-measurement/`;

  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      let table = "";
      table += `
      <table id="newTable" class="table table-bordered m-0 p-0" style="width:100%">
      <thead>
        <tr>
          <th class="ps-5 pe-5">Title English</th>
          <th class="ps-5 pe-5">Title Amharic</th>
          <th class="ps-5 pe-5">Action</th>
        </tr>
  
      </thead>
      <tbody>`;

      //Child Measurement

      let measurementChild = (parent, space) => {
        let status = false;
        space += String("&nbsp;&nbsp;&nbsp;&nbsp");
        for (measure of data.measurements) {
          if (String(measure.parent_id) === String(parent.id) && !measure.is_deleted) {
            for (check of data.measurements) {
              if (String(measure.id) === String(check.parent_id)) {
                status = true;
              }
            }
            if(!measure.Amount_AMH) {
              measure.Amount_AMH = ' - '
            }
            if (status == true) {
              table += `
                <tr>
                  <td class="fw-bold">
                  &nbsp;&nbsp;&nbsp;&nbsp; ${space} ${measure.Amount_ENG}
                  </td>
                  <td class="fw-bold">
                  &nbsp;&nbsp;&nbsp;&nbsp; ${space} ${measure.Amount_AMH}
                  </td>
                  <td>
                    <button type="button" name="btnAddMeasurement" id="${measure.id}" data-bs-toggle="modal"  data-bs-target="#addIndicatorModal"  class="btn btn-outline-primary border-0  pt-1 pb-1" data-bs-toggle="tooltip" data-bs-placement="bottom" title="Add new Sub-Indicator">+</button>
    
                    <button type="button" name="editMeasurement" id="${measure.id}" data-bs-toggle="modal"  data-bs-toggle="modal" data-bs-target="#editModalIndicator"   data-bs-toggle="modal"  data-bs-target="#addIndicatorModal"  class="btn btn-outline-warning border-0  pt-1 pb-1" data-bs-toggle="tooltip" data-bs-placement="bottom" title="Edit indicator "><i class="fas fa-pen"></i></button>
    
                    <button type="button" name="btnDeleteMeasurement" id="${measure.id}" data-bs-toggle="modal"  data-bs-target="#removeIndicatorModal"  class="btn btn-outline-danger border-0  pt-1 pb-1" data-bs-toggle="tooltip" data-bs-placement="bottom" title="Remove Indicator"><i class="fas fa-trash"></i></button>
                  </td>
                </tr>`;
              measurementChild(measure, space);
            } else {
              table += `
                <tr>
                  <td class="">
                  &nbsp;&nbsp;&nbsp;&nbsp;  ${space} ${measure.Amount_ENG}
                  </td>
                  <td class="">
                  &nbsp;&nbsp;&nbsp;&nbsp;  ${space} ${measure.Amount_AMH}
                  </td>
                  <td>
                    <button type="button" name="btnAddMeasurement" id="${measure.id}" data-bs-toggle="modal"  data-bs-target="#addIndicatorModal"  class="btn btn-outline-primary border-0  pt-1 pb-1" data-bs-toggle="tooltip" data-bs-placement="bottom" title="Add new Sub-Indicator">+</button>
    
                    <button type="button" name="editMeasurement" id="${measure.id}" data-bs-toggle="modal"  data-bs-toggle="modal" data-bs-target="#editModalIndicator"   data-bs-toggle="modal"  data-bs-target="#addIndicatorModal"  class="btn btn-outline-warning border-0  pt-1 pb-1" data-bs-toggle="tooltip" data-bs-placement="bottom" title="Edit indicator "><i class="fas fa-pen"></i></button>
    
                    <button type="button" name="btnDeleteMeasurement" id="${measure.id}" data-bs-toggle="modal"  data-bs-target="#removeIndicatorModal"  class="btn btn-outline-danger border-0  pt-1 pb-1" data-bs-toggle="tooltip" data-bs-placement="bottom" title="Remove Indicator"><i class="fas fa-trash"></i></button>
                  </td>
                </tr>`;
            }
          }
        }
      };

      //Parent Measurement
      for (measurement of data.measurements) {
        if (measurement.parent_id == null && !measurement.is_deleted) {
          if(!measurement.Amount_AMH) {
            measurement.Amount_AMH = ' - '
          }
          table += `
              <tr>
                <td class="fw-bold">
                          ${measurement.Amount_ENG}
                </td>
                <td class="fw-bold">
                          ${measurement.Amount_AMH}
                </td>
                <td>
                  <button type="button" name="btnAddMeasurement" id="${measurement.id}" data-bs-toggle="modal"  data-bs-target="#addIndicatorModal"  class="btn btn-outline-primary border-0  pt-1 pb-1" data-bs-toggle="tooltip" data-bs-placement="bottom" title="Add new Sub-Indicator">+</button>
  
                  <button type="button" name="editMeasurement" id="${measurement.id}" data-bs-toggle="modal"  data-bs-toggle="modal" data-bs-target="#editModalIndicator"   data-bs-toggle="modal"  data-bs-target="#addIndicatorModal"  class="btn btn-outline-warning border-0  pt-1 pb-1" data-bs-toggle="tooltip" data-bs-placement="bottom" title="Edit indicator "><i class="fas fa-pen"></i></button>
  
                  <button type="button" name="btnDeleteMeasurement" id="${measurement.id}" data-bs-toggle="modal"  data-bs-target="#removeIndicatorModal"  class="btn btn-outline-danger border-0  pt-1 pb-1" data-bs-toggle="tooltip" data-bs-placement="bottom" title="Remove Indicator"><i class="fas fa-trash"></i></button>
                </td>
              </tr>`;
              measurementChild(measurement, " ");
        }
       
      }

      document.getElementById("tableTest").innerHTML = table;

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
            [25, 50, -1],
            ["25 rows", "50 rows", "Show all"],
          ],

          dom: "Bfrtip",
          buttons: ["pageLength", "excel", "csv", "pdf", "print"],
        });
      });



      let parentContainer = document.querySelector("#tableTest");

      let titleEnglish = document.getElementById("id_Amount_ENG");
      let titleAmharic = document.getElementById("id_Amount_AMH");


      //Add Indicator Function
      let addSubMeasurement = () => {
        let btnAddMeasurement = document.getElementsByName("btnAddMeasurement");
        btnAddMeasurement.forEach((clickableButton) => {
          clickableButton.addEventListener("click", () => {
            let measurementId = clickableButton.id;
            console.log(measurementId)
            document.getElementById("addNewMeasurement").value = measurementId;
          });
        });
      };


      //Edit Indicator Function
      let editMeasurement = () => {
        let btnMeasurement =
          document.getElementsByName("editMeasurement");
        btnMeasurement.forEach((editMeasure) => {
          editMeasure.addEventListener("click", () => {
            let measurementId = editMeasure.id;
            console.log(measurementId)


            let selectedMeasurement = data.measurements.find(
              (measurement) => String(measurement.id) == String(measurementId)
            );

            if (selectedMeasurement.title_AMH == null) {
              selectedMeasurement.title_AMH = "";
            }

            titleEnglish.value = selectedMeasurement.Amount_ENG;
            titleAmharic.value = selectedMeasurement.Amount_AMH;
            document.getElementById("id_measurement_id").value = measurementId;
          });
        });
      };

      //Delete Indicator Function
      let removeSubIndicator = () => {
        let btnDeleteMeasurement = document.getElementsByName(
          "btnDeleteMeasurement"
        );
        btnDeleteMeasurement.forEach((deleteMeasurement) => {
          deleteMeasurement.addEventListener("click", () => {
            let approveAnchor = document.getElementById("forRemoveMeasurement");
            approveAnchor.setAttribute(
              "href",
              `/user-admin/measurement-delete/${deleteMeasurement.id}`
            );
          });
        });
      };

      //Before any changes
      editMeasurement();
      removeSubIndicator();
      addSubMeasurement();
      //Call After table is Changed
      parentContainer.addEventListener("click", () => {
        editMeasurement();
        removeSubIndicator();
        addSubMeasurement();
      });
    })
    .catch((err) => console.log(err));
});
