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
      return { response: true, value: 0 };
    }
  };
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