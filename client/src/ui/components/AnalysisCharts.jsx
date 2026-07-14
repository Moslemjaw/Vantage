import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
  BarChart, Bar,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

// Soft, light-themed palette
const COLORS = {
  Bullish: '#34d399',   // emerald-400
  Bearish: '#fb7185',   // rose-400
  Neutral: '#a5b4fc',   // indigo-300
};

const AGENT_COLORS = [
  '#818cf8', // violet-400
  '#34d399', // emerald-400
  '#f472b6', // pink-400
  '#38bdf8', // sky-400
  '#fb923c', // orange-400
  '#a78bfa', // violet-400
  '#4ade80', // green-400
  '#facc15', // yellow-400
  '#f87171', // red-400
  '#22d3ee', // cyan-400
];

// Custom light tooltip
const LightTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl px-3.5 py-2.5 shadow-lg">
      <p className="text-[11px] font-bold text-slate-700 mb-1.5">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-[11px]">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color || p.fill }} />
          <span className="text-slate-500 font-medium">{p.name}:</span>
          <span className="font-bold text-slate-800">{p.value}%</span>
        </div>
      ))}
    </div>
  );
};

/**
 * Debate Sentiment Flow — shows each agent's confidence as a line,
 * colored by their sentiment, across debate turns.
 * Much more useful: you can see how each agent's conviction changes.
 */
