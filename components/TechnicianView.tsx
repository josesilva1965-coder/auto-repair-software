

import React, { useState, useEffect } from 'react';
import type { Technician, HydratedQuote } from '../types';
import { UserGroupIcon, PlusIcon, BriefcaseIcon, UserIcon, CheckBadgeIcon, ClockIcon } from '../Icon';
import { useLocalization } from '../services/localization';

interface TechnicianViewProps {
  technicians: Technician[];
  quotes: HydratedQuote[];
  onAddTechnician: () => void;
  onSaveTechnicians: (technicians: Technician[]) => void;
}

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const TechnicianView: React.FC<TechnicianViewProps> = ({ technicians, quotes, onAddTechnician, onSaveTechnicians }) => {
  const { t } = useLocalization();
  const [editableTechnicians, setEditableTechnicians] = useState<Technician[]>(technicians);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setEditableTechnicians(technicians);
    setHasChanges(false);
  }, [technicians]);

  const toggleAvailability = (techId: string, day: string) => {
    setEditableTechnicians(prev => 
        prev.map(tech => 
            tech.id === techId
                ? { ...tech, availability: { ...tech.availability, [day]: !tech.availability[day] } }
                : tech
        )
    );
    setHasChanges(true);
  };

  const handleSave = () => {
    onSaveTechnicians(editableTechnicians);
    setHasChanges(false);
  };

  const handleDiscard = () => {
    setEditableTechnicians(technicians);
    setHasChanges(false);
  };
  
  const sortedTechnicians = [...technicians].sort((a, b) => a.name.localeCompare(b.name));
  const sortedEditableTechnicians = [...editableTechnicians].sort((a, b) => a.name.localeCompare(b.name));

  if (technicians.length === 0) {
    return (
      <div className="text-center text-brand-gray-500 dark:text-brand-gray-400 h-full flex flex-col justify-center items-center animate-fade-in">
        <UserGroupIcon className="h-16 w-16 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-brand-gray-700 dark:text-brand-gray-200">{t('technicianViewEmptyTitle')}</h2>
        <p className="mt-2 max-w-md">{t('technicianViewEmptyDesc')}</p>
        <button onClick={onAddTechnician} className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-brand-blue hover:bg-brand-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue">
            <PlusIcon className="h-5 w-5 mr-2" />
            {t('addNewTechnicianButton')}
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in flex flex-col h-full">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-brand-gray-800 dark:text-brand-gray-100">{t('technicianViewTitle')}</h2>
            <button onClick={onAddTechnician} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-brand-blue hover:bg-brand-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue dark:focus:ring-offset-brand-gray-800">
                <PlusIcon className="h-5 w-5 mr-2" />
                {t('addNewTechnicianButton')}
            </button>
        </div>
        
        {/* Weekly Timetable */}
        <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-brand-gray-800 dark:text-brand-gray-100">{t('weeklyTimetableTitle')}</h3>
                {hasChanges && (
                    <div className="flex space-x-2">
                        <button onClick={handleDiscard} className="px-4 py-2 text-sm font-medium rounded-md border border-brand-gray-300 dark:border-brand-gray-600 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700">{t('discardChangesButton')}</button>
                        <button onClick={handleSave} className="px-4 py-2 text-sm font-medium rounded-md text-white bg-brand-blue hover:bg-brand-blue-dark">{t('saveTimetableButton')}</button>
                    </div>
                )}
            </div>
             <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-brand-gray-200 dark:divide-brand-gray-700 border border-brand-gray-200 dark:border-brand-gray-700 rounded-lg">
                    <thead className="bg-brand-gray-50 dark:bg-brand-gray-700/50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase tracking-wider">{t('technicianNameHeader')}</th>
                            {WEEKDAYS.map(day => (
                                <th key={day} className="px-4 py-3 text-center text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase tracking-wider">{t(`day${day}Full` as any)}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-brand-gray-800 divide-y divide-brand-gray-200 dark:divide-brand-gray-700">
                        {sortedEditableTechnicians.map(tech => (
                            <tr key={tech.id}>
                                <td className="px-4 py-3 whitespace-nowrap font-medium text-brand-gray-900 dark:text-white">{tech.name}</td>
                                {WEEKDAYS.map(day => (
                                    <td key={day} className="px-4 py-3 text-center">
                                        <button 
                                            onClick={() => toggleAvailability(tech.id, day)}
                                            className={`w-6 h-6 rounded-md transition-colors ${tech.availability[day] ? 'bg-green-500 hover:bg-green-600' : 'bg-brand-gray-200 dark:bg-brand-gray-600 hover:bg-brand-gray-300 dark:hover:bg-brand-gray-500'}`}
                                            aria-label={`Toggle ${day} for ${tech.name}`}
                                        />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>


        <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedTechnicians.map(tech => {
                    const completedQuotes = quotes.filter(q => q.technicianId === tech.id && (q.status === 'Completed' || q.status === 'Paid'));
                    const jobsCompleted = completedQuotes.length;
                    const totalHours = completedQuotes.reduce((sum, q) => sum + q.estimatedDurationHours, 0);

                    return (
                        <div key={tech.id} className="bg-white dark:bg-brand-gray-800 border border-brand-gray-200 dark:border-brand-gray-700 rounded-lg p-4">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center bg-brand-gray-100 dark:bg-brand-gray-700 rounded-full">
                                    <UserIcon className="h-8 w-8 text-brand-gray-500 dark:text-brand-gray-400" />
                                </div>
                                <div className="ml-4">
                                    <h3 className="text-lg font-bold text-brand-gray-900 dark:text-white">{tech.name}</h3>
                                    {tech.specialty && (
                                        <p className="text-sm text-brand-gray-500 dark:text-brand-gray-400 flex items-center">
                                            <BriefcaseIcon className="h-4 w-4 mr-1.5" />
                                            {tech.specialty}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-brand-gray-200 dark:border-brand-gray-700 flex justify-around">
                                <div className="text-center">
                                    <p className="text-xs text-brand-gray-500 dark:text-brand-gray-400 uppercase font-semibold">{t('jobsCompletedHeader')}</p>
                                    <p className="text-2xl font-bold text-brand-blue dark:text-blue-400 flex items-center justify-center gap-2 mt-1">
                                        <CheckBadgeIcon className="h-6 w-6"/>
                                        {jobsCompleted}
                                    </p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-brand-gray-500 dark:text-brand-gray-400 uppercase font-semibold">{t('totalHoursHeader')}</p>
                                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 flex items-center justify-center gap-2 mt-1">
                                        <ClockIcon className="h-6 w-6"/>
                                        {totalHours.toFixed(1)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    </div>
  );
};