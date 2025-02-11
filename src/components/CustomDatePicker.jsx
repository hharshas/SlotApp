import { useState } from "react";
import dayjs from "dayjs";

export default function CustomDatePicker({ selectedDate, handleDateSelect, eventsByDate}) {
  const [currentMonth, setCurrentMonth] = useState(dayjs(selectedDate));

  const daysInMonth = currentMonth.daysInMonth();
  const firstDayOfMonth = currentMonth.startOf("month").day();
  const daysArray = Array.from({ length: firstDayOfMonth + daysInMonth }, (_, i) =>
    i >= firstDayOfMonth ? i - firstDayOfMonth + 1 : null
  );
  // console.log(daysArray);
  // console.log(firstDayOfMonth);
  const handleDateClick = (day) => {
    const newDate = currentMonth.date(day).toDate();
    handleDateSelect(newDate);
  };

  return (
    <div className="bg-white shadow-lg rounded p-4 w-full h-full">
      {/* Month Navigation */}
      <div className="flex justify-between items-center mb-12">
        <button onClick={() => setCurrentMonth(currentMonth.subtract(1, "month"))}>←</button> 
        <span className="font-bold">{currentMonth.format("MMMM YYYY")}</span>
        <button onClick={() => setCurrentMonth(currentMonth.add(1, "month"))}>→</button>
      </div>

      {/* Week Labels */}
      <div className="grid grid-cols-7 gap-20 text-center font-bold text-gray-600">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 text-center gap-20">
      {daysArray.map((day, index) =>
          day ? (
            (() => {
              const dateKey = currentMonth.date(day).format("YYYY-MM-DD");
              const eventCount = eventsByDate[dateKey]?.length || 0;

              // Determine intensity of the color based on event frequency
              const bgColor =
                eventCount > 5 ? "bg-blue-900 text-white" :
                eventCount > 3 ? "bg-blue-700 text-white" :
                eventCount > 1 ? "bg-blue-500 text-white" :
                eventCount === 1 ? "bg-blue-300 text-white" : "bg-transparent";

              return (
                <button
                  key={index}
                  className={`cursor-pointer w-12 h-12 flex items-center justify-center rounded-full text-lg font-bold ${bgColor} ${
                    dayjs(selectedDate).date() === day ? "border-2 border-black" : "hover:bg-gray-200"
                  }`}
                  onClick={() => handleDateClick(day)}
                >
                  {day}
                </button>
              );
            })()
          ) : (
            <div key={index} className="p-2"></div>
          )
        )}
      </div>
    </div>
  );
}
