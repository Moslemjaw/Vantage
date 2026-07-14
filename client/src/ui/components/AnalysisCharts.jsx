import React from 'react';
import { 
  AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell,
  BarChart, Bar, YAxis,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

// Theme colors mapping
const COLORS = {
  Bullish: '#10b981', // emerald-500
  Bearish: '#f43f5e', // rose-500
  Neutral: '#94a3b8', // slate-400
  Score: '#8b5cf6', // violet-500
};

/**
 * Visualizes the flow of sentiment and confidence through the debate.
 */
export function DebateSentimentFlow({ messages }) {
  if (!messages || messages.length === 0) return null;

  const data = messages.map((m, i) => {
    return {
      turn: i + 1,
      name: m.agentName,
      sentiment: m.sentiment,
      confidence: m.confidence,
      // Map confidence into respective buckets for stacked area
      Bullish: m.sentiment === 'Bullish' ? m.confidence : 0,
      Bearish: m.sentiment === 'Bearish' ? m.confidence : 0,
      Neutral: m.sentiment === 'Neutral' ? m.confidence : 0,
    };
  });

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorBull" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.Bullish} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={COLORS.Bullish} stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorBear" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.Bearish} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={COLORS.Bearish} stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorNeut" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.Neutral} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={COLORS.Neutral} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <Tooltip 
            contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
            itemStyle={{ fontSize: '12px' }}
            labelStyle={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}
          />
          <Area type="monotone" dataKey="Bullish" stroke={COLORS.Bullish} strokeWidth={2} fillOpacity={1} fill="url(#colorBull)" />
          <Area type="monotone" dataKey="Bearish" stroke={COLORS.Bearish} strokeWidth={2} fillOpacity={1} fill="url(#colorBear)" />
          <Area type="monotone" dataKey="Neutral" stroke={COLORS.Neutral} strokeWidth={2} fillOpacity={1} fill="url(#colorNeut)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Visualizes the breakdown of agent stances as a Donut Chart.
 */
export function ConvictionDonut({ messages }) {
  if (!messages || messages.length === 0) return null;

  const counts = { Bullish: 0, Bearish: 0, Neutral: 0 };
  messages.forEach(m => {
    if (counts[m.sentiment] !== undefined) {
      counts[m.sentiment]++;
    }
  });

  const data = [
    { name: 'Bullish', value: counts.Bullish, color: COLORS.Bullish },
    { name: 'Neutral', value: counts.Neutral, color: COLORS.Neutral },
    { name: 'Bearish', value: counts.Bearish, color: COLORS.Bearish }
  ].filter(d => d.value > 0);

  return (
    <div className="h-48 w-full flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
            itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Animated Bar Chart for Agent Accuracy Scores.
 */
export function AgentScoreBarChart({ agentScores }) {
  if (!agentScores || agentScores.length === 0) return null;

  // Sort by score descending and take top 5
  const data = [...agentScores]
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 5)
    .map(s => ({
      name: s.agentName.replace(' (Verdict)', ''),
      score: s.score || 0
    }));

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(0,0,0,0.05)" />
          <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} width={100} axisLine={false} tickLine={false} />
          <Tooltip 
            cursor={{ fill: 'rgba(0,0,0,0.02)' }}
            contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
            itemStyle={{ fontSize: '12px', color: '#334155', fontWeight: 'bold' }}
          />
          <Bar dataKey="score" fill="url(#scoreGradient)" radius={[0, 4, 4, 0]} barSize={20} animationDuration={1500}>
            <defs>
              <linearGradient id="scoreGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#38bdf8"/>
                <stop offset="100%" stopColor="#818cf8"/>
              </linearGradient>
            </defs>
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
