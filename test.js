  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

  const handleAddEvent = async () => {
    if (!eventText.trim() || !startDateTime || !endDateTime) {
      alert("Please fill in all fields: Event Name, Start Time, and End Time.");
      return;
    }
    console.log(startDateTime);
    let start = new Date(startDateTime);
    let end = new Date(endDateTime);
    console.log(start);
    console.log(end);

    if (start >= end) {
      alert("Start time must be earlier than end time!");
      return;
    }

    let current = new Date(start);
    let eventsData = [];

    // while (current <= end) {
    //   let nextDay = new Date(current);
    //   nextDay.setHours(23, 59, 59, 999);

    //   let currentEnd = nextDay < end ? nextDay : end;
    //   console.log(current, currentEnd);
      let currentEnd = end;
      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, "0"); // Months are 0-based, so +1
      const day = String(current.getDate()).padStart(2, "0");

      const theDate = `${year}-${month}-${day}`;

      const formatTime = (date) => {
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        const seconds = String(date.getSeconds()).padStart(2, "0");
        return `${hours}:${minutes}:${seconds}`;
      };      

      const eventData = {
        event_name: eventText,
        // date: theDate,
        start_time: formatTime(current),
        end_time: formatTime(currentEnd),
      };
      eventsData.push(eventData);
      console.log("before api call: ", eventData);
      current.setDate(current.getDate() + 1);
      current.setHours(0, 0, 0, 0);
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("User is not authenticated.");
      }

      const responses = await Promise.all(eventsData.map(eventData =>
        fetchWithAuth(`${apiBaseUrl}timetable/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(eventData),
        })
      ));

      const responseData = await Promise.all(responses.map(res => res.json()));
      console.log("now response data: ");
      responseData.forEach((data) => {
        const [startHour, startMinute] = data.start_time.split(":").map(Number);
        const [endHour, endMinute] = data.end_time.split(":").map(Number);

        const start = startHour * 60 + startMinute;
        const end = endHour * 60 + endMinute;
        const duration = end - start;

        addEvent(data.event_name, start, duration, data.id, data.date);
      });
      
      setEventText("");
      setStartDateTime("");
      setEndDateTime("");
      setError("");
    } catch (error) {
      console.error("Error adding event:", error);
      setError(error.message);
    }
  };