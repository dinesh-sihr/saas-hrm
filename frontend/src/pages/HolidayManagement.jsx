import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Calendar, Plus, Search, Edit2, Trash2, X, Check,
    Palmtree, Gift, Flag, PartyPopper
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Pagination from '../components/Pagination';
import '../styles/UI.css';

const HolidayManagement = () => {
    const { user } = useAuth();
    const isManager = user?.role === 'manager' || user?.role === 'admin';
    
    const [scheduledHolidays, setScheduledHolidays] = useState([]);
    const [isDataLoading, setIsDataLoading] = useState(true);
    const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
    const [selectedHolidayForEdit, setSelectedHolidayForEdit] = useState(null);
    const [holidayFormFields, setHolidayFormFields] = useState({
        name: '',
        holiday_date: ''
    });

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const loadHolidayCalendar = async () => {
        try {
            const response = await axios.get('/api/holidays');
            setScheduledHolidays(response.data);
        } catch (err) {
            console.error('Failed to load holidays:', err);
        } finally {
            setIsDataLoading(false);
        }
    };

    useEffect(() => {
        loadHolidayCalendar();
    }, []);

    const saveHolidayDetails = async (e) => {
        e.preventDefault();
        try {
            if (selectedHolidayForEdit) {
                await axios.put(`/api/holidays/${selectedHolidayForEdit.id}`, holidayFormFields);
            } else {
                await axios.post('/api/holidays', holidayFormFields);
            }
            loadHolidayCalendar();
            closeHolidayModal();
        } catch (err) {
            alert('Something went wrong while saving the holiday details.');
        }
    };

    const removeHolidayFromCalendar = async (holidayId) => {
        if (!window.confirm('Are you sure you want to remove this day from the calendar?')) return;
        try {
            await axios.delete(`/api/holidays/${holidayId}`);
            loadHolidayCalendar();
        } catch (err) {
            alert('We couldn’t delete this record at the moment.');
        }
    };

    const openHolidayModal = (holidayToEdit = null) => {
        if (holidayToEdit) {
            setSelectedHolidayForEdit(holidayToEdit);
            setHolidayFormFields({
                name: holidayToEdit.name,
                holiday_date: holidayToEdit.holiday_date.split('T')[0]
            });
        } else {
            setSelectedHolidayForEdit(null);
            setHolidayFormFields({ name: '', holiday_date: '' });
        }
        setIsHolidayModalOpen(true);
    };

    const closeHolidayModal = () => {
        setIsHolidayModalOpen(false);
        setSelectedHolidayForEdit(null);
    };

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = scheduledHolidays.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(scheduledHolidays.length / itemsPerPage);

    if (isDataLoading) return <div className="empty-state">Just a moment, syncing the holiday calendar...</div>;

    return (
        <div className="dashboard-container">
            <div className="feed-header" style={{marginBottom: '2rem'}}>
                <div>
                    <h1 className="heading-lg">Company Holidays & Observances</h1>
                    <p className="text-label" style={{textTransform: 'none'}}>Upcoming days for rest, celebration, and team bonding</p>
                </div>
                {isManager && (
                    <button onClick={() => openHolidayModal()} className="btn-primary" style={{width: 'auto', padding: '0 1.5rem'}}>
                        <Plus size={18} />
                        <span>Add a Holiday</span>
                    </button>
                )}
            </div>

            <div className="glass-card" style={{padding: '1.5rem'}}>
                <div className="glass-table-container">
                    <table className="glass-table">
                        <thead>
                            <tr>
                                <th>What’s the Occasion?</th>
                                <th>When?</th>
                                <th>Day of the Week</th>
                                {isManager && <th style={{textAlign: 'right'}}>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {currentItems.length > 0 ? (
                                currentItems.map((holiday) => {
                                    const dateObj = new Date(holiday.holiday_date);
                                    const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
                                    const hasPassed = dateObj < new Date().setHours(0,0,0,0);

                                    return (
                                        <tr key={holiday.id} style={{opacity: hasPassed ? 0.5 : 1}}>
                                            <td>
                                                <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                                                    <div className="avatar-circle" style={{width: '2rem', height: '2rem', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b'}}>
                                                        <Palmtree size={18} />
                                                    </div>
                                                    <span style={{fontWeight: 600}}>{holiday.name}</span>
                                                </div>
                                            </td>
                                            <td>{dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</td>
                                            <td>{dayOfWeek}</td>
                                            {isManager && (
                                                <td style={{textAlign: 'right'}}>
                                                    <div className="action-group" style={{justifyContent: 'flex-end'}}>
                                                        <button onClick={() => openHolidayModal(holiday)} className="btn-icon edit" title="Edit Holiday"><Edit2 size={16} /></button>
                                                        <button onClick={() => removeHolidayFromCalendar(holiday.id)} className="btn-icon delete" title="Delete Holiday"><Trash2 size={16} /></button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={isManager ? 4 : 3} style={{textAlign: 'center', padding: '3rem', opacity: 0.5}}>
                                        <Calendar size={40} style={{marginBottom: '1rem', opacity: 0.2}} />
                                        <p>No holidays listed yet. Keep an eye out for future breaks!</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                </div>
            </div>

            {isHolidayModalOpen && (
                <div className="modal-overlay">
                    <div className="glass-card modal-content" style={{maxWidth: '450px', width: '90%'}}>
                        <div className="feed-header">
                            <h3 className="heading-md">{selectedHolidayForEdit ? 'Update Holiday Info' : 'Schedule a New Holiday'}</h3>
                            <button onClick={closeHolidayModal} className="btn-icon"><X size={18} /></button>
                        </div>

                        <form onSubmit={saveHolidayDetails} className="auth-form" style={{marginTop: '1.5rem'}}>
                            <div className="field-wrapper">
                                <label className="input-label">Holiday / Event Name</label>
                                <input className="input-field" value={holidayFormFields.name} onChange={(e) => setHolidayFormFields({...holidayFormFields, name: e.target.value})} placeholder="e.g. New Year's Day, Independence Day" required />
                            </div>

                            <div className="field-wrapper">
                                <label className="input-label">When is it happening?</label>
                                <input type="date" className="input-field" value={holidayFormFields.holiday_date} onChange={(e) => setHolidayFormFields({...holidayFormFields, holiday_date: e.target.value})} required />
                            </div>

                            <button type="submit" className="btn-primary" style={{marginTop: '1rem'}}>
                                {selectedHolidayForEdit ? 'Save Changes' : 'Add to Calendar'}
                                <Check size={18} />
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HolidayManagement;
