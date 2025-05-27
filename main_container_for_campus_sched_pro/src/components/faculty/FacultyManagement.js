import React from "react";
import { useSchedule } from "../../context/ScheduleContext";
import "../../styles/FacultyManagement.css";

const FacultyManagement = () => {
  const { faculty, loading, errors, refreshData } = useSchedule();

  if (loading) {
    return <div className="loader">Loading faculty data...</div>;
  }

  if (errors?.general) {
    return (
      <div className="error-container">
        <strong>Error: {errors.general}</strong>
        <button onClick={refreshData} className="btn btn-accent">Retry</button>
      </div>
    );
  }

  return (
    <div className="container">
      <h2>Faculty List</h2>
      <table className="entity-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Department</th>
            {/* Only show direct flat fields */}
          </tr>
        </thead>
        <tbody>
          {faculty.map(fac => (
            <tr key={fac.id}>
              <td>{fac.name}</td>
              <td>{fac.email}</td>
              <td>{fac.department}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FacultyManagement;
