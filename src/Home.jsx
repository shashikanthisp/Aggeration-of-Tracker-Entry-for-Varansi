import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Table, TableBody, TableRow, TableCell, Button } from "@dhis2/ui-core";
import ReactPaginate from "react-js-pagination";
import { CircularProgress } from "@material-ui/core";

import "./Pagination.css"; // Custom CSS file for pagination

const Home = () => {
  const TRACKER_PROGRAM = "Uj0u5eXg0RK";

  const PROGRAM_ORG_UNIT = "PYHQttVvQU0";
  const SAMPLE_LOCATION_DEPT_CODE = "sampleLocationDepartment";
  const DEFAULT_CC_CODE = "default";
  const ORGANISMS_SAMPLE_WISE_DATASET = "oG3BlD3M9IE";
  const ORGANISMS_ANTIBIOTIC_DATASET = "CBsMJKLKkUQ";
  const ANTIBIOTIC_CATEGORY_COMBO_CODE = "antibiotic";

  const allOrganismsAntibioticWiseDataSet = "CBsMJKLKkUQ";
  const antibioticCategoryComboCode = "antibiotic";

  const [isLoading, setIsLoading] = useState(false);
  const [program, setProgram] = useState([]);
  const [dataElementObjects, setDataElementObjects] = useState(null);
  const [categoryCombos, setCategoryCombos] = useState(null);
  const [aggregatedDataValue, setAggregatedDataValue] = useState(null);
  const [rootOrgUnit, setRootOrgUnit] = useState(null);
  const [activeEventList, setActiveEventList] = useState(null);
  const [Data, setData] = useState([]);
  const getRootOrgUnit = async () => {
    try {
      const response = await fetch(
        "../../organisationUnits?level=1&fields=id,name",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      return data.organisationUnits;
    } catch (error) {
      console.error("Error fetching root organization unit", error);
      return [];
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const result = await getRootOrgUnit();
      setRootOrgUnit(result[0].id);
    };

    fetchData();
  }, []);

  console.log("rootOrgUnit========", rootOrgUnit);
  const getActiveEventList = async (rootOrgUnit) => {
    try {
      const response = await fetch(
        `../../events.json?skipPaging=true&program=Uj0u5eXg0RK&orgUnit=YdrvIdocEMn&ouMode=DESCENDANTS&status=ACTIVE&filter=l9NuW9KD5mU:neq:NO GROWTH`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      return data.events;
    } catch (error) {
      console.error("Error fetching active event list", error);
      return [];
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const result = await getActiveEventList(rootOrgUnit);
      console.log("result=====", result);
      setActiveEventList(result);
    };

    fetchData();
  }, []);

  console.log("activeEventList=======", activeEventList);

  const fetchDataElementsDetails = async () => {
    try {
      const response = await fetch(
        "../../dataElements.json?paging=false&fields=id,code,displayName,formName,attributeValues[value,attribute[id,name]]",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const responseData = await response.json();
      const dataElements = {};
      const dataElementObjects = { attributeGroups: {} };

      responseData.dataElements.forEach((de) => {
        dataElements[de.id] = de.formName ? de.formName : de.displayName;

        de.attributeValues.forEach((attributeValue) => {
          de[attributeValue.attribute.code] = attributeValue.value;

          if (!dataElementObjects.attributeGroups[attributeValue.value]) {
            dataElementObjects.attributeGroups[attributeValue.value] = [];
          }

          dataElementObjects.attributeGroups[attributeValue.value].push(de.id);
        });

        dataElementObjects[de.id] = de;
        dataElementObjects[de.code] = de;
      });

      return dataElementObjects;
    } catch (error) {
      console.error(error.message);
      return { attributeGroups: {} };
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const result = await fetchDataElementsDetails();
      setDataElementObjects(result);
    };

    fetchData();
  }, []);
  console.log(
    "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
    dataElementObjects
  );
  const fetchCategoryCombosOptionsDetails = async () => {
    try {
      const response = await fetch(
        "../../categoryCombos.json?paging=false&fields=id,displayName,code,categoryOptionCombos[id,displayName,code,categoryOptions[id,code,displayName]]",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const responseData = await response.json();
      const categoryCombos = {};

      responseData.categoryCombos.forEach((categoryCombo) => {
        categoryCombo.categoryOptions = {};
        console.log("categoryCombo.categoryOptions======");

        categoryCombo.categoryOptionCombos.forEach((categoryOptionCombo) => {
          let categoryOptionCodes = [];

          categoryOptionCombo.categoryOptions.forEach((categoryOption) => {
            categoryOptionCodes.push(categoryOption.code);

            if (!categoryCombo.categoryOptions[categoryOption.code]) {
              categoryCombo.categoryOptions[categoryOption.code] =
                categoryOption.id;
            }
          });

          categoryOptionCodes = categoryOptionCodes.sort();
          const identifierWithOptionCodes = categoryOptionCodes.join("");
          categoryCombo.categoryOptionCombos[identifierWithOptionCodes] =
            categoryOptionCombo.id;
        });

        categoryCombos[categoryCombo.code] = categoryCombo;
      });

      return categoryCombos;
    } catch (error) {
      console.error(error.message);
      return {};
    }
  };
  useEffect(() => {
    const fetchData = async () => {
      const result = await fetchCategoryCombosOptionsDetails();
      setCategoryCombos(result);
    };

    fetchData();
  }, []);
  console.log("setCategoryCombos==========", categoryCombos);

  const postAggregatedDataValue = async (
    period,
    dataSet,
    de,
    orgUnit,
    cc,
    cp,
    co,
    defaultValue
  ) => {
    try {
      const response = await fetch(
        `../../dataValues.json?paging=false&pe=${period}&ds=${dataSet}&de=${de}&ou=${orgUnit}&cc=${cc}&cp=${cp}&co=${co}&value=${defaultValue}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        // Handle error
        console.error("Error:", response);
        return null; // or throw an error
      }

      const aggregatedDataValuePostResponse = await response.json();
      return aggregatedDataValuePostResponse;
    } catch (error) {
      console.error("Error:", error);
      return null; // or throw an error
    }
  };

  const getAggregatedDataValue = async (
    period,
    dataSet,
    de,
    orgUnit,
    cc,
    cp,
    co
  ) => {
    try {
      const response = await fetch(
        `../../dataValues.json?paging=false&pe=${period}&ds=${dataSet}&de=${de}&ou=${orgUnit}&cc=${cc}&cp=${cp}&co=${co}`
      );
      const data = await response.json();
      const value = data.length > 0 ? parseInt(data[0]) + 1 : 0;
      return { response: true, value };
    } catch (error) {
      console.error("Error fetching aggregated data value", error);
      return { response: true, value: 1 };
    }
  };

  console.log("aggregatedDataValue===========", aggregatedDataValue);

  const tempCategoryCombos = categoryCombos;

  const getEventList = async () => {
    try {
      const headersMapGrpByDomain = {}; // Replace with actual data
      // const initialSummary = prepareListFromMap(headersMapGrpByDomain); // Uncomment if needed
      const importSummary = {};
      const importSummaryMap = [];

      console.log("tempCategoryCombos -- ", categoryCombos); // Assuming tempCategoryCombos is defined

      const defaultDataSet = "oG3BlD3M9IE";
      const antibioticWiseDataSet = "CBsMJKLKkUQ";
      const coDefault =
        tempCategoryCombos[DEFAULT_CC_CODE].categoryOptionCombos[
          DEFAULT_CC_CODE
        ];
      const cCombo = categoryCombos.sampleLocationDepartment.id;
      console.log("cCombo==========", cCombo);
      // const activeEvenList = await MetadataService.getActiveEvenList(
      //   ROOT_OU_UID
      // );
      const eventList = activeEventList;
      console.log("EVentlisttttttttttttttttttt", eventList);
      setData(eventList);
      for (let i = 0; i < eventList.length; i++) {
        let organismDataTEI = "";
        let departmentDataTEI = "";
        let locationDataTEI = "";
        let sampleTypeDataTEI = "";
        let purposeOfSampleDataTEI = "";
        const antibioticCategoryOptionComboUIDsTEI = [];
        let tempAggregateDE = "";
        let tempCategoryOptions = "";

        const tempEventForUpdate = eventList[i];
        console.log("tempEventForUpdate===", tempEventForUpdate);
        const isoPeriod = eventList[i].eventDate
          .split("T")[0]
          .substring(0, 7)
          .replace("-", "");
        // const  isoPeriod =  new Date(eventList[i].eventDate).toISOString().split('T')[0];
        console.log("isoPeriod===========", isoPeriod);
        const aggregateorgUnit = eventList[i].orgUnit;

        console.log(i + " -- " + eventList[i].event + " -- " + isoPeriod);
        console.log("eventList[i].eventDate========", eventList[i].eventDate);
        // 2023-01-06T00:00:00.000

        for (let j = 0; j < eventList[i].dataValues.length; j++) {
          const dataElement = eventList[i].dataValues[j].dataElement;
          const isoPeriod = eventList[i].dataValues[j].value;
          console.log("organismDataTEI============", aggregateorgUnit);

          if (eventList[i].dataValues[j].dataElement === "KVYg3tnmNMU") {
            departmentDataTEI = eventList[i].dataValues[j].value;
          }
          if (eventList[i].dataValues[j].dataElement === "JtPSS6ksvz0") {
            locationDataTEI = eventList[i].dataValues[j].value;
          }
          if (eventList[i].dataValues[j].dataElement === "sCu0ugyEhus") {
            sampleTypeDataTEI = eventList[i].dataValues[j].value;
          }
          if (eventList[i].dataValues[j].dataElement === "l4kqMRq38bm") {
            purposeOfSampleDataTEI = eventList[i].dataValues[j].value;
          }
          if (eventList[i].dataValues[j].dataElement === "l9NuW9KD5mU") {
            organismDataTEI = eventList[i].dataValues[j].value;
          }
          console.log(
            "eventList[i].dataValues[j].value",
            eventList[i].dataValues[j].value
          );
          if (
            eventList[i].dataValues[j].value === "R" ||
            eventList[i].dataValues[j].value === "I" ||
            eventList[i].dataValues[j].value === "S"
          ) {
            console.log("dataElementObjects=============", dataElementObjects);
            console.log(
              "dataElementObjects[eventList[i].dataValues[j].dataElement].code",
              dataElementObjects[eventList[i].dataValues[j].dataElement].code
            );
            let tempArray = [
              dataElementObjects[eventList[i].dataValues[j].dataElement].code,
              eventList[i].dataValues[j].value,
            ];
            console.log("tempArray====", tempArray);
            tempArray = tempArray.sort();

            let categoryOptionCombo = tempArray.join("");
            console.log("categoryOptionCombo====", categoryOptionCombo);
            categoryOptionCombo =
              tempCategoryCombos[ANTIBIOTIC_CATEGORY_COMBO_CODE]
                .categoryOptionCombos[categoryOptionCombo];
            antibioticCategoryOptionComboUIDsTEI.push(categoryOptionCombo);
          }
        }

        if (
          locationDataTEI &&
          sampleTypeDataTEI &&
          departmentDataTEI &&
          purposeOfSampleDataTEI &&
          organismDataTEI
        ) {
          tempCategoryOptions =
            tempCategoryCombos[SAMPLE_LOCATION_DEPT_CODE].categoryOptions[
              locationDataTEI
            ];
          tempCategoryOptions =
            tempCategoryOptions +
            ";" +
            tempCategoryCombos[SAMPLE_LOCATION_DEPT_CODE].categoryOptions[
              sampleTypeDataTEI
            ];
          tempCategoryOptions =
            tempCategoryOptions +
            ";" +
            tempCategoryCombos[SAMPLE_LOCATION_DEPT_CODE].categoryOptions[
              departmentDataTEI
            ];
          tempCategoryOptions =
            tempCategoryOptions +
            ";" +
            tempCategoryCombos[SAMPLE_LOCATION_DEPT_CODE].categoryOptions[
              purposeOfSampleDataTEI
            ];
          tempAggregateDE = dataElementObjects[organismDataTEI].id;
          console.log("whyyyyyyyyyyy", tempAggregateDE);
          console.log("tempCategoryOptions====", tempCategoryOptions);
          // let defaultValue = 0;

          //           const aggregatedDataValueGetResponse = getAggregatedDataValue(
          //             isoPeriod,
          //             defaultDataSet,
          //             tempAggregateDE,
          //             aggregateorgUnit,
          //             cCombo,
          //             tempCategoryOptions,
          //             coDefault,
          //             'COMPLETE'
          //           );
          // console.log("aggregatedDataValueGetResponse========",aggregatedDataValueGetResponse)
          //           if (aggregatedDataValueGetResponse.response) {
          //             defaultValue = aggregatedDataValueGetResponse.value;

          //             // const aggregatedDataValuePostResponse =
          //             //   await fetch.postAggregatedDataValue(
          //             //     isoPeriod,
          //             //     defaultDataSet,
          //             //     tempAggregateDE,
          //             //     aggregateorgUnit,
          //             //     cCombo,
          //             //     tempCategoryOptions,
          //             //     coDefault,
          //             //     defaultValue
          //             //   );
          //             const aggregatedDataValuePostResponse =
          //             postAggregatedDataValue(
          //               isoPeriod,
          //               defaultDataSet,
          //               tempAggregateDE,
          //               aggregateorgUnit,
          //               cCombo,
          //               tempCategoryOptions,
          //               coDefault,
          //               defaultValue
          //             );

          //             console.log("aggregatedDataValuePostResponse===",aggregatedDataValuePostResponse);

          //             if (aggregatedDataValuePostResponse.data.status === "OK") {
          //               const eventUpdateResponse = await fetch.updateEventStatus(
          //                 tempEventForUpdate
          //               );
          //               console.log(eventUpdateResponse);
          //             }
          //           }
          //           else{

          //             defaultValue = 0;

          //             // const aggregatedDataValuePostResponse =
          //             //   await fetch.postAggregatedDataValue(
          //             //     isoPeriod,
          //             //     defaultDataSet,
          //             //     tempAggregateDE,
          //             //     aggregateorgUnit,
          //             //     cCombo,
          //             //     tempCategoryOptions,
          //             //     coDefault,
          //             //     defaultValue
          //             //   );
          //             const aggregatedDataValuePostResponse =
          //             postAggregatedDataValue(
          //               isoPeriod,
          //               defaultDataSet,
          //               tempAggregateDE,
          //               aggregateorgUnit,
          //               cCombo,
          //               tempCategoryOptions,
          //               coDefault,
          //               defaultValue
          //             );

          //             console.log("aggregatedDataValuePostResponse===",aggregatedDataValuePostResponse);

          //             if (aggregatedDataValuePostResponse.data.status === "OK") {
          //               const eventUpdateResponse = updateEventStatus(
          //                 tempEventForUpdate
          //               );
          //               console.log(eventUpdateResponse);
          //             }
          //           }
          let aggregatedDataValueGetResponse;
          let defaultValue;
          aggregatedDataValueGetResponse = await getAggregatedDataValue(
            isoPeriod,
            defaultDataSet,
            tempAggregateDE,
            aggregateorgUnit,
            cCombo,
            tempCategoryOptions,
            coDefault
          );

          if (aggregatedDataValueGetResponse.response) {
            // Successful fetching of data
            defaultValue = aggregatedDataValueGetResponse.value;
          }

          const aggregatedDataValuePostResponse = await postAggregatedDataValue(
            isoPeriod,
            defaultDataSet,
            tempAggregateDE,
            aggregateorgUnit,
            cCombo,
            tempCategoryOptions,
            coDefault,
            defaultValue
          ).then((aggregatedDataValuePostResponse) => {
            console.log(
              "aggregatedDataValuePostResponse.data.message",
              aggregatedDataValuePostResponse.data.message
            );
          });

          if (aggregatedDataValuePostResponse.data.status === "OK") {
            const eventUpdateResponse = updateEventStatus(tempEventForUpdate);
            console.log(eventUpdateResponse);
          }

          // push antibiotic test result value to aggregated DataValue
          // if (organismDataTEI !== "STERILE") {
          //   const deAntibioticWise =
          //     dataElementObjects[`${organismDataTEI}_AW`].id;

          //   for (let index in antibioticCategoryOptionComboUIDsTEI) {
          //     const antiCategoryOptionCombo =
          //       antibioticCategoryOptionComboUIDsTEI[index];

          //     const aggregatedDataValueGetResponse =
          //       getAggregatedDataValue(
          //         isoPeriod,
          //         antibioticWiseDataSet,
          //         deAntibioticWise,
          //         aggregateorgUnit,
          //         cCombo,
          //         tempCategoryOptions,
          //         antiCategoryOptionCombo
          //       );

          //     if (aggregatedDataValueGetResponse.response) {
          //       defaultValue = aggregatedDataValueGetResponse.value;

          //       const aggregatedDataValuePostResponse =
          //         postAggregatedDataValue(
          //           isoPeriod,
          //           antibioticWiseDataSet,
          //           deAntibioticWise,
          //           aggregateorgUnit,
          //           cCombo,
          //           tempCategoryOptions,
          //           antiCategoryOptionCombo,
          //           defaultValue
          //         );

          //       console.log(aggregatedDataValuePostResponse.data.message);

          //       if (aggregatedDataValuePostResponse.data.status === "OK") {
          //         const eventUpdateResponse =
          //           updateEventStatus(tempEventForUpdate);
          //         console.log(eventUpdateResponse);
          //       }
          //     }
          //   }
          // }
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const updateEventStatus = async (tempEvent) => {
    try {
      const updatedEvent = { ...tempEvent, status: "COMPLETED" };

      const response = await fetch(`../../events/${tempEvent.event}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedEvent),
      });

      if (!response.ok) {
        // Handle error
        console.error("Error:", response);
        return null; // or throw an error
      }

      const updateEventStatusResponse = await response.json();
      return updateEventStatusResponse;
    } catch (error) {
      console.error("Error:", error);
      return null; // or throw an error
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // const tempEventForUpdate;

        // Call your updateEventStatus function here
        const updateEventStatusResponse = await updateEventStatus(
          tempEventForUpdate
        );

        console.log("updateEventStatusResponse==", updateEventStatusResponse);

        // Rest of your logic here
      } catch (error) {
        console.error("Error:", error);
      }
    };

    fetchData(); // Invoke the fetchData function when the component mounts
  }, []);

  // useEffect(() => {
  //   getEventList();
  // }, []);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Adjust this value to set the number of items per page

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  var val = () => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentData = Data.slice(indexOfFirstItem, indexOfLastItem);

    if (currentData !== undefined) {
      return currentData.map((ele, index) => {
        if (ele.program) {
          var dataValue = {};

          for (let value of ele.dataValues) {
            if (value.dataElement === "l9NuW9KD5mU") {
              dataValue["1"] = value;
            }
            if (value.dataElement === "sCu0ugyEhus") {
              dataValue["2"] = value;
            }
            if (value.dataElement === "JtPSS6ksvz0") {
              dataValue["3"] = value;
            }
            if (value.dataElement === "KVYg3tnmNMU") {
              dataValue["7"] = value;
            }
           
            // if (value.dataElement === "R2mBPwI7ofD ") {
            //   dataValue["9"] = value;
            //   console.log("dataValue333333333333", dataValue["9"]);
            // }
          }

          // Conditionally initialize missing values
          if (!dataValue["1"]) {
            dataValue["1"] = { value: "" };
          }
          if (!dataValue["2"]) {
            dataValue["2"] = { value: "" };
          }
          if (!dataValue["3"]) {
            dataValue["3"] = { value: "" };
          }
          if (!dataValue["7"]) {
            dataValue["7"] = { value: "" };
          }
          if (!dataValue["9"]) {
            dataValue["9"] = { value: "" };
          }

          return (
            <>
              <TableRow key={index}>
                {Object.keys(dataValue).map((key) => (
                  <TableCell key={key}>{dataValue[key].value}</TableCell>
                ))}
              </TableRow>
            </>
          );
        }
      });
    }
  };

  const handleSelectChange = (e) => {
    setSelectedProgramValue(e.target.value);
  };
  // useEffect(() => {
  //   val();
  // }, []);
  return (
    <>
      <div style={{ padding: "10px" }}>
        <div style={{ display: "flex" }}>
          <div style={{ marginTop: "42px", marginLeft: "5px" }}>
            <Button primary={true} onClick={getEventList}>
              Aggregate
            </Button>
          </div>
        </div>
        <div>
          <Table>
            <TableRow>
              <TableCell>
                <b>Organism</b>
              </TableCell>
              <TableCell>
                <b>Sample Type</b>
              </TableCell>
              <TableCell>
                <b>Location</b>
              </TableCell>
              <TableCell>
                <b>Department</b>
              </TableCell>
            </TableRow>
            {isLoading ? (
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                }}
              >
                <CircularProgress />
              </div>
            ) : (
              <TableBody>{val()}</TableBody>
            )}
          </Table>

          <ReactPaginate
            activePage={currentPage}
            itemsCountPerPage={itemsPerPage}
            totalItemsCount={Data.length}
            pageRangeDisplayed={5}
            onChange={handlePageChange}
            itemClass="page-item"
            linkClass="page-link"
          />
        </div>
      </div>
    </>
  );
};

export default Home;
