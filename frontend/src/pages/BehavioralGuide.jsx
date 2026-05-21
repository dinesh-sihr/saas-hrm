import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Brain, Zap, Target, Users, Clock, 
    Star, ShieldCheck, ZapOff, Sparkles, Quote, HelpCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/UI.css';

const BehavioralGuide = () => {
    const { user } = useAuth();
    const isManager = user?.role === 'manager' || user?.role === 'admin';
    
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInsights = async () => {
            try {
                const endpoint = isManager ? '/api/ai/team-aggregate' : '/api/ai/insights';
                const res = await axios.get(endpoint);
                setData(res.data);
            } catch (err) {
                console.error('Failed to load behavioral map:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchInsights();
    }, [isManager]);

    const getRadarPoints = (stats, size, scale) => {
        const center = size / 2;
        const angleStep = (Math.PI * 2) / stats.length;
        return stats.map((s, i) => {
            const r = (s.A / 100) * scale;
            const x = center + r * Math.cos(i * angleStep - Math.PI / 2);
            const y = center + r * Math.sin(i * angleStep - Math.PI / 2);
            return `${x},${y}`;
        }).join(' ');
    };

    if (loading) return <div className="empty-state">Personalizing your behavioral story...</div>;

    const behavioralMap = data?.behavioral?.map || [];

    return (
        <div className="dashboard-container">
            <header style={{marginBottom: 'clamp(2rem, 5vw, 4rem)', position: 'relative'}}>
                <div style={{position: 'absolute', top: '-20px', left: '-20px', opacity: 0.1}}>
                    <Sparkles size={80} color="var(--accent)" />
                </div>
                <div style={{display: 'flex', alignItems: 'flex-end', gap: '1rem', marginBottom: '1rem'}}>
                    <h4 className="text-label" style={{margin: 0, fontSize: '0.7rem', fontWeight: 700, letterSpacing: '2px', color: 'var(--accent)'}}>PERFORMANCE ANTHROPOLOGY</h4>
                    <div style={{height: '1px', flex: 1, background: 'linear-gradient(90deg, var(--accent) 0%, transparent 100%)', opacity: 0.3, marginBottom: '0.3rem'}}></div>
                </div>
                <h1 className="heading-lg" style={{fontSize: 'clamp(2rem, 8vw, 3.5rem)', lineHeight: 1.1, marginBottom: '1.5rem', fontWeight: 900}}>
                    {isManager ? "Team Behavioral " : "The Art of Your "}<span style={{color: 'var(--accent)', fontStyle: 'italic'}}>{isManager ? "Landscape" : "Workstyle."}</span>
                </h1>
                <p style={{fontSize: 'clamp(1rem, 3vw, 1.25rem)', opacity: 0.7, maxWidth: '650px', lineHeight: 1.6}}>
                    {isManager ? "A direct overview of your team's collective energy, synchronization, and individual operational rhythms." : "A curated look at how you navigate the digital workspace, collaborate with peers, and drive results."}
                </p>
            </header>

            {!isManager && (
                <>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '2rem', marginBottom: '4rem'}}>
                        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem'}}>
                            <div className="glass-card" style={{padding: 'clamp(1.5rem, 5vw, 3rem)', borderRadius: '2rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden'}}>
                                <div style={{position: 'absolute', top: '2rem', right: '2rem'}}>
                                    <Quote size={40} opacity={0.1} />
                                </div>
                                
                                <div style={{display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2.5rem'}}>
                                    <div className="avatar-circle" style={{width: '3.5rem', height: '3.5rem', fontSize: '1.2rem', background: 'linear-gradient(135deg, var(--accent) 0%, #6366f1 100%)'}}>
                                        {user.name[0]}
                                    </div>
                                    <div>
                                        <p className="text-label" style={{margin: 0, fontSize: '0.6rem'}}>CURRENT ARCHETYPE</p>
                                        <h2 className="heading-md" style={{fontSize: 'clamp(1.5rem, 5vw, 2rem)', margin: 0, color: 'var(--accent)'}}>{data?.behavioral?.type || 'The Reliable Pro'}</h2>
                                    </div>
                                </div>

                                <p style={{fontSize: '1.1rem', lineHeight: 1.8, fontStyle: 'italic', color: 'rgba(255,255,255,0.9)', marginBottom: '3rem'}}>
                                    "{data.aiSummary}"
                                </p>

                                <div style={{display: 'flex', flexWrap: 'wrap', gap: '2rem'}}>
                                    <div>
                                        <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                                            <h4 style={{margin: '0', fontSize: '2.2rem', color: '#10b981', fontWeight: 900}}>{data?.behavioral?.collaboration || 0}</h4>
                                            {data?.behavioral?.benchmarks?.isAboveCollab && (
                                                <span className="badge good" style={{fontSize: '0.5rem', padding: '0.2rem 0.4rem'}}>TOP</span>
                                            )}
                                        </div>
                                        <p className="text-label" style={{fontSize: '0.65rem', opacity: 0.5}}>COLLABORATION IQ</p>
                                    </div>
                                    <div style={{width: '1px', height: '30px', background: 'rgba(255,255,255,0.1)', alignSelf: 'center'}}></div>
                                    <div>
                                        <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                                            <h4 style={{margin: '0', fontSize: '2.2rem', color: 'var(--accent)', fontWeight: 900}}>{data?.behavioral?.coordination || 0}</h4>
                                            {data?.behavioral?.benchmarks?.isAboveCoord && (
                                                <span className="badge" style={{fontSize: '0.5rem', padding: '0.2rem 0.4rem', backgroundColor: 'rgba(168, 85, 247, 0.2)', color: 'var(--accent)'}}>TOP</span>
                                            )}
                                        </div>
                                        <p className="text-label" style={{fontSize: '0.65rem', opacity: 0.5}}>COORDINATION IQ</p>
                                    </div>
                                </div>
                            </div>

                            <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'radial-gradient(circle at center, rgba(168, 85, 247, 0.05) 0%, transparent 70%)', borderRadius: '2rem', padding: '2rem'}}>
                                <div style={{position: 'relative', width: 'min(260px, 70vw)', height: 'min(260px, 70vw)'}}>
                                    <svg viewBox="0 0 260 260" style={{width: '100%', height: '100%', filter: 'drop-shadow(0 0 20px rgba(168, 85, 247, 0.2))'}}>
                                        <circle cx="130" cy="130" r="110" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="5 5" />
                                        <polygon points={getRadarPoints(behavioralMap.map(s => ({ ...s, A: 100 })), 260, 110)} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                                        <polygon points={getRadarPoints(behavioralMap, 260, 110)} fill="rgba(168, 85, 247, 0.15)" stroke="var(--accent)" strokeWidth="3" strokeLinejoin="round" />
                                    </svg>
                                    {behavioralMap.map((s, i) => {
                                        const angle = (i * (Math.PI * 2)) / behavioralMap.length - Math.PI / 2;
                                        const x = 130 + 135 * Math.cos(angle);
                                        const y = 130 + 135 * Math.sin(angle);
                                        return <span key={i} style={{position: 'absolute', left: x, top: y, fontSize: '0.6rem', fontWeight: 700, transform: 'translate(-50%, -50%)', opacity: 0.4, textTransform: 'uppercase', letterSpacing: '1px'}}>{s.subject}</span>
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{marginBottom: '5rem'}}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '3rem'}}>
                            <h3 className="heading-sm" style={{margin: 0, fontSize: '1.25rem'}}>How We See Your Work</h3>
                            <div style={{height: '1px', flex: 1, background: 'rgba(255,255,255,0.1)'}}></div>
                        </div>

                        <div className="responsive-grid" style={{gap: 'clamp(2rem, 5vw, 4rem)'}}>
                            <section>
                                <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem'}}>
                                    <Users size={20} color="#10b981" />
                                    <h4 style={{margin: 0, fontSize: '1rem', fontWeight: 700}}>The Synergy Pillars</h4>
                                </div>
                                <p style={{fontSize: '0.9rem', opacity: 0.6, lineHeight: 1.6, marginBottom: '2rem'}}>
                                    Collaboration isn't about being social; it's about being reliable in shared digital spaces. We look at two high-signal behaviors:
                                </p>
                                <div style={{display: 'flex', flexDirection: 'column', gap: '2rem'}}>
                                    <div style={{position: 'relative', paddingLeft: '1.5rem', borderLeft: '2px solid rgba(16, 185, 129, 0.2)'}}>
                                        <span className="badge" style={{position: 'absolute', right: 0, top: 0, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981'}}>60% Weight</span>
                                        <h5 style={{margin: '0 0 0.5rem 0', fontSize: '0.95rem'}}>Meeting Punctuality</h5>
                                        <p style={{margin: 0, fontSize: '0.8rem', opacity: 0.5}}>Respecting team time is the ultimate sign of sync. We track on-time joins vs. scheduled meetings.</p>
                                    </div>
                                    <div style={{position: 'relative', paddingLeft: '1.5rem', borderLeft: '2px solid rgba(16, 185, 129, 0.2)'}}>
                                        <span className="badge" style={{position: 'absolute', right: 0, top: 0, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981'}}>40% Weight</span>
                                        <h5 style={{margin: '0 0 0.5rem 0', fontSize: '0.95rem'}}>Notice Awareness</h5>
                                        <p style={{margin: 0, fontSize: '0.8rem', opacity: 0.5}}>How quickly you absorb company updates. Real-time alignment reduces friction for everyone.</p>
                                    </div>
                                </div>
                            </section>

                            <section>
                                <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem'}}>
                                    <Target size={20} color="var(--accent)" />
                                    <h4 style={{margin: 0, fontSize: '1rem', fontWeight: 700}}>The Operational Rhythm</h4>
                                </div>
                                <p style={{fontSize: '0.9rem', opacity: 0.6, lineHeight: 1.6, marginBottom: '2rem'}}>
                                    Coordination measures your personal "pulse"—how consistently you execute and adhere to the project's beat:
                                </p>
                                <div style={{display: 'flex', flexDirection: 'column', gap: '2rem'}}>
                                    <div style={{position: 'relative', paddingLeft: '1.5rem', borderLeft: '2px solid rgba(168, 85, 247, 0.2)'}}>
                                        <span className="badge" style={{position: 'absolute', right: 0, top: 0, background: 'rgba(168, 85, 247, 0.1)', color: 'var(--accent)'}}>50% Weight</span>
                                        <h5 style={{margin: '0 0 0.5rem 0', fontSize: '0.95rem'}}>Execution Rate</h5>
                                        <p style={{margin: 0, fontSize: '0.8rem', opacity: 0.5}}>The velocity of task completion. It's not just doing work; it's moving the needle forward.</p>
                                    </div>
                                    <div style={{position: 'relative', paddingLeft: '1.5rem', borderLeft: '2px solid rgba(168, 85, 247, 0.2)'}}>
                                        <span className="badge" style={{position: 'absolute', right: 0, top: 0, background: 'rgba(168, 85, 247, 0.1)', color: 'var(--accent)'}}>50% Weight</span>
                                        <h5 style={{margin: '0 0 0.5rem 0', fontSize: '0.95rem'}}>Schedule Discipline</h5>
                                        <p style={{margin: 0, fontSize: '0.8rem', opacity: 0.5}}>Measured via daily tap-in consistency. Predictability is the foundation of a coordinated team.</p>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                </>
            )}

            {isManager && data?.distribution && (
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '4rem'}}>
                    <div className="glass-card" style={{padding: '2rem', borderRadius: '1.5rem', background: 'rgba(255,255,255,0.01)'}}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem'}}>
                            <h4 className="text-label" style={{fontSize: '0.7rem', margin: 0, opacity: 0.6}}>SYNERGY PULSE</h4>
                            <span style={{fontSize: '0.65rem', color: '#10b981', fontWeight: 700}}>TREND: STABLE</span>
                        </div>
                        <div style={{height: '120px', width: '100%', position: 'relative'}}>
                            <svg viewBox="0 0 100 40" preserveAspectRatio="none" style={{width: '100%', height: '100%', display: 'block'}}>
                                <defs>
                                    <linearGradient id="lineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                        <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.2" />
                                        <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
                                    </linearGradient>
                                </defs>
                                <path 
                                    d={`M ${data.synergyTrend.length > 0 ? data.synergyTrend.map((t, i) => `${(i / (data.synergyTrend.length - 1)) * 100},${40 - (Math.min(40, t.count * 8))}`).join(' L ') : '0,40 L 100,40'} L 100,40 L 0,40 Z`}
                                    fill="url(#lineGrad)"
                                />
                                <polyline 
                                    fill="none"
                                    stroke="var(--accent)"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    points={data.synergyTrend.length > 0 ? data.synergyTrend.map((t, i) => `${(i / (data.synergyTrend.length - 1)) * 100},${40 - (Math.min(40, t.count * 8))}`).join(' ') : '0,40 100,40'}
                                />
                            </svg>
                            <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '1rem', opacity: 0.4}}>
                                {data.synergyTrend.map((t, i) => (
                                    <span key={i} style={{fontSize: '0.55rem', fontWeight: 700}}>{t.day}</span>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="glass-card" style={{padding: '2rem', borderRadius: '1.5rem', background: 'rgba(255,255,255,0.01)'}}>
                        <h4 className="text-label" style={{fontSize: '0.7rem', marginBottom: '2rem', opacity: 0.6}}>TEAM DNA COMPOSITION</h4>
                        <div style={{display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '2rem'}}>
                            <div style={{position: 'relative', width: '100px', height: '100px'}}>
                                <svg viewBox="0 0 36 36" style={{width: '100%', height: '100%', transform: 'rotate(-90deg)'}}>
                                    <circle cx="18" cy="18" r="15.9" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="3.5" />
                                    {Object.entries(data.distribution).map(([type, count], i, arr) => {
                                        const total = Object.values(data.distribution).reduce((a, b) => a + b, 0);
                                        const percentage = (count / total) * 100;
                                        const offset = arr.slice(0, i).reduce((acc, curr) => acc + (curr[1] / total) * 100, 0);
                                        const colors = ['var(--accent)', '#10b981', '#6366f1', '#f59e0b', '#ec4899'];
                                        return (
                                            <circle 
                                                key={type}
                                                cx="18" cy="18" r="15.9" 
                                                fill="transparent" 
                                                stroke={colors[i % colors.length]} 
                                                strokeWidth="3.5" 
                                                strokeDasharray={`${percentage} 100`} 
                                                strokeDashoffset={-offset}
                                            />
                                        );
                                    })}
                                </svg>
                                <div style={{position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center'}}>
                                    <p style={{margin: 0, fontSize: '1rem', fontWeight: 900}}>{Object.values(data.distribution).reduce((a, b) => a + b, 0)}</p>
                                    <p style={{margin: 0, fontSize: '0.35rem', opacity: 0.5}}>USERS</p>
                                </div>
                            </div>
                            <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                                {Object.entries(data.distribution).map(([type, count], i) => (
                                    <div key={type} style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                                        <div style={{width: '5px', height: '5px', borderRadius: '50%', background: ['var(--accent)', '#10b981', '#6366f1', '#f59e0b', '#ec4899'][i % 5]}}></div>
                                        <span style={{fontSize: '0.65rem', fontWeight: 600, opacity: 0.7}}>{type}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isManager && data?.teamList && (
                <div style={{marginBottom: '5rem'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '3rem'}}>
                        <h3 className="heading-sm" style={{margin: 0, fontSize: '1.5rem'}}>Team Behavioral Landscape</h3>
                        <div style={{height: '1px', flex: 1, background: 'rgba(255,255,255,0.1)'}}></div>
                    </div>

                    <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem'}}>
                        {data.teamList.map((member) => (
                            <div key={member.id} className="glass-card" style={{
                                padding: '1.5rem', 
                                borderRadius: '1.5rem', 
                                border: member.id === user.id ? '2px solid var(--accent)' : '1px solid rgba(255,255,255,0.05)',
                                background: member.id === user.id ? 'rgba(168, 85, 247, 0.05)' : 'rgba(255,255,255,0.01)',
                                position: 'relative'
                            }}>
                                {member.id === user.id && (
                                    <span className="badge" style={{position: 'absolute', top: '-10px', right: '1rem', backgroundColor: 'var(--accent)', color: 'white', fontSize: '0.6rem'}}>YOU</span>
                                )}
                                <div style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem'}}>
                                    <div className="avatar-circle-sm" style={{width: '2.5rem', height: '2.5rem', background: member.role === 'manager' ? 'linear-gradient(135deg, var(--accent) 0%, #6366f1 100%)' : 'rgba(255,255,255,0.1)'}}>
                                        {member.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 style={{margin: 0, fontSize: '1rem', fontWeight: 700}}>{member.name}</h4>
                                        <p style={{margin: 0, fontSize: '0.7rem', opacity: 0.5, textTransform: 'uppercase'}}>{member.role}</p>
                                    </div>
                                </div>
                                <div style={{marginBottom: '1rem'}}>
                                    <span className="badge good" style={{fontSize: '0.7rem', padding: '0.3rem 0.8rem'}}>{member.type}</span>
                                </div>
                                <div style={{display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '1rem'}}>
                                    <div style={{textAlign: 'center'}}>
                                        <p style={{margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#10b981'}}>{member.collaboration}</p>
                                        <p style={{margin: 0, fontSize: '0.6rem', opacity: 0.5}}>COLLAB</p>
                                    </div>
                                    <div style={{width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)', alignSelf: 'center'}}></div>
                                    <div style={{textAlign: 'center'}}>
                                        <p style={{margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent)'}}>{member.coordination}</p>
                                        <p style={{margin: 0, fontSize: '0.6rem', opacity: 0.5}}>COORD</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {!isManager && (
                <div className="glass-card" style={{padding: '3rem', borderRadius: '2.5rem', background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 100%)', textAlign: 'left', border: '1px solid rgba(255,255,255,0.05)', position: 'relative'}}>
                    <div style={{display: 'flex', gap: '4rem', alignItems: 'flex-start'}}>
                        <div style={{flex: 1}}>
                            <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem'}}>
                                <HelpCircle size={20} className="text-accent" />
                                <h3 style={{margin: 0, fontSize: '1.3rem'}}>A Note on Your Data</h3>
                            </div>
                            <p style={{fontSize: '0.95rem', opacity: 0.7, lineHeight: 1.7, margin: 0}}>
                                These scores are snapshots of your current operational energy. They aren't permanent grades. They help us understand when you're in a "Flow State" or when the workload might be causing friction. Our goal is to use these patterns to support your growth, not just track your output.
                            </p>
                        </div>
                        <div style={{display: 'flex', gap: '2rem'}}>
                            <div style={{textAlign: 'center'}}>
                                <ShieldCheck size={24} color="#10b981" style={{marginBottom: '0.5rem'}} />
                                <p style={{margin: 0, fontSize: '0.7rem', fontWeight: 700, opacity: 0.5}}>ANONYMIZED</p>
                            </div>
                            <div style={{textAlign: 'center'}}>
                                <Sparkles size={24} color="var(--accent)" style={{marginBottom: '0.5rem'}} />
                                <p style={{margin: 0, fontSize: '0.7rem', fontWeight: 700, opacity: 0.5}}>DYNAMIC</p>
                            </div>
                            <div style={{textAlign: 'center'}}>
                                <Brain size={24} color="#6366f1" style={{marginBottom: '0.5rem'}} />
                                <p style={{margin: 0, fontSize: '0.7rem', fontWeight: 700, opacity: 0.5}}>MENTORSHIP</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BehavioralGuide;
