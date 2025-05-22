import React, { useState } from 'react';

// Sample room data
const INITIAL_ROOMS = [
  {
    id: 'room-1',
    name: 'Lecture Hall A',
    type: 'Lecture Hall',
    capacity: 120,
    equipment: ['Projector', 'Smart Board', 'Audio System'],
    building: 'Science Building',
    floor: '1st Floor'
  },
  {
    id: 'room-2',
    name: 'Lab 101',
    type: 'Computer Lab',
    capacity: 30,
    equipment: ['Computers', 'Projector', 'Whiteboard'],
    building: 'Engineering Building',
    floor: '2nd Floor'
  },
  {
    id: 'room-3',
    name: 'Seminar Room 201',
    type: 'Seminar Room',
    capacity: 40,
    equipment: ['Projector', 'Whiteboard'],
    building: 'Humanities Building',
    floor: '3rd Floor'
  }
];

const RoomManagement = () => {
  const [rooms, setRooms] = useState(INITIAL_ROOMS);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleTypeFilter = (type) => {
    setTypeFilter(type);
  };

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room.building.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || room.type.toLowerCase().includes(typeFilter.toLowerCase());
    return matchesSearch && matchesType;
  });

  const handleSelectRoom = (room) => {
    setSelectedRoom(room);
  };

  return (
    <div className="room-management">
      <div className="room-header">
        <h2>Room Management</h2>
        <button className="btn">
          Add Room
        </button>
      </div>

      <div className="room-container">
        <div className="room-list">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search rooms..."
              value={searchTerm}
              onChange={handleSearch}
              className="search-input"
            />
          </div>

          <div className="search-filters">
            <div className="filter-group">
              <span className="filter-label">Type:</span>
              <select 
                className="filter-select"
                value={typeFilter}
                onChange={(e) => handleTypeFilter(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="lecture">Lecture Halls</option>
                <option value="lab">Labs</option>
                <option value="seminar">Seminar Rooms</option>
              </select>
            </div>
          </div>

          <div className="room-grid">
            {filteredRooms.map(room => (
              <div
                key={room.id}
                className={`room-card ${selectedRoom?.id === room.id ? 'selected' : ''}`}
                onClick={() => handleSelectRoom(room)}
              >
                <div className="room-card-header">
                  <div className="room-info">
                    <h3>{room.name}</h3>
                    <div className="room-type">{room.type}</div>
                  </div>
                </div>
                
                <div className="room-stats">
                  <div className="stat-item">
                    <div className="stat-value">{room.capacity}</div>
                    <div className="stat-label">Capacity</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">{room.building}</div>
                    <div className="stat-label">Building</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedRoom && (
          <div className="room-details">
            <div className="details-header">
              <h2>{selectedRoom.name}</h2>
              <div className="room-actions">
                <button 
                  className="btn btn-icon" 
                  onClick={() => {}}
                  title="Edit Room"
                >
                  ✎
                </button>
                <button 
                  className="btn btn-icon btn-danger" 
                  onClick={() => {}}
                  title="Delete Room"
                >
                  🗑
                </button>
              </div>
            </div>

            <div className="room-info-section">
              <p><strong>Type:</strong> {selectedRoom.type}</p>
              <p><strong>Building:</strong> {selectedRoom.building}</p>
              <p><strong>Floor:</strong> {selectedRoom.floor}</p>
              <p><strong>Capacity:</strong> {selectedRoom.capacity} students</p>
            </div>

            <div className="equipment-section">
              <h3>Equipment</h3>
              <div className="equipment-list">
                {selectedRoom.equipment.map((item, index) => (
                  <span key={index} className="equipment-tag">{item}</span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomManagement;