export function DebateSentimentFlow({ messages }) {
  if (!messages || messages.length === 0) return null;

  // Build per-turn data with each agent's confidence
  const agentNames = [...new Set(messages.map(m => m.agentName))];
  
  // Group messages into turns (each agent speaks once per round)
  const data = messages.map((m, i) => {
    const point = {
      turn: m.agentName,
      index: i,
    };
    // Show confidence value for this agent
    point[m.agentName] = m.confidence;
    return point;
  });

  // Create a running data set where each agent's latest confidence carries forward
  const runningData = [];
  const latest = {};
  messages.forEach((m, i) => {
    latest[m.agentName] = m.confidence;
    const point = { turn: m.agentName, ...latest };
    runningData.push(point);
  });

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={runningData} margin={{ top: 10, right: 15, left: -15, bottom: 5 }}>
          <defs>
            {agentNames.map((name, i) => (
              <linearGradient key={name} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={AGENT_COLORS[i % AGENT_COLORS.length]} stopOpacity={0.25}/>
                <stop offset="95%" stopColor={AGENT_COLORS[i % AGENT_COLORS.length]} stopOpacity={0.02}/>
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="turn" 
            tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }} 
            axisLine={{ stroke: '#e2e8f0' }} 
            tickLine={false} 
          />
          <YAxis 
            tick={{ fontSize: 10, fill: '#94a3b8' }} 
            axisLine={false} 
            tickLine={false} 
            domain={[0, 100]}
            tickFormatter={v => `${v}%`}
          />
          <Tooltip content={<LightTooltip />} />
          {agentNames.map((name, i) => (
            <Area
              key={name}
              type="monotone"
              dataKey={name}
              stroke={AGENT_COLORS[i % AGENT_COLORS.length]}
              strokeWidth={2.5}
              fillOpacity={1}
              fill={`url(#grad-${i})`}
              dot={{ r: 3, fill: '#fff', stroke: AGENT_COLORS[i % AGENT_COLORS.length], strokeWidth: 2 }}
              activeDot={{ r: 5, fill: AGENT_COLORS[i % AGENT_COLORS.length], stroke: '#fff', strokeWidth: 2 }}
              connectNulls
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Conviction Donut — shows Bullish / Bearish / Neutral breakdown
 * with labels, percentages, and a legend.
 */
const RADIAN = Math.PI / 180;
const renderDonutLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 1.6;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  if (percent < 0.05) return null;
  return (
    <text x={x} y={y} fill="#475569" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={11} fontWeight={700}>
      {name} {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export function ConvictionDonut({ messages }) {
  if (!messages || messages.length === 0) return null;

  const counts = { Bullish: 0, Bearish: 0, Neutral: 0 };
  const totalConf = { Bullish: 0, Bearish: 0, Neutral: 0 };
  messages.forEach(m => {
    if (counts[m.sentiment] !== undefined) {
      counts[m.sentiment]++;
      totalConf[m.sentiment] += (m.confidence || 0);
    }
  });

  const data = [
    { name: 'Bullish', value: counts.Bullish, color: COLORS.Bullish, avgConf: counts.Bullish ? Math.round(totalConf.Bullish / counts.Bullish) : 0 },
    { name: 'Neutral', value: counts.Neutral, color: COLORS.Neutral, avgConf: counts.Neutral ? Math.round(totalConf.Neutral / counts.Neutral) : 0 },
    { name: 'Bearish', value: counts.Bearish, color: COLORS.Bearish, avgConf: counts.Bearish ? Math.round(totalConf.Bearish / counts.Bearish) : 0 },
  ].filter(d => d.value > 0);

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={4}
              dataKey="value"
              stroke="#fff"
              strokeWidth={3}
              label={renderDonutLabel}
              labelLine={false}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl px-3.5 py-2.5 shadow-lg">
                    <p className="text-[11px] font-bold text-slate-700 mb-1">{d.name}</p>
                    <p className="text-[10px] text-slate-500">{d.value} agent{d.value !== 1 ? 's' : ''} · Avg confidence: {d.avgConf}%</p>
                  </div>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      {/* Legend Cards */}
      <div className="flex items-center gap-3 flex-wrap justify-center">
        {data.map(d => (
          <div key={d.name} className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="text-[11px] font-bold text-slate-700">{d.name}</span>
            <span className="text-[10px] font-mono text-slate-500">{d.value}/{total}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Agent Score Bar Chart — horizontal bars with individual agent colors,
 * score labels on bars, and a cleaner light design.
 */
export function AgentScoreBarChart({ agentScores }) {
  if (!agentScores || agentScores.length === 0) return null;

  const data = [...agentScores]
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 8)
    .map((s, i) => ({
      name: s.agentName.replace(' (Verdict)', ''),
      score: s.score || 0,
      fill: AGENT_COLORS[i % AGENT_COLORS.length],
    }));

  const CustomBar = (props) => {
    const { x, y, width, height, fill } = props;
    return (
      <g>
        <defs>
          <linearGradient id={`bar-${props.index}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={fill} stopOpacity={0.7}/>
            <stop offset="100%" stopColor={fill} stopOpacity={1}/>
          </linearGradient>
        </defs>
        <rect x={x} y={y} width={width} height={height} rx={6} ry={6} fill={`url(#bar-${props.index})`} />
        {width > 30 && (
          <text x={x + width - 8} y={y + height / 2} textAnchor="end" dominantBaseline="central" fill="#fff" fontSize={10} fontWeight={700}>
            {props.score}
          </text>
        )}
      </g>
    );
  };

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 25, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={true} stroke="#f1f5f9" />
          <XAxis 
            type="number" 
            domain={[0, 100]} 
            tick={{ fontSize: 10, fill: '#94a3b8' }} 
            axisLine={{ stroke: '#e2e8f0' }} 
            tickLine={false}
            tickFormatter={v => `${v}`}
          />
          <YAxis 
            type="category" 
            dataKey="name" 
            tick={{ fontSize: 10, fill: '#475569', fontWeight: 600 }} 
            width={110} 
            axisLine={false} 
            tickLine={false} 
          />
          <Tooltip 
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload;
              return (
                <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl px-3.5 py-2.5 shadow-lg">
                  <p className="text-[11px] font-bold text-slate-700">{d.name}</p>
                  <p className="text-[10px] text-slate-500">Accuracy Score: <span className="font-bold text-slate-800">{d.score}/100</span></p>
                </div>
              );
            }}
            cursor={{ fill: 'rgba(99, 102, 241, 0.04)' }}
          />
          <Bar 
            dataKey="score" 
            radius={[0, 6, 6, 0]} 
            barSize={22} 
            animationDuration={1200}
            shape={<CustomBar />}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Agent Radar — shows each agent's confidence on a radar/spider chart.
 * Useful for comparing agent conviction at a glance.
 */
export function AgentRadarChart({ messages }) {
  if (!messages || messages.length < 2) return null;

  const agentMap = {};
  messages.forEach(m => {
    if (!agentMap[m.agentName]) {
      agentMap[m.agentName] = { name: m.agentName, confidence: m.confidence, sentiment: m.sentiment };
    } else {
      // Use the latest confidence
      agentMap[m.agentName].confidence = m.confidence;
      agentMap[m.agentName].sentiment = m.sentiment;
    }
  });

  const data = Object.values(agentMap).map(a => ({
    agent: a.name.split(' ').slice(0, 2).join(' '),
    fullName: a.name,
    Confidence: a.confidence,
  }));

  if (data.length < 3) return null; // Radar needs at least 3 points

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis 
            dataKey="agent" 
            tick={{ fontSize: 9, fill: '#64748b', fontWeight: 600 }} 
          />
          <PolarRadiusAxis 
            angle={90} 
            domain={[0, 100]} 
            tick={{ fontSize: 8, fill: '#94a3b8' }}
            tickFormatter={v => `${v}%`}
          />
          <Radar
            name="Confidence"
            dataKey="Confidence"
            stroke="#818cf8"
            fill="#818cf8"
            fillOpacity={0.15}
            strokeWidth={2}
            dot={{ r: 3, fill: '#818cf8', stroke: '#fff', strokeWidth: 2 }}
          />
          <Tooltip 
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload;
              return (
                <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl px-3.5 py-2.5 shadow-lg">
                  <p className="text-[11px] font-bold text-slate-700">{d.fullName}</p>
                  <p className="text-[10px] text-slate-500">Confidence: <span className="font-bold text-slate-800">{d.Confidence}%</span></p>
                </div>
              );
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
