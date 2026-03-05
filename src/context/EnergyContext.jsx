
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { format, subDays, isSameDay, parseISO, differenceInDays } from 'date-fns';

const EnergyContext = createContext();

export const USERS = {
    JIANG: {
        id: 'jiang',
        name: '小姜同学',
        keywords: ['专注', '求索', '真实']
    },
    ZHEN: {
        id: 'zhen',
        name: '小肴同学',
        keywords: ['思考', '减负', '在场', '投入']
    }
};

const QUALITY_SCORES = {
    high: 3,
    medium: 2,
    low: 1,
    none: 0
};

const DECAY_RATE = 0.95; // 5% decay per day of no activity
const BASE_BOOST = 5; // Base points added per check-in points

// Planet Metadata
export const PLANET_METADATA = {
    '求索': { en: 'Questing', desc: 'Maintain curiosity about the world and explore the unknown. Keep asking questions.' },
    '真实': { en: 'Authenticity', desc: 'Face the true self and the world. Be honest and transparent.' },
    '专注': { en: 'Focus', desc: 'eliminate distractions and devote yourself wholeheartedly to the present moment.' },
    '减负': { en: 'Declutter', desc: 'Timely clean up physical and mental burdens. Travel light.' },
    '思考': { en: 'Thinking', desc: 'Think deeply and independently. Do not follow the crowd blindly.' },
    '在场': { en: 'Presence', desc: 'Be here, now. Fully engage with the current experience.' },
    '投入': { en: 'Commitment', desc: 'Once a choice is made, go all in. No hesitation.' }
};

