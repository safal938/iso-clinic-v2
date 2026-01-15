import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, AlertCircle, CheckCircle2, Info, ThumbsUp, ThumbsDown, BarChart3 } from 'lucide-react';
import { AnalyticsData } from '../../types/nurse-sim';
import analyticsData from '../../data/nurse-sim/new_format/analytics.json';

const BACKEND_ANALYTICS: AnalyticsData = analyticsData as AnalyticsData;

interface MetricCardProps {
  title: string;
  score: number;
  maxScore?: number;
  reasoning: string;
  example_quote?: string;
  feedback?: string;
  turn_taking_ratio?: string;
  pros?: string;
  cons?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  score, 
  maxScore = 100, 
  reasoning, 
  example_quote,
  feedback,
  turn_taking_ratio,
  pros,
  cons
}) => {
  const [animatedProgress, setAnimatedProgress] = React.useState(0);
  const percentage = (score / maxScore) * 100;
  const size = 90;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedProgress / 100) * circumference;
  
  // Animate progress on mount
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(percentage);
    }, 100);
    return () => clearTimeout(timer);
  }, [percentage]);
  
  // Determine color based on score
  const getColor = () => {
    if (score >= 80) return { stroke: '#0EA5E9', bg: '#e0f2fe', text: '#0284c7' }; // Excellent - blue
    if (score >= 60) return { stroke: '#10b981', bg: '#d1fae5', text: '#059669' }; // Good - green
    return { stroke: '#f97316', bg: '#ffedd5', text: '#ea580c' }; // Needs Improvement - orange
  };
  
  const colors = getColor();
  
  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-4 hover:shadow-md transition-all">
      <div className="flex items-start gap-3 mb-3">
        {/* Circular Progress */}
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="transform -rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth={strokeWidth}
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={colors.stroke}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{
                transition: 'stroke-dashoffset 1.5s ease-out'
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold text-neutral-900">{score}</span>
            <span className="text-[10px] text-neutral-400">/ {maxScore}</span>
          </div>
        </div>
        
        {/* Title and Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-neutral-900 mb-1">{title}</h3>
          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
            score >= 80 ? 'bg-sky-100 text-sky-700' : 
            score >= 60 ? 'bg-emerald-100 text-emerald-700' : 
            'bg-orange-100 text-orange-700'
          }`}>
            {score >= 80 ? <TrendingUp size={10} /> : score >= 60 ? <Minus size={10} /> : <TrendingDown size={10} />}
            {score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : 'Needs Improvement'}
          </div>
          
          {turn_taking_ratio && (
            <div className="mt-1.5 text-[11px] text-neutral-600">
              <span className="font-medium">Turn Ratio:</span> {turn_taking_ratio}
            </div>
          )}
        </div>
      </div>
      
      {/* Reasoning */}
      <div className="space-y-2">
        <div className="bg-neutral-50 rounded-lg p-2.5 border border-neutral-100">
          <div className="flex items-start gap-2">
            <Info size={12} className="text-neutral-400 mt-0.5 shrink-0" />
            <p className="text-[11px] text-neutral-700 leading-relaxed">{reasoning}</p>
          </div>
        </div>
        
        {/* Example Quote */}
        {example_quote && (
          <div className="bg-neutral-50 rounded-lg p-2.5 border border-blue-100">
            <div className="flex items-start gap-2">
              <span className="text-blue-600 text-base leading-none">"</span>
              <p className="text-[11px] text-neutral-700 italic leading-relaxed">{example_quote}</p>
            </div>
          </div>
        )}
        
        {/* Feedback */}
        {feedback && (
          <div className="bg-neutral-50 rounded-lg p-2.5 border border-emerald-100">
            <div className="flex items-start gap-2">
              <CheckCircle2 size={12} className="text-emerald-600 mt-0.5 shrink-0" />
              <p className="text-[11px] text-neutral-700 leading-relaxed">{feedback}</p>
            </div>
          </div>
        )}

        {/* Pros and Cons - Two Column Layout */}
        {(pros || cons) && (
          <div className="grid grid-cols-2 gap-2">
            {/* Pros */}
            {pros && (
              <div className="bg-neutral-50 rounded-lg p-2.5 border border-neutral-200">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <ThumbsUp size={11} className="text-neutral-500" />
                  <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wide">What Went Well</span>
                </div>
                <p className="text-[11px] text-neutral-700 leading-relaxed">{pros}</p>
              </div>
            )}
            
            {/* Cons */}
            {cons && (
              <div className="bg-neutral-50 rounded-lg p-2.5 border border-neutral-200">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <ThumbsDown size={11} className="text-neutral-500" />
                  <span className="text-[10px] font-semibold text-red-600 uppercase tracking-wide">What Didn't Go Well</span>
                </div>
                <p className="text-[11px] text-neutral-700 leading-relaxed">{cons}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export const AnalyticsInterface: React.FC<{ analyticsData?: AnalyticsData | null }> = ({ analyticsData: externalAnalytics = null }) => {
  // Use backend data immediately, fall back to dummy data if no external data or incomplete data
  const analytics = (externalAnalytics && externalAnalytics.metrics) ? externalAnalytics : BACKEND_ANALYTICS;
  
  return (
    <div className="h-full overflow-y-auto">
      <div className="space-y-3">
        {/* Overall Score Header */}
        <div className="bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-xl border border-neutral-200 p-4 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-neutral-900 mb-0.5">Consultation Analytics</h2>
              <p className="text-xs text-neutral-600">Real-time performance metrics and insights</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-[10px] text-neutral-500 uppercase tracking-wide font-medium mb-0.5">Overall Score</div>
                <div className="text-2xl font-bold text-neutral-900">{analytics.overall_score}</div>
              </div>
             
            </div>
          </div>
          
          {/* Sentiment Trend */}
          <div className="mt-3 pt-3 border-t border-neutral-200">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-neutral-500 uppercase tracking-wide font-medium">Sentiment Trend:</span>
              <span className="text-xs font-medium text-neutral-900">{analytics.sentiment_trend}</span>
            </div>
          </div>
        </div>
        
        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            title="Patient Empathy"
            score={analytics.metrics.empathy.score}
            reasoning={analytics.metrics.empathy.reasoning}
            example_quote={analytics.metrics.empathy.example_quote}
            pros={analytics.metrics.empathy.pros}
            cons={analytics.metrics.empathy.cons}
          />
          
          <MetricCard
            title="Clarity Score"
            score={analytics.metrics.clarity.score}
            reasoning={analytics.metrics.clarity.reasoning}
            feedback={analytics.metrics.clarity.feedback}
            pros={analytics.metrics.clarity.pros}
            cons={analytics.metrics.clarity.cons}
          />
          
          <MetricCard
            title="Information Gathering"
            score={analytics.metrics.information_gathering.score}
            reasoning={analytics.metrics.information_gathering.reasoning}
            pros={analytics.metrics.information_gathering.pros}
            cons={analytics.metrics.information_gathering.cons}
          />
          
          <MetricCard
            title="Patient Engagement"
            score={analytics.metrics.patient_engagement.score}
            reasoning={analytics.metrics.patient_engagement.reasoning}
            turn_taking_ratio={analytics.metrics.patient_engagement.turn_taking_ratio}
            pros={analytics.metrics.patient_engagement.pros}
            cons={analytics.metrics.patient_engagement.cons}
          />
        </div>
        
        {/* Key Insights */}
        <div className="grid grid-cols-2 gap-3">
          {/* Strengths */}
          <div className="bg-white rounded-xl border border-neutral-200 p-3.5">
            <div className="flex items-center gap-2 mb-2.5">
              <CheckCircle2 size={14} className="text-emerald-600" />
              <h3 className="text-xs font-semibold text-neutral-900">Key Strengths</h3>
            </div>
            <ul className="space-y-1.5">
              {analytics.key_strengths.map((strength, idx) => (
                <li key={idx} className="flex items-start gap-2 text-[11px] text-neutral-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                  <span className="leading-relaxed">{strength}</span>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Improvement Areas */}
          <div className="bg-white rounded-xl border border-neutral-200 p-3.5">
            <div className="flex items-center gap-2 mb-2.5">
              <AlertCircle size={14} className="text-amber-600" />
              <h3 className="text-xs font-semibold text-neutral-900">Areas for Improvement</h3>
            </div>
            <ul className="space-y-1.5">
              {analytics.improvement_areas.map((area, idx) => (
                <li key={idx} className="flex items-start gap-2 text-[11px] text-neutral-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0"></span>
                  <span className="leading-relaxed">{area}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
