import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Circle } from 'lucide-react';
import { QuestionCard, QuestionCardData } from './interaction/QuestionCard';
import { Question } from '../../types/nurse-sim';

const mapQuestionToCardData = (q: Question): QuestionCardData => {
  let status: 'answered' | 'pending' | 'urgent' = 'pending';
  if (q.status === 'asked' && q.answer) {
    status = 'answered';
  } else if (q.rank <= 2 && q.rank !== 999) {
    status = 'urgent';
  }
  return { 
    id: q.qid, 
    status, 
    headline: q.headline, 
    question: q.content, 
    answer: q.answer || undefined, 
    rank: q.rank 
  };
};

export const QuestionsInterface: React.FC<{ questions?: Question[] }> = ({ questions: externalQuestions = [] }) => {
  // Start with empty array, only use backend data when it arrives
  const [questions, setQuestions] = useState<Question[]>([]);

  // Update when external questions change
  useEffect(() => {
    if (externalQuestions.length > 0) {
      setQuestions(externalQuestions);
    }
  }, [externalQuestions]);

  const handleMarkAsAnswered = (questionId: string) => {
    // This would be handled by backend updates
    console.log('Mark as answered:', questionId);
  };

  const questionCards = questions.map(mapQuestionToCardData);
  const unansweredQuestions = questionCards.filter(q => q.status !== 'answered').sort((a, b) => a.rank - b.rank);
  const answeredQuestions = questionCards.filter(q => q.status === 'answered');
  const urgentQuestions = unansweredQuestions.filter(q => q.status === 'urgent');
  const regularPendingQuestions = unansweredQuestions.filter(q => q.status === 'pending');

  return (
    <div className="h-full flex gap-4">
      {/* Left Column - Questions to Ask (66%) */}
      <div className="flex-[2] flex flex-col bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="px-5 py-2.5 border-b border-neutral-200 bg-neutral-50 shrink-0">
         <div className="flex items-center gap-2">
  <h2 className="text-[10px]  text-neutral-800">Questions to ask</h2>
  <div className="h-3 w-px bg-neutral-300"></div>
  <p className="text-[10px] text-neutral-500">{unansweredQuestions.length} remaining</p>
</div>

        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Urgent Questions - Full Width */}
          {urgentQuestions.length > 0 && (
            <AnimatePresence mode="popLayout">
              <div className="space-y-3 mb-4">
                {urgentQuestions.map((q) => (
                  <QuestionCard key={q.id} data={q} />
                ))}
              </div>
            </AnimatePresence>
          )}

          {/* Regular Pending Questions - 2 Column Grid */}
          {regularPendingQuestions.length > 0 && (
            <AnimatePresence mode="popLayout">
              <div className="grid grid-cols-2 gap-3">
                {regularPendingQuestions.map((q) => (
                  <QuestionCard key={q.id} data={q} />
                ))}
              </div>
            </AnimatePresence>
          )}

          {unansweredQuestions.length === 0 && (
            <div className="flex items-center justify-center h-full text-center py-12">
              <div>
                <Circle size={48} className="text-neutral-300 mx-auto mb-3" />
                <p className="text-sm text-neutral-500">All questions answered</p>
                <p className="text-xs text-neutral-400 mt-1">Great job!</p>
              </div>
            </div>
          )}
        </div>

       
      </div>

      {/* Right Column - Questions Answered (33%) */}
      <div className="flex-1 flex flex-col bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="px-5 py-2.5 border-b border-neutral-200 bg-neutral-50 shrink-0">
         <div className="flex items-center gap-2">
  <h2 className="text-[10px] text-neutral-800">Questions answered</h2>
  <div className="h-3 w-px bg-neutral-300"></div>
  <p className="text-[10px] text-neutral-500">{answeredQuestions.length} completed</p>
</div>

        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <AnimatePresence mode="popLayout">
            {answeredQuestions.map((q) => (
              <QuestionCard key={q.id} data={q} />
            ))}
          </AnimatePresence>

          {answeredQuestions.length === 0 && (
            <div className="flex items-center justify-center h-full text-center py-12">
              <div>
                <Circle size={48} className="text-neutral-300 mx-auto mb-3" />
                <p className="text-sm text-neutral-500">No questions answered yet</p>
                <p className="text-xs text-neutral-400 mt-1">Start asking questions from the left</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
