const parseISODate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(num => parseInt(num, 10));
  return new Date(year, month - 1, day);
};

export const getSessionStatus = (scheduledDate: string, endDate?: string): 'scheduled' | 'active' | 'complete' => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDate = parseISODate(scheduledDate);
  startDate.setHours(0, 0, 0, 0);

  const finalDate = endDate ? parseISODate(endDate) : startDate;
  finalDate.setHours(0, 0, 0, 0);

  if (today < startDate) {
    return 'scheduled';
  } else if (today >= startDate && today <= finalDate) {
    return 'active';
  } else {
    return 'complete';
  }
};
