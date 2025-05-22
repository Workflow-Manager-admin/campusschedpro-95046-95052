import React, { useState } from 'react';
import { Alert, Snackbar } from '@mui/material';
import { useSchedule } from '../../context/ScheduleContext';

const ROOM_TYPES = ['Lecture Hall', 'Computer Lab', 'Seminar Room', 'Classroom', 'Conference Room'];
const EQUIPMENT_OPTIONS = ['Projector', 'Whiteboard', 'Smart Board', 'Computers', 'Audio System', 'Video Conference', 'Document Camera'];
const BUILDINGS = ['Science Building', 'Engineering Building', 'Humanities Building', 'Business Building', 'Library'];

const RoomManagement = () => {
  // Use room data from context instead of local state
  const { rooms, setRooms, showNotification: contextShowNotification } = useSchedule();
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [buildingFilter, setBuildingFilter] = useState('all');
  const [isEditing, setIsEditing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editedRoom, setEditedRoom] = useState(null);
  // Local component state for UI management only
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Room form state for adding new rooms
  const [newRoom, setNewRoom] = useState({
    name: '',
    type: ROOM_TYPES[0],
    capacity: 30,
    equipment: [],
    building: BUILDINGS[0],
    floor: '1st Floor'
  });

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleTypeFilter = (type) => {
    setTypeFilter(type);
  };

  const handleBuildingFilter = (building) => {
    setBuildingFilter(building);
  };

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room.building.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || room.type.toLowerCase().includes(typeFilter.toLowerCase());
    const matchesBuilding = buildingFilter === 'all' || room.building === buildingFilter;
    return matchesSearch && matchesType && matchesBuilding;
  });

  const handleSelectRoom = (room) => {
    setSelectedRoom(room);
    setIsEditing(false);
  };

  const handleEditRoom = () => {
    setIsEditing(true);
    setEditedRoom({ ...selectedRoom });
  };

  const handleEditChange = (field, value) => {
    setEditedRoom(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEquipmentChange = (equipment) => {
    const updatedEquipment = editedRoom.equipment.includes(equipment)
      ? editedRoom.equipment.filter(e => e !== equipment)
      : [...editedRoom.equipment, equipment];
    
    setEditedRoom(prev => ({
      ...prev,
      equipment: updatedEquipment
    }));
  };

  const handleNewRoomEquipmentChange = (equipment) => {
    const updatedEquipment = newRoom.equipment.includes(equipment)
      ? newRoom.equipment.filter(e => e !== equipment)
      : [...newRoom.equipment, equipment];
    
    setNewRoom(prev => ({
      ...prev,
      equipment: updatedEquipment
    }));
  };

  const handleSaveEdit = () => {
    // Validate edited room
    if (!editedRoom.name || !editedRoom.type || !editedRoom.building) {
      contextShowNotification('Please fill in all required fields', 'error');
      return;
    }

    // Update rooms array
    const updatedRooms = rooms.map(room => 
      room.id === editedRoom.id ? editedRoom : room
    );
    
    setRooms(updatedRooms);
    setSelectedRoom(editedRoom);
    setIsEditing(false);
    
    contextShowNotification('Room updated successfully', 'success');
  };

  const handleDeleteRoom = () => {
    if (!selectedRoom) return;

    // Filter out the selected room
    const updatedRooms = rooms.filter(room => room.id !== selectedRoom.id);
    
    setRooms(updatedRooms);
    setSelectedRoom(null);
    
    contextShowNotification('Room deleted successfully', 'success');
  };

  const handleAddRoom = () => {
    // Validate new room
    if (!newRoom.name || !newRoom.type || !newRoom.building) {
      contextShowNotification('Please fill in all required fields', 'error');
      return;
    }

    // Create new room with unique ID
    const newRoomWithId = {
      ...newRoom,
      id: `room-${Date.now()}`
    };

    // Add to rooms array
    setRooms([...rooms, newRoomWithId]);
    setShowAddModal(false);
    
    // Reset new room form
    setNewRoom({
      name: '',
      type: ROOM_TYPES[0],
      capacity: 30,
      equipment: [],
      building: BUILDINGS[0],
      floor: '1st Floor'
    });
    
    contextShowNotification('Room added successfully', 'success');
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  return (
    <div className="room-management">
      <div className="room-header">
        <h2>Room Management</h2>
        <button 
          className="btn"
          onClick={() => setShowAddModal(true)}
        >
          + Add Room
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
                {ROOM_TYPES.map((type, index) => (
                  <option key={index} value={type.toLowerCase()}>{type}</option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <span className="filter-label">Building:</span>
              <select 
                className="filter-select"
                value={buildingFilter}
                onChange={(e) => handleBuildingFilter(e.target.value)}
              >
                <option value="all">All Buildings</option>
                {BUILDINGS.map((building, index) => (
                  <option key={index} value={building}>{building}</option>
                ))}
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
                    <div className="stat-value">{room.building.split(' ')[0]}</div>
                    <div className="stat-label">Building</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">{room.equipment.length}</div>
                    <div className="stat-label">Equipment</div>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredRooms.length === 0 && (
              <div className="no-results">
                <p>No rooms match your search criteria</p>
              </div>
            )}
          </div>
        </div>

        {selectedRoom && !isEditing && (
          <div className="room-details">
            <div className="details-header">
              <h2>{selectedRoom.name}</h2>
              <div className="room-actions">
                <button 
                  className="btn btn-icon" 
                  onClick={handleEditRoom}
                  title="Edit Room"
                >
                  ✎
                </button>
                <button 
                  className="btn btn-icon btn-danger" 
                  onClick={handleDeleteRoom}
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
                {selectedRoom.equipment.length === 0 && (
                  <p>No equipment listed</p>
                )}
              </div>
            </div>
          </div>
        )}

        {selectedRoom && isEditing && (
          <div className="room-details">
            <div className="details-header">
              <h2>Edit Room</h2>
              <div className="room-actions">
                <button
                  className="btn btn-icon"
                  onClick={handleSaveEdit}
                  title="Save Changes"
                >
                  ✓
                </button>
                <button
                  className="btn btn-icon"
                  onClick={() => setIsEditing(false)}
                  title="Cancel"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Room Name</label>
              <input
                type="text"
                value={editedRoom.name}
                onChange={(e) => handleEditChange('name', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Type</label>
              <select
                value={editedRoom.type}
                onChange={(e) => handleEditChange('type', e.target.value)}
              >
                {ROOM_TYPES.map((type, index) => (
                  <option key={index} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Building</label>
              <select
                value={editedRoom.building}
                onChange={(e) => handleEditChange('building', e.target.value)}
              >
                {BUILDINGS.map((building, index) => (
                  <option key={index} value={building}>{building}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Floor</label>
              <input
                type="text"
                value={editedRoom.floor}
                onChange={(e) => handleEditChange('floor', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Capacity</label>
              <input
                type="number"
                value={editedRoom.capacity}
                onChange={(e) => handleEditChange('capacity', parseInt(e.target.value) || 0)}
                min="0"
              />
            </div>

            <div className="form-group">
              <label>Equipment</label>
              <div className="equipment-checkboxes">
                {EQUIPMENT_OPTIONS.map((equipment, index) => (
                  <div key={index} className="equipment-checkbox">
                    <input
                      type="checkbox"
                      id={`equipment-${index}`}
                      checked={editedRoom.equipment.includes(equipment)}
                      onChange={() => handleEquipmentChange(equipment)}
                    />
                    <label htmlFor={`equipment-${index}`}>{equipment}</label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Room Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="details-header">
              <h2>Add New Room</h2>
              <div className="room-actions">
                <button
                  className="btn btn-icon"
                  onClick={() => setShowAddModal(false)}
                  title="Close"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Room Name</label>
              <input
                type="text"
                value={newRoom.name}
                onChange={(e) => setNewRoom({...newRoom, name: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label>Type</label>
              <select
                value={newRoom.type}
                onChange={(e) => setNewRoom({...newRoom, type: e.target.value})}
              >
                {ROOM_TYPES.map((type, index) => (
                  <option key={index} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Building</label>
              <select
                value={newRoom.building}
                onChange={(e) => setNewRoom({...newRoom, building: e.target.value})}
              >
                {BUILDINGS.map((building, index) => (
                  <option key={index} value={building}>{building}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Floor</label>
              <input
                type="text"
                value={newRoom.floor}
                onChange={(e) => setNewRoom({...newRoom, floor: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label>Capacity</label>
              <input
                type="number"
                value={newRoom.capacity}
                onChange={(e) => setNewRoom({...newRoom, capacity: parseInt(e.target.value) || 0})}
                min="0"
              />
            </div>

            <div className="form-group">
              <label>Equipment</label>
              <div className="equipment-checkboxes">
                {EQUIPMENT_OPTIONS.map((equipment, index) => (
                  <div key={index} className="equipment-checkbox">
                    <input
                      type="checkbox"
                      id={`new-equipment-${index}`}
                      checked={newRoom.equipment.includes(equipment)}
                      onChange={() => handleNewRoomEquipmentChange(equipment)}
                    />
                    <label htmlFor={`new-equipment-${index}`}>{equipment}</label>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-actions">
              <button className="btn" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="btn btn-accent" onClick={handleAddRoom}>Add Room</button>
            </div>
          </div>
        </div>
      )}

      {/* Snackbar notifications are handled by the context */}
    </div>
  );
};

export default RoomManagement;