export function EnergyProvider({ children }) {
    const [currentUser, setCurrentUser] = useState('jiang'); // 'jiang' or 'zhen'
    const [checkins, setCheckins] = useState([]);
    const [keywordTasks, setKeywordTasks] = useState([]); // Sub-tasks for keywords
    const [loading, setLoading] = useState(true);

    // -- Data Fetching --
    const fetchCheckins = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('checkins')
            .select('*')
            .order('date', { ascending: true });

        if (error) console.error('Error fetching checkins:', error);
        else setCheckins(data || []);

        setLoading(false);
    };

    const fetchKeywordTasks = async () => {
        const { data, error } = await supabase
            .from('keyword_tasks')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) {
            console.log('Task table might not exist yet, using local state for demo', error);
        } else {
            setKeywordTasks(data || []);
        }
    };

    useEffect(() => {
        fetchCheckins();
        fetchKeywordTasks();
    }, []);

    // -- Action: Check In --
    const addCheckin = async (dateStr, keyword, quality) => {
        const userId = currentUser;
        const newCheckin = {
            user_id: userId,
            date: dateStr,
            keyword,
            quality
        };

        const { data, error } = await supabase
            .from('checkins')
            .upsert(newCheckin, { onConflict: 'user_id, date, keyword' })
            .select();

        if (error) {
            console.error('Error saving checkin:', error);
            alert('Failed to save energy. Check console.');
        } else {
            fetchCheckins();
        }
    };

    // -- Action: Tasks --
    const addKeywordTask = async (keyword, content) => {
        const newTask = {
            user_id: currentUser,
            keyword,
            content,
            is_completed: false,
            created_at: new Date().toISOString()
        };

        // Optimistic update
        setKeywordTasks(prev => [...prev, { ...newTask, id: 'temp-' + Date.now() }]);

        const { data, error } = await supabase
            .from('keyword_tasks')
            .insert(newTask)
            .select();

        if (!error && data) {
            // Replace temp with real
            fetchKeywordTasks();
        }
    };

    const toggleKeywordTask = async (taskId, currentStatus) => {
        // Optimistic
        setKeywordTasks(prev => prev.map(t => t.id === taskId ? { ...t, is_completed: !currentStatus } : t));

        const { error } = await supabase
            .from('keyword_tasks')
            .update({ is_completed: !currentStatus })
            .eq('id', taskId);

        if (error) fetchKeywordTasks(); // Revert on error
    };

    const deleteKeywordTask = async (taskId) => {
        setKeywordTasks(prev => prev.filter(t => t.id !== taskId));
        await supabase.from('keyword_tasks').delete().eq('id', taskId);
    };

    // -- Helper: Calculate Gravity History for a specific user --
    const computeUserGravity = (targetUserId, targetKeywords, allCheckins) => {
        const userCheckins = allCheckins.filter(c => c.user_id === targetUserId);
        const scoresByKeyword = {};

        // Start date: 2026-01-01
        const startDate = new Date('2026-01-01');
        const today = new Date();
        const daysDiff = differenceInDays(today, startDate);
        const totalDays = Math.max(daysDiff, 0);

        targetKeywords.forEach(kw => {
            let currentScore = 0;
            const history = [];

            for (let i = 0; i <= totalDays; i++) {
                const currentDate = new Date(startDate);
                currentDate.setDate(startDate.getDate() + i);
                const dateStr = format(currentDate, 'yyyy-MM-dd');

                const checkin = userCheckins.find(c => c.keyword === kw && c.date === dateStr);

                if (checkin) {
                    const rawScore = QUALITY_SCORES[checkin.quality] || 0;
                    // Formula: S_t = S_(t-1) * Decay + P_today * Boost
                    let decayedScore = currentScore * DECAY_RATE;
                    const boost = rawScore * BASE_BOOST;
                    currentScore = Math.min(100, decayedScore + boost);
                } else {
                    currentScore = currentScore * DECAY_RATE;
                }

                if (currentScore < 0.1) currentScore = 0;

                history.push({
                    date: dateStr,
                    score: parseFloat(currentScore.toFixed(1)),
                });
            }
            scoresByKeyword[kw] = history;
        });
        return scoresByKeyword;
    };

    // -- Algorithm: Calculate Gravity Scores (For Current User UI) --
    const gravityScores = useMemo(() => {
        // Compute gravity for ALL keywords from both users so any planet modal works
        const jiangScores = computeUserGravity(USERS.JIANG.id, USERS.JIANG.keywords, checkins);
        const zhenScores = computeUserGravity(USERS.ZHEN.id, USERS.ZHEN.keywords, checkins);
        return { ...jiangScores, ...zhenScores };
    }, [checkins]);

    // -- Game: Spacecraft Logic (Hybrid Algorithm + Breakdown) --
    // 50% Fixed + 50% Gravity Dependent
    const starshipState = useMemo(() => {
        // 1. Constants
        const MAX_DAILY_PER_KEYWORD = 350;
        const DAYS_IN_YEAR = 365;
        const TARGET_RATIO = 0.75; // 75% is the new goal

        // Target for a single keyword to be considered "Complete"
        const SINGLE_KEYWORD_TARGET = MAX_DAILY_PER_KEYWORD * DAYS_IN_YEAR * TARGET_RATIO;

        // Total Target for the System (7 keywords)
        const TARGET_POINTS = SINGLE_KEYWORD_TARGET * 7;

        // Base Max Values (100%)
        const MAX_GAINS = {
            high: 350,
            medium: 200,
            low: 100,
            none: 0
        };

        // 2. Compute Gravity Context for BOTH users to have accurate historical scores
        const jiangGravity = computeUserGravity(USERS.JIANG.id, USERS.JIANG.keywords, checkins);
        const zhenGravity = computeUserGravity(USERS.ZHEN.id, USERS.ZHEN.keywords, checkins);

        const gravityMap = {
            [USERS.JIANG.id]: jiangGravity,
            [USERS.ZHEN.id]: zhenGravity
        };

        // 3. Calculate Points & Breakdown
        let totalPoints = 0;
        const keywordPointsMap = {};

        // Initialize map with 0
        [...USERS.JIANG.keywords, ...USERS.ZHEN.keywords].forEach(k => {
            keywordPointsMap[k] = 0;
        });

        checkins.forEach(c => {
            const maxGain = MAX_GAINS[c.quality] || 0;
            if (maxGain === 0) return;

            // Find the Gravity Score for this User+Keyword on this Date
            const userHistory = gravityMap[c.user_id];
            let dayGravity = 0;

            if (userHistory && userHistory[c.keyword]) {
                const dayRecord = userHistory[c.keyword].find(rec => rec.date === c.date);
                if (dayRecord) {
                    dayGravity = dayRecord.score;
                }
            }

            // Hybrid Formula
            const fixedPart = maxGain * 0.5;
            const variablePart = (maxGain * 0.5) * (dayGravity / 100);
            const actualPoints = fixedPart + variablePart;

            totalPoints += actualPoints;

            // Add to specific keyword bucket
            if (keywordPointsMap[c.keyword] !== undefined) {
                keywordPointsMap[c.keyword] += actualPoints;
            }
        });

        // 4. Calculate Progress Stats
        const rawProgress = (totalPoints / TARGET_POINTS) * 100;
        const progress = Math.min(100, Math.max(0, rawProgress));

        const keywordStats = {};
        Object.keys(keywordPointsMap).forEach(key => {
            const kp = keywordPointsMap[key];
            const kProgress = (kp / SINGLE_KEYWORD_TARGET) * 100;
            // Allow > 100% for individual stars? Or cap? Let's cap at 100 for UI niceness, or allow overflow.
            // User probably wants to see true progress. Let's not strict cap yet for internal value.
            keywordStats[key] = Math.min(100, kProgress);
        });

        return {
            totalPoints,
            target: TARGET_POINTS,
            progress: progress,
            keywordStats, // { '求索': 12.5, ... }
            status: 'ACTIVE'
        };
    }, [checkins]);


    return (
        <EnergyContext.Provider value={{
            currentUser,
            setCurrentUser,
            userInfo: USERS[currentUser === 'jiang' ? 'JIANG' : 'ZHEN'],
            users: USERS,
            checkins,
            addCheckin,
            gravityScores,
            loading,
            starshipState,
            keywordTasks,
            addKeywordTask,
            toggleKeywordTask,
            deleteKeywordTask,
            PLANET_METADATA
        }}>
            {children}
        </EnergyContext.Provider>
    );
}

export function useEnergy() {
    return useContext(EnergyContext);
}
