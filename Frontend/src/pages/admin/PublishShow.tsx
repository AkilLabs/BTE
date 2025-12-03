import { useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

export default function PublishShowAndScreens() {
  const { movieId } = useParams();

  const [dateInput, setDateInput] = useState("");
  const [timeInput, setTimeInput] = useState("");
  const [selectedScreens, setSelectedScreens] = useState<string[]>([]);

  const [schedule, setSchedule] = useState<{
    [date: string]: { [time: string]: string[] };
  }>({});

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const toggleScreen = (screen: string) => {
    setSelectedScreens((prev) =>
      prev.includes(screen)
        ? prev.filter((x) => x !== screen)
        : [...prev, screen]
    );
  };

  const addShowtime = () => {
    if (!dateInput || !timeInput || selectedScreens.length === 0) {
      setMessage("Please select date, time, and at least one screen.");
      return;
    }

    setSchedule((prev) => ({
      ...prev,
      [dateInput]: {
        ...(prev[dateInput] || {}),
        [timeInput]: selectedScreens
      }
    }));

    setTimeInput("");
    setSelectedScreens([]);
    setMessage("");
  };

  const publishData = async () => {
    if (Object.keys(schedule).length === 0) {
      setMessage("Please add show schedule first.");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(
        `http://localhost:8000/api/admin/movies/${movieId}/publish-schedule/`,
        { schedule },
        { withCredentials: true }
      );

      setMessage("Showtimes & screens published successfully!");
      console.log(response.data);
    } catch (err: any) {
      console.error(err);
      setMessage(err?.response?.data?.error || "Failed to publish schedule.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-5">Publish Showtimes & Screens</h1>

      {/* Date Input */}
      <label className="font-semibold">Select Date</label>
      <input
        type="date"
        value={dateInput}
        onChange={(e) => setDateInput(e.target.value)}
        className="border p-2 rounded w-full mb-4"
      />

      {/* Time Input */}
      <label className="font-semibold">Select Showtime</label>
      <input
        type="time"
        value={timeInput}
        onChange={(e) => setTimeInput(e.target.value)}
        className="border p-2 rounded w-full mb-4"
      />

      {/* Screen Selection */}
      <label className="font-semibold">Select Screens</label>
      <div className="flex gap-4 my-2">
        {["S1", "S2", "S3", "S4"].map((screen) => (
          <button
            key={screen}
            type="button"
            className={`px-4 py-2 rounded border ${
              selectedScreens.includes(screen)
                ? "bg-blue-600 text-white"
                : "bg-gray-100"
            }`}
            onClick={() => toggleScreen(screen)}
          >
            {screen}
          </button>
        ))}
      </div>

      <button
        onClick={addShowtime}
        className="bg-green-600 text-white px-6 py-2 rounded w-full mt-3"
      >
        Add Showtime
      </button>

      {/* Schedule Preview */}
      <h2 className="text-xl font-semibold mt-6 mb-3">Show Schedule</h2>

      {Object.keys(schedule).length === 0 && (
        <p className="text-gray-600">No showtimes added yet.</p>
      )}

      {Object.entries(schedule).map(([date, times]) => (
        <div key={date} className="border rounded p-4 mb-4 bg-gray-50">
          <h3 className="font-bold mb-2">{date}</h3>

          {Object.entries(times).map(([time, screens]) => (
            <div key={time} className="mb-2">
              <span className="font-medium">{time}</span>
              <span className="ml-3 text-sm text-gray-700">
                Screens: {screens.join(", ")}
              </span>
            </div>
          ))}
        </div>
      ))}

      <button
        onClick={publishData}
        disabled={loading}
        className="bg-blue-700 text-white px-6 py-2 rounded w-full mt-5"
      >
        {loading ? "Publishing..." : "Publish All"}
      </button>

      {message && (
        <p className="mt-4 text-center font-semibold">{message}</p>
      )}
    </div>
  );
}
