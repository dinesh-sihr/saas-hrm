import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', padding: '0.5rem 1rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Page <strong style={{color: 'var(--text-main)'}}>{currentPage}</strong> of <strong style={{color: 'var(--text-main)'}}>{totalPages}</strong>
            </span>
            
            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="glass-card"
                    style={{ 
                        padding: '0.5rem 1rem', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.25rem',
                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                        opacity: currentPage === 1 ? 0.5 : 1,
                        background: 'var(--bg-main)',
                        border: '1px solid var(--card-border)',
                        color: 'var(--text-main)',
                        borderRadius: '0.5rem'
                    }}
                >
                    <ChevronLeft size={16} /> Prev
                </button>
                <button 
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="glass-card"
                    style={{ 
                        padding: '0.5rem 1rem', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.25rem',
                        cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                        opacity: currentPage === totalPages ? 0.5 : 1,
                        background: 'var(--bg-main)',
                        border: '1px solid var(--card-border)',
                        color: 'var(--text-main)',
                        borderRadius: '0.5rem'
                    }}
                >
                    Next <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
};

export default Pagination;
