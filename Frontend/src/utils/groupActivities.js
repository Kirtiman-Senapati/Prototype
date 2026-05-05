export const groupActivitiesByDate = (activities) => {
  const groups = {
    today: [],
    yesterday: [],
    older: [],
  };

  if (!activities) return groups;

  const now = new Date();
  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayDate = new Date(todayDate);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);

  activities.forEach((activity) => {
    const actDate = new Date(activity.createdAt);
    const actDay = new Date(actDate.getFullYear(), actDate.getMonth(), actDate.getDate());

    if (actDay.getTime() === todayDate.getTime()) {
      groups.today.push(activity);
    } else if (actDay.getTime() === yesterdayDate.getTime()) {
      groups.yesterday.push(activity);
    } else {
      groups.older.push(activity);
    }
  });

  return groups;
};
