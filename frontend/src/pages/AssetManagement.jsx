import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Briefcase, Plus, Search, Edit2, Trash2, X, Check,
    Laptop, Smartphone, Keyboard, Mouse, Monitor, Package
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Pagination from '../components/Pagination';
import '../styles/UI.css';

const AssetManagement = () => {
    const { user } = useAuth();
    const isManager = user?.role === 'manager' || user?.role === 'admin';
    
    const [equipmentList, setEquipmentList] = useState([]);
    const [teamMembers, setTeamMembers] = useState([]);
    const [isInventoryLoading, setIsInventoryLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
    const [selectedAssetForEdit, setSelectedAssetForEdit] = useState(null);
    const [assetDetailsForm, setAssetDetailsForm] = useState({
        name: '',
        serial_number: '',
        status: 'available',
        user_id: ''
    });

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const loadInventoryData = async () => {
        try {
            const [inventoryResponse, employeesResponse] = await Promise.all([
                axios.get('/api/assets'),
                isManager ? axios.get('/api/employees') : Promise.resolve({ data: [] })
            ]);
            setEquipmentList(inventoryResponse.data);
            setTeamMembers(employeesResponse.data);
        } catch (err) {
            console.error('Could not load inventory:', err);
        } finally {
            setIsInventoryLoading(false);
        }
    };

    useEffect(() => {
        loadInventoryData();
    }, []);

    const openAssetModal = (assetToEdit = null) => {
        if (assetToEdit) {
            setSelectedAssetForEdit(assetToEdit);
            setAssetDetailsForm({
                name: assetToEdit.name,
                serial_number: assetToEdit.serial_number || '',
                status: assetToEdit.status,
                user_id: assetToEdit.user_id || ''
            });
        } else {
            setSelectedAssetForEdit(null);
            setAssetDetailsForm({ name: '', serial_number: '', status: 'available', user_id: '' });
        }
        setIsInventoryModalOpen(true);
    };

    const closeAssetModal = () => {
        setIsInventoryModalOpen(false);
        setSelectedAssetForEdit(null);
    };

    const saveAssetDetails = async (e) => {
        e.preventDefault();
        try {
            const submissionData = {
                ...assetDetailsForm,
                user_id: assetDetailsForm.user_id === "" ? null : assetDetailsForm.user_id
            };

            if (selectedAssetForEdit) {
                await axios.put(`/api/assets/${selectedAssetForEdit.id}`, submissionData);
            } else {
                await axios.post('/api/assets', submissionData);
            }
            await loadInventoryData();
            closeAssetModal();
        } catch (err) {
            alert('Something went wrong while saving the equipment details. Please try again.');
        }
    };

    const removeAssetFromInventory = async (assetId) => {
        if (!window.confirm('Are you sure you want to remove this item from the inventory?')) return;
        try {
            await axios.delete(`/api/assets/${assetId}`);
            loadInventoryData();
        } catch (err) {
            alert('We couldn’t delete this item at the moment.');
        }
    };

    const getIconForAsset = (assetName) => {
        const nameLower = (assetName || '').toLowerCase();
        if (nameLower.includes('laptop')) return <Laptop size={18} />;
        if (nameLower.includes('phone')) return <Smartphone size={18} />;
        if (nameLower.includes('monitor')) return <Monitor size={18} />;
        if (nameLower.includes('keyboard')) return <Keyboard size={18} />;
        if (nameLower.includes('mouse')) return <Mouse size={18} />;
        return <Package size={18} />;
    };

    const filteredEquipment = equipmentList.filter(item => 
        (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.serial_number || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredEquipment.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredEquipment.length / itemsPerPage);

    if (isInventoryLoading) return <div className="empty-state">Loading company inventory...</div>;

    return (
        <div className="dashboard-container">
            <div className="feed-header" style={{marginBottom: '2rem'}}>
                <div>
                    <h1 className="heading-lg">{isManager ? 'Company Inventory' : 'My Assigned Equipment'}</h1>
                    <p className="text-label" style={{textTransform: 'none'}}>Keep track of the tools that help us work better</p>
                </div>
                {isManager && (
                    <button onClick={() => openAssetModal()} className="btn-primary" style={{width: 'auto', padding: '0 1.5rem'}}>
                        <Plus size={18} />
                        <span>Add New Equipment</span>
                    </button>
                )}
            </div>

            <div className="glass-card" style={{padding: '1.5rem'}}>
                <div className="input-group" style={{maxWidth: '400px', marginBottom: '1.5rem'}}>
                    <Search className="input-icon" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search by name or serial number..." 
                        className="input-field"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="glass-table-container">
                    <table className="glass-table">
                        <thead>
                            <tr>
                                <th>Item Details</th>
                                <th>Serial Number</th>
                                <th>Availability</th>
                                {isManager && <th>Currently With</th>}
                                {isManager && <th style={{textAlign: 'right'}}>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {currentItems.length > 0 ? (
                                currentItems.map((item) => (
                                    <tr key={item.id}>
                                        <td>
                                            <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                                                <div className="avatar-circle" style={{width: '2rem', height: '2rem', fontSize: '0.7rem', background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1'}}>
                                                    {getIconForAsset(item.name)}
                                                </div>
                                                <span style={{fontWeight: 600}}>{item.name}</span>
                                            </div>
                                        </td>
                                        <td><code>{item.serial_number || 'No Serial Info'}</code></td>
                                        <td>
                                            <span className={`badge ${item.status}`} style={{
                                                backgroundColor: item.status === 'available' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                                                color: item.status === 'available' ? '#10b981' : '#6366f1'
                                            }}>
                                                {item.status.toUpperCase()}
                                            </span>
                                        </td>
                                        {isManager && <td>{item.assigned_to || <span style={{opacity: 0.5}}>In Storage</span>}</td>}
                                        {isManager && (
                                            <td style={{textAlign: 'right'}}>
                                                <div className="action-group" style={{justifyContent: 'flex-end'}}>
                                                    <button onClick={() => openAssetModal(item)} className="btn-icon edit" title="Edit Item"><Edit2 size={16} /></button>
                                                    <button onClick={() => removeAssetFromInventory(item.id)} className="btn-icon delete" title="Remove Item"><Trash2 size={16} /></button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={isManager ? 5 : 3} style={{textAlign: 'center', padding: '3rem', opacity: 0.5}}>
                                        <Briefcase size={40} style={{marginBottom: '1rem', opacity: 0.2}} />
                                        <p>No equipment found matching your search.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                </div>
            </div>

            {isInventoryModalOpen && (
                <div className="modal-overlay" onClick={closeAssetModal}>
                    <div className="glass-card modal-content" onClick={(e) => e.stopPropagation()} style={{maxWidth: '500px', width: '90%'}}>
                        <div className="feed-header">
                            <h3 className="heading-md">{selectedAssetForEdit ? 'Update Equipment Details' : 'Register New Equipment'}</h3>
                            <button onClick={closeAssetModal} className="btn-icon"><X size={18} /></button>
                        </div>

                        <form onSubmit={saveAssetDetails} className="auth-form" style={{marginTop: '1.5rem'}}>
                            <div className="field-wrapper">
                                <label className="input-label">What item are you adding?</label>
                                <input className="input-field" value={assetDetailsForm.name} onChange={(e) => setAssetDetailsForm({...assetDetailsForm, name: e.target.value})} placeholder="e.g. MacBook Pro, Dell Monitor, Office Phone" required />
                            </div>

                            <div className="field-wrapper">
                                <label className="input-label">Serial Number / Tag ID</label>
                                <input className="input-field" value={assetDetailsForm.serial_number} onChange={(e) => setAssetDetailsForm({...assetDetailsForm, serial_number: e.target.value})} placeholder="e.g. SN-987654321" />
                            </div>

                            <div className="field-wrapper">
                                <label className="input-label">Availability Status</label>
                                <select className="input-field" style={{paddingLeft: '1rem'}} value={assetDetailsForm.status} onChange={(e) => setAssetDetailsForm({...assetDetailsForm, status: e.target.value})}>
                                    <option value="available">✅ Available in Storage</option>
                                    <option value="assigned">👤 Assigned to Someone</option>
                                    <option value="repair">🛠️ Under Repair</option>
                                    <option value="retired">📦 Retired / Disposed</option>
                                </select>
                            </div>

                            <div className="field-wrapper">
                                <label className="input-label">Who is currently using this?</label>
                                <select className="input-field" style={{paddingLeft: '1rem'}} value={assetDetailsForm.user_id} onChange={(e) => setAssetDetailsForm({...assetDetailsForm, user_id: e.target.value})}>
                                    <option value="">Nobody (Keep it in storage)</option>
                                    {teamMembers.map(member => (
                                        <option key={member.id} value={member.id}>{member.name}</option>
                                    ))}
                                </select>
                            </div>

                            <button type="submit" className="btn-primary" style={{marginTop: '1rem'}}>
                                {selectedAssetForEdit ? 'Save Changes' : 'Add to Inventory'}
                                <Check size={18} />
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AssetManagement;
