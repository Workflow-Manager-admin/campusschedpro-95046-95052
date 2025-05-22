import React, { useState } from 'react';

// Sample room allocation data
const INITIAL_ALLOCATIONS = [
  {
    roomId: 'room-1',
    roomName: 'Lecture Hall A',
    building: 'Science Building',
    courses: [
      {
        id: 'course-1',
        name: 'Introduction to Computer Science',
        code: 'CS101',
        instructor: 'Dr. Smith',
        schedule: ['Monday-9:00 AM', 'Wednesday-9:00 AM']
      },
      {
        id: 'course-3',
        name: 'Database Systems',
        code: 'CS301',
        instructor: 'Dr. Davis',
        schedule: ['Tuesday-1:00 PM', 'Thursday-1:00 PM']
      }
    ]
  },
  {
    roomId: 'room-2',
    roomName: 'Lab 101',
    building: 'Engineering Building',
    courses: [
      {
        id: 'course-2',
        name: 'Data Structures',
        code: 'CS201',
        instructor: 'Dr. Johnson',
        schedule: ['Monday-1:00 PM', 'Wednesday-1:00 PM']
      }
    ]
  }
];

const RoomAllocation = () => {
  const [allocations] = useState(INITIAL_ALLOCATIONS);
  const [buildingFilter, setBuildingFilter] = useState('all');

  const buildings = ['all', ...new Set(allocations.map(a => a.building))];
  
  const filteredAllocations = allocations.filter(allocation => 
    buildingFilter === 'all' || allocation.building === buildingFilter
  );

  return (
    <div className="room-allocation">
      <div className="room-header">
        <h2>Room Allocation</h2>
      </div>

      <div className="search-filters">
        <div className="filter-group">
          <span className="filter-label">Building:</span>
          <select 
            className="filter-select"
            value={buildingFilter}
            onChange={(e) => setBuildingFilter(e.target.value)}
          >
            {buildings.map((building, index) => (
              <option key={index} value={building}>
                {building === 'all' ? 'All Buildings' : building}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="allocation-container">
        {filteredAllocations.map(allocation => (
          <div key={allocation.roomId} className="allocation-card">
            <div className="allocation-header">
              <h3 className="allocation-title">{allocation.roomName}</h3>
              <span>{allocation.building}</span>
            </div>

            <table className="schedule-table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Instructor</th>
                  <th>Schedule</th>
                </tr>
              </thead>
              <tbody>
                {allocation.courses.map(course => (
                  <tr key={course.id}>
                    <td>{course.code} - {course.name}</td>
                    <td>{course.instructor}</td>
                    <td>{course.schedule.join(', ')}</td>
                  </tr>
                ))}
                {allocation.courses.length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', padding: '20px 0' }}>
                      No courses assigned
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoomAllocation;
